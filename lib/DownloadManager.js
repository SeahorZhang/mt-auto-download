import { downloadFile, formatBytes, logger } from "../utils/index.js";
import { torrentApi } from "../api/search.js";
import { createQBittorrentAPI } from "../api/qbittorrent.new.js";
import { globalRetryManager } from "../utils/retry.js";
import pc from "picocolors";
import { CONFIG } from "../config/index.js";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

// 创建下载管理器状态
const createDownloadManagerState = ({ currentPage, searchType }) => ({
  currentPage,
  gracefulExit: false,
  currentDownload: null,
  isDownloading: false,
  stopImmediately: false,
  searchType,
  qbClient: CONFIG.QBITTORRENT.ENABLED
    ? createQBittorrentAPI(CONFIG.QBITTORRENT)
    : null,
});

// 获取种子URL
const getTorrentUrl = async (data) => {
  try {
    const result = await globalRetryManager.execute(
      () => torrentApi({ id: data.id }),
      `获取种子链接 ${data.name}`
    );
    return result.data;
  } catch (error) {
    logger.error(`❌ 获取 ${data.name} 的种子链接失败: ${error.message}`);
    return null;
  }
};

// 上传种子到qBittorrent
const uploadToQBittorrent = async (state, qbClient, torrentPath) => {
  if (!qbClient) return false;

  try {
    if (!qbClient.isConnected) {
      const connected = await qbClient.connect();
      if (!connected) return false;
    }

    logger.info(
      `[${state.searchType}：第${
        state.currentPage || "未知"
      }页] 📤 正在将种子上传到qBittorrent`
    );

    const uploaded = await qbClient.addTorrentFile(torrentPath);
    if (uploaded) {
      logger.info(
        `[${state.searchType}：第${
          state.currentPage || "未知"
        }页] 📁 下载路径: ${CONFIG.QBITTORRENT.DOWNLOAD_PATH}  保存路径：${
          CONFIG.QBITTORRENT.FINAL_PATH
        }`
      );
      logger.success(
        `[${state.searchType}：第${
          state.currentPage || "未知"
        }页] ✅ 种子已成功添加到qBittorrent`
      );
      return true;
    }
    logger.error(
      `[${state.searchType}：第${
        state.currentPage || "未知"
      }页] ❌ 种子添加到qBittorrent失败`
    );
    return false;
  } catch (error) {
    logger.error(`上传到qBittorrent失败: ${error.message}`);
    return false;
  }
};

// 删除种子文件
const deleteTorrentFile = async (state, torrentPath, item) => {
  try {
    if (existsSync(torrentPath)) {
      await globalRetryManager.execute(async () => {
        await fs.unlink(torrentPath);
      });
      logger.success(
        `[${state.searchType}：第${
          state.currentPage || "未知"
        }页] 🗑️  删除/torrents下载的种子文件`
      );

      // 检查种子目录是否为空，如果为空则删除目录
      const torrentDir = path.dirname(torrentPath);
      const files = await fs.readdir(torrentDir);
      if (files.length === 0) {
        await fs.rmdir(torrentDir);
        logger.info(
          `[${state.searchType}：第${
            state.currentPage || "未知"
          }页] 📁 已删除空目录: ${torrentDir}`
        );
      }
      return true;
    } else {
      logger.warn(
        `[${state.searchType}：第${
          state.currentPage || "未知"
        }页] ⚠️ 种子文件不存在，无法删除: ${torrentPath}`
      );
      return false;
    }
  } catch (error) {
    logger.error(
      `[${state.searchType}：第${
        state.currentPage || "未知"
      }页] ❌ 删除种子文件失败: ${error.message}`
    );
    return false;
  }
};

// 清理资源
const cleanup = async (qbClient) => {
  if (qbClient) {
    await qbClient.disconnect();
  }
};

// 下载种子主函数
const downloadTorrent = async (state, item, remainingCount) => {
  if (state.isDownloading || state.currentDownload) {
    return false;
  }

  try {
    state.isDownloading = true;
    state.currentDownload = item;

    if (item.size > CONFIG.DOWNLOAD.MAX_SIZE) {
      logger.warn(
        `发现大于 ${formatBytes(CONFIG.DOWNLOAD.MAX_SIZE)} 的种子 "${
          item.name
        }"，跳过当前页剩余种子，继续下一页。`
      );
      state.stopImmediately = true;
      return true;
    }

    if (item.size < CONFIG.DOWNLOAD.MIN_SIZE) {
      logger.warn(
        `跳过小于 ${formatBytes(CONFIG.DOWNLOAD.MIN_SIZE)} 的种子 "${
          item.name
        }"`
      );
      return false;
    }

    logger.warn(
      pc.bold(
        `准备下载：大小: ${formatBytes(item.size)}，剩余文件: ${pc.yellow(
          remainingCount
        )}，名称：${item.name}`
      )
    );

    const torrentUrl = await getTorrentUrl(item);
    if (!torrentUrl) {
      return false;
    }

    const torrentPath = await downloadFile(torrentUrl, CONFIG.DOWNLOAD.DIR, {
      searchType: state.searchType,
      pageNumber: state.currentPage,
    });

    if (torrentPath && state.qbClient) {
      const uploadSuccess = await uploadToQBittorrent(
        state,
        state.qbClient,
        torrentPath
      );

      if (uploadSuccess) {
        await deleteTorrentFile(state, torrentPath, item);
      }
    }

    return true;
  } catch (error) {
    logger.error(`下载失败 ${item.name}: ${error.message}`);
    return false;
  } finally {
    state.currentDownload = null;
    state.isDownloading = false;
  }
};

// 导出下载管理器
export const createDownloadManager = ({ currentPage, searchType }) => {
  const state = createDownloadManagerState({ currentPage, searchType });

  return {
    get currentPage() {
      return state.currentPage;
    },
    set currentPage(value) {
      state.currentPage = value;
    },
    get gracefulExit() {
      return state.gracefulExit;
    },
    set gracefulExit(value) {
      state.gracefulExit = value;
    },
    get stopImmediately() {
      return state.stopImmediately;
    },
    set stopImmediately(value) {
      state.stopImmediately = value;
    },
    get searchType() {
      return state.searchType;
    },
    set searchType(value) {
      state.searchType = value;
    },

    downloadTorrent: (item, remainingCount) =>
      downloadTorrent(state, item, remainingCount),
    cleanup: () => cleanup(state.qbClient),
  };
};
