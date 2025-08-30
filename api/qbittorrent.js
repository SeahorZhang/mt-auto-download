// qbittorrent-api.js
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

// 简单的日志封装（你原有 logger 可替换进来）
const logger = {
  success: (msg) => console.log(`\x1b[32m${msg}\x1b[0m`),
  error: (msg) => console.log(`\x1b[31m${msg}\x1b[0m`),
  info: (msg) => console.log(`\x1b[34m${msg}\x1b[0m`),
  warn: (msg) => console.log(`\x1b[33m${msg}\x1b[0m`)
};

export class QBittorrentAPI {
  /**
   * config:
   *  BASE_URL, USERNAME, PASSWORD,
   *  DOWNLOAD_PATH (临时目录), FINAL_PATH (完成目录),
   *  CATEGORY (可选), TAGS (可选)
   */
  constructor(config) {
    this.config = {
      USE_CATEGORY: true, // 默认开启 category
      ...config
    };
    this.baseUrl = this.config.BASE_URL;
    this.username = this.config.USERNAME;
    this.password = this.config.PASSWORD;
    this.cookie = null;
    this.isConnected = false;

    if (!this.config.DOWNLOAD_PATH || !this.config.FINAL_PATH) {
      logger.error('❌ qBittorrent配置不完整，缺少 DOWNLOAD_PATH 或 FINAL_PATH');
    }
  }

  // --- 内部：过滤会覆盖路径的参数 ---
  sanitizeOptions(options = {}) {
    // 移除了 category 和 tags 在 forbidden set 中，因为现在它们是允许的
    const forbidden = new Set(['savepath', 'save_path', 'savePath', 'savePath=', 'save_path=']);
    const out = {};
    Object.entries(options).forEach(([k, v]) => {
      if (forbidden.has(k)) return;
      // 过滤掉空字符串
      if (v === undefined || v === null) return;
      out[k] = v;
    });
    // 如果全局禁用 category，则删除 (虽然我们现在默认开启，但保留此逻辑以防万一)
    if (!this.config.USE_CATEGORY) delete out.category;
    return out;
  }

