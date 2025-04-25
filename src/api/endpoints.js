/**
 * API端点实现
 * 提供高级API操作方法
 */
import { fetchApi } from './client';
import { API_ENDPOINTS, DEFAULT_DRAWING_PARAMS } from './config';
import { validateApiKey } from '../utils/validators';

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
  const validationResult = validateApiKey(apiKey);
  if (!validationResult.isValid) {
    return {
      valid: false,
      message: validationResult.error,
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
      body: requestBody
    }, {
      retryCount: 1,
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
 * 查询API密钥的体力值信息
 * @param {string} apiKey - API密钥
 * @returns {Promise<Object>} - 体力值信息
 */
export const getStamina = async (apiKey) => {
  if (!apiKey) {
    throw new Error('API密钥不能为空');
  }

  try {
    const response = await fetchApi(API_ENDPOINTS.GET_STAMINA, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        jjddApiKey: apiKey
      }
    }, {
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
    console.error('获取体力信息出错:', error);
    return {
      success: false,
      error: error.message
    };
  }
}; 