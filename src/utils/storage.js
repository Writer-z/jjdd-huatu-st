/**
 * 数据存储工具函数
 * 封装了本地存储和SessionStorage操作的相关工具函数
 */

const STORAGE_PREFIX = 'jjdd_huatu_';

/**
 * 将数据保存到本地存储
 * @param {string} key - 存储键名
 * @param {any} value - 要存储的值
 * @param {boolean} [usePrefix=true] - 是否使用前缀
 */
export const saveToLocalStorage = (key, value, usePrefix = true) => {
  try {
    const storageKey = usePrefix ? `${STORAGE_PREFIX}${key}` : key;
    const valueToStore = typeof value === 'object' ? JSON.stringify(value) : value;
    localStorage.setItem(storageKey, valueToStore);
  } catch (error) {
    console.error('保存到本地存储失败:', error);
  }
};

/**
 * 从本地存储获取数据
 * @param {string} key - 存储键名
 * @param {any} [defaultValue=null] - 默认值（如果未找到数据）
 * @param {boolean} [usePrefix=true] - 是否使用前缀
 * @returns {any} 获取的数据或默认值
 */
export const getFromLocalStorage = (key, defaultValue = null, usePrefix = true) => {
  try {
    const storageKey = usePrefix ? `${STORAGE_PREFIX}${key}` : key;
    const item = localStorage.getItem(storageKey);
    
    if (item === null) {
      return defaultValue;
    }
    
    // 尝试解析JSON
    try {
      return JSON.parse(item);
    } catch (e) {
      // 如果不是JSON，则返回原始值
      return item;
    }
  } catch (error) {
    console.error('从本地存储获取数据失败:', error);
    return defaultValue;
  }
};

/**
 * 从本地存储删除数据
 * @param {string} key - 存储键名
 * @param {boolean} [usePrefix=true] - 是否使用前缀
 */
export const removeFromLocalStorage = (key, usePrefix = true) => {
  try {
    const storageKey = usePrefix ? `${STORAGE_PREFIX}${key}` : key;
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('从本地存储删除数据失败:', error);
  }
};

/**
 * 清除所有以前缀开头的本地存储
 */
export const clearPrefixedLocalStorage = () => {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('清除前缀本地存储失败:', error);
  }
};

/**
 * 将数据保存到会话存储
 * @param {string} key - 存储键名
 * @param {any} value - 要存储的值
 * @param {boolean} [usePrefix=true] - 是否使用前缀
 */
export const saveToSessionStorage = (key, value, usePrefix = true) => {
  try {
    const storageKey = usePrefix ? `${STORAGE_PREFIX}${key}` : key;
    const valueToStore = typeof value === 'object' ? JSON.stringify(value) : value;
    sessionStorage.setItem(storageKey, valueToStore);
  } catch (error) {
    console.error('保存到会话存储失败:', error);
  }
};

/**
 * 从会话存储获取数据
 * @param {string} key - 存储键名
 * @param {any} [defaultValue=null] - 默认值（如果未找到数据）
 * @param {boolean} [usePrefix=true] - 是否使用前缀
 * @returns {any} 获取的数据或默认值
 */
export const getFromSessionStorage = (key, defaultValue = null, usePrefix = true) => {
  try {
    const storageKey = usePrefix ? `${STORAGE_PREFIX}${key}` : key;
    const item = sessionStorage.getItem(storageKey);
    
    if (item === null) {
      return defaultValue;
    }
    
    // 尝试解析JSON
    try {
      return JSON.parse(item);
    } catch (e) {
      // 如果不是JSON，则返回原始值
      return item;
    }
  } catch (error) {
    console.error('从会话存储获取数据失败:', error);
    return defaultValue;
  }
};

/**
 * 从会话存储删除数据
 * @param {string} key - 存储键名
 * @param {boolean} [usePrefix=true] - 是否使用前缀
 */
export const removeFromSessionStorage = (key, usePrefix = true) => {
  try {
    const storageKey = usePrefix ? `${STORAGE_PREFIX}${key}` : key;
    sessionStorage.removeItem(storageKey);
  } catch (error) {
    console.error('从会话存储删除数据失败:', error);
  }
}; 