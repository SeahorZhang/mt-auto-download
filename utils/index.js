import { createHmac } from "crypto";
import axios from "axios";
import path from "path";
import fs from "fs";
import pc from "picocolors";

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
      timeout: 30000, // 30秒超时
      // 请求头，让服务器知道我们接受的编码
      headers: {
        "Accept-Charset": "utf-8, gbk;q=0.9, *;q=0.8",
      },
    });

    const contentDisposition = response.headers["content-disposition"];
    if (!contentDisposition) {
      throw new Error("服务器未返回文件名信息");
    }

    const match = contentDisposition.match(/filename="(.+?)"/i);
    if (!match) {
      throw new Error("无法解析文件名");
    }

    let filename = match[1];
    filename = decodeURIComponent(escape(filename));

    // 检查文件名是否包含非法字符
    const invalidChars = /[<>:"/\\|?*]/g;
    if (invalidChars.test(filename)) {
      filename = filename.replace(invalidChars, '_');
    }

    const destPath = path.join(dir, filename);

    const writer = fs.createWriteStream(destPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("下载超时"));
      }, 60000); // 60秒超时

      writer.on("finish", () => {
        clearTimeout(timeout);
        logger.success(`✅ 下载完成: ${filename}`);
        resolve(destPath); // 返回下载文件的完整路径
      });
      
      writer.on("error", (err) => {
        clearTimeout(timeout);
        // 删除可能损坏的文件
        try {
          if (fs.existsSync(destPath)) {
            fs.unlinkSync(destPath);
          }
        } catch (unlinkError) {
          // 忽略删除错误
        }
        reject(err);
      });

      response.data.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  } catch (error) {
    logger.error(`下载文件失败: ${url}`, error.message);
    return null;
  }
}

export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 MB";
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(decimals)} MB`;
}


export const logger = {
  info: (msg) => console.log(pc.blue(msg)),
  success: (msg) => console.log(pc.green(msg)),
  warn: (msg) => console.log(pc.yellow(msg)),
  error: (msg) => console.error(pc.red(msg)),
  log: (msg) => console.log(msg),
};