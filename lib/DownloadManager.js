import { downloadFile, formatBytes, logger } from "../utils/index.js";
import { torrentApi } from "../api/search.js";
import { QBittorrentAPI } from "../api/qbittorrent.js";
import pc from "picocolors";
import { CONFIG } from "../config/index.js";
import path from "path";

export class DownloadManager {
  constructor() {
    this.gracefulExit = false;
    this.currentDownload = null;
    this.isDownloading = false;
    this.stopImmediately = false;
    this.qbClient = null;
    
    // 初始化qBittorrent客户端
    if (CONFIG.QBITTORRENT.ENABLED) {
      this.qbClient = new QBittorrentAPI(CONFIG.QBITTORRENT);
    }
  }

  async downloadTorrent(item, remainingCount) {
    this.isDownloading = true;
    try {
      this.currentDownload = item;

      if (item.size > CONFIG.DOWNLOAD.MAX_SIZE) {
        logger.warn(`发现大于 ${formatBytes(CONFIG.DOWNLOAD.MAX_SIZE)} 的种子 "${item.name}"，跳过当前页剩余种子，继续下一页。`);
        this.stopImmediately = true;
        return true;
      }

      if (item.size < CONFIG.DOWNLOAD.MIN_SIZE) {
        logger.warn(`跳过小于 ${formatBytes(CONFIG.DOWNLOAD.MIN_SIZE)} 的种子 "${item.name}"`);
        return false;
      }

      logger.log(
        `准备下载: ${pc.cyan(item.name)}，大小: ${pc.bold(
          formatBytes(item.size)
        )}，本页还剩 ${pc.yellow(remainingCount)} 个文件`
      );

      const torrentUrl = await this.getTorrentUrl(item);
      if (!torrentUrl) {
        return false;
      }

      const torrentPath = await downloadFile(torrentUrl, CONFIG.DOWNLOAD.DIR);
      
      // 如果下载成功且启用了qBittorrent，则上传种子
      if (torrentPath && this.qbClient) {
        await this.uploadToQBittorrent(torrentPath, item);
      }
      
      return true;
    } catch (error) {
      logger.error(`下载失败 ${item.name}: ${error.message}`);
      return false;
    } finally {
      this.currentDownload = null;
      this.isDownloading = false;
    }
  }

  async getTorrentUrl(data) {
    try {
      const res = await torrentApi({ id: data.id });
      return res.data;
    } catch (error) {
      logger.error(`❌ 获取 ${data.name} 的种子链接失败: ${error.message}`);
      return null;
    }
  }

  async uploadToQBittorrent(torrentPath, item) {
    try {
      logger.info(`📤 正在将种子上传到qBittorrent: ${item.name}`);
      
      const success = await this.qbClient.addTorrent(torrentPath, {
        savepath: CONFIG.QBITTORRENT.SAVE_PATH,
        category: CONFIG.QBITTORRENT.CATEGORY,
        tags: CONFIG.QBITTORRENT.TAGS
      });

      if (success) {
        logger.success(`✅ 种子 "${item.name}" 已成功添加到qBittorrent`);
      } else {
        logger.error(`❌ 种子 "${item.name}" 添加到qBittorrent失败`);
      }
    } catch (error) {
      logger.error(`❌ 上传种子到qBittorrent时发生错误: ${error.message}`);
    }
  }

  async cleanup() {
    // 断开qBittorrent连接
    if (this.qbClient) {
      await this.qbClient.disconnect();
    }
  }
}
