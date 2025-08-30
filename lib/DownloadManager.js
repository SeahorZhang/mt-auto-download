import { downloadFile, formatBytes, logger } from "../utils/index.js";
import { torrentApi } from "../api/search.js";
import pc from "picocolors";
import { CONFIG } from "../config/index.js";

export class DownloadManager {
  constructor() {
    this.gracefulExit = false;
    this.currentDownload = null;
    this.isDownloading = false;
    this.stopImmediately = false;
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

      await downloadFile(torrentUrl, CONFIG.DOWNLOAD.DIR);
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
}
