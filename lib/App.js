import { searchApi, queryHistoryApi } from "../api/search.js";
import fs from "fs";
import { logger } from "../utils/index.js";
import { CONFIG } from "../config/index.js";
import { DownloadManager } from "./DownloadManager.js";
import { waitWithCountdown } from "../utils/countdown.js";

export class App {
  constructor(options = {}) {
    const { startPage, type, typeIndex } = options;
    this.pageNumber = startPage ?? CONFIG.SEARCH.START_PAGE;
    this.typeIndex = typeIndex ?? CONFIG.SEARCH.CURRENT_TYPE_INDEX;
    this.searchType = type ?? CONFIG.SEARCH.TYPES[this.typeIndex];
    this.downloadManager = new DownloadManager();
    this.isRunning = false;
    this.currentPageComplete = false;
    this.errorCount = 0;
    this.pagesProcessed = 0;
    this.categoryPagesProcessed = 0; // 当前分类已处理页数
    this.setupExitHandler();
  }

  setupExitHandler() {
    process.on("SIGINT", async () => {
      if (this.downloadManager.gracefulExit) {
        logger.error("\n强制退出程序。");
        await this.downloadManager.cleanup();
        process.exit(1);
      }
      logger.warn("\n收到退出信号，将在当前页面下载完成后安全退出...（再次按下 Ctrl+C 将强制退出）");
      this.downloadManager.gracefulExit = true;
    });
  }

  async start() {
    if (this.isRunning) {
      logger.warn("程序已在运行中");
      return;
    }

    try {
      this.isRunning = true;
      logger.info("🚀 开始");
      this.ensureDownloadDir();

      while (true) {
        if (this.downloadManager.gracefulExit && this.currentPageComplete) {
          logger.warn("🛑 当前页面处理完成，安全退出。");
          break;
        }

        try {
          const list = await this.getPageData();
          if (!list) {
            // 当前分类没有更多数据，切换到下一个分类
            logger.info(`📄 ${this.searchType} 分类没有更多数据，准备切换分类`);
            if (!this.switchToNextCategory()) {
              break; // 没有更多分类了
            }
            continue;
          }

          const filteredData = await this.filterData(list);
          if (filteredData.length > 0) {
            logger.info(`[第${this.pageNumber}页] 📄 筛选完成，待下载数据 ${filteredData.length} 条`);
            // 设置DownloadManager的当前页数
            this.downloadManager.currentPage = this.pageNumber;
            const needSwitchCategory = await this.processDownloads(filteredData);
            
            if (needSwitchCategory) {
              // 发现大于150MB的种子，需要切换分类
              if (!this.switchToNextCategory()) {
                break; // 没有更多分类了
              }
              continue;
            }
            
            logger.info(`[第${this.pageNumber}页] 第 ${this.pageNumber} 页处理完毕`);
          } else {
            logger.info(`[第${this.pageNumber}页] 第 ${this.pageNumber} 页无新数据需要下载`);
          }

          this.pageNumber++;
          this.pagesProcessed++;
          this.categoryPagesProcessed++;
          this.errorCount = 0; // 重置错误计数
          
          // 检查是否达到总页数限制
          if (this.pagesProcessed >= CONFIG.SEARCH.MAX_PAGES_PER_SESSION) {
            logger.info(`[第${this.pageNumber}页] 已达到本次会话最大页数限制 (${CONFIG.SEARCH.MAX_PAGES_PER_SESSION})，程序结束`);
            break;
          }
          
          // 添加翻页间隔
          if (!this.downloadManager.gracefulExit) {
            logger.info(`[第${this.pageNumber}页] ⏳ 等待 ${CONFIG.SEARCH.PAGE_INTERVAL / 1000} 秒后处理下一页...`);
            await waitWithCountdown(CONFIG.SEARCH.PAGE_INTERVAL / 1000);
          }
        } catch (error) {
          logger.error(`[第${this.pageNumber}页] 处理第 ${this.pageNumber} 页时发生错误: ${error.message}`);
          
          // 检查是否为认证错误，如果是则直接停止程序
          if (error.isAuthError || error.name === "AuthenticationError" || error.code === 401) {
            logger.error("🚨 检测到认证错误，程序将立即停止");
            logger.error("请检查以下配置是否正确：");
            logger.error("- AUTH_TOKEN (认证令牌)");
            logger.error("- DID (设备ID)");
            logger.error("- COOKIE (Cookie信息)");
            logger.error("- VISITOR_ID (访问者ID)");
            
            // 设置立即停止标志
            this.downloadManager.stopImmediately = true;
            this.downloadManager.gracefulExit = false;
            break;
          }
          
          // 检查是否达到最大错误次数
          if (this.errorCount >= CONFIG.SEARCH.MAX_ERRORS_PER_PAGE) {
            logger.error(`[第${this.pageNumber}页] 第 ${this.pageNumber} 页错误次数过多，跳过此页`);
            this.pageNumber++;
            this.errorCount = 0;
            continue;
          }
          
          this.errorCount = (this.errorCount || 0) + 1;
          
          // 发生错误时等待一段时间后继续
          await waitWithCountdown(CONFIG.DOWNLOAD.INTERVAL / 1000);
        }
      }
    } finally {
      this.isRunning = false;
      // 清理资源
      await this.downloadManager.cleanup();
    }

    return {
      gracefulExit: this.downloadManager.gracefulExit,
      stopImmediately: this.downloadManager.stopImmediately,
    };
  }

