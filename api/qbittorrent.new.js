import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import { logger } from "../utils/index.js";

// 创建qBittorrent API状态
const createQBittorrentState = (config) => ({
  config: {
    USE_CATEGORY: true,
    ...config,
  },
  baseUrl: config.BASE_URL,
  username: config.USERNAME,
  password: config.PASSWORD,
  cookie: null,
  isConnected: false
});

// 获取默认的种子参数
const getDefaultTorrentParams = (state) => {
  const params = {
    addToTopOfQueue: "false",
    autoTMM: "false",
    contentLayout: "Original",
    downloadPath: state.config.DOWNLOAD_PATH,
    firstLastPiecePrio: "false",
    paused: "false",
    stopped: "false",
    savepath: state.config.FINAL_PATH,
    sequentialDownload: "false",
    skip_checking: "false",
    stopCondition: "None",
    useDownloadPath: "true",
  };

  if (state.config.USE_CATEGORY && state.config.CATEGORY) {
    params.category = state.config.CATEGORY;
  }
  if (state.config.TAGS) {
    params.tags = state.config.TAGS;
  }

  return params;
};

// 连接到qBittorrent
const connect = async (state) => {
  try {
    const loginData = new URLSearchParams({
      username: state.username,
      password: state.password,
    });

    const response = await axios.post(
      `${state.baseUrl}/api/v2/auth/login`,
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
        state.cookie = setCookie[0].split(";")[0];
      }
      state.isConnected = true;
      logger.success("✅ 成功连接到 qBittorrent");
      await setGlobalPreferences(state);
      return true;
    } else {
      logger.error(`❌ 登录失败，状态码: ${response.status}`);
      return false;
    }
  } catch (error) {
    logger.error(`❌ 连接qBittorrent失败: ${error.message}`);
    return false;
  }
};

// 设置全局偏好设置
const setGlobalPreferences = async (state) => {
  if (!state.cookie) return false;

  try {
    const preferences = {
      max_active_downloads: 5,
      max_active_torrents: 10,
      max_active_uploads: 5,
    };

    await axios.post(
      `${state.baseUrl}/api/v2/app/setPreferences`,
      { json: JSON.stringify(preferences) },
      {
        headers: {
          Cookie: state.cookie,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return true;
  } catch (error) {
    logger.error(`❌ 设置全局偏好设置失败: ${error.message}`);
    return false;
  }
};

// 添加种子文件
const addTorrentFile = async (state, torrentPath) => {
  if (!state.cookie) {
    logger.error("❌ 未连接到qBittorrent，请先调用 connect()");
    return false;
  }

  try {
    const form = new FormData();
    form.append("torrents", fs.createReadStream(torrentPath));

    const params = getDefaultTorrentParams(state);
    Object.entries(params).forEach(([key, value]) => {
      form.append(key, value);
    });

    const response = await axios.post(
      `${state.baseUrl}/api/v2/torrents/add`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Cookie: state.cookie,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    if (response.status === 200) {
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`❌ 添加种子文件失败: ${error.message}`);
    return false;
  }
};

// 断开连接
const disconnect = async (state) => {
  try {
    if (state.cookie) {
      await axios.post(
        `${state.baseUrl}/api/v2/auth/logout`,
        {},
        {
          headers: {
            Cookie: state.cookie,
          },
        }
      );
    }
  } catch (error) {
    logger.error(`❌ 断开连接失败: ${error.message}`);
  } finally {
    state.cookie = null;
    state.isConnected = false;
  }
};

// 创建qBittorrent API客户端
export const createQBittorrentAPI = (config) => {
  const state = createQBittorrentState(config);

  if (!config.DOWNLOAD_PATH || !config.FINAL_PATH) {
    logger.error(
      "❌ qBittorrent配置不完整，缺少 DOWNLOAD_PATH 或 FINAL_PATH"
    );
  }

  return {
    connect: () => connect(state),
    disconnect: () => disconnect(state),
    addTorrentFile: (torrentPath) => addTorrentFile(state, torrentPath),
    get isConnected() { return state.isConnected; }
  };
};
