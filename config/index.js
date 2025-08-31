/**
 * M-Team 自动下载工具配置文件
 * 
 * 本文件包含所有配置项，支持通过环境变量进行自定义。
 * 配置优先级：环境变量 > 代码默认值
 * 
 * 使用方法：
 * 1. 复制 .env.example 为 .env
 * 2. 在 .env 文件中设置相应的环境变量
 * 3. 程序启动时会自动加载环境变量
 * 
 * @author MT Auto Download Team
 * @version 1.1.4
 */

// ============================================================================
// 🔐 API 基础配置 - M-Team 网站认证和连接相关
// ============================================================================

/**
 * M-Team API 基础 URL
 * 用于构建完整的 API 请求地址
 * 通常不需要修改，除非 M-Team 更换了域名
 */
export const API_BASE_URL = process.env.API_BASE_URL || "https://api.m-team.cc";

/**
 * 签名密钥
 * 用于生成 API 请求的签名，确保请求的合法性
 * 如果 M-Team 更换了密钥，需要更新此值
 */
export const SECRET_KEY = process.env.SECRET_KEY || "HLkPcWmycL57mfJt";

/**
 * 认证令牌 (必需)
 * M-Team 用户登录后的认证令牌，用于验证用户身份
 * 格式：JWT 格式的字符串
 * 获取方式：登录 M-Team 后从浏览器开发者工具中获取
 * 有效期：通常为 30 天，过期需要重新获取
 */
export function getAuthToken() {
  return process.env.AUTH_TOKEN || "";
}
/**
 * 设备 ID (必需)
 * 用于标识当前设备，防止多设备同时登录
 * 格式：32 位十六进制字符串
 * 获取方式：登录 M-Team 后从请求头中获取
 */
export function getDid() {
  return process.env.DID || "";
}

/**
 * Cookie 信息 (必需)
 * 包含会话信息和用户偏好设置
 * 格式：标准的 HTTP Cookie 字符串
 * 获取方式：登录 M-Team 后从浏览器开发者工具中复制
 * 注意：包含敏感信息，请妥善保管
 */
export function getCookie() {
  return process.env.COOKIE || "";
}

/**
 * 客户端版本号
 * 用于标识客户端版本，通常不需要修改
 * 格式：语义化版本号 (如 1.1.4)
 */
export const VERSION = process.env.VERSION || "1.1.4";

/**
 * Web 版本号
 * 用于标识 Web 界面版本，通常不需要修改
 * 格式：数字版本号 (如 1140)
 */
export const WEB_VERSION = process.env.WEB_VERSION || "1140";

/**
 * 访问者 ID (必需)
 * 用于标识访问者身份，防止恶意访问
 * 格式：32 位十六进制字符串
 * 获取方式：登录 M-Team 后从请求头中获取
 */
export function getVisitorId() {
  return process.env.VISITOR_ID || "";
}

// ============================================================================
// 📥 下载配置 - 种子下载行为控制
// ============================================================================

/**
 * 种子文件保存目录
 * 下载的 .torrent 文件将保存到此目录
 * 支持相对路径和绝对路径
 * 如果目录不存在，程序会自动创建
 */
export const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR || 'torrents';

/**
 * 下载间隔时间
 * 两次下载操作之间的等待时间，避免请求过于频繁
 * 单位：毫秒 (ms)
 * 建议值：30000 (30秒) - 60000 (1分钟)
 * 注意：设置过短可能导致被服务器限制访问
 */
export const DOWNLOAD_INTERVAL = parseInt(process.env.DOWNLOAD_INTERVAL) || 30 * 1000;

/**
 * 优雅退出间隔时间
 * 当程序准备退出时，种子之间的等待时间
 * 单位：毫秒 (ms)
 * 建议值：10000 (10秒) - 30000 (30秒)
 * 作用：确保当前种子能够正常完成下载
 */
export const DOWNLOAD_GRACEFUL_INTERVAL = parseInt(process.env.DOWNLOAD_GRACEFUL_INTERVAL) || 10 * 1000;

