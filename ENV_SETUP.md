# 环境变量配置说明

## 概述
为了安全起见，敏感配置信息已从代码中移除，改为使用环境变量管理。所有配置现在统一在 `config/index.js` 文件中管理，并且都可以通过环境变量进行自定义。

## 配置位置
- **主配置文件**: `config/index.js`
- **环境变量**: `.env` 文件（项目根目录）
- **模板文件**: `.env.example`
- **配置映射**: `CONFIG_MAPPING.md`

## 配置分类

### 🔐 API 基础配置
- 认证信息、API URL、版本等

### 📥 下载配置
- 下载目录、间隔、重试、文件大小限制等

### 🔍 搜索配置
- 分页、错误处理、会话管理等

### 🌐 API 配置
- 请求限制、重试机制、超时设置等

### 🚀 qBittorrent 配置
- 连接信息、路径设置、分类标签等

### 📝 日志配置
- 日志级别、文件保存、目录设置等

## 设置步骤

### 1. 创建环境变量文件
在项目根目录创建 `.env` 文件：

```bash
cp .env.example .env
```

### 2. 配置环境变量
编辑 `.env` 文件，填入实际值。您可以根据需要修改任何配置项：

```env
# 必需配置（认证信息）
AUTH_TOKEN=your_auth_token_here
DID=your_device_id_here
COOKIE=your_cookie_here
VISITOR_ID=your_visitor_id_here

# 可选配置（使用默认值或自定义）
DOWNLOAD_DIR=my_torrents
DOWNLOAD_INTERVAL=60000
QB_BASE_URL=http://localhost:8080
QB_USERNAME=my_username
QB_PASSWORD=my_password
```

### 3. 重要说明
- **不要将 `.env` 文件提交到版本控制系统**
- 敏感信息包括：`AUTH_TOKEN`、`DID`、`COOKIE`、`VISITOR_ID`
- 所有配置项都可以通过环境变量自定义
- 如果环境变量未设置，将使用代码中的默认值
- 详细配置说明请参考 `CONFIG_MAPPING.md`

### 4. 环境变量说明

| 配置类型 | 必需项 | 可选项 | 说明 |
|----------|--------|--------|------|
| **API 基础** | 4项 | 4项 | 认证和基础配置 |
| **下载** | 0项 | 9项 | 下载行为控制 |
| **搜索** | 0项 | 5项 | 搜索和分页设置 |
| **API** | 0项 | 6项 | 请求和重试控制 |
| **qBittorrent** | 0项 | 10项 | 下载器集成配置 |
| **日志** | 0项 | 3项 | 日志输出控制 |

### 5. 验证配置
启动应用时，如果缺少必需的环境变量，控制台会显示警告信息。

### 6. 文件结构变更
- ✅ `api/config.js` 已删除
- ✅ 所有配置现在在 `config/index.js` 中
- ✅ 环境变量自动加载和验证
- ✅ 支持所有配置项的环境变量覆盖

### 7. 认证错误处理
当遇到以下认证相关错误时，程序会自动停止：
- `Full authentication is required to access this resource`
- `401: Full authentication is required`
- 任何包含 "authentication" 关键词的 API 错误

**错误处理流程：**
1. 检测到认证错误
2. 显示详细的错误信息
3. 提示需要检查的配置项
4. 程序立即停止运行

**常见认证错误原因：**
- AUTH_TOKEN 过期或无效
- DID 设备ID不正确
- COOKIE 信息过期
- VISITOR_ID 访问者ID无效

## 配置优先级
1. **环境变量** - 最高优先级
2. **代码默认值** - 最低优先级
3. **必需配置** - 必须设置，否则程序无法正常运行
4. **可选配置** - 可以保持默认值或自定义

## 安全建议
1. 定期更新认证令牌
2. 不要在公共环境中暴露 `.env` 文件
3. 使用强密码和安全的认证方式
4. 定期检查访问日志
