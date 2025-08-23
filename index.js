import { searchApi, queryHistoryApi, torrentApi } from "./api/search.js";
import fs from "fs";

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
  const res = await torrentApi({
    id: data.id,
  });
  console.log(234, res);
  return res.data;
}

const start = async () => {
  console.log("开始");
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
  console.log("结束");
};
start();

// 循环下载 filteredData 数据
const time = 30 * 1000; // 30秒
function loopDownload(filteredData) {
  let index = 0;
  const downloadNext = async () => {
    if (index >= filteredData.length) {
      console.log("所有文件下载完成");
    } else {
      const item = filteredData[index];
      console.log(12, item);
      const torrentUrl = await torrent(item);
      console.log(`下载链接为：${torrentUrl}`);
      // 下载到本地
      await downloadFile(torrentUrl, `./${item.name}.torrent`);
      console.log(`下载完成`);
      //等待time秒
      await new Promise((resolve) => setTimeout(resolve, time));
      index++;
      downloadNext();
    }
  };
  downloadNext();
}

// node 下载文件
async function downloadFile(url, dest) {
  const writer = fs.createWriteStream(dest);
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}
