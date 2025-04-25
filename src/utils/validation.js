/**
 * 验证工具函数
 * 从gege-huatu迁移和优化的验证相关工具函数
 */

import { showInputError } from './ui';

/**
 * 验证并处理输入值，支持范围检查
 * @param {HTMLInputElement} input - 输入元素
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @param {string} errorMsg - 错误提示消息
 * @returns {number|null} - 验证后的数值或null（验证失败）
 */
export const validateAndProcessInput = (input, min, max, errorMsg) => {
  const value = input.value.trim();
  
  // 检查是否为空
  if (!value) {
    showInputError(input, '请输入有效数值');
    return null;
  }
  
  // 尝试转换为数字
  const numValue = Number(value);
  
  // 检查是否为有效数字
  if (isNaN(numValue)) {
    showInputError(input, '请输入有效数值');
    return null;
  }
  
  // 范围检查
  if (numValue < min || numValue > max) {
    showInputError(input, errorMsg || `数值必须在${min}到${max}之间`);
    return null;
  }
  
  return numValue;
};

/**
 * 验证文本输入是否符合要求
 * @param {HTMLInputElement} input - 输入元素
 * @param {RegExp} [pattern] - 验证的正则表达式
 * @param {string} [errorMsg] - 错误提示消息
 * @param {boolean} [allowEmpty=false] - 是否允许为空
 * @returns {string|null} - 验证后的字符串或null（验证失败）
 */
export const validateTextInput = (input, pattern, errorMsg, allowEmpty = false) => {
  const value = input.value.trim();
  
  // 检查是否为空
  if (!value && !allowEmpty) {
    showInputError(input, '请输入有效文本');
    return null;
  }
  
  // 如果允许为空且输入为空，直接返回空字符串
  if (allowEmpty && !value) {
    return '';
  }
  
  // 如果提供了模式，则进行验证
  if (pattern && !pattern.test(value)) {
    showInputError(input, errorMsg || '输入格式不正确');
    return null;
  }
  
  return value;
};

/**
 * 验证文件输入是否符合要求
 * @param {HTMLInputElement} input - 文件输入元素
 * @param {Array<string>} [allowedTypes] - 允许的文件类型数组
 * @param {number} [maxSize] - 最大文件大小（字节）
 * @returns {File|null} - 验证后的文件对象或null（验证失败）
 */
export const validateFileInput = (input, allowedTypes = [], maxSize = 0) => {
  if (!input.files || input.files.length === 0) {
    showInputError(input, '请选择文件');
    return null;
  }
  
  const file = input.files[0];
  
  // 检查文件类型
  if (allowedTypes.length > 0) {
    const fileType = file.type;
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    // 检查MIME类型或扩展名
    const isValidType = allowedTypes.some(type => {
      // 检查MIME类型
      if (type.includes('/')) {
        return fileType === type;
      }
      // 检查扩展名
      return fileExtension === type.toLowerCase();
    });
    
    if (!isValidType) {
      showInputError(input, `文件类型必须是 ${allowedTypes.join(', ')}`);
      return null;
    }
  }
  
  // 检查文件大小
  if (maxSize > 0 && file.size > maxSize) {
    const sizeInMB = maxSize / (1024 * 1024);
    showInputError(input, `文件大小不能超过 ${sizeInMB.toFixed(2)} MB`);
    return null;
  }
  
  return file;
}; 