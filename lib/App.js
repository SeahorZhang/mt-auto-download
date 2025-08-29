import { searchApi, queryHistoryApi } from "../api/search.js";
import fs from "fs";
import { logger } from "../utils/index.js";
import { CONFIG } from "../config/index.js";
import { DownloadManager } from "./DownloadManager.js";
import { waitWithCountdown } from "../utils/countdown.js";

export class App {
  constructor() {
    this.pageNumber = CONFIG.SEARCH.START_PAGE;
    this.downloadManager = new DownloadManager();
    this.isRunning = false;
    this.currentPageComplete = false;
    this.setupExitHandler();
  }

  setupExitHandler() {
    process.on("SIGINT", () => {
      if (this.downloadManager.gracefulExit) {
        logger.error("\n强制退出程序。");
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
          if (!list) break;

          const filteredData = await this.filterData(list);
          if (filteredData.length > 0) {
            logger.info(`📄 筛选完成，待下载数据 ${filteredData.length} 条`);
            await this.processDownloads(filteredData);
            logger.info(`第 ${this.pageNumber} 页处理完毕`);
          } else {
            logger.info(`第 ${this.pageNumber} 页无新数据需要下载`);
          }

          this.pageNumber++;
        } catch (error) {
          logger.error(`处理第 ${this.pageNumber} 页时发生错误: ${error.message}`);
          // 发生错误时等待一段时间后继续
          await waitWithCountdown(CONFIG.DOWNLOAD.INTERVAL / 1000);
        }
      }
    } finally {
      this.isRunning = false;
    }
  }

  ensureDownloadDir() {
    if (!fs.existsSync(CONFIG.DOWNLOAD.DIR)) {
      fs.mkdirSync(CONFIG.DOWNLOAD.DIR, { recursive: true });
      logger.success(`✅ 创建下载目录: ${CONFIG.DOWNLOAD.DIR}`);
    }
  }

  async getPageData() {
    logger.info(`📄 获取${CONFIG.SEARCH.TYPE}类第${this.pageNumber}页列表数据`);
    const res = await searchApi({
      pageNumber: this.pageNumber,
      pageSize: CONFIG.SEARCH.PAGE_SIZE,
      type: CONFIG.SEARCH.TYPE,
    });
    
    if (!res.data || !res.data.data || res.data.data.length === 0) {
      logger.warn(`第${this.pageNumber}页没有数据，脚本结束。`);
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

        if (i < filteredData.length - 1) {
          const waitMs = this.downloadManager.gracefulExit
            ? CONFIG.DOWNLOAD.GRACEFUL_INTERVAL
            : CONFIG.DOWNLOAD.INTERVAL;
          await waitWithCountdown(waitMs / 1000);
        }
      }
    } finally {
      this.currentPageComplete = true;
      if (this.downloadManager.gracefulExit) {
        logger.success("✅ 当前页面下载任务已完成，准备安全退出");
      }
    }
  }
}
