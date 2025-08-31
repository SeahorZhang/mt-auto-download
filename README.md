# MT Auto Download

自动下载 M-Team 种子的工具，支持自动分类、qBittorrent 集成等功能。

## 🚀 快速开始

### 1. 安装依赖
```bash
pnpm install
```

### 2. 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入实际值
# 特别是以下必需配置：
# - AUTH_TOKEN (认证令牌)
# - DID (设备ID)
# - COOKIE (Cookie信息)
# - VISITOR_ID (访问者ID)
```

### 3. 验证配置
```bash
pnpm validate
```

### 4. 启动程序
```bash
# 直接启动（不验证配置）
pnpm start

# 安全启动（先验证配置）
pnpm start:safe
```

## 📋 配置说明

### 必需配置
- **AUTH_TOKEN**: M-Team 认证令牌
- **DID**: 设备 ID
- **COOKIE**: Cookie 信息
- **VISITOR_ID**: 访问者 ID

### 可选配置
所有其他配置项都可以通过环境变量自定义，包括：
- 下载设置（目录、间隔、重试、文件大小限制等）
- 搜索设置（分页、错误处理等）
- API 设置（请求限制、超时等）
- qBittorrent 设置（连接、路径、分类等）
- 日志设置（级别、文件保存等）

**详细配置说明请参考：[配置指南](CONFIG_GUIDE.md)**

## 🔧 可用命令

```bash
pnpm start          # 启动程序
pnpm start:safe     # 安全启动（先验证配置）
pnpm validate       # 验证配置
```

## 📁 项目结构

```
├── api/              # API 相关代码
├── config/           # 配置文件
├── lib/              # 核心逻辑
├── scripts/          # 工具脚本
├── utils/            # 工具函数
├── .env.example      # 环境变量模板
├── CONFIG_GUIDE.md   # 完整配置指南
└── README.md         # 项目说明
```

## 🛡️ 安全特性

- 敏感配置通过环境变量管理
- 认证错误自动检测和程序停止
- 支持配置验证和检查
- 详细的错误提示和配置指导

## 📖 更多信息

- **[配置指南](CONFIG_GUIDE.md)** - 完整的配置说明和使用指南
- **[代码结构说明](CODE_STRUCTURE.md)** - 项目代码结构分析

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## �� 许可证

ISC License
