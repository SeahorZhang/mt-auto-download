import dotenv from "dotenv";
import { App } from "./lib/App.js";
import { logger } from "./utils/index.js";
import { intro, outro, select, text } from "@clack/prompts";
import pc from "picocolors";

// 加载环境变量
dotenv.config();

async function main() {
  intro(pc.cyan("MT Auto Download"));

  const categories = [
    "全部顺序执行",
    "综合",
    "电影",
    "记录",
    "剧集",
    "音乐",
    "动漫",
    "体育",
    "软件",
    "游戏",
    "电子书",
    "有声书",
    "教育影片",
    "其他",
  ];

  const chosenType = await select({
    message: "请选择分类（默认全部顺序执行）",
    options: categories.map((c) => ({ value: c, label: c })),
    initialValue: "全部顺序执行",
  });

  const startPageInput = await text({
    message: "请输入开始页码（默认 1）",
    initialValue: "1",
    validate: (v) => {
      if (!v) return;
      const n = Number(v);
      if (!Number.isInteger(n) || n <= 0) return "请输入正整数";
    },
  });

  const startPage = startPageInput ? Number(startPageInput) : 1;

  if (chosenType === "全部顺序执行") {
    const runCategories = categories.filter((c) => c !== "全部顺序执行");
    for (let i = 0; i < runCategories.length; i++) {
      const t = runCategories[i];
      const effectiveStartPage = i === 0 ? startPage : 1;
      const app = new App({ startPage: effectiveStartPage, type: t });
      await app.start();
    }
  } else {
    const app = new App({ startPage, type: chosenType });
    await app.start();
  }

  outro(pc.green("任务完成"));
}

main().catch((err) => {
  logger.error(`脚本执行时发生未捕获的错误: ${err}`);
});
