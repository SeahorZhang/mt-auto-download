import { searchApi, queryHistoryApi, torrentApi } from "./api/search.js";
import fs from "fs";
import { downloadFile, formatBytes, logger } from "./utils/index.js";
import pc from "picocolors";

const DOWNLOAD_DIR = "torrents";
const DOWNLOAD_INTERVAL = 30 * 1000; // 30秒

let pageNumber = 22;
const searchType = "剧集"; // 综合 电影 记录 剧集 音乐 动漫 体育 软件 游戏 电子书 有声书 教育影片 其他
let gracefulExit = false;

process.on("SIGINT", () => {
  if (gracefulExit) {
    logger.error("\n强制退出程序。");
    process.exit(1);
  }
  logger.warn("\n收到退出信号，将在当前页面下载完成后安全退出...（再次按下 Ctrl+C 将强制退出）");
  gracefulExit = true;
});

async function getList() {
  const res = await searchApi({
    pageNumber,
    pageSize: 100,
    type: searchType,
  });
  return res.data;
}

async function queryHistory(data) {
  const res = await queryHistoryApi({
    tids: data.map((item) => item.id),
  });
  return res.data;
}

async function torrent(data) {
  try {
    const res = await torrentApi({
      id: data.id,
    });
    return res.data;
  } catch (error) {
    logger.error(`❌ 获取 ${data.name} 的种子链接失败: ${error.message}`);
    return null;
  }
}

const countdown = (seconds) => {
  return new Promise((resolve) => {
    let remaining = seconds;
    const intervalId = setInterval(() => {
      if (gracefulExit) {
        process.stdout.write(
          pc.yellow("收到退出信号，等待当前任务完成... ") +
            pc.gray(`⏳ ${remaining} 秒`) +
            "   \r"
        );
      } else {
        process.stdout.write(pc.gray(`⏳ 等待 ${remaining} 秒... \r`));
      }

      remaining--;
      if (remaining < 0) {
        clearInterval(intervalId);
        process.stdout.write("\n"); // Move to next line after countdown
        resolve();
      }
    }, 1000);
  });
};

const start = async () => {
  logger.info("🚀 开始");

  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
    logger.success(`✅ 创建下载目录: ${DOWNLOAD_DIR}`);
  }

  while (true) {
    if (gracefulExit) {
      logger.warn("🛑 安全退出。");
      break;
    }
    logger.info(`📄 获取${searchType}类第${pageNumber}页列表数据`);
    const list = await getList();
    if (!list || !list.data || list.data.length === 0) {
      logger.warn(`第${pageNumber}页没有数据，脚本结束。`);
      break;
    }
    logger.info("🔍 筛选掉上传为 0 和小于 11M 并未下载过的数据");
    list.data = list.data.filter(
      (item) => item.status.seeders !== "0" && item.size > 11 * 1024 * 1024
    );
    if (list.data.length > 0) {
      const historyData = await queryHistory(list.data);
      const filteredData = list.data.filter(
        (item) => !historyData.historyMap[item.id]
      );
      logger.info(`📄 筛选完成，还剩数据 ${filteredData.length} 条`);
      if (filteredData.length > 0) {
        logger.info("⬇️ 开始下载");
        await loopDownload(filteredData);
        logger.info(`第 ${pageNumber} 页处理完毕，准备翻页`);
        if (gracefulExit) break;
        await countdown(DOWNLOAD_INTERVAL / 1000);
      } else {
        logger.warn("本页没有需要下载的新数据。");
        logger.info(`第 ${pageNumber} 页处理完毕，准备翻页`);
      }
    } else {
      logger.warn(`第 ${pageNumber} 页没有符合条件的数据`);
    }

    pageNumber++;
  }
  // The script will now end when loopDownload finishes.
};
start().catch((err) => {
  logger.error(`脚本执行时发生未捕获的错误: ${err}`);
});

// 循环下载 filteredData 数据
function loopDownload(filteredData) {
  return new Promise((resolve) => {
    let index = 0;
    const downloadNext = async () => {
      if (index >= filteredData.length) {
        resolve();
        return;
      }
      const item = filteredData[index];

      if (item.size > 150 * 1024 * 1024) {
        logger.warn(`发现大于 150M 的种子 "${item.name}"，脚本将停止。`);
        gracefulExit = true;
        resolve();
        return;
      }

      logger.log(
        `准备下载: ${pc.cyan(item.name)}，大小: ${pc.bold(
          formatBytes(item.size)
        )}，本页还剩 ${pc.yellow(filteredData.length - index)} 个文件`
      );
      const torrentUrl = await torrent(item);
      if (torrentUrl) {
        logger.success(`下载链接为：${torrentUrl}`);
        await downloadFile(torrentUrl, DOWNLOAD_DIR);
      }

      index++;
      if (index < filteredData.length) {
        if (gracefulExit) {
          // 如果收到了退出信号，就不再等待，直接开始下一个下载
          await countdown((DOWNLOAD_INTERVAL - 20 * 1000) / 1000);
          await downloadNext();
        } else {
          await countdown(DOWNLOAD_INTERVAL / 1000);
          await downloadNext();
        }
      } else {
        logger.success(`✅ ${pageNumber}页文件下载完成`);
        resolve();
      }
    };
    downloadNext();
  });
}
