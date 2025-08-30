/**
 * 重试机制工具
 */
export class RetryManager {
  constructor(maxRetries = 3, baseDelay = 1000, maxDelay = 10000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
  }

  /**
   * 指数退避算法计算延迟时间
   */
  calculateDelay(attempt) {
    const delay = Math.min(this.baseDelay * Math.pow(2, attempt), this.maxDelay);
    return delay + Math.random() * 1000; // 添加随机抖动
  }

  /**
   * 执行带重试的异步操作
   */
  async execute(operation, context = '') {
    let lastError;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === this.maxRetries) {
          throw new Error(`${context} 重试${this.maxRetries}次后仍然失败: ${error.message}`);
        }
        
        const delay = this.calculateDelay(attempt);
        console.log(`${context} 第${attempt + 1}次尝试失败，${delay.toFixed(0)}ms后重试: ${error.message}`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * 检查错误是否应该重试
   */
  shouldRetry(error) {
    // 认证错误不应该重试，直接失败
    if (error.isAuthError || error.name === "AuthenticationError" || error.code === 401) {
      return false;
    }
    
    // 网络错误、超时、服务器错误等应该重试
    if (error.code === 'ECONNRESET' || 
        error.code === 'ETIMEDOUT' || 
        error.code === 'ENOTFOUND' ||
        error.response?.status >= 500) {
      return true;
    }
    
    // 客户端错误（4xx）通常不应该重试
    if (error.response?.status >= 400 && error.response?.status < 500) {
      return false;
    }
    
    return true;
  }
}

/**
 * 创建全局重试管理器
 */
import { CONFIG } from '../config/index.js';
export const globalRetryManager = new RetryManager(
  CONFIG.API.RETRY.MAX_RETRIES,
  CONFIG.API.RETRY.BASE_DELAY,
  CONFIG.API.RETRY.MAX_DELAY
);
