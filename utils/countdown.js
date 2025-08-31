import pc from "picocolors";

/**
 * 带倒计时的等待函数
 * @param {number} seconds - 等待秒数
 * @param {boolean} gracefulExit - 是否为优雅退出模式
 * @returns {Promise<void>}
 */
export const waitWithCountdown = (seconds, gracefulExit = false) => {
  return new Promise((resolve) => {
    let remaining = seconds;
    const intervalId = setInterval(() => {
      if (gracefulExit) {
        process.stdout.write(
          pc.yellow("收到退出信号，等待当前任务完成... ") +
            pc.gray(`⏳ ${remaining} 秒`) +
            "   \r"
        );
      } else {
        process.stdout.write(pc.gray(`⏳ 等待 ${remaining} 秒... \r`));
      }

      remaining--;
      if (remaining < 0) {
        clearInterval(intervalId);
        process.stdout.write("\n");
        resolve();
      }
    }, 1000);
  });
};