/**
 * 最大文件大小限制
 * 超过此大小的种子将被跳过，不进行下载
 * 单位：字节 (bytes)
 * 默认值：150MB (157,286,400 字节)
 * 作用：避免下载过大的文件，节省存储空间
 */
export const DOWNLOAD_MAX_SIZE = parseInt(process.env.DOWNLOAD_MAX_SIZE) || 150 * 1024 * 1024;

/**
 * 最小文件大小限制
 * 小于此大小的种子将被跳过，不进行下载
 * 单位：字节 (bytes)
 * 默认值：11MB (11,534,336 字节)
 * 作用：避免下载过小的文件，提高效率
 */
export const DOWNLOAD_MIN_SIZE = parseInt(process.env.DOWNLOAD_MIN_SIZE) || 11 * 1024 * 1024;

/**
 * 下载重试次数
 * 当下载失败时，程序会尝试重新下载的次数
 * 单位：次
 * 建议值：3-5 次
 * 作用：提高下载成功率，处理网络波动
 */
export const DOWNLOAD_RETRY_COUNT = parseInt(process.env.DOWNLOAD_RETRY_COUNT) || 3;

/**
 * 重试延迟时间
 * 重试之间的等待时间，避免立即重试
 * 单位：毫秒 (ms)
 * 建议值：5000 (5秒) - 10000 (10秒)
 * 作用：给网络和服务器恢复的时间
 */
export const DOWNLOAD_RETRY_DELAY = parseInt(process.env.DOWNLOAD_RETRY_DELAY) || 5 * 1000;

/**
 * 下载超时时间
 * 单次下载操作的最大等待时间
 * 单位：毫秒 (ms)
 * 建议值：30000 (30秒) - 60000 (1分钟)
 * 作用：避免程序因网络问题而无限等待
 */
export const DOWNLOAD_TIMEOUT = parseInt(process.env.DOWNLOAD_TIMEOUT) || 30000;

/**
 * 最大并发下载数
 * 同时进行的下载任务数量
 * 单位：个
 * 建议值：1-3 个
 * 作用：控制资源使用，避免被服务器限制
 */
export const DOWNLOAD_MAX_CONCURRENT = parseInt(process.env.DOWNLOAD_MAX_CONCURRENT) || 1;

// ============================================================================
// 🔍 搜索配置 - 种子搜索和分页控制
// ============================================================================

/**
 * 每页搜索结果数量
 * 从 M-Team 获取的每页种子数量
 * 单位：个
 * 建议值：50-100 个
 * 注意：设置过大可能影响响应速度
 */
export const SEARCH_PAGE_SIZE = parseInt(process.env.SEARCH_PAGE_SIZE) || 100;

/**
 * 搜索起始页码
 * 每个分类开始搜索的页码
 * 单位：页
 * 建议值：1 (从第一页开始)
 * 作用：支持断点续传，从指定页继续搜索
 */
export const SEARCH_START_PAGE = parseInt(process.env.SEARCH_START_PAGE) || 1;

/**
 * 每页最大错误次数
 * 当一页出现过多错误时，程序会跳过该页
 * 单位：次
 * 建议值：3-5 次
 * 作用：避免因单页问题影响整体运行
 */
export const SEARCH_MAX_ERRORS_PER_PAGE = parseInt(process.env.SEARCH_MAX_ERRORS_PER_PAGE) || 3;

/**
 * 翻页间隔时间
 * 处理完一页后，等待多长时间再处理下一页
 * 单位：毫秒 (ms)
 * 建议值：5000 (5秒) - 10000 (10秒)
 * 作用：避免请求过于频繁，给服务器缓冲时间
 */
export const SEARCH_PAGE_INTERVAL = parseInt(process.env.SEARCH_PAGE_INTERVAL) || 5 * 1000;

/**
 * 每次会话最大处理页数
 * 程序运行一次最多处理多少页
 * 单位：页
 * 建议值：50-100 页
 * 作用：控制单次运行的工作量，便于管理
 */
export const SEARCH_MAX_PAGES_PER_SESSION = parseInt(process.env.SEARCH_MAX_PAGES_PER_SESSION) || 50;

