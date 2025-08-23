import { searchApi, queryHistoryApi, torrentApi } from "./api/search.js";
import fs from "fs";
import axios from "axios";
import path from "path";

const DOWNLOAD_DIR = "torrents";
const DOWNLOAD_INTERVAL = 30 * 1000; // 30秒

let pageNumber = 28;
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
    console.log(22,res)
    return res.data;
  } catch (error) {
    console.error(`获取 ${data.name} 的种子链接失败:`, error.message);
    return null;
  }
}

const start = async () => {
  console.log("开始");

  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
    console.log(`创建下载目录: ${DOWNLOAD_DIR}`);
  }

  console.log(`获取第${pageNumber}页列表数据`);
  const list = await getList();
  console.log(`获取第${pageNumber}页列表数据成功`, list);
  console.log("筛选掉上传为 0 和小于 11M 的数据");
  list.data = list.data.filter(
    (item) => item.status.seeders !== "0" && item.size > 11 * 1024 * 1024
  );
  console.log(`筛选完成，还剩数据 ${list.data.length} 条`);
  console.log("开始查询历史记录");
  const historyData = await queryHistory(list.data);
  console.log("查询历史记录成功", historyData);
  console.log("筛选掉已下载数据");
  const filteredData = list.data.filter(
    (item) => !historyData.historyMap[item.id]
  );
  console.log(`筛选完成，还剩数据 ${filteredData.length} 条`);
  console.log("输出结果");
  console.log(filteredData);

  console.log("开始生成下载链接");
  loopDownload(filteredData);
  // The script will now end when loopDownload finishes.
};
start().catch((err) => {
  console.error("脚本执行时发生未捕获的错误:", err);
});

// 循环下载 filteredData 数据
function loopDownload(filteredData) {
  let index = 0;
  const downloadNext = async () => {
    if (index >= filteredData.length) {
      console.log("所有文件下载完成");
      console.log("结束");
      return;
    }
    const item = filteredData[index];
    console.log(`准备下载: ${item.name}`);
    const torrentUrl = await torrent(item);
    console.log(11,torrentUrl)
    if (torrentUrl) {
      console.log(`下载链接为：${torrentUrl}`);
      // 清理文件名中的非法字符
      const safeFilename = item.name.replace(/[\/\\?%*:|"<>]/g, "-") + ".torrent";
      const destPath = path.join(DOWNLOAD_DIR, safeFilename);
      await downloadFile(torrentUrl, destPath);
    }

    // 等待
    console.log(`等待 ${DOWNLOAD_INTERVAL / 1000} 秒...`);
    await new Promise((resolve) => setTimeout(resolve, DOWNLOAD_INTERVAL));
    index++;
    await downloadNext();
  };
  downloadNext();
}

// node 下载文件
async function downloadFile(url, dest) {
  try {
    const writer = fs.createWriteStream(dest);
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => {
        console.log(`下载完成: ${dest}`);
        resolve();
      });
      writer.on("error", (err) => {
        console.error(`写入文件失败: ${dest}`, err);
        reject(err);
      });
    });
  } catch (error) {
    console.error(`下载文件失败: ${url}`, error.message);
  }
}
