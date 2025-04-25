/**
 * DOM操作工具函数
 * 从gege-huatu迁移和优化的DOM操作相关工具函数
 */

/**
 * 创建DOM元素
 * @param {string} tag - 标签名
 * @param {Object} [attributes={}] - 属性对象
 * @param {string|Node|Array} [children] - 子元素
 * @returns {HTMLElement} - 创建的DOM元素
 */
export const createElement = (tag, attributes = {}, children) => {
  const element = document.createElement(tag);
  
  // 设置属性
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.entries(value).forEach(([prop, val]) => {
        element.style[prop] = val;
      });
    } else if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else {
      element.setAttribute(key, value);
    }
  });
  
  // 添加子元素
  if (children) {
    if (Array.isArray(children)) {
      children.forEach(child => {
        appendChild(element, child);
      });
    } else {
      appendChild(element, children);
    }
  }
  
  return element;
};

/**
 * 添加子元素
 * @param {HTMLElement} parent - 父元素
 * @param {string|Node} child - 子元素
 */
const appendChild = (parent, child) => {
  if (typeof child === 'string' || typeof child === 'number') {
    parent.appendChild(document.createTextNode(child));
  } else if (child instanceof Node) {
    parent.appendChild(child);
  }
};

/**
 * 查找元素
 * @param {string} selector - CSS选择器
 * @param {HTMLElement} [context=document] - 查找上下文
 * @returns {HTMLElement|null} - 找到的元素
 */
export const findElement = (selector, context = document) => {
  return context.querySelector(selector);
};

/**
 * 查找多个元素
 * @param {string} selector - CSS选择器
 * @param {HTMLElement} [context=document] - 查找上下文
 * @returns {NodeList} - 找到的元素列表
 */
export const findElements = (selector, context = document) => {
  return context.querySelectorAll(selector);
};

/**
 * 获取或设置元素属性
 * @param {HTMLElement} element - DOM元素
 * @param {string} name - 属性名
 * @param {string} [value] - 属性值
 * @returns {string|null} - 获取模式下返回属性值
 */
export const attr = (element, name, value) => {
  if (value === undefined) {
    return element.getAttribute(name);
  }
  
  element.setAttribute(name, value);
  return null;
};

/**
 * 添加类名
 * @param {HTMLElement} element - DOM元素
 * @param {string} className - 类名
 */
export const addClass = (element, className) => {
  element.classList.add(className);
};

/**
 * 移除类名
 * @param {HTMLElement} element - DOM元素
 * @param {string} className - 类名
 */
export const removeClass = (element, className) => {
  element.classList.remove(className);
};

/**
 * 切换类名
 * @param {HTMLElement} element - DOM元素
 * @param {string} className - 类名
 * @param {boolean} [force] - 强制添加或移除
 */
export const toggleClass = (element, className, force) => {
  element.classList.toggle(className, force);
};

/**
 * 绑定事件
 * @param {HTMLElement} element - DOM元素
 * @param {string} event - 事件名称
 * @param {Function} handler - 处理函数
 * @param {boolean|Object} [options=false] - 选项
 */
export const on = (element, event, handler, options = false) => {
  element.addEventListener(event, handler, options);
};

/**
 * 解绑事件
 * @param {HTMLElement} element - DOM元素
 * @param {string} event - 事件名称
 * @param {Function} handler - 处理函数
 * @param {boolean|Object} [options=false] - 选项
 */
export const off = (element, event, handler, options = false) => {
  element.removeEventListener(event, handler, options);
};

/**
 * 触发自定义事件
 * @param {string} eventName - 事件名称
 * @param {Object} [detail={}] - 事件详情
 * @param {HTMLElement} [target=document] - 目标元素
 */
export const triggerEvent = (eventName, detail = {}, target = document) => {
  const event = new CustomEvent(eventName, {
    detail,
    bubbles: true,
    cancelable: true
  });
  
  target.dispatchEvent(event);
}; 