// ============================================================================
// 🌐 API 配置 - 请求限制和重试机制
// ============================================================================

/**
 * 每分钟最大请求数
 * 限制向 M-Team API 发送请求的频率
 * 单位：次/分钟
 * 建议值：5-10 次/分钟
 * 作用：避免被服务器识别为恶意请求
 */
export const API_MAX_REQUESTS = parseInt(process.env.API_MAX_REQUESTS) || 8;

/**
 * 时间窗口大小
 * 用于计算请求频率的时间范围
 * 单位：毫秒 (ms)
 * 建议值：60000 (1分钟)
 * 作用：与 MAX_REQUESTS 配合，实现请求频率控制
 */
export const API_TIME_WINDOW = parseInt(process.env.API_TIME_WINDOW) || 60000;

/**
 * 最大重试次数
 * API 请求失败时的重试次数
 * 单位：次
 * 建议值：3-5 次
 * 作用：提高请求成功率，处理临时网络问题
 */
export const API_MAX_RETRIES = parseInt(process.env.API_MAX_RETRIES) || 3;

/**
 * 基础延迟时间
 * 重试时的基础等待时间
 * 单位：毫秒 (ms)
 * 建议值：2000 (2秒) - 5000 (5秒)
 * 作用：避免立即重试，给服务器恢复时间
 */
export const API_BASE_DELAY = parseInt(process.env.API_BASE_DELAY) || 2000;

/**
 * 最大延迟时间
 * 重试时的最大等待时间
 * 单位：毫秒 (ms)
 * 建议值：10000 (10秒) - 30000 (30秒)
 * 作用：限制重试等待时间，避免程序长时间等待
 */
export const API_MAX_DELAY = parseInt(process.env.API_MAX_DELAY) || 10000;

/**
 * API 请求超时时间
 * 单次 API 请求的最大等待时间
 * 单位：毫秒 (ms)
 * 建议值：30000 (30秒) - 60000 (1分钟)
 * 作用：避免程序因网络问题而无限等待
 */
export const API_TIMEOUT = parseInt(process.env.API_TIMEOUT) || 30000;

// ============================================================================
// 🚀 qBittorrent 配置 - 下载器集成设置
// ============================================================================

/**
 * 是否启用 qBittorrent 自动上传
 * 控制是否自动将种子添加到 qBittorrent
 * 类型：布尔值
 * 可选值：true (启用) / false (禁用)
 * 作用：实现种子下载和管理的自动化
 */
export const QB_ENABLED = process.env.QB_ENABLED === 'true' || true;

/**
 * qBittorrent Web UI 地址
 * qBittorrent 的 Web 管理界面地址
 * 格式：http://IP地址:端口
 * 示例：http://192.168.1.100:8080
 * 注意：确保 qBittorrent 已启用 Web UI
 */
export const QB_BASE_URL = process.env.QB_BASE_URL || 'http://192.168.50.100:8085';

/**
 * qBittorrent 用户名
 * 用于登录 Web UI 的用户名
 * 在 qBittorrent 的 Web UI 设置中配置
 * 建议：使用强密码，避免被恶意访问
 */
export const QB_USERNAME = process.env.QB_USERNAME || 'admin';

/**
 * qBittorrent 密码
 * 用于登录 Web UI 的密码
 * 在 qBittorrent 的 Web UI 设置中配置
 * 注意：包含敏感信息，请妥善保管
 */
export const QB_PASSWORD = process.env.QB_PASSWORD || '188642345';

/**
 * 下载时的临时路径
 * 种子下载完成前的临时保存路径
 * 支持相对路径和绝对路径
 * 建议：使用专门的临时目录，便于管理
 */
export const QB_DOWNLOAD_PATH = process.env.QB_DOWNLOAD_PATH || '/downloads/下载中';

/**
 * 完成后的最终保存路径
 * 种子下载完成后的最终保存路径
 * 支持相对路径和绝对路径
 * 建议：使用有意义的目录名，便于分类管理
 */
export const QB_FINAL_PATH = process.env.QB_FINAL_PATH || '/downloads/刷魔力值';

