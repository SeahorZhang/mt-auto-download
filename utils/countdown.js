import pc from "picocolors";

export const waitWithCountdown = (seconds) => {
  return new Promise((resolve) => {
    let remaining = seconds;
    const intervalId = setInterval(() => {
      let gracefulExit = false; // 从全局获取
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
