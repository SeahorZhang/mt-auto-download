#!/usr/bin/env node

/**
 * 配置验证脚本
 * 用于检查环境变量配置是否正确
 */

import dotenv from "dotenv";
import pc from "picocolors";

// 加载环境变量
dotenv.config();

console.log("🔍 配置验证开始...\n");

// 检查必需配置
const requiredConfigs = [
  { name: "AUTH_TOKEN", value: process.env.AUTH_TOKEN, description: "认证令牌" },
  { name: "DID", value: process.env.DID, description: "设备ID" },
  { name: "COOKIE", value: process.env.COOKIE, description: "Cookie信息" },
  { name: "VISITOR_ID", value: process.env.VISITOR_ID, description: "访问者ID" }
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
  { name: "API_BASE_URL", value: process.env.API_BASE_URL || "https://api.m-team.cc", description: "API基础URL" },
  { name: "SECRET_KEY", value: process.env.SECRET_KEY || "HLkPcWmycL57mfJt", description: "签名密钥" },
  { name: "VERSION", value: process.env.VERSION || "1.1.4", description: "版本号" },
  { name: "WEB_VERSION", value: process.env.WEB_VERSION || "1140", description: "Web版本" },
  { name: "DOWNLOAD_DIR", value: process.env.DOWNLOAD_DIR || "torrents", description: "下载目录" },
  { name: "QB_ENABLED", value: process.env.QB_ENABLED || "true", description: "qBittorrent启用状态" },
  { name: "QB_BASE_URL", value: process.env.QB_BASE_URL || "http://192.168.50.100:8085", description: "qBittorrent地址" },
  { name: "QB_USERNAME", value: process.env.QB_USERNAME || "admin", description: "qBittorrent用户名" },
  { name: "QB_PASSWORD", value: process.env.QB_PASSWORD || "188642345", description: "qBittorrent密码" }
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
