/**
 * 工具函数集合
 */

/**
 * 显示提示消息
 * @param {string} message - 消息内容
 * @param {number} duration - 显示时长(毫秒)
 * @param {boolean} isError - 是否为错误消息
 */
export const showToast = (message, duration = 3000, isError = false) => {
  // 检查是否已有toast元素
  let toast = document.getElementById('jjdd-huatu-toast');
  
  // 如果已存在，先移除
  if (toast) {
    document.body.removeChild(toast);
  }
  
  // 创建新的toast元素
  toast = document.createElement('div');
  toast.id = 'jjdd-huatu-toast';
  toast.className = `jjdd-huatu-toast ${isError ? 'error' : 'success'}`;
  toast.textContent = message;
  
  // 添加到页面
  document.body.appendChild(toast);
  
  // 设置显示样式
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // 自动关闭
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast && toast.parentNode) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, duration);
};

/**
 * 防抖函数
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 等待时间
 * @returns {Function} 防抖处理后的函数
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
};

/**
 * 节流函数
 * @param {Function} func - 要执行的函数
 * @param {number} limit - 节流时间
 * @returns {Function} 节流处理后的函数
 */
export const throttle = (func, limit = 300) => {
  let inThrottle;
  return function(...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * 将图像应用到按钮背景
 * @param {HTMLElement} button - 按钮元素
 * @param {string} imageUrl - 图像URL
 * @param {number} width - 宽度
 * @param {number} height - 高度
 */
export const applyImageToButton = (button, imageUrl, width = 100, height = 100) => {
  if (!button || !imageUrl) return;
  
  // 设置按钮样式
  button.style.backgroundImage = `url(${imageUrl})`;
  button.style.backgroundSize = 'cover';
  button.style.backgroundPosition = 'center';
  button.style.width = `${width}px`;
  button.style.height = `${height}px`;
  button.classList.add('has-image');
};

/**
 * 添加图像消息到聊天
 * @param {Object} imageData - 图像数据
 * @param {string} prompt - 提示词
 */
export const addImageToChat = (imageData, prompt = '') => {
  if (!imageData || !Array.isArray(imageData) || imageData.length === 0) return;
  
  // 获取全局SillyTavern对象
  if (typeof SillyTavern === 'undefined' || !SillyTavern.addOneMessage) {
    console.error('SillyTavern API不可用');
    return;
  }
  
  try {
    // 构建消息HTML
    const messageHtml = imageData.map(img => {
      const url = img.url || img;
      return `<img src="${url}" class="jjdd-generated-image" style="max-width: 100%;" />`;
    }).join('');
    
    // 添加消息
    const messageText = prompt ? `${prompt}\n\n${messageHtml}` : messageHtml;
    SillyTavern.addOneMessage('user', messageText);
    
    console.log('已添加图像消息到聊天');
  } catch (error) {
    console.error('添加图像消息失败:', error);
    showToast('添加图像消息失败', 3000, true);
  }
}; 