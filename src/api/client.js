/**
 * API客户端
 * 提供基础API请求功能
 */
import { API_BASE_URL, DEFAULT_TIMEOUT } from './config';
import { showToast } from '../utils/ui';

/**
 * 创建超时Promise
 * @param {number} ms - 超时时间（毫秒）
 * @returns {Promise<never>} 超时Promise
 */
export const createTimeoutPromise = (ms) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`请求超时 (${ms}ms)`));
    }, ms);
  });
};

// 请求控制器存储
export const abortControllers = new Map();

/**
 * 基础API请求函数
 * @param {string} endpoint - API端点
 * @param {Object} options - 请求选项
 * @param {Object} config - 请求配置
 * @returns {Promise<Object>} 响应数据
 */
export const fetchApi = async (endpoint, options = { method: 'GET', headers: {} }, config = {}) => {
  const requestId = `${endpoint}-${Date.now()}`;
  const controller = new AbortController();
  
  // 存储AbortController以便可以取消请求
  abortControllers.set(requestId, controller);
  
  // 合并默认配置和用户配置
  const { 
    timeout = DEFAULT_TIMEOUT,
    retryCount = 3,
    retryDelay = 1000,
    showErrors = true
  } = config;
  
  // 添加signal到请求选项
  const requestOptions = {
    ...options,
    signal: controller.signal,
  };
  
  let lastError = null;
  let retries = 0;

  try {
    while (retries <= retryCount) {
      try {
        // 处理请求体
        let requestBody = requestOptions.body;
        if (requestBody && typeof requestBody === 'object') {
          // 确保请求体正确序列化，尤其是中文字段名
          try {
            requestBody = JSON.stringify(requestBody);
            console.log('序列化请求体:', requestBody); // 调试日志
            requestOptions.body = requestBody;
          } catch (error) {
            console.error('序列化请求体时出错:', error, requestBody);
            throw new Error(`序列化请求体失败: ${error.message}`);
          }
          
          if (!requestOptions.headers['Content-Type']) {
            requestOptions.headers['Content-Type'] = 'application/json';
          }
        }

        // 确保端点以/开头
        const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        
        // 创建带超时的fetch请求
        const timeoutPromise = createTimeoutPromise(timeout);
        const fetchPromise = fetch(`${API_BASE_URL}${normalizedEndpoint}`, requestOptions);
        
        // 使用Promise.race来实现超时控制
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        
        // 检查HTTP状态
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'No error details');
          throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }
        
        // 解析JSON响应
        const data = await response.json();
        
        // 移除控制器
        abortControllers.delete(requestId);
        
        // 返回成功响应
        return data;
      } catch (error) {
        lastError = error;
        
        // 如果是AbortError或已达最大重试次数，则不再重试
        if (error.name === 'AbortError' || retries >= retryCount) {
          throw error;
        }
        
        // 否则等待一段时间后重试
        retries++;
        console.warn(`API请求失败，正在重试 (${retries}/${retryCount}): ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    throw lastError;
  } catch (error) {
    // 记录错误并移除控制器
    console.error(`API请求错误(${endpoint}):`, error);
    abortControllers.delete(requestId);
    
    // 如果需要显示错误
    if (showErrors && typeof showToast === 'function') {
      showToast(`API请求失败: ${error.message}`, 3000, true);
    }
    
    // 重新抛出错误
    throw error;
  }
};

/**
 * 取消所有正在进行的请求
 */
export const cancelAllRequests = () => {
  abortControllers.forEach((controller, id) => {
    console.log(`取消请求: ${id}`);
    controller.abort();
  });
  abortControllers.clear();
};

/**
 * 取消特定请求
 * @param {string} requestId - 请求ID
 */
export const cancelRequest = (requestId) => {
  const controller = abortControllers.get(requestId);
  if (controller) {
    controller.abort();
    abortControllers.delete(requestId);
    return true;
  }
  return false;
}; 