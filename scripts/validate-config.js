#!/usr/bin/env node

/**
 * 配置验证脚本
 * 用于检查环境变量配置是否正确
 */

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
  DOWNLOAD_DIR,
  QB_ENABLED,
  QB_BASE_URL,
  QB_USERNAME,
  QB_PASSWORD
} from "../config/index.js";

console.log("🔍 配置验证开始...\n");

// 检查必需配置
const requiredConfigs = [
  { name: "AUTH_TOKEN", value: AUTH_TOKEN, description: "认证令牌" },
  { name: "DID", value: DID, description: "设备ID" },
  { name: "COOKIE", value: COOKIE, description: "Cookie信息" },
  { name: "VISITOR_ID", value: VISITOR_ID, description: "访问者ID" }
];

console.log("📋 必需配置检查:");
let hasError = false;

requiredConfigs.forEach(config => {
  if (!config.value) {
    console.log(`❌ ${config.name}: 未设置 - ${config.description}`);
    hasError = true;
  } else {
    console.log(`✅ ${config.name}: 已设置 - ${config.description}`);
  }
});

console.log();

// 检查可选配置
console.log("📋 可选配置检查:");
const optionalConfigs = [
  { name: "API_BASE_URL", value: API_BASE_URL, description: "API基础URL" },
  { name: "SECRET_KEY", value: SECRET_KEY, description: "签名密钥" },
  { name: "VERSION", value: VERSION, description: "版本号" },
  { name: "WEB_VERSION", value: WEB_VERSION, description: "Web版本" },
  { name: "DOWNLOAD_DIR", value: DOWNLOAD_DIR, description: "下载目录" },
  { name: "QB_ENABLED", value: QB_ENABLED, description: "qBittorrent启用状态" },
  { name: "QB_BASE_URL", value: QB_BASE_URL, description: "qBittorrent地址" },
  { name: "QB_USERNAME", value: QB_USERNAME, description: "qBittorrent用户名" },
  { name: "QB_PASSWORD", value: QB_PASSWORD, description: "qBittorrent密码" }
];

optionalConfigs.forEach(config => {
  if (config.value) {
    console.log(`✅ ${config.name}: ${config.value} - ${config.description}`);
  } else {
    console.log(`⚠️  ${config.name}: 使用默认值 - ${config.description}`);
  }
});

console.log();

// 总结
if (hasError) {
  console.log("❌ 配置验证失败！请检查必需配置项。");
  console.log("💡 提示：复制 .env.example 为 .env 并填入实际值");
  process.exit(1);
} else {
  console.log("✅ 配置验证通过！所有必需配置项已设置。");
  console.log("🚀 可以启动程序了");
}
