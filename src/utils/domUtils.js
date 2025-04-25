/**
 * DOM 工具函数
 * 提供更高级的DOM元素操作工具
 */

/**
 * 创建DOM元素并设置属性、样式、内容和事件
 * @param {string} tag - 标签名
 * @param {Object} options - 配置选项
 * @param {Object} [options.attrs={}] - 元素属性
 * @param {Object} [options.styles={}] - 样式
 * @param {string|Node|Array} [options.content] - 内容/子元素
 * @param {Object} [options.events={}] - 事件监听器
 * @returns {HTMLElement} - 创建的DOM元素
 */
export function createElement(tag, options = {}) {
  const { attrs = {}, styles = {}, content, events = {} } = options;
  const element = document.createElement(tag);
  
  // 设置属性
  Object.entries(attrs).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  
  // 设置样式
  Object.entries(styles).forEach(([prop, value]) => {
    element.style[prop] = value;
  });
  
  // 添加内容
  if (content) {
    if (Array.isArray(content)) {
      content.forEach(item => {
        if (typeof item === 'string') {
          element.appendChild(document.createTextNode(item));
        } else if (item instanceof Node) {
          element.appendChild(item);
        }
      });
    } else if (typeof content === 'string') {
      element.textContent = content;
    } else if (content instanceof Node) {
      element.appendChild(content);
    }
  }
  
  // 添加事件监听器
  Object.entries(events).forEach(([event, handler]) => {
    element.addEventListener(event, handler);
  });
  
  return element;
}

/**
 * 创建输入元素
 * @param {Object} options - 配置选项
 * @param {string} [options.type='text'] - 输入类型
 * @param {string} [options.placeholder] - 占位符
 * @param {string} [options.value] - 初始值
 * @param {Function} [options.validate] - 验证函数
 * @param {Function} [options.onChange] - 值变化时的回调
 * @returns {HTMLInputElement} - 创建的输入元素
 */
export function createInput(options = {}) {
  const { 
    type = 'text', 
    placeholder, 
    value, 
    validate, 
    onChange 
  } = options;
  
  const input = createElement('input', {
    attrs: { 
      type, 
      placeholder: placeholder || '',
      value: value || ''
    }
  });
  
  if (onChange) {
    input.addEventListener('input', (e) => {
      if (validate) {
        const isValid = validate(e.target.value);
        input.classList.toggle('invalid', !isValid);
      }
      onChange(e.target.value, e);
    });
  }
  
  return input;
}

/**
 * 创建输入组（带标签）
 * @param {string} labelText - 标签文本
 * @param {Object} inputOptions - 输入元素选项
 * @returns {HTMLDivElement} - 包含标签和输入的容器
 */
export function createInputGroup(labelText, inputOptions = {}) {
  const container = createElement('div', {
    attrs: { class: 'input-group' }
  });
  
  const label = createElement('label', {
    content: labelText
  });
  
  const input = createInput(inputOptions);
  label.appendChild(input);
  container.appendChild(label);
  
  return container;
}

/**
 * 创建按钮
 * @param {string} text - 按钮文本
 * @param {Function} onClick - 点击事件处理函数
 * @param {Object} [options={}] - 附加选项
 * @returns {HTMLButtonElement} - 创建的按钮元素
 */
export function createButton(text, onClick, options = {}) {
  return createElement('button', {
    attrs: options.attrs || {},
    styles: options.styles || {},
    content: text,
    events: {
      click: onClick,
      ...options.events
    }
  });
}

/**
 * 创建下拉选择框
 * @param {Array} options - 选项数组 [{value, text}]
 * @param {Function} onChange - 变化时的回调
 * @param {string} [selectedValue] - 默认选中的值
 * @returns {HTMLSelectElement} - 创建的select元素
 */
export function createSelect(options, onChange, selectedValue) {
  const select = createElement('select');
  
  options.forEach(opt => {
    const option = createElement('option', {
      attrs: { 
        value: opt.value
      },
      content: opt.text
    });
    
    if (selectedValue && opt.value === selectedValue) {
      option.selected = true;
    }
    
    select.appendChild(option);
  });
  
  if (onChange) {
    select.addEventListener('change', (e) => onChange(e.target.value, e));
  }
  
  return select;
}

/**
 * 清空元素内容
 * @param {HTMLElement} element - 要清空的元素
 */
