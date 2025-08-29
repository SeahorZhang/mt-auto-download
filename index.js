import { App } from "./lib/App.js";
import { logger } from "./utils/index.js";

const app = new App();
app.start().catch((err) => {
  logger.error(`脚本执行时发生未捕获的错误: ${err}`);
});
