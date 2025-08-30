# 环境变量配置说明

## 概述
为了安全起见，敏感配置信息已从代码中移除，改为使用环境变量管理。所有配置现在统一在 `config/index.js` 文件中管理。

## 配置位置
- **主配置文件**: `config/index.js`
- **环境变量**: `.env` 文件（项目根目录）
- **模板文件**: `.env.example`

## 设置步骤

### 1. 创建环境变量文件
在项目根目录创建 `.env` 文件：

```bash
cp .env.example .env
```

### 2. 配置环境变量
编辑 `.env` 文件，填入实际值：

```env
# M-Team API 配置
API_BASE_URL=https://api.m-team.cc
SECRET_KEY=your_secret_key_here
AUTH_TOKEN=your_auth_token_here
DID=your_device_id_here
COOKIE=your_cookie_here
VERSION=1.1.4
WEB_VERSION=1140
VISITOR_ID=your_visitor_id_here
```

### 3. 重要说明
- **不要将 `.env` 文件提交到版本控制系统**
- 敏感信息包括：`AUTH_TOKEN`、`DID`、`COOKIE`、`VISITOR_ID`
- `API_BASE_URL` 和版本信息可以保持默认值
- 所有配置现在统一在 `config/index.js` 中管理

### 4. 环境变量说明

| 变量名 | 说明 | 是否必需 | 默认值 |
|--------|------|----------|--------|
| `API_BASE_URL` | API 基础 URL | 否 | `https://api.m-team.cc` |
| `SECRET_KEY` | 密钥 | 否 | `HLkPcWmycL57mfJt` |
| `AUTH_TOKEN` | 认证令牌 | 是 | - |
| `DID` | 设备 ID | 是 | - |
| `COOKIE` | Cookie 信息 | 是 | - |
| `VERSION` | 版本号 | 否 | `1.1.4` |
| `WEB_VERSION` | Web 版本 | 否 | `1140` |
| `VISITOR_ID` | 访问者 ID | 是 | - |

### 5. 验证配置
启动应用时，如果缺少必需的环境变量，控制台会显示警告信息。

### 6. 文件结构变更
- ✅ `api/config.js` 已删除
- ✅ 所有配置现在在 `config/index.js` 中
- ✅ 环境变量自动加载和验证

## 安全建议
1. 定期更新认证令牌
2. 不要在公共环境中暴露 `.env` 文件
3. 使用强密码和安全的认证方式
4. 定期检查访问日志
