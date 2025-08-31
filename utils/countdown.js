import pc from "picocolors";

/**
 * 带倒计时的等待函数
 * @param {number} seconds - 等待秒数
 * @param {boolean} gracefulExit - 是否为优雅退出模式
 * @returns {Promise<void>}
 */
export const waitWithCountdown = (seconds, { searchType }) => {
  return new Promise((resolve) => {
    let remaining = seconds;
    const intervalId = setInterval(() => {
      process.stdout.write(
        pc.gray(`[${searchType}]⏳ 等待 ${remaining} 秒开始下一个任务... \r`)
      );

      remaining--;
      if (remaining < 0) {
        clearInterval(intervalId);
        process.stdout.write("\n");
        resolve();
      }
    }, 1000);
  });
};
