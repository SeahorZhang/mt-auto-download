import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const CONFIG = {
  BASE_URL: 'http://127.0.0.1:8080',  // qB WebUI 地址
  USERNAME: 'admin',
  PASSWORD: 'adminadmin',
  DOWNLOAD_PATH: '/downloads/下载中',      // 临时下载目录
  FINAL_PATH: '/downloads/刷魔力值',       // 下载完成目录
  CATEGORY: '刷魔力值',                          // 可选 category
  TAGS: '刷魔力值,待转移',                              // 可选 tags
};

let cookie = null;

// 登录并获取 cookie
async function login() {
  const params = new URLSearchParams();
  params.append('username', CONFIG.USERNAME);
  params.append('password', CONFIG.PASSWORD);

  const res = await axios.post(`${CONFIG.BASE_URL}/api/v2/auth/login`, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    validateStatus: () => true,
  });

  if (res.status === 200) {
    const setCookie = res.headers['set-cookie'];
    if (setCookie) {
      cookie = setCookie[0].split(';')[0];
    }
    console.log('✅ 登录成功');
    return true;
  } else {
    console.log('❌ 登录失败', res.status);
    return false;
  }
}

// 设置全局偏好，确保下载完成自动移动
async function setPreferences() {
  const prefs = {
    save_path: CONFIG.FINAL_PATH,
    temp_path_enabled: true,
    temp_path: CONFIG.DOWNLOAD_PATH,
    auto_tmm_enabled: true,
    torrent_changed_tmm_enabled: true,
    save_path_changed_tmm_enabled: true,
    category_changed_tmm_enabled: true,
  };

  const res = await axios.post(
    `${CONFIG.BASE_URL}/api/v2/app/setPreferences`,
    new URLSearchParams({ json: JSON.stringify(prefs) }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookie }, validateStatus: () => true }
  );

  if (res.status === 200) console.log('🔧 全局偏好设置完成');
  else console.log('⚠️ 设置全局偏好失败', res.status);
}

// 添加种子文件
async function addTorrentFile(torrentPath) {
  if (!fs.existsSync(torrentPath)) {
    console.log('❌ 种子文件不存在', torrentPath);
    return;
  }

  const form = new FormData();
  form.append('torrents', fs.createReadStream(torrentPath));
  form.append('save_path', CONFIG.FINAL_PATH); // 直接设置 save_path
  form.append('temp_path', CONFIG.DOWNLOAD_PATH); // 直接设置 temp_path
  form.append('autoTMM', 'true');
  form.append('sequentialDownload', 'false'); // 顺序下载
  form.append('firstLastPiecePriority', 'false'); // 首尾优先

  if (CONFIG.CATEGORY) form.append('category', CONFIG.CATEGORY);
  if (CONFIG.TAGS) form.append('tags', CONFIG.TAGS);

  const res = await axios.post(`${CONFIG.BASE_URL}/api/v2/torrents/add`, form, {
    headers: { ...form.getHeaders(), Cookie: cookie },
    validateStatus: () => true,
  });

  if (res.status === 200) console.log('✅ 种子已添加', torrentPath);
  else console.log('❌ 添加种子失败', res.status);
}

// 添加磁力链接
async function addMagnet(magnet) {
  const params = new URLSearchParams();
  params.append('urls', magnet);
  params.append('save_path', CONFIG.FINAL_PATH); // 直接设置 save_path
  params.append('temp_path', CONFIG.DOWNLOAD_PATH); // 直接设置 temp_path
  params.append('autoTMM', 'true');
  params.append('sequentialDownload', 'false'); // 顺序下载
  params.append('firstLastPiecePriority', 'false'); // 首尾优先

  if (CONFIG.CATEGORY) params.append('category', CONFIG.CATEGORY);
  if (CONFIG.TAGS) params.append('tags', CONFIG.TAGS);

  const res = await axios.post(`${CONFIG.BASE_URL}/api/v2/torrents/add`, params, {
    headers: { Cookie: cookie },
    validateStatus: () => true,
  });

  if (res.status === 200) console.log('✅ 磁力链接已添加');
  else console.log('❌ 添加磁力失败', res.status);
}

// 运行示例
(async () => {
  const ok = await login();
  if (!ok) return;

  await setPreferences();

  // 添加 .torrent 文件
  await addTorrentFile('/path/to/your/file.torrent');

  // 或者添加磁力链接
  // await addMagnet('magnet:?xt=urn:btih:XXXXXXXXXXXXXXXXXXXXXXX');

  console.log('🎉 完成！');
})();
