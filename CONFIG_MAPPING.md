# 配置映射说明

## 概述
本文档说明了 `.env` 文件中的环境变量与 `config/index.js` 中配置项的对应关系。

## 环境变量与配置项映射

### 🔐 API 基础配置

| 环境变量 | 配置项 | 默认值 | 说明 |
|----------|--------|--------|------|
| `API_BASE_URL` | `API_BASE_URL` | `https://api.m-team.cc` | API 基础 URL |
| `SECRET_KEY` | `SECRET_KEY` | `HLkPcWmycL57mfJt` | 签名密钥 |
| `AUTH_TOKEN` | `AUTH_TOKEN` | - | 认证令牌（必需） |
| `DID` | `DID` | - | 设备 ID（必需） |
| `COOKIE` | `COOKIE` | - | Cookie 信息（必需） |
| `VERSION` | `VERSION` | `1.1.4` | 版本号 |
| `WEB_VERSION` | `WEB_VERSION` | `1140` | Web 版本 |
| `VISITOR_ID` | `VISITOR_ID` | - | 访问者 ID（必需） |

### 📥 下载配置

| 环境变量 | 配置项 | 默认值 | 说明 |
|----------|--------|--------|------|
| `DOWNLOAD_DIR` | `CONFIG.DOWNLOAD.DIR` | `torrents` | 下载目录 |
| `DOWNLOAD_INTERVAL` | `CONFIG.DOWNLOAD.INTERVAL` | `30000` | 下载间隔（毫秒） |
| `DOWNLOAD_GRACEFUL_INTERVAL` | `CONFIG.DOWNLOAD.GRACEFUL_INTERVAL` | `10000` | 优雅退出间隔（毫秒） |
| `DOWNLOAD_MAX_SIZE` | `CONFIG.DOWNLOAD.MAX_SIZE` | `157286400` | 最大文件大小（字节） |
| `DOWNLOAD_MIN_SIZE` | `CONFIG.DOWNLOAD.MIN_SIZE` | `11534336` | 最小文件大小（字节） |
| `DOWNLOAD_RETRY_COUNT` | `CONFIG.DOWNLOAD.RETRY_COUNT` | `3` | 重试次数 |
| `DOWNLOAD_RETRY_DELAY` | `CONFIG.DOWNLOAD.RETRY_DELAY` | `5000` | 重试延迟（毫秒） |
| `DOWNLOAD_TIMEOUT` | `CONFIG.DOWNLOAD.TIMEOUT` | `30000` | 下载超时（毫秒） |
| `DOWNLOAD_MAX_CONCURRENT` | `CONFIG.DOWNLOAD.MAX_CONCURRENT` | `1` | 最大并发下载数 |

### 🔍 搜索配置

| 环境变量 | 配置项 | 默认值 | 说明 |
|----------|--------|--------|------|
| `SEARCH_PAGE_SIZE` | `CONFIG.SEARCH.PAGE_SIZE` | `100` | 每页大小 |
| `SEARCH_START_PAGE` | `CONFIG.SEARCH.START_PAGE` | `1` | 起始页码 |
| `SEARCH_MAX_ERRORS_PER_PAGE` | `CONFIG.SEARCH.MAX_ERRORS_PER_PAGE` | `3` | 每页最大错误次数 |
| `SEARCH_PAGE_INTERVAL` | `CONFIG.SEARCH.PAGE_INTERVAL` | `5000` | 翻页间隔（毫秒） |
| `SEARCH_MAX_PAGES_PER_SESSION` | `CONFIG.SEARCH.MAX_PAGES_PER_SESSION` | `50` | 每次会话最大页数 |

### 🌐 API 配置

| 环境变量 | 配置项 | 默认值 | 说明 |
|----------|--------|--------|------|
| `API_MAX_REQUESTS` | `CONFIG.API.RATE_LIMIT.MAX_REQUESTS` | `8` | 每分钟最大请求数 |
| `API_TIME_WINDOW` | `CONFIG.API.RATE_LIMIT.TIME_WINDOW` | `60000` | 时间窗口（毫秒） |
| `API_MAX_RETRIES` | `CONFIG.API.RETRY.MAX_RETRIES` | `3` | 最大重试次数 |
| `API_BASE_DELAY` | `CONFIG.API.RETRY.BASE_DELAY` | `2000` | 基础延迟时间（毫秒） |
| `API_MAX_DELAY` | `CONFIG.API.RETRY.MAX_DELAY` | `10000` | 最大延迟时间（毫秒） |
| `API_TIMEOUT` | `CONFIG.API.TIMEOUT` | `30000` | API 请求超时（毫秒） |

### 🚀 qBittorrent 配置

| 环境变量 | 配置项 | 默认值 | 说明 |
|----------|--------|--------|------|
| `QB_ENABLED` | `CONFIG.QBITTORRENT.ENABLED` | `true` | 是否启用 qBittorrent |
| `QB_BASE_URL` | `CONFIG.QBITTORRENT.BASE_URL` | `http://192.168.50.100:8085` | Web UI 地址 |
| `QB_USERNAME` | `CONFIG.QBITTORRENT.USERNAME` | `admin` | 用户名 |
| `QB_PASSWORD` | `CONFIG.QBITTORRENT.PASSWORD` | `188642345` | 密码 |
| `QB_DOWNLOAD_PATH` | `CONFIG.QBITTORRENT.DOWNLOAD_PATH` | `/downloads/下载中` | 临时下载路径 |
| `QB_FINAL_PATH` | `CONFIG.QBITTORRENT.FINAL_PATH` | `/downloads/刷魔力值` | 最终保存路径 |
| `QB_CATEGORY` | `CONFIG.QBITTORRENT.CATEGORY` | `刷魔力值` | 分类 |
| `QB_TAGS` | `CONFIG.QBITTORRENT.TAGS` | `刷魔力值,待转移` | 标签 |
| `QB_USE_CATEGORY` | `CONFIG.QBITTORRENT.USE_CATEGORY` | `true` | 是否传递分类 |
| `QB_TIMEOUT` | `CONFIG.QBITTORRENT.TIMEOUT` | `10000` | 连接超时（毫秒） |

### 📝 日志配置

| 环境变量 | 配置项 | 默认值 | 说明 |
|----------|--------|--------|------|
| `LOG_SAVE_TO_FILE` | `CONFIG.LOG.SAVE_TO_FILE` | `false` | 是否保存到文件 |
| `LOG_DIR` | `CONFIG.LOG.LOG_DIR` | `logs` | 日志目录 |
| `LOG_LEVEL` | `CONFIG.LOG.LEVEL` | `info` | 日志级别 |

## 使用方法

### 1. 复制环境变量模板
```bash
cp .env.example .env
```

### 2. 编辑 .env 文件
根据您的实际环境修改相应的值，特别是标记为"必需"的配置项。

### 3. 配置优先级
- 环境变量 > 默认值
- 如果环境变量未设置，将使用代码中的默认值
- 必需的环境变量（如 AUTH_TOKEN）如果未设置，程序会显示警告

## 注意事项

1. **敏感信息**：AUTH_TOKEN、DID、COOKIE、VISITOR_ID 等敏感信息请妥善保管
2. **数值类型**：时间、大小等数值配置会自动转换为数字类型
3. **布尔类型**：布尔配置项使用字符串 `true`/`false`
4. **路径配置**：路径配置支持相对路径和绝对路径
5. **单位说明**：时间单位为毫秒，大小单位为字节
