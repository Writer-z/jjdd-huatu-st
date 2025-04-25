/**
 * 参数处理工具
 * 严格按照gege-huatu的逻辑处理画图参数
 */

// 正则表达式
const PATTERNS = {
  MODEL_ID: /^\d+$/,
  TENSOR_ART_URL: /^(?:https?:\/\/)?tensor\.art\/models\/(\d+)(?:\/[^\/?#]*)?/,
  LORA_ID: /^[a-zA-Z0-9_-]+$/,
  TENSOR_ART_LORA_URL: /^(?:https?:\/\/)?tensor\.art\/loras\/([a-zA-Z0-9_-]+)(?:\/[^\/?#]*)?/,
  NUMERIC: /^\d+$/
};

/**
 * 处理模型输入，解析tensor.art链接或直接使用模型ID
 * @param {string} value - 输入值
 * @returns {Object} - 包含value和isValid的结果对象
 */
export const processModelInput = (value) => {
  const trimmedValue = value.trim();

  // 空值处理
  if (trimmedValue === "") {
    return { value: "", isValid: true };
  }

  // 纯数字ID
  if (PATTERNS.MODEL_ID.test(trimmedValue)) {
    return { value: trimmedValue, isValid: true };
  }

  // tensor.art链接
  const match = trimmedValue.match(PATTERNS.TENSOR_ART_URL);
  return match
    ? { value: match[1], isValid: true }
    : { value: trimmedValue, isValid: false };
};

/**
 * 处理Lora输入，解析tensor.art链接或直接使用模型ID
 * @param {string} value - 输入值
 * @returns {Object} - 包含value和isValid的结果对象
 */
export const processLoraInput = (value) => {
  console.log('processLoraInput被调用', { value });

  // 防错：确保输入为字符串
  if (value === null || value === undefined) {
    console.log('processLoraInput: 输入为null或undefined');
    return { value: "", isValid: false };
  }

  const trimmedValue = String(value).trim();
  console.log('processLoraInput: 处理后的值', { trimmedValue });

  // 空值处理
  if (trimmedValue === "") {
    console.log('processLoraInput: 空值处理');
    return { value: "", isValid: true };
  }

  // 纯数字ID
  if (PATTERNS.MODEL_ID.test(trimmedValue)) {
    console.log('processLoraInput: 匹配纯数字ID', { id: trimmedValue });
    return { value: trimmedValue, isValid: true };
  }

  // 特殊处理tensor.art链接 - 增强匹配能力
  if (trimmedValue.includes('tensor.art/models/')) {
    console.log('processLoraInput: 检测到tensor.art链接');
    try {
      // 尝试简单提取数字ID - 适用于不标准URL格式
      const simpleParse = /tensor\.art\/models\/(\d+)/i.exec(trimmedValue);
      if (simpleParse && simpleParse[1]) {
        console.log('processLoraInput: 简单提取成功', { id: simpleParse[1] });
        return { value: simpleParse[1], isValid: true };
      }

      // 标准URL匹配
      const match = trimmedValue.match(PATTERNS.TENSOR_ART_URL);
      if (match && match[1]) {
        console.log('processLoraInput: 标准URL匹配成功', { id: match[1] });
        return { value: match[1], isValid: true };
      }

      console.log('processLoraInput: URL匹配失败');
    } catch (error) {
      console.error('URL处理出错:', error, 'URL:', trimmedValue);
    }
  }

  // 未能匹配任何模式
  console.log('processLoraInput: 未能匹配任何模式', { value: trimmedValue });
  return { value: trimmedValue, isValid: false };
};

/**
 * 检查宽高比是否在合理范围内
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @returns {boolean} 宽高比是否合理
 */
export const isValidAspectRatio = (width, height) => {
  if (!width || !height) return false;

  const ratio = width / height;
  // 确保宽高比在0.5到2.0之间
  return ratio >= 0.5 && ratio <= 2.0;
};

/**
 * 显示Toast消息
 * @param {string} message - 消息内容
 * @param {number} duration - 持续时间
 * @param {boolean} isError - 是否为错误消息
 */
export const showToast = (message, duration = 3000, isError = false) => {
  // 创建或获取toast元素
  let toastEl = document.getElementById('jjdd-huatu-toast');
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'jjdd-huatu-toast';
    toastEl.className = 'jjdd-huatu-toast';
    document.body.appendChild(toastEl);
  }

  // 设置消息和样式
  toastEl.textContent = message;
  toastEl.className = `jjdd-huatu-toast ${isError ? 'error' : 'success'}`;

  // 显示toast
  setTimeout(() => {
    toastEl.classList.add('show');
  }, 10);

  // 设置隐藏定时器
  clearTimeout(toastEl.hideTimeout);
  toastEl.hideTimeout = setTimeout(() => {
    toastEl.classList.remove('show');
  }, duration);
};

/**
 * 显示输入错误提示
 * @param {HTMLElement} input - 输入元素
 * @param {string} message - 错误消息
 */
export const showInputError = (input, message) => {
  if (!input) return;

  // 添加错误样式
  input.classList.add('input-error');

  // 显示错误消息
  showToast(message, 3000, true);

  // 自动清除错误样式
  setTimeout(() => {
    input.classList.remove('input-error');
  }, 2000);
};

/**
 * 验证并处理输入
 * @param {string} value - 输入值
 * @param {string} type - 输入类型 (numeric|text)
 * @param {Object} options - 验证选项
 * @returns {Object} 处理结果
 */
export const validateAndProcessInput = (value, type = 'numeric', options = {}) => {
  const {
    min = Number.MIN_SAFE_INTEGER,
    max = Number.MAX_SAFE_INTEGER,
    allowEmpty = false,
    defaultValue = '',
    pattern = null,
    patternErrorMsg = '',
    processFunc = null
  } = options;

  // 处理空值
  if (!value && value !== 0) {
    if (allowEmpty) return { value: '', isValid: true };
    return { value: defaultValue, isValid: false, error: '值不能为空' };
  }

  // 处理基于类型的验证
  if (type === 'numeric') {
    // 允许-1作为特殊值（比如种子值）
    if (value === '-1' && min <= -1) {
      return { value: -1, isValid: true };
    }

    // 清除非数字字符，但保留前导负号
    const cleanValue = value.toString().replace(/^-/, '').replace(/[^\d.]/g, '').replace(/^-/, '');
    let numValue = parseFloat((value.startsWith('-') ? '-' : '') + cleanValue);

    // 检查是否为有效数字
    if (isNaN(numValue)) {
      return { value, isValid: false, error: '请输入有效的数字' };
    }

    // 检查范围
    if (numValue < min || numValue > max) {
      return {
        value: numValue,
        isValid: false,
        error: `值必须在${min}到${max}之间`
      };
    }

    return { value: numValue, isValid: true };
  } else {
    // 文本类型验证
    if (pattern && !pattern.test(value)) {
      return { value, isValid: false, error: patternErrorMsg || '输入格式不正确' };
    }

    // 应用自定义处理函数
    const processedValue = processFunc ? processFunc(value) : value;

    return { value: processedValue, isValid: true };
  }
};

/**
 * 根据输入互斥锁定尺寸
 * @param {number} width - 当前宽度值
 * @param {number} height - 当前高度值
 * @param {string} changedDimension - 被更改的维度 ('width'|'height')
 * @returns {Object} 调整后的宽高值
 */
export const adjustDimensions = (width, height, changedDimension) => {
  // 如果一个维度是初始值但另一个不是，保持宽高比为1:1
  if ((width === 512 && height !== 512) || (height === 512 && width !== 512)) {
    if (changedDimension === 'width') {
      return { width, height: width };
    } else {
      return { width: height, height };
    }
  }

  // 检查宽高比是否合理，如果不合理则调整
  if (!isValidAspectRatio(width, height)) {
    if (changedDimension === 'width') {
      // 限制宽度为高度的0.5到2.0倍
      const minWidth = Math.max(256, Math.round(height * 0.5));
      const maxWidth = Math.min(2300, Math.round(height * 2.0));
      const adjustedWidth = Math.max(minWidth, Math.min(maxWidth, width));
      return { width: adjustedWidth, height };
    } else {
      // 限制高度为宽度的0.5到2.0倍
      const minHeight = Math.max(256, Math.round(width * 0.5));
      const maxHeight = Math.min(3200, Math.round(width * 2.0));
      const adjustedHeight = Math.max(minHeight, Math.min(maxHeight, height));
      return { width, height: adjustedHeight };
    }
  }

  // 确保宽高在有效范围内
  const validWidth = Math.max(256, Math.min(2300, width));
  const validHeight = Math.max(256, Math.min(3200, height));

  return { width: validWidth, height: validHeight };
};

/**
 * 检查对象或数组是否为空
 * @param {Object|Array} obj - 要检查的对象或数组
 * @returns {boolean} 是否为空
 */
export const isEmpty = (obj) => {
  if (!obj) return true;

  if (Array.isArray(obj)) {
    return obj.length === 0;
  }

  if (typeof obj === 'object') {
    return Object.keys(obj).length === 0;
  }

  return false;
};

/**
 * 转换模型名称为ID或链接
 * @param {string} value - 模型名称或ID
 * @returns {string} 处理后的值
 */
export const formatModelValue = (value) => {
  return value.trim();
};

/**
 * 处理Lora权重输入
 * @param {string|number} value - 输入的权重值
 * @returns {number} 处理后的权重值
 */
export const processLoraWeight = (value) => {
  // 防错：确保有输入值
  if (value === null || value === undefined) {
    return 1.0; // 默认值
  }

  try {
    // 将输入转换为数字
    let numValue;

    if (typeof value === 'string') {
      // 去除非数字字符，但保留小数点和负号
      try {
        const cleanValue = value.replace(/[^\d.-]/g, '');
        numValue = parseFloat(cleanValue);
      } catch (parseError) {
        console.warn('权重字符串解析出错:', parseError);
        return 1.0; // 出现解析错误时返回默认值
      }
    } else {
      try {
        numValue = parseFloat(value);
      } catch (parseError) {
        console.warn('权重数值转换出错:', parseError);
        return 1.0; // 出现转换错误时返回默认值
      }
    }

    // 检查是否为有效数字
    if (isNaN(numValue)) {
      return 1.0; // 默认值
    }

    // 确保在0-2范围内
    return Math.max(0, Math.min(2, numValue));
  } catch (error) {
    console.error('处理Lora权重时出错:', error);
    return 1.0; // 出现任何错误时返回默认值
  }
};

/**
 * 添加带前缀和后缀的逗号分隔项到列表
 * @param {string} list - 逗号分隔的列表
 * @param {string} item - 要添加的项
 * @param {string} prefix - 前缀
 * @param {string} suffix - 后缀
 * @returns {string} 更新后的列表
 */
export const addPrefixedItem = (list, item, prefix = '', suffix = '') => {
  const formattedItem = `${prefix}${item}${suffix}`;

  if (!list || list.trim() === '') {
    return formattedItem;
  }

  // 检查项是否已存在（忽略前缀后缀）
  const items = list.split(',').map(i => i.trim());
  const exists = items.some(existingItem =>
    existingItem === formattedItem ||
    existingItem.includes(`${item}`) ||
    (prefix && existingItem.startsWith(prefix) && existingItem.includes(item))
  );

  if (exists) return list;

  return `${list.trim()}, ${formattedItem}`;
};

/**
 * 验证单个Lora参数
 * @param {Object} lora - Lora对象
 * @param {number} index - Lora索引
 * @returns {Object} - 验证结果
 */
export const validateLora = (lora, index) => {
  if (!lora.model || lora.model.trim() === '') {
    return {
      valid: false,
      error: {
        index,
        type: 'empty_model',
        message: `第${index + 1}个Lora模型名称不能为空`
      }
    };
  }

  const weight = parseFloat(lora.weight);
  if (isNaN(weight) || weight < 0 || weight > 2) {
    return {
      valid: false,
      error: {
        index,
        type: 'invalid_weight',
        message: `第${index + 1}个Lora权重必须在0-2之间`
      }
    };
  }

  return { valid: true };
};

/**
 * 验证Lora参数列表
 * @param {Array} loras - Lora参数列表
 * @returns {Object} - 验证结果
 */
export const validateLoras = (loras) => {
  if (!loras || loras.length === 0) {
    return { valid: true, errors: [] };
  }

  const errors = [];

  loras.forEach((lora, index) => {
    const result = validateLora(lora, index);
    if (!result.valid) {
      errors.push(result.error);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * 获取完整的模型参数，包括高清修复参数
 * @param {Object} state - 当前状态对象
 * @returns {Object} 完整的参数对象
 */
export const getFullModelParams = (state) => {
  if (!state) return {};

  const { model, upscaler, prompt, negativePrompt, apiKey, loras } = state;

  // 基础参数
  const params = {
    jjddApiKey: apiKey,
    prompt: prompt || '',
    negativePrompt: negativePrompt || '',
    useCustomModel: model?.useCustomModel || false,
    selectedModel: model?.selectedModel || '',
    customModelId: model?.customModelId || '',
    width: model?.width || 512,
    height: model?.height || 512,
    steps: model?.steps || 20,
    cfgScale: model?.cfgScale || 7,
    seed: model?.seed || -1,
    count: model?.count || 1,
    vae: model?.vae || 'ae.sft',
    sampler: model?.sampler || 'Euler',
    clipSkip: model?.clipSkip || 1,
    loras: loras || []
  };

  // 如果启用了高清修复，添加相关参数
  if (upscaler && upscaler.enabled) {
    params.upscaler = {
      enabled: true,
      model: upscaler.model || '4x-UltraSharp',
      resizeX: upscaler.resizeX || 1024,
      resizeY: upscaler.resizeY || 1024,
      steps: upscaler.steps || 20,
      denoisingStrength: upscaler.denoisingStrength || 0.3
    };
  }

  return params;
};

/**
 * 显示Toast通知
 * @param {string} title - 通知标题
 * @param {string} message - 通知消息
 * @param {string} type - 通知类型 (success, error, warning, info)
 * @param {number} duration - 显示时长(毫秒)
 */
export const showNotification = (title, message, type = 'info', duration = 3000) => {
  // 查找或创建toast容器
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  // 创建toast元素
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  // 创建标题
  const titleElement = document.createElement('div');
  titleElement.className = 'toast-title';
  titleElement.textContent = title;

  // 创建消息
  const messageElement = document.createElement('div');
  messageElement.className = 'toast-message';
  messageElement.textContent = message;

  // 组装toast
  toast.append(titleElement, messageElement);
  toastContainer.appendChild(toast);

  // 自动隐藏
  setTimeout(() => {
    toast.classList.add('toast-hiding');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);

  // 返回toast元素，允许外部手动控制
  return toast;
};

/**
 * 添加Lora标签到提示词
 * @param {string} prompt - 原始提示词
 * @param {string} loraName - Lora名称
 * @param {number} weight - Lora权重
 * @returns {string} 添加了Lora标签的提示词
 */
export const addLoraToPrompt = (prompt, loraName, weight = 1) => {
  if (!loraName || loraName.trim() === '') return prompt;

  // 确保权重在-1到2的范围内
  const constrainedWeight = Math.max(-1, Math.min(2, parseFloat(weight) || 1));

  const loraTag = `<lora:${loraName.trim()}:${constrainedWeight}>`;

  // 检查提示词是否已包含该Lora
  const loraRegex = new RegExp(`<lora:${loraName.trim()}:[^>]*>`);
  if (loraRegex.test(prompt)) {
    // 替换已存在的Lora标签
    return prompt.replace(loraRegex, loraTag);
  }

  // 添加到提示词前面
  return prompt.trim() ? `${loraTag} ${prompt.trim()}` : loraTag;
};

/**
 * 从存储中获取画图参数
 * @returns {Object} 画图参数对象
 */
export const getDrawingParamsFromStorage = () => {
  try {
    // 尝试从设置中获取参数
    const settingsStr = localStorage.getItem('jjddHuatuSettings');
    if (!settingsStr) {
      console.warn('未找到画图设置');
      return null;
    }

    const settings = JSON.parse(settingsStr);
    if (!settings) {
      console.warn('解析画图设置失败');
      return null;
    }

    // 获取API密钥
    let apiKey = settings.apiKey;

    // 如果设置中没有API密钥，尝试从其他存储位置获取
    if (!apiKey) {
      apiKey = localStorage.getItem('jjdd_api_key') || localStorage.getItem('jjdd_huatu_api_key');
    }

    if (!apiKey) {
      console.warn('未找到API密钥');
      return null;
    }

    // 构建参数对象
    const params = {
      // 使用与后端匹配的字段名
      sdModel: settings.model?.useCustomModel ? settings.model?.customModelId : settings.model?.selectedModel,
      prompt: settings.prompt || '',
      negativePrompt: settings.negativePrompt || '',
      width: settings.model?.width || 512,
      height: settings.model?.height || 512,
      count: settings.model?.count || 1,
      steps: settings.model?.steps || 20,
      cfgScale: settings.model?.cfgScale || 7,
      seed: settings.model?.seed || -1,
      sampler: settings.model?.sampler || 'Euler',
      sdVae: settings.model?.vae || 'ae.sft',
      clipSkip: settings.model?.clipSkip || 1,
      jjddApiKey: apiKey
    };

    // 添加Lora (仅添加有效的Lora)
    if (settings.loras && settings.loras.length > 0) {
      const validLoras = settings.loras.filter(lora => lora && lora.model && lora.model.trim() !== '');
      if (validLoras.length > 0) {
        params.loras = validLoras;
      }
    }

    // 添加高清修复参数(如果启用)
    if (settings.upscaler && settings.upscaler.enabled) {
      params.upscaler = {
        enabled: true,
        model: settings.upscaler.model || '4x-UltraSharp',
        resize_x: settings.upscaler.resizeX || 1024,
        resize_y: settings.upscaler.resizeY || 1024,
        steps: settings.upscaler.steps || 20,
        denoising_strength: settings.upscaler.denoisingStrength || 0.3
      };
    }

    console.log('从存储中获取到画图参数:', params);
    return params;
  } catch (error) {
    console.error('从存储中获取画图参数失败:', error);
    return null;
  }
};

// 为了全局访问，在window对象上暴露函数
if (typeof window !== 'undefined') {
  window.showToast = showToast;
  window.showInputError = showInputError;
  window.showNotification = showNotification;
  window.getDrawingParamsFromStorage = getDrawingParamsFromStorage;
}