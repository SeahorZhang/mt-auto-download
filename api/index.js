import axios from "axios";
import qs from "qs";
import FormDataNode from "form-data"; // Node.js 下使用
import { hmacSHA1 } from "../utils/index.js";

const s = "HLkPcWmycL57mfJt";
const authorization =
  "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJzZWFob3IwMDEiLCJ1aWQiOjM1Njc4OCwianRpIjoiNDE4NDBlZmEtNzQ1OS00NWMxLWEyMmMtZTZlMGI2ZWE2ODI3IiwiaXNzIjoiaHR0cHM6Ly9hcGkubS10ZWFtLmNjIiwiaWF0IjoxNzUzOTc2MzY1LCJleHAiOjE3NTY1NjgzNjV9.LdclaE_ohBzW2U0pE16WcwlYAMjNnag9LDZoncIHnQqSzDcJRSTalFyYrVsX_ye8FIiSWQMIgla_62_GPKbcOw";
const did = "9c9c665984e54a6e8b239462aeafacb4";
const cookie =
  "cf_clearance=mIi9nEVYErj_u7ltliR6HU4t1gF_bwMKvl9M7D3bvIc-1746074003-1.2.1.1-.nI92fuJBSN..7X4e1ZGxlJeaG2YM2nd.X9.k5vh9DN.1kkSJLl03HS9ksI8FFZwlKj3zf8fuIdAgEc3IbDvnj0V2bxt1nQdVb9FivoPuBrTo5CqBiSAl7qF.Y.n3gHExr_TG.jImTAez61kscH8NGo5bSzfKfxPrWUZTQM6ucILGf6qHa9_Y0c2rUMGngFOhuHGxIFC7raZlo9OFD4dQim7ZZsIhspgNVS9TYGvSoU.eXpkSEGa54Yg0OWCsJH.3xJQOWz9z4yfyNJIKJZf3FXeIvZRWOvVCbFY.KbQ4ohCcpFTAt1FkFLqcRaL0vXY0JKCSNBOyQO3QLFN2AXWqAz7qUt3D8OZJRwyHlQh5INz0ezp4Mc0NqQvBmBa3KEV";
const version = "1.1.4";
const webVersion = "1140";
const visitorid = "2dd42bd99e11b410c66c76bb03e46986";

// 你的签名函数
function genSign(method, url, timestamp) {
  const signStr = `${method.toUpperCase()}&${url}&${timestamp}`;
  return hmacSHA1(signStr, s); // s 是你的密钥
}

/**
 * 自动处理 POST 请求数据并添加 _timestamp 和 _sgin
 */
function handlePostData(data, url, headers = {}) {
  const _timestamp = Date.now();
  const _sgin = genSign("POST", url, _timestamp);

  // 🔹 FormData（浏览器或 Node.js）
  if (
    (typeof FormData !== "undefined" && data instanceof FormData) ||
    data instanceof FormDataNode
  ) {
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
  baseURL: "/api",
  headers: {
    authorization,
    did,
    cookie,
    version,
    webVersion,
    visitorid,
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

export default api;