  async connect() {
    try {
      const loginData = new URLSearchParams();
      loginData.append('username', this.username);
      loginData.append('password', this.password);

      const response = await axios.post(`${this.baseUrl}/api/v2/auth/login`, loginData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000,
        validateStatus: (status) => status < 500
      });

      if (response.status === 200) {
        const setCookie = response.headers['set-cookie'];
        if (setCookie) {
          this.cookie = setCookie[0].split(';')[0];
        }
        this.isConnected = true;
        logger.success('✅ 成功连接到 qBittorrent');

        // 登录后立即设置全局偏好，保证后续任务使用这些全局设置
        await this.setGlobalPreferences();
        return true;
      } else {
        logger.error(`❌ 登录失败，状态码: ${response.status}`);
        return false;
      }
    } catch (error) {
      logger.error(`❌ 连接 qBittorrent 失败: ${error.message}`);
      return false;
    }
  }

  async setGlobalPreferences() {
    try {
      let qbSavePath = this.config.FINAL_PATH;
      // 如果 FINAL_PATH 以 CATEGORY 结尾，则截取 FINAL_PATH 的父目录作为 qbSavePath
      if (this.config.USE_CATEGORY && this.config.CATEGORY) {
        const categorySegment = `/${this.config.CATEGORY}`;
        if (qbSavePath.endsWith(categorySegment)) {
          qbSavePath = qbSavePath.substring(0, qbSavePath.length - categorySegment.length);
        }
      }

      const prefs = {
        save_path: qbSavePath,
        temp_path_enabled: true,
        temp_path: this.config.DOWNLOAD_PATH,
        auto_tmm_enabled: true,
        // 开启迁移开关，保证完成后会发生"搬家"
        torrent_changed_tmm_enabled: true,
        save_path_changed_tmm_enabled: true,
        category_changed_tmm_enabled: true
      };

      const preferencesData = new URLSearchParams({
        json: JSON.stringify(prefs)
      });

      const response = await axios.post(`${this.baseUrl}/api/v2/app/setPreferences`, preferencesData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': this.cookie
        },
        timeout: 10000,
        validateStatus: (status) => status < 500
      });

      if (response.status === 200) {
        logger.info('🔧 已设置 qBittorrent 全局偏好');
        logger.info(`📁 临时下载路径: ${this.config.DOWNLOAD_PATH}`);
        logger.info(`📁 最终保存路径: ${this.config.FINAL_PATH}`);
      } else {
        logger.warn(`⚠️ 设置全局偏好失败，状态码: ${response.status}`);
      }
    } catch (error) {
      logger.warn(`⚠️ 设置全局偏好失败: ${error.message}`);
    }
  }

  // 添加 .torrent 文件（不传 savepath，默认启用 autoTMM）
  async addTorrentFile(torrentPath, options = {}) {
    if (!this.isConnected) {
      const connected = await this.connect();
      if (!connected) return false;
    }

    try {
      if (!fs.existsSync(torrentPath)) {
        logger.error(`❌ 种子文件不存在: ${torrentPath}`);
        return false;
      }

      const formData = new FormData();
      formData.append('torrents', fs.createReadStream(torrentPath));

      // 基本选项：始终启用 autoTMM；category 仅在 USE_CATEGORY=true 时添加
      const baseOptions = { autoTMM: 'true' };
      if (this.config.USE_CATEGORY && this.config.CATEGORY) baseOptions.category = this.config.CATEGORY;
      if (this.config.TAGS) baseOptions.tags = this.config.TAGS;

      const merged = { ...baseOptions, ...options };
      const safe = this.sanitizeOptions(merged);

      Object.entries(safe).forEach(([k, v]) => {
        formData.append(k, String(v));
      });

      logger.info('🔧 添加种子 FormData 参数:');
      Object.keys(safe).forEach(k => logger.info(`  • ${k}`));

      const response = await axios.post(`${this.baseUrl}/api/v2/torrents/add`, formData, {
        headers: { ...formData.getHeaders(), 'Cookie': this.cookie },
        timeout: 30000,
        validateStatus: (status) => status < 500
      });

      if (response.status === 200) {
        logger.success(`✅ 种子已成功添加: ${torrentPath}`);
        return true;
      } else {
        logger.error(`❌ 添加种子失败，状态码: ${response.status}`);
        return false;
      }
    } catch (error) {
      logger.error(`❌ 添加种子失败: ${error.message}`);
      return false;
    }
  }

  // 添加磁力链接（同上）
  async addMagnet(magnet, options = {}) {
    if (!this.isConnected) {
      const connected = await this.connect();
      if (!connected) return false;
    }

    try {
      const params = new URLSearchParams();
      params.append('urls', magnet);
      params.append('autoTMM', 'true');

      // 仅在允许时附加 category / tags
      if (this.config.USE_CATEGORY && this.config.CATEGORY) params.append('category', this.config.CATEGORY);
      if (this.config.TAGS) params.append('tags', this.config.TAGS);

      const safeOptions = this.sanitizeOptions(options);
      Object.entries(safeOptions).forEach(([k, v]) => params.append(k, String(v)));

      logger.info('🔧 添加磁力 参数:');
      Array.from(params.keys()).forEach(k => logger.info(`  • ${k}`));

      const response = await axios.post(`${this.baseUrl}/api/v2/torrents/add`, params, {
        headers: { 'Cookie': this.cookie },
        timeout: 30000,
        validateStatus: (status) => status < 500
      });

      if (response.status === 200) {
        logger.success('✅ 磁力链接已成功添加');
        return true;
      } else {
        logger.error(`❌ 添加磁力失败，状态码: ${response.status}`);
        return false;
      }
    } catch (error) {
      logger.error(`❌ 添加磁力失败: ${error.message}`);
      return false;
    }
  }

  async getTorrents() {
    if (!this.isConnected) {
      const connected = await this.connect();
      if (!connected) return [];
    }

    try {
      const response = await axios.get(`${this.baseUrl}/api/v2/torrents/info`, {
        headers: { 'Cookie': this.cookie },
        timeout: 10000
      });

      if (response.status === 200) {
        return response.data;
      } else {
        logger.error(`❌ 获取种子列表失败，状态码: ${response.status}`);
        return [];
      }
    } catch (error) {
      logger.error(`❌ 获取种子列表失败: ${error.message}`);
      return [];
    }
  }

  async disconnect() {
    try {
      if (this.cookie) {
        await axios.post(`${this.baseUrl}/api/v2/auth/logout`, {}, {
          headers: { 'Cookie': this.cookie },
          timeout: 5000,
          validateStatus: (status) => status < 500
        });
      }
      this.isConnected = false;
      this.cookie = null;
      logger.info('🔌 已断开 qBittorrent 连接');
    } catch (error) {
      this.isConnected = false;
      this.cookie = null;
      logger.info('🔌 已断开 qBittorrent 连接');
    }
  }
}
