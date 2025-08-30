/**
 * 请求频率控制工具
 * 防止请求过于频繁被服务器限制
 */
export class RateLimiter {
  constructor(maxRequests = 10, timeWindow = 60000) {
    this.maxRequests = maxRequests; // 最大请求数
    this.timeWindow = timeWindow;   // 时间窗口（毫秒）
    this.requests = [];             // 请求时间记录
  }

  /**
   * 检查是否可以发送请求
   */
  canMakeRequest() {
    const now = Date.now();
    // 清理过期的请求记录
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    return this.requests.length < this.maxRequests;
  }

  /**
   * 记录请求
   */
  recordRequest() {
    this.requests.push(Date.now());
  }

  /**
   * 等待直到可以发送请求
   */
  async waitForNextSlot() {
    while (!this.canMakeRequest()) {
      const oldestRequest = this.requests[0];
      const waitTime = this.timeWindow - (Date.now() - oldestRequest);
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  /**
   * 获取当前请求统计
   */
  getStats() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    return {
      currentRequests: this.requests.length,
      maxRequests: this.maxRequests,
      timeWindow: this.timeWindow
    };
  }
}

/**
 * 创建全局请求频率控制器
 */
import { CONFIG } from '../config/index.js';
export const globalRateLimiter = new RateLimiter(
  CONFIG.API.RATE_LIMIT.MAX_REQUESTS, 
  CONFIG.API.RATE_LIMIT.TIME_WINDOW
);
