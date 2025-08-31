import { downloadFile, formatBytes, logger } from "../utils/index.js";
import { torrentApi } from "../api/search.js";
import { QBittorrentAPI } from "../api/qbittorrent.js";
import { globalRetryManager } from "../utils/retry.js";
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
    this.currentPage = null;
    
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
        `[${this.searchType}：第${this.currentPage || '未知'}页] 准备下载: ${pc.cyan(item.name)}，大小: ${pc.bold(
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
        const uploadSuccess = await this.uploadToQBittorrent(torrentPath, item);
        
        // 如果上传成功，删除种子文件
        if (uploadSuccess) {
          await this.deleteTorrentFile(torrentPath, item);
        }
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
      const res = await globalRetryManager.execute(
        () => torrentApi({ id: data.id }),
        `获取种子链接 ${data.name}`
      );
      return res.data;
    } catch (error) {
      logger.error(`❌ 获取 ${data.name} 的种子链接失败: ${error.message}`);
      return null;
    }
  }

  async uploadToQBittorrent(torrentPath, item) {
    try {
      logger.info(`[${this.searchType}：第${this.currentPage || '未知'}页] 📤 正在将种子上传到qBittorrent: ${item.name}`);
      
      // 不传递savepath，让qBittorrent API使用默认的DOWNLOAD_PATH
      const success = await this.qbClient.addTorrentFile(torrentPath, {
        category: CONFIG.QBITTORRENT.CATEGORY,
        tags: CONFIG.QBITTORRENT.TAGS
      });

      if (success) {
        logger.success(`[${this.searchType}：第${this.currentPage || '未知'}页] ✅ 种子 "${item.name}" 已成功添加到qBittorrent`);
        logger.info(`[${this.searchType}：第${this.currentPage || '未知'}页] 📁 下载路径: ${CONFIG.QBITTORRENT.DOWNLOAD_PATH}`);
        logger.info(`[${this.searchType}：第${this.currentPage || '未知'}页] 📁 完成后将移动到: ${CONFIG.QBITTORRENT.FINAL_PATH}`);
        return true; // 返回成功状态
      } else {
        logger.error(`[${this.searchType}：第${this.currentPage || '未知'}页] ❌ 种子 "${item.name}" 添加到qBittorrent失败`);
        return false; // 返回失败状态
      }
    } catch (error) {
      logger.error(`[${this.searchType}：第${this.currentPage || '未知'}页] ❌ 上传种子到qBittorrent时发生错误: ${error.message}`);
      return false; // 返回失败状态
    }
  }

  async deleteTorrentFile(torrentPath, item) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      // 检查文件是否存在
      if (fs.existsSync(torrentPath)) {
        // 删除种子文件
        fs.unlinkSync(torrentPath);
        logger.success(`[${this.searchType}：第${this.currentPage || '未知'}页] 🗑️ 已删除种子文件: ${path.basename(torrentPath)}`);
        
        // 检查种子目录是否为空，如果为空则删除目录
        const torrentDir = path.dirname(torrentPath);
        const files = fs.readdirSync(torrentDir);
        if (files.length === 0) {
          fs.rmdirSync(torrentDir);
          logger.info(`[${this.searchType}：第${this.currentPage || '未知'}页] 📁 已删除空目录: ${torrentDir}`);
        }
      } else {
        logger.warn(`[${this.searchType}：第${this.currentPage || '未知'}页] ⚠️ 种子文件不存在，无法删除: ${torrentPath}`);
      }
    } catch (error) {
      logger.error(`[${this.searchType}：第${this.currentPage || '未知'}页] ❌ 删除种子文件失败: ${error.message}`);
    }
  }

  async cleanup() {
    // 断开qBittorrent连接
    if (this.qbClient) {
      await this.qbClient.disconnect();
    }
  }
}
