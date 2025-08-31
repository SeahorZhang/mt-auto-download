import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 定义要替换的文件
const filesToReplace = [
  {
    old: 'lib/App.js',
    new: 'lib/app.new.js',
    target: 'lib/App.js'
  },
  {
    old: 'api/qbittorrent.js',
    new: 'api/qbittorrent.new.js',
    target: 'api/qbittorrent.js'
  },
  {
    old: 'index.js',
    new: 'index.new.js',
    target: 'index.js'
  }
];

// 替换文件
const replaceFiles = () => {
  filesToReplace.forEach(file => {
    const oldPath = path.resolve(__dirname, file.old);
    const newPath = path.resolve(__dirname, file.new);
    const targetPath = path.resolve(__dirname, file.target);
    
    // 备份原文件
    if (fs.existsSync(oldPath)) {
      const backupPath = `${oldPath}.bak`;
      fs.copyFileSync(oldPath, backupPath);
      console.log(`已备份原文件到: ${backupPath}`);
    }
    
    // 替换文件
    fs.copyFileSync(newPath, targetPath);
    console.log(`已更新文件: ${targetPath}`);
    
    // 删除临时文件
    fs.unlinkSync(newPath);
    console.log(`已删除临时文件: ${newPath}`);
  });
  
  console.log('所有文件已成功更新！');
};

replaceFiles();
