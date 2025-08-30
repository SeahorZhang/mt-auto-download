import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { logger } from '../utils/index.js';

export class QBittorrentAPI {
  constructor(config) {
    this.config = config;
    this.baseUrl = config.BASE_URL;
    this.username = config.USERNAME;
    this.password = config.PASSWORD;
    this.cookie = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // 登录获取cookie
      const loginData = new URLSearchParams();
      loginData.append('username', this.username);
      loginData.append('password', this.password);

      const response = await axios.post(`${this.baseUrl}/api/v2/auth/login`, loginData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000,
        validateStatus: (status) => status < 500 // 接受所有状态码
      });

      if (response.status === 200) {
        // 获取cookie
        const setCookie = response.headers['set-cookie'];
        if (setCookie) {
          this.cookie = setCookie[0].split(';')[0];
        }
        this.isConnected = true;
        logger.success('✅ 成功连接到qBittorrent');
        return true;
      } else {
        logger.error(`❌ 登录失败，状态码: ${response.status}`);
        return false;
      }
    } catch (error) {
      logger.error(`❌ 连接qBittorrent失败: ${error.message}`);
      return false;
    }
  }

  async addTorrent(torrentPath, options = {}) {
    if (!this.isConnected) {
      const connected = await this.connect();
      if (!connected) {
        return false;
      }
    }

    try {
      // 检查文件是否存在
      if (!fs.existsSync(torrentPath)) {
        logger.error(`❌ 种子文件不存在: ${torrentPath}`);
        return false;
      }

      // 创建FormData
      const formData = new FormData();
      formData.append('torrents', fs.createReadStream(torrentPath));
      
      // 添加选项
      const defaultOptions = {
        savepath: this.config.DOWNLOAD_PATH, // 使用下载时的临时路径
        category: this.config.CATEGORY,
        tags: this.config.TAGS,
        ...options
      };

      // 添加选项到FormData
      Object.entries(defaultOptions).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });

      const response = await axios.post(`${this.baseUrl}/api/v2/torrents/add`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Cookie': this.cookie,
        },
        timeout: 30000,
        validateStatus: (status) => status < 500
      });

      if (response.status === 200) {
        logger.success(`✅ 种子已成功添加到qBittorrent: ${torrentPath}`);
        logger.info(`📁 下载路径: ${this.config.DOWNLOAD_PATH}`);
        logger.info(`📁 完成后将移动到: ${this.config.FINAL_PATH}`);
        
        // 设置完成后的移动路径（通过标签或其他方式）
        await this.setTorrentMoveOnComplete(torrentPath);
        
        return true;
      } else {
        logger.error(`❌ 添加种子失败，状态码: ${response.status}`);
        return false;
      }
    } catch (error) {
      logger.error(`❌ 添加种子到qBittorrent失败: ${error.message}`);
      return false;
    }
  }

  async getTorrents() {
    if (!this.isConnected) {
      const connected = await this.connect();
      if (!connected) {
        return [];
      }
    }

    try {
      const response = await axios.get(`${this.baseUrl}/api/v2/torrents/info`, {
        headers: {
          'Cookie': this.cookie,
        },
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

  async setTorrentMoveOnComplete(torrentPath) {
    try {
      // 获取刚添加的种子信息
      const torrents = await this.getTorrents();
      const torrentName = path.basename(torrentPath, '.torrent');
      
      // 查找刚添加的种子
      const torrent = torrents.find(t => t.name.includes(torrentName) || torrentName.includes(t.name));
      
      if (torrent) {
        // 设置完成后的移动路径
        const moveData = new URLSearchParams();
        moveData.append('hashes', torrent.hash);
        moveData.append('location', this.config.FINAL_PATH);
        
        await axios.post(`${this.baseUrl}/api/v2/torrents/setLocation`, moveData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': this.cookie,
          },
          timeout: 10000,
          validateStatus: (status) => status < 500
        });
        
        logger.info(`📁 已设置种子 "${torrent.name}" 完成后的移动路径: ${this.config.FINAL_PATH}`);
      }
    } catch (error) {
      logger.warn(`⚠️ 设置移动路径失败: ${error.message}`);
    }
  }

  async disconnect() {
    try {
      if (this.cookie) {
        await axios.post(`${this.baseUrl}/api/v2/auth/logout`, {}, {
          headers: {
            'Cookie': this.cookie,
          },
          timeout: 5000,
          validateStatus: (status) => status < 500 // 忽略400错误
        });
      }
      this.isConnected = false;
      this.cookie = null;
      logger.info('已断开qBittorrent连接');
    } catch (error) {
      // 忽略登出时的错误，因为这不影响主要功能
      this.isConnected = false;
      this.cookie = null;
      logger.info('已断开qBittorrent连接');
    }
  }
}
