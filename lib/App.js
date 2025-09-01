import { searchApi, queryHistoryApi } from "../api/search.js";
import fs from "fs";
import { logger, ensureDir } from "../utils/index.js";
import { CONFIG } from "../config/index.js";
import { createDownloadManager } from "./DownloadManager.js";
import { waitWithCountdown } from "../utils/countdown.js";

// 创建应用状态
const createAppState = (options = {}) => {
  const { startPage, type } = options;
  const pageNumber = startPage ?? CONFIG.SEARCH.START_PAGE;
  const typeIndex = type ? CONFIG.SEARCH.CATEGORIES.indexOf(type) : 0;
  const searchType =
    type ?? CONFIG.SEARCH.CATEGORIES[typeIndex >= 0 ? typeIndex : 0];

  return {
    pageNumber,
    typeIndex: typeIndex >= 0 ? typeIndex : 0,
    searchType,
    downloadManager: createDownloadManager({
      currentPage: pageNumber,
      searchType: searchType,
    }),
    isRunning: false,
    currentPageComplete: false,
    errorCount: 0,
    pagesProcessed: 0,
    categoryPagesProcessed: 0,
  };
};



// 获取页面数据
const getPageData = async (state) => {
  const remainingCategories = CONFIG.SEARCH.CATEGORIES.length - state.typeIndex;
  logger.info(
    `📄 获取${state.searchType}类第${state.pageNumber}页列表数据 (剩余分类: ${remainingCategories})`
  );
  const res = await searchApi({
    pageNumber: state.pageNumber,
    pageSize: CONFIG.SEARCH.PAGE_SIZE,
    type: state.searchType,
  });

  if (!res.data || !res.data.data || res.data.data.length === 0) {
    logger.warn(`${state.searchType}类第${state.pageNumber}页没有数据`);
    return null;
  }
  return res.data;
};

// 过滤数据
const filterData = async (list) => {
  logger.info("🔍 筛选掉上传为 0 和小于 11M 并未下载过的数据");
  const validData = list.data.filter(
    (item) =>
      item.status.seeders !== "0" && item.size > CONFIG.DOWNLOAD.MIN_SIZE
  );

  if (validData.length > 0) {
    const historyData = await queryHistoryApi({
      tids: validData.map((item) => item.id),
    });
    return validData.filter((item) => !historyData.data.historyMap[item.id]);
  }
  return [];
};

// 切换到下一个分类
const switchToNextCategory = (state) => {
  state.typeIndex++;
  if (state.typeIndex >= CONFIG.SEARCH.CATEGORIES.length) {
    logger.info("🎉 所有分类都已处理完毕，程序结束");
    return false;
  }

  state.searchType = CONFIG.SEARCH.CATEGORIES[state.typeIndex];
  state.pageNumber = CONFIG.SEARCH.START_PAGE;
  state.categoryPagesProcessed = 0;
  state.errorCount = 0;
  state.downloadManager.searchType = state.searchType;

  logger.info(`🔄 切换到下一个分类: ${state.searchType}`);
  return true;
};

// 处理下载
const processDownloads = async (state, filteredData) => {
  state.currentPageComplete = false;
  try {
    for (let i = 0; i < filteredData.length; i++) {
      const success = await state.downloadManager.downloadTorrent(
        filteredData[i],
        filteredData.length - i
      );

      if (state.downloadManager.stopImmediately) {
        logger.info("发现大于150MB的种子，跳过当前页剩余种子，准备切换分类");
        return true;
      }

      if (i < filteredData.length - 1) {
        const waitMs = state.downloadManager.gracefulExit
          ? CONFIG.DOWNLOAD.GRACEFUL_INTERVAL
          : CONFIG.DOWNLOAD.INTERVAL;
        await waitWithCountdown(waitMs / 1000, {
          searchType: state.searchType,
        });
      }
    }
  } finally {
    state.currentPageComplete = true;
    if (state.downloadManager.stopImmediately) {
      state.downloadManager.stopImmediately = false;
    }
    if (state.downloadManager.gracefulExit) {
      logger.success("✅ 当前页面下载任务已完成，准备安全退出");
    }
  }
  return false;
};

// 设置退出处理器
const setupExitHandler = (state) => {
  let exitAttempts = 0;
  const maxAttempts = 2;

  const cleanup = async () => {
    try {
      await state.downloadManager.cleanup();
    } catch (error) {
      logger.error("清理资源时发生错误：", error);
    }
  };

  process.on("SIGINT", async () => {
    exitAttempts++;
    
    if (exitAttempts === 1) {
      logger.warn(
        "\n🚫 收到退出信号，将在当前页面下载完成后安全退出..."
      );
      logger.info("⚠️  再次按下 Ctrl+C 将立即停止程序");
      state.downloadManager.gracefulExit = true;
      return;
    }
    
    if (exitAttempts >= maxAttempts) {
      logger.warn("\n⛔️ 正在强制停止程序...");
      await cleanup();
      // 使用 0 表示正常退出
      process.exit(0);
    }
  });
};

