# MT Auto Download

自动下载M-Team种子的工具，支持自动上传到qBittorrent进行刷魔力值。

## 功能特性

- 自动搜索和下载M-Team种子
- 支持自动上传种子到qBittorrent（使用原生JavaScript实现）
- 可配置的下载大小限制
- 自动跳过已下载的种子
- 支持优雅退出
- 无需额外依赖包，使用axios直接调用qBittorrent API

## 安装依赖

```bash
pnpm install
```

## 配置

### 1. 基础配置

编辑 `config/index.js` 文件：

```javascript
export const CONFIG = {
  DOWNLOAD: {
    DIR: 'torrents',           // 种子文件保存目录
    INTERVAL: 30 * 1000,       // 下载间隔（毫秒）
    MAX_SIZE: 150 * 1024 * 1024, // 最大下载大小（150MB）
    MIN_SIZE: 11 * 1024 * 1024,  // 最小下载大小（11MB）
  },
  SEARCH: {
    TYPE: '剧集',              // 搜索类型
    PAGE_SIZE: 100,            // 每页数量
    START_PAGE: 1,             // 起始页码
  },
  QBITTORRENT: {
    ENABLED: true,             // 是否启用qBittorrent自动上传
    BASE_URL: 'http://localhost:8080', // qBittorrent Web UI地址
    USERNAME: 'admin',         // qBittorrent用户名
    PASSWORD: 'admin',         // qBittorrent密码
    SAVE_PATH: '/downloads/刷魔力值', // 保存路径
    CATEGORY: '刷魔力值',       // 分类
    TAGS: '刷魔力值,待转移'     // 标签
  }
};
```

### 2. qBittorrent配置

确保你的qBittorrent已启用Web UI：

1. 打开qBittorrent
2. 进入 `工具` -> `选项` -> `Web UI`
3. 勾选 `Web用户界面(远程控制)`
4. 设置端口（默认8080，你的配置是8085）
5. 设置用户名和密码
6. 点击应用并确定

**注意**：程序使用原生JavaScript实现qBittorrent API调用，无需额外依赖包。

### 3. 认证配置

编辑 `env.js` 文件，填入你的M-Team认证信息：

```javascript
s = "你的密钥";
authorization = "你的认证token";
did = "你的设备ID";
cookie = "你的cookie";
version = "版本号";
webVersion = "Web版本号";
visitorid = "访客ID";
```

## 使用方法

### 启动程序

```bash
node index.js
# 或者使用npm脚本
pnpm start
```

### 测试qBittorrent连接

在正式使用前，建议先测试qBittorrent连接：

```bash
node test-qb.js
# 或者使用npm脚本
pnpm test-qb
```

## 功能说明

### 自动上传到qBittorrent

当种子下载成功后，程序会自动：

1. 连接到qBittorrent Web UI
2. 上传种子文件
3. 设置保存路径为 `/downloads/刷魔力值`
4. 添加分类 `刷魔力值`
5. 添加标签 `刷魔力值,待转移`

### 配置选项

- `QBITTORRENT.ENABLED`: 是否启用自动上传功能
- `QBITTORRENT.BASE_URL`: qBittorrent Web UI地址
- `QBITTORRENT.USERNAME`: qBittorrent用户名
- `QBITTORRENT.PASSWORD`: qBittorrent密码
- `QBITTORRENT.SAVE_PATH`: 种子下载保存路径
- `QBITTORRENT.CATEGORY`: 种子分类
- `QBITTORRENT.TAGS`: 种子标签（逗号分隔）

## 注意事项

1. 确保qBittorrent正在运行且Web UI已启用
2. 检查网络连接和防火墙设置
3. 确保保存路径在qBittorrent中是可写的
4. 建议在测试环境中先验证配置是否正确

## 故障排除

如果遇到连接问题：

1. 检查qBittorrent Web UI是否正常运行
2. 验证用户名和密码是否正确
3. 确认端口是否被防火墙阻止
4. 检查网络连接是否正常
