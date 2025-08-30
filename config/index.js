export const CONFIG = {
  DOWNLOAD: {
    DIR: 'torrents',
    INTERVAL: 30 * 1000,
    GRACEFUL_INTERVAL: 10 * 1000,
    MAX_SIZE: 150 * 1024 * 1024,
    MIN_SIZE: 11 * 1024 * 1024,
    RETRY_COUNT: 3,        // 下载重试次数
    RETRY_DELAY: 5 * 1000  // 重试等待时间
  },
  SEARCH: {
    TYPE: '剧集', // 综合 电影 记录 剧集 音乐 动漫 体育 软件 游戏 电子书 有声书 教育影片 其他
    PAGE_SIZE: 100,
    START_PAGE: 22,
    MAX_ERRORS_PER_PAGE: 3, // 每页最大错误次数
    PAGE_INTERVAL: 5 * 1000 // 翻页间隔（5秒）
  },
  QBITTORRENT: {
    ENABLED: true,         // 是否启用qBittorrent自动上传
    BASE_URL: 'http://192.168.50.100:8085', // qBittorrent Web UI地址
    USERNAME: 'admin',     // qBittorrent用户名
    PASSWORD: '188642345',     // qBittorrent密码
    SAVE_PATH: '/downloads/刷魔力值', // 保存路径
    CATEGORY: '刷魔力值',   // 分类
    TAGS: '刷魔力值,待转移' // 标签
  },
  LOG: {
    SAVE_TO_FILE: false,    // 是否保存日志到文件
    LOG_DIR: 'logs'        // 日志文件目录
  }
};
