import { searchApi, queryHistoryApi, torrentApi } from "./api/search.js";
import fs from "fs";
import { downloadFile } from "./utils/index.js";

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 MB";
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(decimals)} MB`;
}

const DOWNLOAD_DIR = "torrents";
const DOWNLOAD_INTERVAL = 30 * 1000; // 30秒

let pageNumber = 63;
let gracefulExit = false;

process.on("SIGINT", () => {
  console.log("\n收到退出信号，将在当前页面下载完成后安全退出...");
  gracefulExit = true;
});

async function getList() {
  const res = await searchApi({
    pageNumber,
    pageSize: 100,
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
    console.error(`获取 ${data.name} 的种子链接失败:`, error.message);
    return null;
  }
}

const countdown = (seconds) => {
  return new Promise((resolve) => {
    let remaining = seconds;
    const intervalId = setInterval(() => {
      process.stdout.write(`等待 ${remaining} 秒... \r`);
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
  console.log("开始");

  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
    console.log(`创建下载目录: ${DOWNLOAD_DIR}`);
  }

  while (true) {
    if (gracefulExit) {
      console.log("安全退出。");
      break;
    }
    console.log(`获取第${pageNumber}页列表数据`);
    const list = await getList();
    if (!list || !list.data || list.data.length === 0) {
      console.log(`第${pageNumber}页没有数据，脚本结束。`);
      break;
    }
    // 检查是否有大于150M的种子
    if (list.data.some((item) => item.size > 150 * 1024 * 1024)) {
      console.log("发现大于 150M 的种子，脚本停止。");
      break;
    }
    console.log(`获取第${pageNumber}页列表数据成功`);
    console.log("筛选掉上传为 0 和小于 11M 的数据");
    list.data = list.data.filter(
      (item) => item.status.seeders !== "0" && item.size > 11 * 1024 * 1024
    );
    console.log(`筛选完成，还剩数据 ${list.data.length} 条`);

    if (list.data.length > 0) {
      console.log("开始查询历史记录");
      const historyData = await queryHistory(list.data);
      console.log("筛选掉已下载数据");
      const filteredData = list.data.filter(
        (item) => !historyData.historyMap[item.id]
      );
      console.log(`筛选完成，还剩数据 ${filteredData.length} 条`);
      if (filteredData.length > 0) {
        console.log("开始下载");
        await loopDownload(filteredData);
        console.log(`第 ${pageNumber} 页处理完毕，准备翻页`);
        if (gracefulExit) break;
        await countdown(DOWNLOAD_INTERVAL / 1000);
      } else {
        console.log("本页没有需要下载的新数据。");
        console.log(`第 ${pageNumber} 页处理完毕，准备翻页`);
      }
    } else {
      console.log(`第 ${pageNumber} 页没有符合条件的数据`);
    }

    pageNumber++;
  }
  // The script will now end when loopDownload finishes.
};
start().catch((err) => {
  console.error("脚本执行时发生未捕获的错误:", err);
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
      console.log(`准备下载: ${item.name}，大小: ${formatBytes(item.size)}，本页还剩 ${filteredData.length - index} 个文件`);
      const torrentUrl = await torrent(item);
      if (torrentUrl) {
        console.log(`下载链接为：${torrentUrl}`);
        await downloadFile(torrentUrl, DOWNLOAD_DIR);
      }

      index++;
      if (index < filteredData.length) {
        await countdown(DOWNLOAD_INTERVAL / 1000);
        await downloadNext();
      } else {
        resolve();
      }
    };
    downloadNext();
  });
}