// 启动应用
const startApp = async (state) => {
  if (state.isRunning) {
    logger.warn("程序已在运行中");
    return;
  }

  try {
    state.isRunning = true;
    logger.info("🚀 开始");
    // 确保下载目录存在
    if (!ensureDir(CONFIG.DOWNLOAD.DIR)) {
      throw new Error("创建下载目录失败");
    }

    while (true) {
      if (state.downloadManager.gracefulExit && state.currentPageComplete) {
        logger.warn("🛑 当前页面处理完成，安全退出。");
        break;
      }

      try {
        const list = await getPageData(state);
        if (!list) {
          logger.info(`📄 ${state.searchType} 分类没有更多数据，准备切换分类`);
          if (!switchToNextCategory(state)) {
            break;
          }
          continue;
        }

        const filteredData = await filterData(list);
        if (filteredData.length > 0) {
          logger.info(
            `[${state.searchType}：第${state.pageNumber}页] 📄 筛选完成，待下载数据 ${filteredData.length} 条`
          );

          state.downloadManager.currentPage = state.pageNumber;
          const needSwitchCategory = await processDownloads(
            state,
            filteredData
          );

          if (needSwitchCategory) {
            if (!switchToNextCategory(state)) {
              break;
            }
            continue;
          }

          logger.info(
            `[${state.searchType}：第${state.pageNumber}页] 第 ${state.pageNumber} 页处理完毕`
          );
        } else {
          logger.info(
            `[${state.searchType}：第${state.pageNumber}页] 第 ${state.pageNumber} 页无新数据需要下载`
          );
        }

        state.pageNumber++;
        state.pagesProcessed++;
        state.categoryPagesProcessed++;
        state.errorCount = 0;

        if (!state.downloadManager.gracefulExit) {
          await waitWithCountdown(CONFIG.SEARCH.PAGE_INTERVAL / 1000, {
            searchType: state.searchType,
          });
        }
      } catch (error) {
        logger.error(
          `[${state.searchType}：第${state.pageNumber}页] 处理第 ${state.pageNumber} 页时发生错误: ${error.message}`
        );

        if (
          error.isAuthError ||
          error.name === "AuthenticationError" ||
          error.code === 401
        ) {
          logger.error("🚨 检测到认证错误，程序将立即停止");
          logger.error("请检查以下配置是否正确：");
          logger.error("- AUTH_TOKEN (认证令牌)");
          logger.error("- DID (设备ID)");
          logger.error("- COOKIE (Cookie信息)");
          logger.error("- VISITOR_ID (访问者ID)");

          state.downloadManager.stopImmediately = true;
          state.downloadManager.gracefulExit = false;
          break;
        }

        // 检查是否为网络连接错误
        if (
          error.code === 'ECONNREFUSED' ||
          error.code === 'ECONNRESET' ||
          error.code === 'ETIMEDOUT' ||
          error.code === 'ENETUNREACH' ||
          error.message.includes('Network Error') ||
          error.message.includes('network') ||
          error.message.includes('连接') ||
          error.message.includes('timeout') ||
          (error.cause && error.cause.code === 'ECONNREFUSED')
        ) {
          logger.error("🌐 网络连接失败，请检查网络连接");
          logger.error("程序将自动停止");
          state.downloadManager.stopImmediately = true;
          state.downloadManager.gracefulExit = false;
          break;
        }

        // 检查是否为页数超限错误
        if (error.message.includes('最大支持100頁') || error.message.includes('结果最大支持100页')) {
          logger.warn(`[${state.searchType}] ⚠️ 已达到最大页数限制（100页），切换到下一个分类`);
          if (!switchToNextCategory(state)) {
            break;
          }
          continue;
        }

        if (state.errorCount >= CONFIG.SEARCH.MAX_ERRORS_PER_PAGE) {
          logger.error(
            `[${state.searchType}：第${state.pageNumber}页] 错误次数过多，跳过此页`
          );
          state.pageNumber++;
          state.errorCount = 0;
          continue;
        }

        state.errorCount++;

        await waitWithCountdown(CONFIG.DOWNLOAD.INTERVAL / 1000, {
          searchType: state.searchType,
        });
      }
    }
  } finally {
    state.isRunning = false;
    await state.downloadManager.cleanup();
  }

  return {
    gracefulExit: state.downloadManager.gracefulExit,
    stopImmediately: state.downloadManager.stopImmediately,
  };
};

// 导出函数式应用
export const createApp = (options = {}) => {
  const state = createAppState(options);
  setupExitHandler(state);

  return {
    start: () => startApp(state),
  };
};
