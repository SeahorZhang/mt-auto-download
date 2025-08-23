import { createHmac } from "crypto";
import axios from "axios";
import path from "path";
import fs from "fs";

export function hmacSHA1(message, key) {
  return createHmac("sha1", key).update(message).digest("base64");
}

// node 下载文件
export async function downloadFile(url, dir) {
  try {
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
      // 请求头，让服务器知道我们接受的编码
      headers: {
        "Accept-Charset": "utf-8, gbk;q=0.9, *;q=0.8",
      },
    });

    const contentDisposition = response.headers["content-disposition"];
    const match = contentDisposition.match(/filename="(.+?)"/i);
    // 先取出来
    let filename = match[1];
    filename = decodeURIComponent(escape(filename));

    const destPath = path.join(dir, filename);

    const writer = fs.createWriteStream(destPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => {
        console.log(`下载完成: ${destPath}`);
        resolve();
      });
      writer.on("error", (err) => {
        console.error(`写入文件失败: ${destPath}`, err);
        reject(err);
      });
    });
  } catch (error) {
    console.error(`下载文件失败: ${url}`, error.message);
  }
}
