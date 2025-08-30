import axios from "axios";
import qs from "qs";
import FormDataNode from "form-data"; // Node.js 下使用
import { hmacSHA1 } from "../utils/index.js";
import { globalRateLimiter } from "../utils/rateLimiter.js";
import { logger } from "../utils/index.js";
import {
  API_BASE_URL,
  SECRET_KEY,
  AUTH_TOKEN,
  DID,
  COOKIE,
  VERSION,
  WEB_VERSION,
  VISITOR_ID,
} from "./config.js";

// 你的签名函数
function genSign(method, url, timestamp) {
  const signStr = `${method.toUpperCase()}&${url}&${timestamp}`;
  return hmacSHA1(signStr, SECRET_KEY); // 使用从配置中导入的密钥
}

/**
 * 自动处理 POST 请求数据并添加 _timestamp 和 _sgin
 */
function handlePostData(data, url, headers = {}) {
  const _timestamp = Date.now();
  const _sgin = genSign("POST", url, _timestamp);
  // 🔹 FormData (Node.js)
  if (data instanceof FormDataNode) {
    data.append("_timestamp", _timestamp);
    data.append("_sgin", _sgin);

    // Node.js 下需要设置 boundary
    if (data.getHeaders) {
      headers = { ...headers, ...data.getHeaders() };
    }

    return { data, headers };
  }

  // 🔹 x-www-form-urlencoded
  const contentType = headers["Content-Type"] || headers["content-type"] || "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const obj = typeof data === "string" ? qs.parse(data) : data || {};
    obj._timestamp = _timestamp;
    obj._sgin = _sgin;
    return { data: qs.stringify(obj), headers };
  }

  // 🔹 默认 JSON
  const obj = data || {};
  obj._timestamp = _timestamp;
  obj._sgin = _sgin;
  return { data: obj, headers };
}

// 创建 Axios 实例
const api = axios.create({
  baseURL: API_BASE_URL, // 使用绝对路径
  headers: {
    authorization: AUTH_TOKEN,
    did: DID,
    cookie: COOKIE,
    version: VERSION,
    webVersion: WEB_VERSION,
    visitorid: VISITOR_ID,
  },
});

// 请求拦截器
api.interceptors.request.use(
  async (config) => {
    // 请求频率控制
    await globalRateLimiter.waitForNextSlot();
    globalRateLimiter.recordRequest();
    
    const method = (config.method || "GET").toUpperCase();

    if (method === "POST") {
      const result = handlePostData(config.data, config.url, config.headers);
      config.data = result.data;
      config.headers = result.headers;
    } else {
      const _timestamp = Date.now();
      const _sgin = genSign(method, config.url || "", _timestamp);

      config.params = {
        ...(config.params || {}),
        _timestamp,
        _sgin,
      };
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 检查API响应状态
    if (response.data && response.data.code !== undefined) {
      // 将code转换为数字进行比较，因为API返回的code是字符串
      const code = parseInt(response.data.code, 10);
      if (code === 0) {
        // 成功响应，直接返回
        return response;
      } else {
        // 错误响应
        const errorMessage = response.data.message || "API 返回错误";
        logger.error(`API Error (${response.data.code}): ${errorMessage}`);
        return Promise.reject(new Error(errorMessage));
      }
    }
    return response;
  },
  (error) => {
    // 处理网络错误
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || "请求失败";
      
      if (status === 429) {
        logger.error("请求频率过高，服务器限制访问");
      } else if (status === 401) {
        logger.error("认证失败，请检查token是否有效");
      } else if (status === 403) {
        logger.error("访问被拒绝，可能被服务器封禁");
      } else {
        logger.error(`HTTP ${status}: ${message}`);
      }
    } else if (error.request) {
      logger.error("网络连接失败，请检查网络连接");
    } else {
      logger.error(`请求错误: ${error.message}`);
    }
    
    return Promise.reject(error);
  }
);

export default api;