/**
 * API工具函数
 * 从gege-huatu迁移和优化的API相关工具函数
 */

import { showToast } from './ui';
import { API_ENDPOINTS, DEFAULT_DRAWING_PARAMS, DEFAULT_TIMEOUT, API_BASE_URL } from './apiConfig';
import { validateApiKey as validateApiKeyFn } from './validators';

/**
 * API请求锁
 * 防止重复请求
 */
const apiLock = {
  _locked: false,
  isLocked() { return this._locked; },
  lock() { this._locked = true; },
  unlock() { this._locked = false; }
};

/**
 * 发送API请求
 * @param {string} endpoint - API端点
 * @param {Object} options - 请求选项
 * @param {string} [options.method='GET'] - 请求方法
 * @param {Object} [options.headers={}] - 请求头
 * @param {Object|string} [options.body=null] - 请求体
 * @param {boolean} [options.showErrors=true] - 是否显示错误提示
 * @param {string} [options.apiKey=null] - API密钥
 * @returns {Promise<Object>} - 响应数据
 */
export const fetchApi = async (endpoint, options = {}) => {
  const {
    method = 'GET',
    headers = {},
    body = null,
    showErrors = true,
    apiKey = null,
    timeout = DEFAULT_TIMEOUT
  } = options;

  try {
    // 构建请求头
    const requestHeaders = {
      ...headers,
    };

    // 添加API密钥（如果有）
    if (apiKey) {
      requestHeaders['Authorization'] = `Bearer ${apiKey}`;
    }

    // 处理请求体
    let requestBody = body;
    if (body && typeof body === 'object') {
      // 确保请求体正确序列化，尤其是中文字段名
      try {
        requestBody = JSON.stringify(body);
        console.log('序列化请求体:', requestBody); // 调试日志
      } catch (error) {
        console.error('序列化请求体时出错:', error, body);
        throw new Error(`序列化请求体失败: ${error.message}`);
      }

      if (!requestHeaders['Content-Type']) {
        requestHeaders['Content-Type'] = 'application/json';
      }
    }

    // 创建AbortController用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // 确保端点以/开头
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // 防止重复添加基础URL，检查endpoint是否已经包含API_BASE_URL
    const url = normalizedEndpoint.includes(API_BASE_URL)
      ? normalizedEndpoint
      : `${API_BASE_URL}${normalizedEndpoint}`;

    console.log('发送API请求:', url); // 调试日志

    // 发送请求
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: requestBody,
      signal: controller.signal
    });

    // 清除超时
    clearTimeout(timeoutId);

    // 检查响应状态
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    // 解析响应
    const data = await response.json();
    return data;
  } catch (error) {
    // 处理超时错误
    if (error.name === 'AbortError') {
      const errorMessage = '请求执行中，请耐心等待...';
      if (showErrors) {
        showToast(errorMessage, 3000, true);
      }
      throw new Error(errorMessage);
    }

    // 处理其他错误
    const errorMessage = `API请求错误: ${error.message}`;
    if (showErrors) {
      showToast(errorMessage, 3000, true);
    }

    throw error;
  }
};

/**
 * 测试API密钥的有效性并获取体力消耗预估
 * @param {string} apiKey - 要测试的API密钥
 * @param {Object} drawingParams - 画图参数
 * @returns {Promise<Object>} - 测试结果
 */
export const testApiKey = async (apiKey, drawingParams = DEFAULT_DRAWING_PARAMS) => {
  if (!apiKey) {
    throw new Error('API密钥不能为空');
  }

  // 检查API密钥格式
  if (!validateApiKey(apiKey)) {
    return {
      valid: false,
      message: 'API密钥格式不正确，应以"jjdd-"开头且长度至少15位',
      error: 'INVALID_FORMAT'
    };
  }

  // 如果API已被锁定，则不允许发送新请求
  if (apiLock.isLocked()) {
    throw new Error('正在处理其他请求，请稍后再试');
  }

  try {
    // 锁定API请求
    apiLock.lock();

    // 构建测试请求体
    let requestBody = {
      jjddApiKey: apiKey
    };

    // 如果提供了自定义模型ID或选择了模型
    if (drawingParams.useCustomModel !== undefined ||
        drawingParams.selectedModel !== undefined ||
        drawingParams.customModelId !== undefined) {

      // 确定使用哪个模型ID
      let modelId;
      if (drawingParams.useCustomModel) {
        modelId = drawingParams.customModelId;
      } else {
        modelId = drawingParams.selectedModel;
      }

      // 制作参数，确保使用中文字段名
      requestBody = {
        jjddApiKey: apiKey,
        正提示词: drawingParams.prompt || "a beautiful landscape",
        负提示词: drawingParams.negativePrompt || "ugly, deformed",
        width: parseInt(drawingParams.width) || 512,
        height: parseInt(drawingParams.height) || 512,
        steps: parseInt(drawingParams.steps) || 20,
        cfgScale: parseFloat(drawingParams.cfgScale) || 7,
        seed: parseInt(drawingParams.seed) || -1,
        sampler: drawingParams.sampler || "Euler",
        sdVae: drawingParams.vae || "None",
        sdModel: modelId || "748070388543653861", // 使用模型ID或默认模型
        count: parseInt(drawingParams.count) || 1,
        clipSkip: parseInt(drawingParams.clipSkip) || 1
      };
    } else {
      // 如果使用的是DEFAULT_DRAWING_PARAMS，它已经有了正确的字段名
      requestBody = {
        jjddApiKey: apiKey,
        ...drawingParams
      };
    }

    console.log('使用实际参数进行API测试:', requestBody);

    // 发送测试请求
    const response = await fetchApi(API_ENDPOINTS.TEST_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: requestBody,
      showErrors: false
    });

    // 检查响应是否包含成功标志
    if (response.success) {
      return {
        valid: true,
        message: response.message || 'API密钥验证成功',
        consumeStamina: response.消耗体力 || 0,
        requestId: response.请求ID || '',
        usedStamina: response.已用体力 || 0,
        totalStamina: response.总体力 || 10000
      };
    } else {
      return {
        valid: false,
        message: response.error || '无效的API密钥',
        error: response.error
      };
    }
  } catch (error) {
    console.error('API密钥测试出错:', error);
    return {
      valid: false,
      message: error.message || '测试API密钥失败',
      error: error.message
    };
  } finally {
    // 解锁API请求
    apiLock.unlock();
  }
};

