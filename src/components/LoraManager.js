import { validateLoras, validateLora, processLoraWeight, showInputError } from '../utils/paramProcessor.js';
import { createElement } from '../utils/domUtils.js';

/**
 * 创建Lora管理器组件
 * @param {Array} initialLoras - 初始Lora列表
 * @param {Function} onChange - 当Lora列表变更时的回调
 * @returns {HTMLElement} - Lora管理器DOM元素
 */
export function createLoraManager(initialLoras = [], onChange = () => {}) {
  const container = createElement('div', { className: 'lora-manager' });
  let loras = [...initialLoras];
  
  // 创建标题
  const title = createElement('h4', { textContent: 'Lora参数管理' });
  container.appendChild(title);
  
  // 创建Lora条目列表容器
  const loraListContainer = createElement('div', { className: 'lora-list' });
  container.appendChild(loraListContainer);
  
  // 创建操作按钮区域
  const actionsContainer = createElement('div', { className: 'lora-actions' });
  const addButton = createElement('button', { 
    textContent: '添加Lora', 
    onclick: () => addLoraEntry()
  });
  const validateButton = createElement('button', { 
    textContent: '验证Lora', 
    onclick: validateAllLoras
  });
  actionsContainer.append(addButton, validateButton);
  container.appendChild(actionsContainer);
  
  /**
   * 创建单个Lora输入行
   * @param {Object} lora - Lora对象
   * @param {number} index - 索引
   * @returns {HTMLElement} - Lora输入行元素
   */
  function createLoraEntry(lora = { model: '', weight: 1 }, index) {
    const entryDiv = createElement('div', { className: 'lora-entry' });
    
    // 模型名称输入
    const modelInput = createElement('input', {
      type: 'text',
      value: lora.model || '',
      placeholder: 'Lora模型名称',
      onchange: () => {
        loras[index].model = modelInput.value.trim();
        updateLoras();
      }
    });
    
    // 权重输入
    const weightInput = createElement('input', {
      type: 'number',
      value: lora.weight || 1,
      placeholder: '权重 (0-2)',
      style: 'width: 70px;',
      min: 0,
      max: 2,
      step: 0.05,
      onchange: () => {
        const processed = processLoraWeight(weightInput.value);
        weightInput.value = processed;
        loras[index].weight = processed;
        updateLoras();
      }
    });
    
    // 删除按钮
    const removeButton = createElement('button', {
      textContent: '删除',
      onclick: () => {
        loras.splice(index, 1);
        renderLoraList();
        updateLoras();
      }
    });
    
    entryDiv.append(modelInput, weightInput, removeButton);
    return entryDiv;
  }
  
  /**
   * 添加新的Lora条目
   */
  function addLoraEntry() {
    loras.push({ model: '', weight: 1 });
    renderLoraList();
    updateLoras();
  }
  
  /**
   * 渲染Lora列表
   */
  function renderLoraList() {
    loraListContainer.innerHTML = '';
    if (loras.length === 0) {
      const emptyMessage = createElement('p', { 
        textContent: '没有Lora参数，点击"添加Lora"按钮添加',
        style: 'font-style: italic; color: #888;'
      });
      loraListContainer.appendChild(emptyMessage);
      return;
    }
    
    loras.forEach((lora, index) => {
      const entryElement = createLoraEntry(lora, index);
      loraListContainer.appendChild(entryElement);
    });
  }
  
  /**
   * 验证所有Lora输入
   */
  function validateAllLoras() {
    const { valid, errors } = validateLoras(loras);
    
    // 高亮错误输入
    const loraInputs = loraListContainer.querySelectorAll('.lora-entry');
    loraInputs.forEach((entry, index) => {
      const modelInput = entry.querySelector('input[type="text"]');
      const weightInput = entry.querySelector('input[type="number"]');
      
      // 重置错误状态
      modelInput.classList.remove('error');
      weightInput.classList.remove('error');
      
      // 检查当前lora是否有错误
      const loraError = errors.find(error => error.index === index);
      if (loraError) {
        if (loraError.type === 'empty_model') {
          modelInput.classList.add('error');
        } else if (loraError.type === 'invalid_weight') {
          weightInput.classList.add('error');
        }
      }
    });
    
    // 显示验证结果
    if (valid) {
      showToast('验证成功', '所有Lora参数有效', 'success');
    } else {
      const errorMessage = errors.map(e => e.message).join('\\n');
      showInputError(errorMessage);
    }
    
    return valid;
  }
  
  /**
   * 更新Lora数据并触发onChange回调
   */
  function updateLoras() {
    onChange([...loras]);
  }
  
  /**
   * 显示toast通知
   * @param {string} title - 通知标题
   * @param {string} message - 通知消息
   * @param {string} type - 通知类型
   */
  function showToast(title, message, type = 'info') {
    // 使用已有的toast功能或简单实现
    if (typeof window.showToast === 'function') {
      window.showToast(title, message, type);
    } else {
      alert(`${title}: ${message}`);
    }
  }
  
  // 初始渲染
  renderLoraList();
  
  // 返回组件的公共API
  return {
    element: container,
    getLoras: () => [...loras],
    setLoras: (newLoras) => {
      loras = [...newLoras];
      renderLoraList();
    },
    validate: validateAllLoras
  };
} 