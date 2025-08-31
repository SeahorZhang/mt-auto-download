import dotenv from "dotenv";

// 首先加载环境变量
dotenv.config();

// 然后导入其他模块
import { createApp } from "./lib/App.js";
import { logger } from "./utils/index.js";
import { intro, outro, select, text } from "@clack/prompts";
import pc from "picocolors";
import { validateRequiredEnvVars, CONFIG } from "./config/index.js";

// 验证必需的环境变量
validateRequiredEnvVars();

async function main() {
  intro(pc.cyan("MT 自动下载种子脚本"));

  // 使用配置文件中的分类列表，并添加"全部顺序执行"和"综合"选项
  const categories = [
    "全部顺序执行",
    "综合",
    ...CONFIG.SEARCH.CATEGORIES
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
      const app = createApp({ startPage: effectiveStartPage, type: t });
      const result = await app.start();
      
      // 检查是否为认证错误导致的停止
      if (result && result.stopImmediately && !result.gracefulExit) {
        logger.error("🚨 程序因认证错误而停止");
        outro(pc.red("程序因认证错误而停止，请检查配置"));
        return;
      }
    }
  } else {
    const app = createApp({ startPage, type: chosenType });
    const result = await app.start();

    // 检查是否为认证错误导致的停止
    if (result && result.stopImmediately && !result.gracefulExit) {
      logger.error("🚨 程序因认证错误而停止");
      outro(pc.red("程序因认证错误而停止，请检查配置"));
      return;
    }
  }

  outro(pc.green("任务完成"));
}

main().catch((err) => {
  logger.error(`脚本执行时发生未捕获的错误: ${err}`);
});