/**
 * 验证API密钥格式
 * @param {string} apiKey - 要验证的API密钥
 * @returns {boolean} - 是否有效
 */
export const validateApiKey = (apiKey) => {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }

  const validationResult = validateApiKeyFn(apiKey);
  return validationResult.isValid;
};

/**
 * 获取API密钥的体力信息
 * @param {string} apiKey - API密钥
 * @returns {Promise<Object>} - 体力信息
 */
export const getApiKeyStamina = async (apiKey) => {
  if (!apiKey) {
    throw new Error('API密钥不能为空');
  }

  try {
    // 直接使用路径而不是完整URL，避免重复添加基础URL
    const response = await fetchApi('/get_stamina', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        jjddApiKey: apiKey
      },
      showErrors: false
    });

    if (response.success) {
      return {
        success: true,
        totalStamina: response.总体力 || 10000,
        usedStamina: response.已用体力 || 0,
        lastUpdate: response.last_update_time || '未知'
      };
    } else {
      return {
        success: false,
        error: response.error || '获取体力信息失败'
      };
    }
  } catch (error) {
    console.error('获取体力信息失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 延迟执行函数
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise} - Promise对象
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 检查API响应数据
 * @param {Object} data - 响应数据
 * @param {boolean} [showErrors=true] - 是否显示错误提示
 * @returns {boolean} - 检查是否通过
 */
export const checkApiResponse = (data, showErrors = true) => {
  if (!data) {
    if (showErrors) {
      showToast('无效的API响应', 3000, true);
    }
    return false;
  }

  if (data.error) {
    if (showErrors) {
      showToast(`API错误: ${data.error}`, 3000, true);
    }
    return false;
  }

  return true;
};

/**
 * 构建图像生成参数
 * @param {Object} modelConfig - 模型配置
 * @param {Object} drawingConfig - 绘图配置
 * @returns {Object} - 图像生成参数
 */
export const buildImageGenerationParams = (modelConfig, drawingConfig) => {
  // 基础参数
  const params = {
    jjddApiKey: modelConfig.apiKey || "",
    // 使用正确的字段名称，与后端一致
    正提示词: drawingConfig.prompt || "",
    负提示词: drawingConfig.negativePrompt || "",
    sdModel: modelConfig.modelId || "",
    width: Number(drawingConfig.width) || 512,
    height: Number(drawingConfig.height) || 512,
    steps: Number(drawingConfig.steps) || 20,
    cfgScale: Number(drawingConfig.cfgScale) || 7,
    seed: Number(drawingConfig.seed) || -1,
    sampler: drawingConfig.sampler || "Euler",
    sdVae: drawingConfig.vae || "None",
    count: Number(drawingConfig.count) || 1,
    clipSkip: Number(drawingConfig.clipSkip) || 1
  };

  // 添加Lora参数（如果有）
  if (drawingConfig.loras && drawingConfig.loras.length > 0) {
    drawingConfig.loras.forEach((lora, index) => {
      if (lora.modelId && lora.modelId.trim() !== "") {
        params[`loraModel${index + 1}`] = lora.modelId;
        params[`weight${index + 1}`] = Number(lora.weight) || 1;
      }
    });
  }

  // 添加高清修复参数（如果启用）
  // 从drawingConfig中的upscaler对象获取参数，或者检查enableUpscale标志
  const upscalerEnabled = drawingConfig.enableUpscale ||
                          (drawingConfig.upscaler && drawingConfig.upscaler.enabled);

  if (upscalerEnabled) {
    params['upscaler-switch'] = true;

    // 如果存在upscaler对象，优先使用其中的参数
    if (drawingConfig.upscaler) {
      params.hrUpscaler = drawingConfig.upscaler.model || "4x-UltraSharp";
      params.hrResizeX = Number(drawingConfig.upscaler.resizeX) || 1024;
      params.hrResizeY = Number(drawingConfig.upscaler.resizeY) || 1024;
      params.denoisingStrength = Number(drawingConfig.upscaler.denoisingStrength) || 0.3;
      params.hrSecondPassSteps = Number(drawingConfig.upscaler.steps) || 20;
    } else {
      // 使用传统参数
      params.hrUpscaler = drawingConfig.hrUpscaler || "4x-UltraSharp";
      params.hrResizeX = Number(drawingConfig.hrResizeX) || 1024;
      params.hrResizeY = Number(drawingConfig.hrResizeY) || 1024;
      params.denoisingStrength = Number(drawingConfig.denoisingStrength) || 0.3;
      params.hrSecondPassSteps = Number(drawingConfig.hrSecondPassSteps) || 20;
    }
  }

  return params;
};