export function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * 显示元素
 * @param {HTMLElement} element - 目标元素
 * @param {string} [displayType='block'] - display属性值
 */
export function showElement(element, displayType = 'block') {
  element.style.display = displayType;
}

/**
 * 隐藏元素
 * @param {HTMLElement} element - 目标元素
 */
export function hideElement(element) {
  element.style.display = 'none';
}

/**
 * 从HTML字符串创建DOM元素
 * @param {string} html - HTML字符串
 * @returns {HTMLElement} - 创建的DOM元素
 */
export function createElementFromHTML(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstChild;
}

/**
 * 添加CSS样式到文档
 * @param {string} css - CSS规则字符串
 * @param {string} [id] - 样式表ID，用于防止重复添加
 */
export function addStyles(css, id) {
  if (id && document.getElementById(id)) {
    return; // 避免重复添加
  }
  
  const style = document.createElement('style');
  if (id) {
    style.id = id;
  }
  
  style.textContent = css;
  document.head.appendChild(style);
}

/**
 * 切换元素的类
 * @param {HTMLElement} element - 目标元素
 * @param {string} className - 类名
 * @param {boolean} [force] - 强制添加或移除
 */
export function toggleClass(element, className, force) {
  element.classList.toggle(className, force);
}

/**
 * 检查元素是否有指定类
 * @param {HTMLElement} element - 目标元素
 * @param {string} className - 类名
 * @returns {boolean} - 是否含有该类
 */
export function hasClass(element, className) {
  return element.classList.contains(className);
}

/**
 * 滚动元素到可视区域
 * @param {HTMLElement} element - 目标元素
 * @param {Object} [options] - 滚动选项
 */
export function scrollIntoView(element, options = { behavior: 'smooth' }) {
  element.scrollIntoView(options);
}

/**
 * 使元素可拖动
 * @param {HTMLElement} element - 要设为可拖动的元素
 * @param {HTMLElement} [handle] - 拖动把手，未指定时使用元素本身
 */
export function makeDraggable(element, handle = null) {
  const dragHandle = handle || element;
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  // 保存原始样式
  const originalPosition = getComputedStyle(element).position;
  if (originalPosition !== 'absolute' && originalPosition !== 'fixed') {
    element.style.position = 'absolute';
  }
  
  dragHandle.addEventListener('mousedown', dragMouseDown);
  
  function dragMouseDown(e) {
    e.preventDefault();
    // 获取鼠标位置
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.addEventListener('mouseup', closeDragElement);
    document.addEventListener('mousemove', elementDrag);
  }
  
  function elementDrag(e) {
    e.preventDefault();
    // 计算新位置
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // 设置元素新位置
    element.style.top = (element.offsetTop - pos2) + "px";
    element.style.left = (element.offsetLeft - pos1) + "px";
  }
  
  function closeDragElement() {
    // 停止移动
    document.removeEventListener('mouseup', closeDragElement);
    document.removeEventListener('mousemove', elementDrag);
  }
}

/**
 * 移动端滑动控制管理器
 * 用于检测和处理移动设备上的滑动手势
 */
