import axios from "axios";
import qs from "qs";
import FormDataNode from "form-data"; // Node.js 下使用
import { hmacSHA1 } from "../utils/index.js";
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
  (config) => {
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
// api.interceptors.response.use(
//   (response) => {
//     // 对响应数据做点什么
//     // 例如，只返回 data 部分
//     if (response.data && response.data.code === 0) {
//       return response.data;
//     } else {
//       // 处理业务错误
//       const errorMessage =
//         (response.data && response.data.message) || "API 返回未知错误";
//       console.error("API Error:", errorMessage);
//       return Promise.reject(new Error(errorMessage));
//     }
//   },
//   (error) => {
//     // 对响应错误做点什么
//     console.error("Request Error:", error.message);
//     if (error.response) {
//       // 请求成功发出且服务器也响应了状态码，但状态代码超出了 2xx 的范围
//       console.error("Error Response Status:", error.response.status);
//       console.error("Error Response Data:", error.response.data);
//     } else if (error.request) {
//       // 请求已经成功发起，但没有收到响应
//       console.error("Error Request: No response received");
//     }
//     return Promise.reject(error);
//   }
// );

export default api;