/**
 * 种子分类
 * 添加到 qBittorrent 的种子分类
 * 用于在 qBittorrent 中组织和识别种子
 * 建议：使用有意义的分类名，便于管理
 */
export const QB_CATEGORY = process.env.QB_CATEGORY || '刷魔力值';

/**
 * 种子标签
 * 添加到 qBittorrent 的种子标签
 * 多个标签用逗号分隔
 * 作用：便于在 qBittorrent 中搜索和筛选种子
 */
export const QB_TAGS = process.env.QB_TAGS || '刷魔力值,待转移';

/**
 * 是否在添加种子时传递分类
 * 控制是否将分类信息传递给 qBittorrent
 * 类型：布尔值
 * 可选值：true (传递) / false (不传递)
 * 作用：在 qBittorrent 中保持种子分类信息
 */
export const QB_USE_CATEGORY = process.env.QB_USE_CATEGORY === 'true' || true;

/**
 * qBittorrent 连接超时时间
 * 连接 qBittorrent Web UI 的最大等待时间
 * 单位：毫秒 (ms)
 * 建议值：10000 (10秒) - 30000 (30秒)
 * 作用：避免程序因网络问题而无限等待
 */
export const QB_TIMEOUT = parseInt(process.env.QB_TIMEOUT) || 10000;

// ============================================================================
// 📝 日志配置 - 日志输出控制
// ============================================================================

/**
 * 是否保存日志到文件
 * 控制是否将日志信息保存到文件中
 * 类型：布尔值
 * 可选值：true (保存) / false (不保存)
 * 作用：便于问题排查和运行记录
 */
export const LOG_SAVE_TO_FILE = process.env.LOG_SAVE_TO_FILE === 'true' || false;

/**
 * 日志文件保存目录
 * 日志文件的保存目录
 * 支持相对路径和绝对路径
 * 如果目录不存在，程序会自动创建
 */
export const LOG_DIR = process.env.LOG_DIR || 'logs';

/**
 * 日志输出级别
 * 控制日志信息的详细程度
 * 可选值：debug, info, warn, error
 * 建议：生产环境使用 info 或 warn，调试时使用 debug
 * 说明：
 *   - debug: 最详细，包含所有调试信息
 *   - info: 一般信息，适合生产环境
 *   - warn: 警告信息，需要注意的问题
 *   - error: 错误信息，需要立即处理的问题
 */
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// ============================================================================
// ⚠️ 环境变量验证 - 检查必需配置是否已设置
// ============================================================================

/**
 * 验证必需的环境变量是否已设置
 * 如果必需配置未设置，程序会显示警告信息
 * 注意：这些配置项是程序正常运行所必需的
 */
export function validateRequiredEnvVars() {
  if (!process.env.AUTH_TOKEN) {
    console.warn("⚠️  警告: AUTH_TOKEN 环境变量未设置");
    console.warn("   说明: 认证令牌是必需的，程序可能无法正常运行");
    console.warn("   解决: 请在 .env 文件中设置 AUTH_TOKEN");
  }

  if (!process.env.DID) {
    console.warn("⚠️  警告: DID 环境变量未设置");
    console.warn("   说明: 设备ID是必需的，程序可能无法正常运行");
    console.warn("   解决: 请在 .env 文件中设置 DID");
  }

  if (!process.env.COOKIE) {
    console.warn("⚠️  警告: COOKIE 环境变量未设置");
    console.warn("   说明: Cookie信息是必需的，程序可能无法正常运行");
    console.warn("   解决: 请在 .env 文件中设置 COOKIE");
  }

  if (!process.env.VISITOR_ID) {
    console.warn("⚠️  警告: VISITOR_ID 环境变量未设置");
    console.warn("   说明: 访问者ID是必需的，程序可能无法正常运行");
    console.warn("   解决: 请在 .env 文件中设置 VISITOR_ID");
  }
}

// ============================================================================
// 📋 配置对象导出 - 保持向后兼容性
// ============================================================================

