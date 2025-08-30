# qBittorrent API 参数更新记录

## 更新概述

根据提供的 qBittorrent API 入参格式，已更新 `api/qbittorrent.js` 文件中的参数名称和值，使其与官方 API 规范保持一致。

## 主要修改

### 1. 种子文件添加方法 (`addTorrentFile`)

**修改前的参数：**
- `auto_tmm` → `autoTMM`
- `save_path` → `savepath` + `downloadPath`
- `is_top_of_queue` → `addToTopOfQueue`
- `content_layout` → `contentLayout`
- `first_last_piece_priority` → `firstLastPiecePrio`
- `sequential` → `sequentialDownload`

**新增的参数：**
- `stopped: false`
- `stopCondition: 'None'`
- `useDownloadPath: true`

### 2. 磁力链接添加方法 (`addMagnet`)

**修改前的参数：**
- `auto_tmm` → `autoTMM`
- `save_path` → `savepath` + `downloadPath`
- `is_top_of_queue` → `addToTopOfQueue`
- `content_layout` → `contentLayout`
- `first_last_piece_priority` → `firstLastPiecePrio`
- `sequential` → `sequentialDownload`

**新增的参数：**
- `stopped: false`
- `stopCondition: 'None'`
- `useDownloadPath: true`

## 更新后的参数列表

### 种子文件添加参数
```javascript
formData.append('addToTopOfQueue', 'false');
formData.append('autoTMM', 'false');
formData.append('contentLayout', 'Original');
formData.append('downloadPath', this.config.DOWNLOAD_PATH);
formData.append('firstLastPiecePrio', 'false');
formData.append('paused', 'false');
formData.append('stopped', 'false');
formData.append('savepath', this.config.DOWNLOAD_PATH);
formData.append('sequentialDownload', 'false');
formData.append('skip_checking', 'false');
formData.append('stopCondition', 'None');
formData.append('useDownloadPath', 'true');
```

### 磁力链接添加参数
```javascript
params.append('addToTopOfQueue', 'false');
params.append('autoTMM', 'false');
params.append('contentLayout', 'Original');
params.append('downloadPath', this.config.DOWNLOAD_PATH);
params.append('firstLastPiecePrio', 'false');
params.append('paused', 'false');
params.append('stopped', 'false');
params.append('savepath', this.config.DOWNLOAD_PATH);
params.append('sequentialDownload', 'false');
params.append('skip_checking', 'false');
params.append('stopCondition', 'None');
params.append('useDownloadPath', 'true');
```

## 兼容性说明

- 所有参数值保持与原有逻辑一致
- 新增的参数提供了更完整的 qBittorrent 配置选项
- 保持了原有的 category 和 tags 支持
- 日志输出已同步更新，便于调试和监控

## 注意事项

1. `downloadPath` 和 `savepath` 都设置为 `DOWNLOAD_PATH`，确保下载到临时目录
2. `useDownloadPath` 设置为 `true`，启用下载路径功能
3. `stopCondition` 设置为 `'None'`，表示不设置停止条件
4. 所有布尔值参数都使用字符串格式 (`'false'` 而不是 `false`)

## 测试建议

建议在更新后测试以下功能：
1. 种子文件添加功能
2. 磁力链接添加功能
3. 参数传递是否正确
4. 日志输出是否完整
5. 下载路径设置是否生效
