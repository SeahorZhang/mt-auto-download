export const CONFIG = {
  DOWNLOAD: {
    DIR: 'torrents',
    INTERVAL: 30 * 1000,
    GRACEFUL_INTERVAL: 10 * 1000,
    MAX_SIZE: 150 * 1024 * 1024,
    MIN_SIZE: 11 * 1024 * 1024,
    RETRY_COUNT: 3,        // 下载重试次数
    RETRY_DELAY: 5 * 1000, // 重试等待时间
    TIMEOUT: 30000,        // 下载超时时间（毫秒）
    MAX_CONCURRENT: 1      // 最大并发下载数
  },
  SEARCH: {
    TYPES: ['剧集', '电影', '动漫', '音乐', '软件', '游戏', '电子书', '有声书', '教育影片', '记录', '体育', '其他'], // 要处理的分类列表
    CURRENT_TYPE_INDEX: 0, // 当前处理的分类索引
    PAGE_SIZE: 100,
    START_PAGE: 1, // 每个分类从第1页开始
    MAX_ERRORS_PER_PAGE: 3, // 每页最大错误次数
    PAGE_INTERVAL: 5 * 1000, // 翻页间隔（5秒）
    MAX_PAGES_PER_SESSION: 50 // 每次会话最大处理页数
  },
  API: {
    RATE_LIMIT: {
      MAX_REQUESTS: 8,     // 每分钟最大请求数
      TIME_WINDOW: 60000   // 时间窗口（毫秒）
    },
    RETRY: {
      MAX_RETRIES: 3,      // 最大重试次数
      BASE_DELAY: 2000,    // 基础延迟时间
      MAX_DELAY: 10000     // 最大延迟时间
    },
    TIMEOUT: 30000         // API请求超时时间
  },
  QBITTORRENT: {
    ENABLED: true,         // 是否启用qBittorrent自动上传
    BASE_URL: 'http://192.168.50.100:8085', // qBittorrent Web UI地址
    USERNAME: 'admin',     // qBittorrent用户名
    PASSWORD: '188642345',     // qBittorrent密码
    DOWNLOAD_PATH: '/downloads/下载中', // 下载时的临时路径
    FINAL_PATH: '/downloads/刷魔力值', // 完成后的最终保存路径
    CATEGORY: '刷魔力值',   // 分类
    TAGS: '刷魔力值,待转移', // 标签
    USE_CATEGORY: true,    // 是否在添加种子时传递分类
    TIMEOUT: 10000         // qBittorrent连接超时时间
  },
  LOG: {
    SAVE_TO_FILE: false,    // 是否保存日志到文件
    LOG_DIR: 'logs',        // 日志文件目录
    LEVEL: 'info'           // 日志级别：debug, info, warn, error
  }
};
