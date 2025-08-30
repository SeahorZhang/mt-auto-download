// qbittorrent-api.js
import axios from "axios";
import FormData from "form-data";
import fs from "fs";

// 简单的日志封装
const logger = {
  success: (msg) => console.log(`\x1b[32m${msg}\x1b[0m`),
  error: (msg) => console.log(`\x1b[31m${msg}\x1b[0m`),
  info: (msg) => console.log(`\x1b[34m${msg}\x1b[0m`),
  warn: (msg) => console.log(`\x1b[33m${msg}\x1b[0m`),
};

export class QBittorrentAPI {
  constructor(config) {
    this.config = {
      USE_CATEGORY: true,
      ...config,
    };
    this.baseUrl = this.config.BASE_URL;
    this.username = this.config.USERNAME;
    this.password = this.config.PASSWORD;
    this.cookie = null;
    this.isConnected = false;

    if (!this.config.DOWNLOAD_PATH || !this.config.FINAL_PATH) {
      logger.error(
        "❌ qBittorrent配置不完整，缺少 DOWNLOAD_PATH 或 FINAL_PATH"
      );
    }
  }

  // 获取默认的种子参数
  _getDefaultTorrentParams() {
    const params = {
      addToTopOfQueue: "false",
      autoTMM: "false",
      contentLayout: "Original",
      downloadPath: this.config.DOWNLOAD_PATH,
      firstLastPiecePrio: "false",
      paused: "false",
      stopped: "false",
      savepath: this.config.FINAL_PATH,
      sequentialDownload: "false",
      skip_checking: "false",
      stopCondition: "None",
      useDownloadPath: "true",
    };

    if (this.config.USE_CATEGORY && this.config.CATEGORY) {
      params.category = this.config.CATEGORY;
    }
    if (this.config.TAGS) {
      params.tags = this.config.TAGS;
    }

    return params;
  }

  // 记录种子参数日志
  _logTorrentParams(params, type = "种子") {
    logger.info(`🔧 添加${type}参数:`);
    Object.entries(params).forEach(([key, value]) => {
      logger.info(`  • ${key}: ${value}`);
    });
  }

  async connect() {
    try {
      const loginData = new URLSearchParams({
        username: this.username,
        password: this.password,
      });

      const response = await axios.post(
        `${this.baseUrl}/api/v2/auth/login`,
        loginData,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: 10000,
          validateStatus: (status) => status < 500,
        }
      );

      if (response.status === 200) {
        const setCookie = response.headers["set-cookie"];
        if (setCookie) {
          this.cookie = setCookie[0].split(";")[0];
        }
        this.isConnected = true;
        logger.success("✅ 成功连接到 qBittorrent");
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
      if (this.config.USE_CATEGORY && this.config.CATEGORY) {
        const categorySegment = `/${this.config.CATEGORY}`;
        if (qbSavePath.endsWith(categorySegment)) {
          qbSavePath = qbSavePath.substring(
            0,
            qbSavePath.length - categorySegment.length
          );
        }
      }

      const prefs = {
        save_path: qbSavePath,
        temp_path_enabled: true,
        temp_path: this.config.DOWNLOAD_PATH,
        auto_tmm_enabled: true,
        torrent_changed_tmm_enabled: true,
        save_path_changed_tmm_enabled: true,
        category_changed_tmm_enabled: true,
      };

      const preferencesData = new URLSearchParams({
        json: JSON.stringify(prefs),
      });

      const response = await axios.post(
        `${this.baseUrl}/api/v2/app/setPreferences`,
        preferencesData,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Cookie: this.cookie,
          },
          timeout: 10000,
          validateStatus: (status) => status < 500,
        }
      );

      if (response.status === 200) {
        logger.info("🔧 已设置 qBittorrent 全局偏好");
        logger.info(`📁 临时下载路径: ${this.config.DOWNLOAD_PATH}`);
        logger.info(`📁 最终保存路径: ${this.config.FINAL_PATH}`);
      } else {
        logger.warn(`⚠️ 设置全局偏好失败，状态码: ${response.status}`);
      }
    } catch (error) {
      logger.warn(`⚠️ 设置全局偏好失败: ${error.message}`);
    }
  }

  // 添加 .torrent 文件
  async addTorrentFile(torrentPath) {
    if (!this.isConnected && !(await this.connect())) {
      return false;
    }

    try {
      if (!fs.existsSync(torrentPath)) {
        logger.error(`❌ 种子文件不存在: ${torrentPath}`);
        return false;
      }

      const formData = new FormData();
      formData.append("torrents", fs.createReadStream(torrentPath));

      const params = this._getDefaultTorrentParams();
      Object.entries(params).forEach(([key, value]) => {
        formData.append(key, value);
      });

      this._logTorrentParams(params, "种子");

      const response = await axios.post(
        `${this.baseUrl}/api/v2/torrents/add`,
        formData,
        {
          headers: { ...formData.getHeaders(), Cookie: this.cookie },
          timeout: 30000,
          validateStatus: (status) => status < 500,
        }
      );

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

  // 添加磁力链接
  async addMagnet(magnet) {
    if (!this.isConnected && !(await this.connect())) {
      return false;
    }

    try {
      const params = new URLSearchParams();
      params.append("urls", magnet);

      const defaultParams = this._getDefaultTorrentParams();
      Object.entries(defaultParams).forEach(([key, value]) => {
        params.append(key, value);
      });

      this._logTorrentParams({ urls: magnet, ...defaultParams }, "磁力");

      const response = await axios.post(
        `${this.baseUrl}/api/v2/torrents/add`,
        params,
        {
          headers: { Cookie: this.cookie },
          timeout: 30000,
          validateStatus: (status) => status < 500,
        }
      );

      if (response.status === 200) {
        logger.success("✅ 磁力链接已成功添加");
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
    if (!this.isConnected && !(await this.connect())) {
      return [];
    }

    try {
      const response = await axios.get(`${this.baseUrl}/api/v2/torrents/info`, {
        headers: { Cookie: this.cookie },
        timeout: 10000,
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
        await axios.post(
          `${this.baseUrl}/api/v2/auth/logout`,
          {},
          {
            headers: { Cookie: this.cookie },
            timeout: 5000,
            validateStatus: (status) => status < 500,
          }
        );
      }
    } catch (error) {
      // 忽略断开连接时的错误
    } finally {
      this.isConnected = false;
      this.cookie = null;
      logger.info("🔌 已断开 qBittorrent 连接");
    }
  }
}
