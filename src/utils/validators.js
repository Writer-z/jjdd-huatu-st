/**
 * 画图参数验证工具
 * 用于验证用户输入的各种参数，确保它们在有效范围内
 */

/**
 * 验证数值是否在指定范围内
 * @param {number} value - 要验证的值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @param {string} paramName - 参数名称（用于错误消息）
 * @returns {{isValid: boolean, error: string|null}} 验证结果和错误消息
 */
export const validateNumberRange = (value, min, max, paramName) => {
  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    return {
      isValid: false,
      error: `${paramName}必须是有效的数字`
    };
  }
  
  if (numValue < min || numValue > max) {
    return {
      isValid: false,
      error: `${paramName}必须在${min}到${max}之间`
    };
  }
  
  return {
    isValid: true,
    error: null
  };
};

/**
 * 验证模型参数
 * @param {Object} model - 模型参数对象
 * @returns {{isValid: boolean, errors: Object}} 验证结果和错误信息
 */
export const validateModelParams = (model) => {
  const errors = {};
  
  // 验证宽度
  const widthResult = validateNumberRange(model.width, 256, 2300, '宽度');
  if (!widthResult.isValid) {
    errors.width = widthResult.error;
  }
  
  // 验证高度
  const heightResult = validateNumberRange(model.height, 256, 3200, '高度');
  if (!heightResult.isValid) {
    errors.height = heightResult.error;
  }
  
  // 验证数量
  const countResult = validateNumberRange(model.count, 1, 4, '生成数量');
  if (!countResult.isValid) {
    errors.count = countResult.error;
  }
  
  // 验证步数
  const stepsResult = validateNumberRange(model.steps, 10, 60, '步数');
  if (!stepsResult.isValid) {
    errors.steps = stepsResult.error;
  }
  
  // 验证CFG Scale
  const cfgScaleResult = validateNumberRange(model.cfgScale, 1, 30, 'CFG Scale');
  if (!cfgScaleResult.isValid) {
    errors.cfgScale = cfgScaleResult.error;
  }
  
  // 验证种子 (特殊处理，-1 表示随机)
  if (model.seed !== -1) {
    const seedResult = validateNumberRange(model.seed, -1, Number.MAX_SAFE_INTEGER, '种子');
    if (!seedResult.isValid) {
      errors.seed = seedResult.error;
    }
  }
  
  // 验证Clip Skip
  const clipSkipResult = validateNumberRange(model.clipSkip, 1, 12, 'Clip Skip');
  if (!clipSkipResult.isValid) {
    errors.clipSkip = clipSkipResult.error;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * 验证Lora条目
 * @param {Object} lora - Lora条目对象
 * @returns {{isValid: boolean, errors: Object}} 验证结果和错误信息
 */
export const validateLora = (lora) => {
  const errors = {};
  
  // 验证模型名称/ID
  if (!lora.model || lora.model.trim() === '') {
    errors.model = 'Lora模型名称/ID不能为空';
  } else {
    // 检查是否为有效数字ID或tensor.art链接
    const modelValue = lora.model.trim();
    const idPattern = /^\d+$/;
    const urlPattern = /^(?:https?:\/\/)?tensor\.art\/models\/(\d+)(?:\/[^\/?#]*)?/;
    
    if (!idPattern.test(modelValue) && !urlPattern.test(modelValue)) {
      errors.model = '请输入有效的数字ID或tensor.art链接';
    }
  }
  
  // 验证权重
  const weightResult = validateNumberRange(lora.weight, 0, 2, 'Lora权重');
  if (!weightResult.isValid) {
    errors.weight = weightResult.error;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * 验证API密钥
 * @param {string} apiKey - API密钥
 * @returns {{isValid: boolean, error: string|null}} 验证结果和错误信息
 */
export const validateApiKey = (apiKey) => {
  if (!apiKey || apiKey.trim() === '') {
    return {
      isValid: false,
      error: 'API密钥不能为空'
    };
  }
  
  // API密钥格式验证:
  // 1. 必须以"jjdd-"开头
  // 2. 最小长度为15位
  if (!apiKey.startsWith('jjdd-') || apiKey.length < 15) {
    return {
      isValid: false,
      error: 'API密钥格式不正确！'
    };
  }
  
  return {
    isValid: true,
    error: null
  };
};

/**
 * 验证模型选择
 * @param {Object} modelSelection - 模型选择对象
 * @returns {{isValid: boolean, error: string|null}} 验证结果和错误信息
 */
export const validateModelSelection = (modelSelection) => {
  const { useCustomModel, selectedModel, customModelId } = modelSelection;
  
  if (useCustomModel) {
    // 验证自定义模型ID
    if (!customModelId || customModelId.trim() === '') {
      return {
        isValid: false,
        error: '自定义模型ID不能为空'
      };
    }
  } else {
    // 验证预设模型选择
    if (!selectedModel || selectedModel.trim() === '') {
      return {
        isValid: false,
        error: '请选择一个模型'
      };
    }
  }
  
  return {
    isValid: true,
    error: null
  };
};

/**
 * 验证整个设置对象
 * @param {Object} settings - 要验证的设置对象 
 * @returns {{isValid: boolean, errors: Object}} 验证结果和错误信息
 */
export const validateSettings = (settings) => {
  const errors = {};
  
  // 验证模型参数
  if (settings.model) {
    const modelResult = validateModelParams(settings.model);
    if (!modelResult.isValid) {
      errors.model = modelResult.errors;
    }
  } else {
    errors.model = { general: '缺少模型参数' };
  }
  
  // 验证模型选择
  if (settings.model) {
    const modelSelectionResult = validateModelSelection({
      useCustomModel: settings.model.useCustomModel,
      selectedModel: settings.model.selectedModel,
      customModelId: settings.model.customModelId
    });
    
    if (!modelSelectionResult.isValid) {
      errors.modelSelection = modelSelectionResult.error;
    }
  }
  
  // 验证Lora列表
  if (Array.isArray(settings.loras)) {
    const loraErrors = [];
    settings.loras.forEach((lora, index) => {
      const loraResult = validateLora(lora);
      if (!loraResult.isValid) {
        loraErrors.push({
          index,
          errors: loraResult.errors
        });
      }
    });
    
    if (loraErrors.length > 0) {
      errors.loras = loraErrors;
    }
  }
  
  // 验证API密钥
  if (settings.apiKey) {
    const apiKeyResult = validateApiKey(settings.apiKey);
    if (!apiKeyResult.isValid) {
      errors.apiKey = apiKeyResult.error;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}; 