  ensureDownloadDir() {
    if (!fs.existsSync(CONFIG.DOWNLOAD.DIR)) {
      fs.mkdirSync(CONFIG.DOWNLOAD.DIR, { recursive: true });
      logger.success(`✅ 创建下载目录: ${CONFIG.DOWNLOAD.DIR}`);
    }
  }

  async getPageData() {
    const remainingCategories = CONFIG.SEARCH.TYPES.length - this.typeIndex;
    logger.info(`📄 获取${this.searchType}类第${this.pageNumber}页列表数据 (剩余分类: ${remainingCategories})`);
    const res = await searchApi({
      pageNumber: this.pageNumber,
      pageSize: CONFIG.SEARCH.PAGE_SIZE,
      type: this.searchType,
    });
    
    if (!res.data || !res.data.data || res.data.data.length === 0) {
      logger.warn(`${this.searchType}类第${this.pageNumber}页没有数据`);
      return null;
    }
    return res.data;
  }

  async filterData(list) {
    logger.info("🔍 筛选掉上传为 0 和小于 11M 并未下载过的数据");
    const validData = list.data.filter(
      (item) => item.status.seeders !== "0" && item.size > CONFIG.DOWNLOAD.MIN_SIZE
    );

    if (validData.length > 0) {
      const historyData = await queryHistoryApi({
        tids: validData.map((item) => item.id),
      });
      return validData.filter((item) => !historyData.data.historyMap[item.id]);
    }
    return [];
  }

  async processDownloads(filteredData) {
    this.currentPageComplete = false;
    try {
      for (let i = 0; i < filteredData.length; i++) {
        const success = await this.downloadManager.downloadTorrent(
          filteredData[i],
          filteredData.length - i
        );

        if (this.downloadManager.stopImmediately) {
          logger.info("发现大于150MB的种子，跳过当前页剩余种子，准备切换分类");
          return true; // 返回true表示需要切换分类
        }

        if (i < filteredData.length - 1) {
          const waitMs = this.downloadManager.gracefulExit
            ? CONFIG.DOWNLOAD.GRACEFUL_INTERVAL
            : CONFIG.DOWNLOAD.INTERVAL;
          await waitWithCountdown(waitMs / 1000);
        }
      }
    } finally {
      this.currentPageComplete = true;
      if (this.downloadManager.stopImmediately) {
        this.downloadManager.stopImmediately = false; // Reset for next page
      }
      if (this.downloadManager.gracefulExit) {
        logger.success("✅ 当前页面下载任务已完成，准备安全退出");
      }
    }
    return false; // 返回false表示不需要切换分类
  }

  switchToNextCategory() {
    this.typeIndex++;
    if (this.typeIndex >= CONFIG.SEARCH.TYPES.length) {
      logger.info("🎉 所有分类都已处理完毕，程序结束");
      return false; // 没有更多分类了
    }
    
    this.searchType = CONFIG.SEARCH.TYPES[this.typeIndex];
    this.pageNumber = CONFIG.SEARCH.START_PAGE;
    this.categoryPagesProcessed = 0;
    this.errorCount = 0;
    
    logger.info(`🔄 切换到下一个分类: ${this.searchType}`);
    return true; // 成功切换到下一个分类
  }
}
