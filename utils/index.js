import { createHmac } from "crypto";
import axios from "axios";
import path from "path";
import fs from "fs";
import pc from "picocolors";

/**
 * 日志工具
 * 提供彩色控制台输出功能
 */
export const logger = {
  info: (msg) => console.log(pc.blue(msg)),
  success: (msg) => console.log(pc.green(msg)),
  warn: (msg) => console.log(pc.yellow(msg)),
  error: (msg) => console.error(pc.red(msg)),
  log: (msg) => console.log(msg),
};

/**
 * HMAC-SHA1 签名函数
 * @param {string} message - 要签名的消息
 * @param {string} key - 签名密钥
 * @returns {string} base64编码的签名
 */
export function hmacSHA1(message, key) {
  return createHmac("sha1", key).update(message).digest("base64");
}

/**
 * 下载文件到指定目录
 * @param {string} url - 文件下载地址
 * @param {string} dir - 保存目录
 * @param {Object} options - 额外选项
 * @param {string} [options.searchType] - 搜索类型
 * @param {number} [options.pageNumber] - 页码
 * @returns {Promise<string|null>} 下载文件路径或null
 */
export async function downloadFile(url, dir, options = {}) {
  try {
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
      timeout: 30000, // 30秒超时
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
      filename = filename.replace(invalidChars, "_");
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
        const context = options.searchType && options.pageNumber
          ? `[${options.searchType}：第${options.pageNumber}页] `
          : '';
        logger.success(`${context}✅ 下载完成: ${filename}`);
        resolve(destPath);
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

/**
 * 格式化字节数为可读格式
 * @param {number} bytes - 字节数
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的字符串
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 MB";
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(decimals)} MB`;
}

/**
 * 确保目录存在
 * @param {string} dirPath - 目录路径
 * @returns {boolean} 是否成功创建或已存在
 */
export function ensureDir(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.success(`✅ 创建目录: ${dirPath}`);
    }
    return true;
  } catch (error) {
    logger.error(`创建目录失败: ${dirPath}`, error.message);
    return false;
  }
}
