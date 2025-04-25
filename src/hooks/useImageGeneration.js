import { useCallback } from 'react';
import { useDrawing } from '../contexts/DrawingContext';
import { validateModelSelection, validateModelParams, validateLora, validateApiKey } from '../utils/validators';

/**
 * 图像生成Hook
 * 用于验证所有参数并提供图像生成相关功能
 */
function useImageGeneration() {
  const { state, setError } = useDrawing();
  
  /**
   * 验证所有参数
   * @returns {{isValid: boolean, errors: Object}} 验证结果和错误信息
   */
  const validateAllParams = useCallback(() => {
    const errors = {};
    let isValid = true;
    
    // 验证API密钥
    const apiKeyResult = validateApiKey(state.apiKey);
    if (!apiKeyResult.isValid) {
      errors.apiKey = apiKeyResult.error;
      isValid = false;
    }
    
    // 验证模型选择
    const modelSelectionResult = validateModelSelection(state.model);
    if (!modelSelectionResult.isValid) {
      errors.modelSelection = modelSelectionResult.error;
      isValid = false;
    }
    
    // 验证模型参数
    const modelParamsResult = validateModelParams(state.model);
    if (!modelParamsResult.isValid) {
      errors.modelParams = modelParamsResult.errors;
      isValid = false;
    }
    
    // 验证Lora (如果有)，但不阻断整个流程
    if (state.loras && state.loras.length > 0) {
      const loraErrors = [];
      let hasLoraErrors = false;
      
      state.loras.forEach((lora, index) => {
        const loraResult = validateLora(lora);
        if (!loraResult.isValid) {
          loraErrors[index] = loraResult.errors;
          hasLoraErrors = true;
          // 不设置isValid = false，让Lora验证错误不影响整体验证
        }
      });
      
      if (hasLoraErrors) {
        errors.loras = loraErrors;
        // 明确记录Lora错误，但不影响整体验证
        console.log('检测到Lora验证错误，但不影响整体参数有效性');
      }
    }
    
    return { isValid, errors };
  }, [state]);
  
  /**
   * 获取画图参数
   * @returns {{params: Object|null, error: string|null}} 画图参数或错误信息
   */
  const getDrawingParams = useCallback(() => {
    const validation = validateAllParams();
    
    //分类处理错误:
    // 1. 核心错误(API密钥、模型选择、模型参数) - 阻止生成
    // 2. Lora错误 - 仅记录不阻止，只过滤无效Lora
    const hasCoreErrors = validation.errors.apiKey || 
                          validation.errors.modelSelection || 
                          validation.errors.modelParams;
    
    if (!validation.isValid && hasCoreErrors) {
      // 只返回核心错误
      const coreErrors = {};
      if (validation.errors.apiKey) coreErrors.apiKey = validation.errors.apiKey;
      if (validation.errors.modelSelection) coreErrors.modelSelection = validation.errors.modelSelection;
      if (validation.errors.modelParams) coreErrors.modelParams = validation.errors.modelParams;
      
      const errorMessage = formatErrorMessage(coreErrors);
      setError(errorMessage);
      console.error('画图核心参数验证失败:', errorMessage);
      return { params: null, error: errorMessage };
    }
    
    // 构建画图参数
    const { model, prompt, negativePrompt, loras, apiKey } = state;
    
    // 确保API密钥存在
    if (!apiKey || apiKey.trim() === '') {
      const errorMessage = '请先设置API密钥';
      setError(errorMessage);
      console.error('API密钥缺失');
      return { params: null, error: errorMessage };
    }
    
    const params = {
      // 使用与API服务匹配的字段名
      model: model.useCustomModel ? model.customModelId : model.selectedModel,
      prompt,
      negativePrompt,
      width: model.width,
      height: model.height,
      count: model.count,
      steps: model.steps,
      cfg_scale: model.cfgScale, // 修改为下划线格式
      seed: model.seed,
      sampler: model.sampler,
      vae: model.vae,
      clip_skip: model.clipSkip, // 修改为下划线格式
      // 在主参数中直接添加API密钥
      jjddApiKey: apiKey
    };
    
    // 添加Lora (仅添加有效的Lora)
    if (loras && loras.length > 0) {
      const validLoras = loras.filter(lora => lora && lora.model && lora.model.trim() !== '');
      if (validLoras.length > 0) {
        params.loras = validLoras;
      }
      console.log(`过滤后的有效Lora数量: ${validLoras.length}`);
    }
    
    // 添加高清修复参数(如果启用)
    if (state.upscaler && state.upscaler.enabled) {
      params.upscaler = {
        enabled: true,
        model: state.upscaler.model,
        resize_x: state.upscaler.resizeX, // 修改为下划线格式
        resize_y: state.upscaler.resizeY, // 修改为下划线格式
        steps: state.upscaler.steps,
        denoising_strength: state.upscaler.denoisingStrength // 修改为下划线格式
      };
    }
    
    // 如果有Lora错误，记录但不阻止生成
    if (validation.errors.loras) {
      const loraErrorMessage = formatErrorMessage({ loras: validation.errors.loras });
      setError(loraErrorMessage);
      console.warn('Lora验证错误，但仍继续生成:', loraErrorMessage);
      // 仍然返回有效参数，只是附带错误信息
      return { params, error: loraErrorMessage };
    }
    
    return { params, error: null };
  }, [state, validateAllParams, setError]);
  
  /**
   * 格式化错误消息
   * @param {Object} errors - 错误对象
   * @returns {string} 格式化的错误消息
   */
  const formatErrorMessage = (errors) => {
    const messages = [];
    
    if (errors.apiKey) {
      messages.push(`API密钥错误: ${errors.apiKey}`);
    }
    
    if (errors.modelSelection) {
      messages.push(`模型选择错误: ${errors.modelSelection}`);
    }
    
    if (errors.modelParams) {
      const paramErrors = Object.entries(errors.modelParams)
        .map(([param, error]) => `${error}`)
        .join('; ');
      
      messages.push(`参数错误: ${paramErrors}`);
    }
    
    if (errors.loras) {
      const loraMessages = errors.loras
        .map((loraError, index) => {
          if (!loraError) return null;
          
          const errorMessages = Object.values(loraError).join('; ');
          return `Lora ${index + 1}: ${errorMessages}`;
        })
        .filter(Boolean)
        .join('; ');
      
      if (loraMessages) {
        messages.push(`Lora错误: ${loraMessages}`);
      }
    }
    
    return messages.join('\n');
  };
  
  return {
    validateAllParams,
    getDrawingParams,
  };
}

export default useImageGeneration; 