/**
 * 统一的配置对象
 * 包含所有配置项，按功能分类组织
 * 保持与旧版本代码的兼容性
 * 
 * 使用方式：
 *   - 直接导入：import { CONFIG } from './config/index.js'
 *   - 访问配置：CONFIG.DOWNLOAD.DIR, CONFIG.SEARCH.PAGE_SIZE 等
 */
export const CONFIG = {
  /**
   * 下载相关配置
   * 控制种子的下载行为
   */
  DOWNLOAD: {
    DIR: DOWNLOAD_DIR,                           // 下载目录
    INTERVAL: DOWNLOAD_INTERVAL,                 // 下载间隔
    GRACEFUL_INTERVAL: DOWNLOAD_GRACEFUL_INTERVAL, // 优雅退出间隔
    MAX_SIZE: DOWNLOAD_MAX_SIZE,                 // 最大文件大小
    MIN_SIZE: DOWNLOAD_MIN_SIZE,                 // 最小文件大小
    RETRY_COUNT: DOWNLOAD_RETRY_COUNT,           // 重试次数
    RETRY_DELAY: DOWNLOAD_RETRY_DELAY,           // 重试延迟
    TIMEOUT: DOWNLOAD_TIMEOUT,                   // 下载超时
    MAX_CONCURRENT: DOWNLOAD_MAX_CONCURRENT      // 最大并发数
  },

  /**
   * 搜索相关配置
   * 控制种子的搜索和分页行为
   */
  SEARCH: {
    // 支持的种子分类列表
    // 程序会按顺序处理这些分类
    TYPES: ['剧集', '电影', '动漫', '音乐', '软件', '游戏', '电子书', '有声书', '教育影片', '记录', '体育', '其他'],
    CURRENT_TYPE_INDEX: 0,                       // 当前处理的分类索引
    PAGE_SIZE: SEARCH_PAGE_SIZE,                 // 每页大小
    START_PAGE: SEARCH_START_PAGE,               // 起始页码
    MAX_ERRORS_PER_PAGE: SEARCH_MAX_ERRORS_PER_PAGE, // 每页最大错误次数
    PAGE_INTERVAL: SEARCH_PAGE_INTERVAL,         // 翻页间隔
    MAX_PAGES_PER_SESSION: SEARCH_MAX_PAGES_PER_SESSION // 每次会话最大页数
  },

  /**
   * API 相关配置
   * 控制与 M-Team 服务器的交互
   */
  API: {
    // 请求频率限制配置
    RATE_LIMIT: {
      MAX_REQUESTS: API_MAX_REQUESTS,            // 每分钟最大请求数
      TIME_WINDOW: API_TIME_WINDOW               // 时间窗口大小
    },
    // 重试机制配置
    RETRY: {
      MAX_RETRIES: API_MAX_RETRIES,              // 最大重试次数
      BASE_DELAY: API_BASE_DELAY,                // 基础延迟时间
      MAX_DELAY: API_MAX_DELAY                   // 最大延迟时间
    },
    TIMEOUT: API_TIMEOUT                         // API 请求超时
  },

  /**
   * qBittorrent 相关配置
   * 控制与 qBittorrent 下载器的集成
   */
  QBITTORRENT: {
    ENABLED: QB_ENABLED,                         // 是否启用
    BASE_URL: QB_BASE_URL,                       // Web UI 地址
    USERNAME: QB_USERNAME,                       // 用户名
    PASSWORD: QB_PASSWORD,                       // 密码
    DOWNLOAD_PATH: QB_DOWNLOAD_PATH,             // 临时下载路径
    FINAL_PATH: QB_FINAL_PATH,                   // 最终保存路径
    CATEGORY: QB_CATEGORY,                       // 种子分类
    TAGS: QB_TAGS,                               // 种子标签
    USE_CATEGORY: QB_USE_CATEGORY,               // 是否传递分类
    TIMEOUT: QB_TIMEOUT                          // 连接超时
  },

  /**
   * 日志相关配置
   * 控制日志信息的输出方式
   */
  LOG: {
    SAVE_TO_FILE: LOG_SAVE_TO_FILE,              // 是否保存到文件
    LOG_DIR: LOG_DIR,                            // 日志目录
    LEVEL: LOG_LEVEL                             // 日志级别
  }
};
