/**
 * UI工具函数
 * 从gege-huatu迁移和优化的用户界面相关工具函数
 */

/**
 * 显示弹出提示消息
 * @param {string} message - 显示的消息内容
 * @param {number} duration - 显示持续时间（毫秒）
 * @param {boolean} isError - 是否是错误消息
 */
export const showToast = (message, duration = 3000, isError = false) => {
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `jjdd-huatu-toast ${isError ? 'error' : 'success'}`;

  const messageElement = document.createElement('span');
  messageElement.textContent = message;

  toast.appendChild(messageElement);
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

/**
 * 在输入框显示错误提示
 * @param {HTMLInputElement} input - 输入元素
 * @param {string} message - 错误消息
 */
export const showInputError = (input, message) => {
  input.classList.add('input-error');
  showToast(message, 3000, true);
  setTimeout(() => {
    input.classList.remove('input-error');
  }, 2000);
};

/**
 * 显示调试信息（仅在调试模式下显示）
 * @param {string} message - 调试消息
 * @param {number} duration - 显示持续时间（毫秒）
 * @param {boolean} debugEnabled - 是否启用调试模式
 */
export const showDebugMessage = (message, duration = 2000, debugEnabled = false) => {
  if (!debugEnabled) return;

  const debugId = 'jjdd-debug-toast';
  let debugToast = document.getElementById(debugId);

  if (!debugToast) {
    debugToast = document.createElement('div');
    debugToast.id = debugId;
    debugToast.className = 'jjdd-debug-toast';

    const messageSpan = document.createElement('span');
    messageSpan.id = 'debug-message';

    const closeButton = document.createElement('button');
    closeButton.className = 'close-debug-toast';
    closeButton.textContent = '...';
    closeButton.onclick = () => { debugToast.style.display = 'none'; };

    debugToast.appendChild(messageSpan);
    debugToast.appendChild(closeButton);
    document.body.appendChild(debugToast);
  }

  // 更新消息
  const messageEl = debugToast.querySelector('#debug-message');
  if (messageEl) {
    messageEl.textContent = message;
  }

  // 显示toast
  debugToast.style.display = 'block';

  // 清除之前的定时器
  if (window._debugTimeout) {
    clearTimeout(window._debugTimeout);
  }

  // 设置新的定时器
  window._debugTimeout = setTimeout(() => {
    if (debugToast) debugToast.style.display = 'none';
  }, duration);
};