export const TouchSwipeManager = {
  // 配置参数
  config: {
    minSwipeDistance: 50,   // 最小滑动距离，单位为像素
    maxSwipeTime: 300,      // 最大滑动时间，单位为毫秒
    swipeTimeoutMs: 3500,   // 滑动状态有效期，单位为毫秒
    debugMode: false        // 调试模式
  },
  
  // 状态变量
  state: {
    startX: 0,
    startY: 0,
    startTime: 0,
    isTracking: false,
    swipeState: {}
  },
  
  /**
   * 初始化滑动控制
   * @param {Object} options - 配置选项
   */
  init(options = {}) {
    // 合并配置
    this.config = { ...this.config, ...options };
    
    // 清理可能存在的旧事件监听器
    this.destroy();
    
    // 调试日志
    this.log('初始化移动端滑动控制');
    
    // 添加全局滑动状态对象
    if (typeof window._jjddSwipeState === 'undefined') {
      window._jjddSwipeState = {};
    }
    
    // 初始化辅助函数
    if (typeof window.isMobile !== 'function') {
      window.isMobile = function() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      };
    }
    
    // 绑定事件处理函数的this上下文
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    
    // 监听触摸事件
    this.attachEventListeners();
    
    // 添加全局样式以优化移动端触摸体验
    this.addTouchStyles();
    
    return this;
  },
  
  /**
   * 清理事件监听器
   */
  destroy() {
    document.removeEventListener('touchstart', this.handleTouchStart);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
    
    // 移除添加的样式
    const styleElement = document.getElementById('jjdd-touch-style');
    if (styleElement) {
      styleElement.remove();
    }
    
    this.log('已清理滑动控制');
  },
  
  /**
   * 添加事件监听器
   */
  attachEventListeners() {
    document.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    
    // 监听系统的滑动事件，在mousedown之前捕获信息
    $(document).on('mousedown', '.mes_img_swipe_right, .mes_img_swipe_left', this.handleSwipeButtonDown.bind(this));
    
    this.log('已添加触摸事件监听器');
  },
  
  /**
   * 添加优化移动端触摸体验的样式
   */
  addTouchStyles() {
    const styleId = 'jjdd-touch-style';
    let styleElement = document.getElementById(styleId);
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    // 添加样式规则以优化移动端的触摸交互
    styleElement.textContent = `
      .mes_img_swipe_right, .mes_img_swipe_left {
        min-width: 40px;
        min-height: 40px;
        touch-action: manipulation;
      }
      
      /* 移动端状态指示器 */
      .jjdd-swipe-indicator {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 14px;
        z-index: 9999;
        transition: opacity 0.3s;
        pointer-events: none;
      }
    `;
  },
  
  /**
   * 处理滑动按钮的mousedown事件
   * @param {Event} event - 事件对象
   */
  handleSwipeButtonDown(event) {
    const $button = $(event.currentTarget);
    const isRightSwipe = $button.hasClass('mes_img_swipe_right');
    const $messageElement = $button.closest('.mes');
    const $imgContainer = $button.closest('.mes_img_container');
    const $swipeCounter = $imgContainer.find('.mes_img_swipe_counter');
    
    // 获取消息ID和当前计数信息
    const messageId = $messageElement.attr('mesid');
    const counterText = $swipeCounter.text() || '1/1';
    const [current, total] = counterText.split('/').map(Number);
    
    // 存储滑动状态
    window._jjddSwipeState[messageId] = {
      current,
      total,
      direction: isRightSwipe ? 'right' : 'left',
      timestamp: Date.now(),
      // 标记特殊位置的滑动
      isRightOnLast: isRightSwipe && current === total,         // 在最后一张右滑
      isRightBeforeLast: isRightSwipe && current === total - 1, // 在倒数第二张右滑
      isLeftOnSecond: !isRightSwipe && current === 2,           // 在第二张左滑
      element: $messageElement[0],
      imgContainer: $imgContainer[0]
    };
    
    this.log(`记录滑动按钮点击: ${current}/${total}, 方向: ${isRightSwipe ? '→' : '←'}`);
  },
  
  /**
   * 处理触摸开始事件
   * @param {TouchEvent} event - 触摸事件对象
   */
  handleTouchStart(event) {
    if (!window.isMobile()) return; // 只在移动设备上处理
    
    const touch = event.touches[0];
    this.state.startX = touch.clientX;
    this.state.startY = touch.clientY;
    this.state.startTime = Date.now();
    this.state.isTracking = true;
    
    // 检查触摸目标是否为图片容器
    const $target = $(event.target);
    const $imgContainer = $target.closest('.mes_img_container');
    
    if ($imgContainer.length) {
      // 如果触摸目标是图片容器，记录信息以备后续使用
      const $messageElement = $imgContainer.closest('.mes');
      const $swipeCounter = $imgContainer.find('.mes_img_swipe_counter');
      
      if ($messageElement.length && $swipeCounter.length) {
        const messageId = $messageElement.attr('mesid');
        const counterText = $swipeCounter.text() || '1/1';
        const [current, total] = counterText.split('/').map(Number);
        
        // 存储滑动上下文
        this.state.currentSwipe = {
          messageId,
          element: $messageElement[0],
          imgContainer: $imgContainer[0],
          current,
          total
        };
        
        this.log(`开始图片触摸追踪: ${current}/${total}`);
      }
    }
  },
  
  /**
   * 处理触摸移动事件
   * @param {TouchEvent} event - 触摸事件对象
   */
  handleTouchMove(event) {
    if (!this.state.isTracking) return;
    
    // 这里可以添加滑动过程中的视觉反馈
    // 例如显示滑动方向指示器
  },
  
  /**
   * 处理触摸结束事件
   * @param {TouchEvent} event - 触摸事件对象
   */
  handleTouchEnd(event) {
    if (!this.state.isTracking) return;
    
    const endX = event.changedTouches[0].clientX;
    const endY = event.changedTouches[0].clientY;
    const endTime = Date.now();
    
    // 计算滑动距离和时间
    const distanceX = endX - this.state.startX;
    const distanceY = endY - this.state.startY;
    const swipeTime = endTime - this.state.startTime;
    
    // 检查是否满足滑动条件
    if (Math.abs(distanceX) > Math.abs(distanceY) && // 水平滑动
        Math.abs(distanceX) > this.config.minSwipeDistance && // 超过最小距离
        swipeTime < this.config.maxSwipeTime) { // 在最大时间内
      
      const direction = distanceX > 0 ? 'right' : 'left';
      
      // 如果有图片滑动上下文，则处理图片滑动
      if (this.state.currentSwipe) {
        const { messageId, element, imgContainer, current, total } = this.state.currentSwipe;
        
        this.log(`检测到有效滑动: ${direction}, 消息ID: ${messageId}`);
        
        // 执行滑动操作
        this.processImageSwipe(messageId, element, direction, current, total);
      }
    }
    
    // 重置状态
    this.state.isTracking = false;
    this.state.currentSwipe = null;
  },
  
  /**
   * 处理图片滑动
   * @param {string} messageId - 消息ID
   * @param {HTMLElement} element - 消息元素
   * @param {string} direction - 滑动方向 ('left' 或 'right')
   * @param {number} current - 当前图片索引
   * @param {number} total - 图片总数
   */
  processImageSwipe(messageId, element, direction, current, total) {
    // 计算目标索引
    let targetIndex = current;
    
    if (direction === 'right') {
      targetIndex = current < total ? current + 1 : 1; // 循环到第一张
    } else {
      targetIndex = current > 1 ? current - 1 : total; // 循环到最后一张
    }
    
    this.log(`滑动处理: ${current} → ${targetIndex} / ${total}`);
    
    // 模拟点击相应的滑动按钮
    const $element = $(element);
    const $button = direction === 'right' 
      ? $element.find('.mes_img_swipe_right') 
      : $element.find('.mes_img_swipe_left');
    
    if ($button.length) {
      // 记录滑动状态，与handleSwipeButtonDown相同
      window._jjddSwipeState[messageId] = {
        current,
        total,
        direction,
        timestamp: Date.now(),
        isRightOnLast: direction === 'right' && current === total,
        isRightBeforeLast: direction === 'right' && current === total - 1,
        isLeftOnSecond: direction === 'left' && current === 2,
        element: $element[0],
        fromTouch: true // 标记这是来自触摸事件的滑动
      };
      
      // 模拟按钮点击
      $button[0].click();
      
      // 显示滑动指示器
      this.showSwipeIndicator(direction, targetIndex, total);
    }
  },
  
  /**
   * 显示滑动指示器
   * @param {string} direction - 滑动方向
   * @param {number} index - 目标索引
   * @param {number} total - 总数
   */
  showSwipeIndicator(direction, index, total) {
    const directionIcon = direction === 'right' ? '→' : '←';
    const message = `${directionIcon} ${index}/${total}`;
    
    let indicator = document.querySelector('.jjdd-swipe-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'jjdd-swipe-indicator';
      document.body.appendChild(indicator);
    }
    
    indicator.textContent = message;
    indicator.style.opacity = '1';
    
    // 自动隐藏
    setTimeout(() => {
      indicator.style.opacity = '0';
      setTimeout(() => {
        indicator.remove();
      }, 300);
    }, 1500);
  },
  
  /**
   * 更新配置
   * @param {Object} options - 新的配置选项
   */
  updateConfig(options) {
    this.config = { ...this.config, ...options };
    this.log(`更新配置: ${JSON.stringify(options)}`);
    return this;
  },
  
  /**
   * 调试日志
   * @param {string} message - 日志消息
   */
  log(message) {
    if (this.config.debugMode) {
      console.log(`[TouchSwipe] ${message}`);
      
      // 在调试模式下显示屏幕提示
      const event = new CustomEvent('jjdd_swipe_debug', { 
        detail: { message } 
      });
      document.dispatchEvent(event);
    }
  }
}; 