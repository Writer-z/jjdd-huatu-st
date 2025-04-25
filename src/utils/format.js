/**
 * 格式化工具函数
 * 从gege-huatu迁移和优化的格式处理相关工具函数
 */

/**
 * 正则表达式模式集合
 */
export const PATTERNS = {
  MODEL_ID: /^\d+$/,
  TENSOR_ART_URL: /^(?:https?:\/\/)?tensor\.art\/models\/(\d+)(?:\/[^\/?#]*)?/,
  NUMERIC: /^\d+$/,
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/,
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
};

/**
 * 处理模型输入，支持ID或tensor.art链接
 * @param {string} value - 输入值
 * @returns {Object} - 处理结果，包含value和isValid
 */
export const processModelInput = (value) => {
  const trimmedValue = value.trim();
  
  // 空值处理
  if (trimmedValue === "") {
    return { value: "", isValid: true };
  }
  
  // 检查是否为纯数字ID
  if (PATTERNS.MODEL_ID.test(trimmedValue)) {
    return { value: trimmedValue, isValid: true };
  }
  
  // 尝试从tensor.art链接提取ID
  const match = trimmedValue.match(PATTERNS.TENSOR_ART_URL);
  return match ? 
    { value: match[1], isValid: true } : 
    { value: trimmedValue, isValid: false };
};

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @param {number} [decimals=2] - 小数位数
 * @returns {string} - 格式化后的文件大小
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 字节';

  const k = 1024;
  const sizes = ['字节', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

/**
 * 格式化时间戳为本地日期时间
 * @param {number} timestamp - 时间戳（毫秒）
 * @returns {string} - 格式化后的日期时间
 */
export const formatDateTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * 截断文本并添加省略号
 * @param {string} text - 原始文本
 * @param {number} maxLength - 最大长度
 * @returns {string} - 截断后的文本
 */
export const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.substr(0, maxLength) + '...';
};

/**
 * 格式化数字，添加千位分隔符
 * @param {number} num - 数字
 * @returns {string} - 格式化后的数字
 */
export const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * 将HEX颜色代码转换为RGB值
 * @param {string} hex - HEX颜色代码
 * @returns {Object|null} - RGB值对象或null（若输入无效）
 */
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}; 