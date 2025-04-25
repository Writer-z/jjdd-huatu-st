/**
 * API服务层
 * 处理与API相关的通信
 */
import { fetchApi as utilsFetchApi } from '../utils/api';
import { validateApiKey } from '../utils/validators';
import { saveLastJobId } from './storage';  // 导入保存任务ID的函数

// API服务基本URL
const BASE_URL = 'http://localhost:1314'; // 本地开发时使用
// const BASE_URL = 'https://huatu.jjdd.top'; // 生产环境使用

// API请求配置
const API_CONFIG = {
  timeout: 30000, // 请求超时时间（毫秒）
  retryCount: 3, // 请求失败重试次数
  retryDelay: 5000, // 重试间隔（毫秒）
  pollInterval: 5000, // 轮询间隔（毫秒），增加到 5 秒减少后端日志输出频率
  maxPollRetries: 90, // 最大轮询次数，由于增加了间隔，减少总次数保持总时间不变
};

// 请求控制器存储
const abortControllers = new Map();

/**
 * 创建超时Promise
 * @param {number} ms - 超时时间（毫秒）
 * @returns {Promise<never>} 超时Promise
 */
const createTimeoutPromise = (ms) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`请求超时 (${ms}ms)`));
    }, ms);
  });
};

/**
 * 基础API请求函数
 * @param {string} endpoint - API端点
 * @param {Object} options - 请求选项
 * @param {Object} config - 请求配置
 * @returns {Promise<Object>} 响应数据
 */
export const fetchApi = async (endpoint, options = { method: 'GET', headers: {} }, config = {}) => {
  const requestId = `${endpoint}-${Date.now()}`;
  const controller = new AbortController();

  // 存储AbortController以便可以取消请求
  abortControllers.set(requestId, controller);

  // 合并默认配置和用户配置
  const {
    timeout = API_CONFIG.timeout,
    retryCount = API_CONFIG.retryCount,
    retryDelay = API_CONFIG.retryDelay,
  } = config;

  // 添加signal到请求选项
  const requestOptions = {
    ...options,
    signal: controller.signal,
  };

  let lastError = null;
  let retries = 0;

  try {
    while (retries <= retryCount) {
      try {
        // 创建带超时的fetch请求
        const timeoutPromise = createTimeoutPromise(timeout);
        const fetchPromise = fetch(`${BASE_URL}${endpoint}`, requestOptions);

        // 使用Promise.race来实现超时控制
        const response = await Promise.race([fetchPromise, timeoutPromise]);

        // 检查HTTP状态
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'No error details');
          throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }

        // 解析JSON响应
        const data = await response.json();

        // 移除控制器
        abortControllers.delete(requestId);

        // 返回成功响应
        return data;
      } catch (error) {
        lastError = error;

        // 如果是AbortError或已达最大重试次数，则不再重试
        if (error.name === 'AbortError' || retries >= retryCount) {
          throw error;
        }

        // 否则等待一段时间后重试
        retries++;
        console.warn(`API请求失败，正在重试 (${retries}/${retryCount}): ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    throw lastError;
  } catch (error) {
    // 记录错误并移除控制器
    console.error(`API请求错误(${endpoint}):`, error);
    abortControllers.delete(requestId);

    // 重新抛出错误
    throw error;
  }
};

/**
 * 取消所有正在进行的请求
 */
export const cancelAllRequests = () => {
  abortControllers.forEach((controller, id) => {
    console.log(`取消请求: ${id}`);
    controller.abort();
  });
  abortControllers.clear();
};

/**
 * 取消特定请求
 * @param {string} requestId - 请求ID
 */
export const cancelRequest = (requestId) => {
  const controller = abortControllers.get(requestId);
  if (controller) {
    controller.abort();
    abortControllers.delete(requestId);
    return true;
  }
  return false;
};

/**
 * 生成图像
 * @param {Object} params - 图像生成参数
 * @param {string} prompt - 额外提示词
 * @param {Function} onProgress - 进度回调函数
 * @returns {Promise<Object>} 图像生成结果
 */
export const generateImage = async (params, prompt = '', onProgress = null) => {
  // 创建唯一的任务ID
  const taskId = `generate-${Date.now()}`;

  // 进度更新
  const updateProgress = (progress, status) => {
    if (onProgress && typeof onProgress === 'function') {
      onProgress({
        taskId,
        progress,
        status,
      });
    }
  };

  try {
    // 更新进度：开始验证
    updateProgress(0, '正在验证参数');

    // 检查params是否为null
    if (!params) {
      throw new Error('参数无效');
    }

    // 验证API密钥
    const apiKey = params.jjddApiKey;
    if (!apiKey) {
      console.error('API密钥缺失，参数键:', Object.keys(params));
      throw new Error('请先设置API密钥');
    }

    if (!apiKey.startsWith('jjdd-') || apiKey.length < 15) {
      throw new Error('API密钥格式不正确!');
    }

    // 记录调试信息
    console.log('API密钥验证通过:', apiKey.substring(0, 10) + '***');

    // 更新进度：准备参数
    updateProgress(5, '正在准备参数');

    // 使用传入的模型参数
    const modelId = params.model;
    if (!modelId) {
      throw new Error('请选择一个模型或输入自定义模型ID');
    }

    console.log('使用模型ID:', modelId);

    // 构建请求参数
    const requestBody = {
      jjddApiKey: apiKey,
      seed: params.seed || -1,
      count: Math.max(1, Math.min(20, parseInt(params.count) || 1)),
      width: parseInt(params.width) || 512,
      height: parseInt(params.height) || 512,
      // 使用正确的字段名称，与后端一致
      正提示词: prompt ? `${params.prompt}, ${prompt}` : params.prompt,
      负提示词: params.negativePrompt,
      sdModel: modelId, // 直接使用传入的模型ID
      sdVae: params.vae || 'ae.sft',
      sampler: params.sampler || 'Euler',
      steps: parseInt(params.steps) || 20,
      cfgScale: parseFloat(params.cfg_scale) || 7.0,
      clipSkip: parseInt(params.clip_skip) || 1
    };

    // 添加Lora参数 (确保只添加有效的Lora)
    if (params.loras && Array.isArray(params.loras) && params.loras.length > 0) {
      // 确保只使用有效的Lora
      const validLoras = params.loras.filter(lora => lora && lora.model && lora.model.trim() !== '');

      validLoras.forEach((lora, index) => {
        if (lora.model) {
          requestBody[`loraModel${index + 1}`] = lora.model;
          requestBody[`weight${index + 1}`] = parseFloat(lora.weight) || 0.8;
        }
      });

      console.log(`有效Lora数量: ${validLoras.length}`);
    }

    // 添加高清修复参数
    if (params.upscaler && params.upscaler.enabled) {
      requestBody['upscaler-switch'] = true;
      requestBody.hrUpscaler = params.upscaler.model || '4x-UltraSharp';
      requestBody.hrResizeX = parseInt(params.upscaler.resize_x) || 1024;
      requestBody.hrResizeY = parseInt(params.upscaler.resize_y) || 1024;
      requestBody.hrSecondPassSteps = parseInt(params.upscaler.steps) || 20;
      requestBody.denoisingStrength = parseFloat(params.upscaler.denoising_strength) || 0.3;
    }

    // 记录实际使用的请求参数
    console.log('实际请求参数:', requestBody);

    // 更新进度：发送请求
    updateProgress(10, '正在发送生成请求');

    // 发送生成请求
    const generateResponse = await utilsFetchApi('/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody),
    });

    if (generateResponse.error) {
      throw new Error(generateResponse.error);
    }

    const { job_id } = generateResponse;
    console.log(`生成图像任务ID: ${job_id}`);

    // 保存任务ID，可以用于SillyTavern集成
    try {
        // 尝试通过多种方式获取eventSource
        const eventSource =
            (typeof window.eventSource !== 'undefined' && window.eventSource) ||
            (typeof window.SillyTavern !== 'undefined' && window.SillyTavern.eventSource) ||
            // 从全局脚本导入
            (typeof window.getContext === 'function' && window.getContext().eventSource);

        if (eventSource && typeof eventSource.emit === 'function') {
            eventSource.emit('jjdd_huatu_job_started', job_id);
            console.log(`成功发送任务开始事件: ${job_id}`);
        } else {
            console.warn('eventSource不可用或格式不正确，无法发送任务开始事件');

            // 直接使用 saveLastJobId 函数保存任务ID
            try {
                saveLastJobId(job_id);
                console.log(`已将任务ID保存到localStorage: ${job_id}`);
            } catch (storageError) {
                console.error('保存任务ID到localStorage失败:', storageError);
            }
        }
    } catch (e) {
        console.warn('无法发送任务开始事件:', e);
    }

    // 更新进度：开始轮询结果
    updateProgress(15, '图像生成中...');

    // 轮询获取任务结果
    const result = await pollJobResult(job_id, apiKey, (progress, status) => {
      // 从15%到95%的进度
      const calculatedProgress = 15 + (progress * 0.8);
      updateProgress(calculatedProgress, status);
    });

    // 检查结果是否表示任务已取消
    if (result.canceled) {
      console.log(`任务 ${job_id} 已被取消`);
      updateProgress(100, '任务已取消');
      return {
        success: false,
        canceled: true,
        message: '任务已被取消',
        jobId: job_id
      };
    }

    // 更新进度：完成
    updateProgress(100, '图像生成完成');

    return result;
  } catch (error) {
    // 更新进度：错误
    updateProgress(-1, `出错: ${error.message}`);

    // 再次抛出错误以便上层处理
    throw error;
  }
};

/**
 * 轮询任务结果
 * @param {string} jobId - 任务ID
 * @param {string} apiKey - API密钥
 * @param {Function} onProgress - 进度回调
 * @returns {Promise<Object>} 任务结果
 */
export const pollJobResult = async (jobId, apiKey, onProgress = null) => {
  const maxRetries = API_CONFIG.maxPollRetries;
  const pollInterval = API_CONFIG.pollInterval; // 轮询间隔（毫秒）
  let retries = 0;

  // 检查任务是否已被取消的标志
  let isCanceled = false;

  // 检查localStorage中的任务ID，如果为空则表示任务已被取消
  const checkIfCanceled = () => {
    try {
      const currentJobId = localStorage.getItem(STORAGE_KEYS.JOB_ID);
      // 如果当前没有任务ID或任务ID与正在轮询的不同，则表示任务可能已被取消
      return !currentJobId || currentJobId !== jobId;
    } catch (e) {
      return false;
    }
  };

  // 导入STORAGE_KEYS常量
  const STORAGE_KEYS = {
    JOB_ID: 'jjddHuatuLastJobId',
  };

  while (retries < maxRetries && !isCanceled) {
    // 检查任务是否已被取消
    isCanceled = checkIfCanceled();
    if (isCanceled) {
      console.log(`任务 ${jobId} 已被取消，停止轮询`);
      return {
        success: false,
        canceled: true,
        message: '任务已被取消'
      };
    }

    // 计算进度百分比
    const progressPercent = Math.min(100, (retries / (maxRetries * 0.8)) * 100);

    if (onProgress && typeof onProgress === 'function') {
      onProgress(progressPercent, `图像生成中... ${Math.round(progressPercent)}%`);
    }

    // 记录开始时间戳，用于确保精确的轮询间隔
    const startTime = Date.now();

    // 每5次轮询输出一次详细日忖，减少日志输出量
    const isDetailedLog = retries % 5 === 0 || retries < 3;
    const logLevel = isDetailedLog ? 'log' : 'debug';

    try {
      if (isDetailedLog) {
        console.log(`[轮询] 第 ${retries+1}/${maxRetries} 次轮询任务 ${jobId}, 时间: ${new Date().toLocaleTimeString()}, 间隔: ${pollInterval}ms`);
      } else {
        // 使用debug级别输出，在控制台中不会显示太多日志
        console.debug(`[轮询] 第 ${retries+1}/${maxRetries} 次轮询任务 ${jobId}`);
      }

      const jobResultResponse = await utilsFetchApi('/jobResult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, jjddApiKey: apiKey }),
      });

      if (jobResultResponse.error) {
        throw new Error(jobResultResponse.error);
      }

      if (jobResultResponse['状态']) {
        const status = jobResultResponse['状态'].toUpperCase();

        console.log(`任务 ${jobId} 状态: ${status}`);

        if (status === 'SUCCESS') {
          console.log(`任务 ${jobResultResponse['任务']} 完成`);
          return {
            success: true,
            data: jobResultResponse.images || [],
            stamina: {
              used: Number(jobResultResponse['已用体力']) || 0,
              consumed: Number(jobResultResponse['消耗体力']) || 0
            },
            task: jobResultResponse['任务'],
            jobId: jobId
          };
        } else if (status === 'FAILED') {
          console.error(`任务 ${jobResultResponse['任务']} 失败`);
          throw new Error(`生成图片任务失败：${jobResultResponse['任务'] || jobId}`);
        } else if (status === 'CANCELED' || status === 'CANCELLED' || status.includes('CANCEL')) {
          // 增强取消状态检测，支持多种形式的取消状态
          console.log(`任务 ${jobResultResponse['任务'] || jobId} 已取消，状态: ${status}`);

          // 清除localStorage中的任务ID
          try {
            localStorage.removeItem(STORAGE_KEYS.JOB_ID);
            console.log('已清除任务ID');
          } catch (e) {
            console.warn('清除任务ID失败:', e);
          }

          return {
            success: false,
            canceled: true,
            message: '任务已被取消'
          };
        } else if (status === 'WAITING' || status === 'PROCESSING' || status === 'PENDING') {
          // 正常的处理中状态，继续轮询
          console.log(`任务 ${jobResultResponse['任务'] || jobId} 状态: ${status}`);
        } else {
          // 处理未知状态
          console.warn(`任务 ${jobResultResponse['任务'] || jobId} 未知状态: ${status}`);

          // 如果是取消相关的状态，也应该退出轮询
          if (status.includes('CANCEL') || status.includes('取消')) {
            console.log(`检测到可能的取消状态: ${status}，停止轮询`);

            // 清除localStorage中的任务ID
            try {
              localStorage.removeItem(STORAGE_KEYS.JOB_ID);
              console.log('已清除任务ID');
            } catch (e) {
              console.warn('清除任务ID失败:', e);
            }

            return {
              success: false,
              canceled: true,
              message: `任务已被取消 (状态: ${status})`
            };
          }
        }
      }
    } catch (error) {
      // 检查任务是否已被取消
      isCanceled = checkIfCanceled();
      if (isCanceled) {
        console.log(`任务 ${jobId} 已被取消，停止轮询`);
        return {
          success: false,
          canceled: true,
          message: '任务已被取消'
        };
      }

      // 检查错误消息是否包含取消相关信息
      if (error.message.includes('CANCEL') || error.message.includes('取消') || error.message.includes('已取消')) {
        console.log(`任务 ${jobId} 已被取消（从错误消息检测），停止轮询`);

        // 清除localStorage中的任务ID
        try {
          localStorage.removeItem(STORAGE_KEYS.JOB_ID);
          console.log('已清除任务ID');
        } catch (e) {
          console.warn('清除任务ID失败:', e);
        }

        return {
          success: false,
          canceled: true,
          message: '任务已被取消'
        };
      }

      // 如果是特定的错误（如连接断开），可以直接抛出
      if (error.message.includes('fetch') || error.message.includes('network')) {
        throw error;
      }

      // 其他错误记录但继续轮询
      console.warn(`轮询任务结果出错 (${retries}/${maxRetries}):`, error);
    }

    retries++;

    // 计算已经过的时间，确保轮询间隔真正为 pollInterval 毫秒
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, pollInterval - elapsedTime);

    // 使用与前面相同的日志级别
    if (isDetailedLog) {
      console.log(`[轮询] 请求耗时: ${elapsedTime}ms, 等待: ${remainingTime}ms, 总间隔: ${elapsedTime + remainingTime}ms`);
    } else {
      console.debug(`[轮询] 请求耗时: ${elapsedTime}ms`);
    }

    if (remainingTime > 0 && retries < maxRetries && !isCanceled) {
      // 等待剩余时间以确保精确的轮询间隔
      await new Promise(resolve => setTimeout(resolve, remainingTime));
    }
  }

  // 如果是因为取消而退出循环
  if (isCanceled) {
    return {
      success: false,
      canceled: true,
      message: '任务已被取消'
    };
  }

  throw new Error('获取任务结果超时，重试次数过多');
};

/**
 * 取消当前生成任务
 * @param {string} jobId - 任务ID
 * @param {string} apiKey - API密钥
 * @returns {Promise<boolean>} 是否成功取消
 */
export const cancelGenerationTask = async (jobId, apiKey) => {
  if (!jobId || !apiKey) {
    return false;
  }

  try {
    const response = await utilsFetchApi('/cancelTask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId, jjddApiKey: apiKey }),
    });

    return response && response.success === true;
  } catch (error) {
    console.error('取消任务失败:', error);
    return false;
  }
};

/**
 * 检查体力值
 * @param {string} apiKey - API密钥
 * @returns {Promise<Object>} 体力值信息
 */
export const checkStamina = async (apiKey) => {
  if (!apiKey) {
    throw new Error('请先设置API密钥');
  }

  try {
    const response = await utilsFetchApi('/get_stamina', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jjddApiKey: apiKey }),
    }, {
      retryCount: 2,  // 减少重试次数，因为这是用户界面常用的功能
    });

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.success) {
      throw new Error(response.message || '获取体力信息失败');
    }

    return {
      used: Number(response['已用体力']) || 0,
      total: Number(response['总体力']) || 10000,
      lastUpdate: response.last_update_time || '',
      updatedAt: Date.now()
    };
  } catch (error) {
    console.error('检查体力值出错:', error);
    throw error;
  }
};

/**
 * 测试API密钥
 * @param {string} apiKey - API密钥
 * @param {Object} params - 测试参数
 * @returns {Promise<Object>} 测试结果，包含详细信息
 */
export const testApiKey = async (apiKey, params = {}) => {
  // 验证API密钥
  const validationResult = validateApiKey(apiKey);
  if (!validationResult.isValid) {
    return {
      valid: false,
      error: validationResult.error
    };
  }

  try {
    // 从参数中获取模型ID（处理可能的不同格式）
    const modelId = params.model || params.sdModel;

    // 确保模型ID不为空
    if (!modelId) {
      return {
        valid: false,
        error: '请选择一个模型或输入自定义模型ID'
      };
    }

    // 构建测试请求体，确保字段名称与后端API一致
    const requestBody = {
      jjddApiKey: apiKey,
      正提示词: params.prompt || "a beautiful landscape",
      负提示词: params.negativePrompt || "ugly, deformed",
      width: parseInt(params.width) || 512,
      height: parseInt(params.height) || 512,
      steps: parseInt(params.steps) || 20,
      cfgScale: parseFloat(params.cfg_scale || params.cfgScale) || 7,
      seed: parseInt(params.seed) || -1,
      sampler: params.sampler || "Euler",
      sdVae: params.vae || "None",
      sdModel: modelId,
      count: parseInt(params.count) || 1,
      clipSkip: parseInt(params.clip_skip || params.clipSkip) || 1
    };

    // 添加高清修复参数 (如果启用)
    if (params.upscaler && params.upscaler.enabled) {
      requestBody['upscaler-switch'] = true;
      requestBody.hrUpscaler = params.upscaler.model || '4x-UltraSharp';
      requestBody.hrResizeX = parseInt(params.upscaler.resize_x || params.upscaler.resizeX) || 1024;
      requestBody.hrResizeY = parseInt(params.upscaler.resize_y || params.upscaler.resizeY) || 1024;
      requestBody.hrSecondPassSteps = parseInt(params.upscaler.steps) || 20;
      requestBody.denoisingStrength = parseFloat(params.upscaler.denoising_strength || params.upscaler.denoisingStrength) || 0.3;
    }

    // 记录真实使用的参数，用于调试
    console.log('使用实际参数进行API测试:', requestBody);

    // 使用test_api_key端点进行测试
    const response = await utilsFetchApi('/test_api_key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    }, {
      retryCount: 1,
    });

    if (response.error) {
      return {
        valid: false,
        error: response.error
      };
    }

    if (!response.success) {
      return {
        valid: false,
        error: response.message || '测试失败'
      };
    }

    return {
      valid: true,
      requestId: response.请求ID || '',
      consumeStamina: response.消耗体力 || 0,
      usedStamina: response.已用体力 || 0,
      totalStamina: response.总体力 || 10000,
      message: `API密钥有效! 预估消耗体力: ${response.消耗体力 || 0}`
    };
  } catch (error) {
    console.error('API密钥验证失败:', error);
    return {
      valid: false,
      error: error.message || '验证失败，请检查网络连接或API密钥'
    };
  }
};

/**
 * 集成到SillyTavern的图像生成函数
 * @param {Object} params - 图像生成参数
 * @param {string} prompt - 额外提示词
 * @param {Object} context - SillyTavern上下文
 * @returns {Promise<Object>} 图像生成结果
 */
export const generateImageForSillyTavern = async (params, prompt = '', context = null) => {
  try {
    console.log('使用参数生成图像:', params);
    console.log('额外提示词:', prompt);

    // 确保params是有效对象
    if (!params || typeof params !== 'object') {
      throw new Error('无效的参数对象');
    }

    // 增强的参数检查
    if (!params.model && !params.sdModel) {
      console.error('缺少模型参数');
      throw new Error('请选择模型');
    }

    // 确保API密钥存在，这是最重要的
    if (!params.jjddApiKey) {
      console.error('API密钥缺失，params:', JSON.stringify({
        hasApiKey: !!params.jjddApiKey,
        hasModel: !!params.model,
        paramKeys: Object.keys(params)
      }));
      throw new Error('请先设置API密钥');
    }

    // 确保字段格式正确
    const processedParams = {
      ...params,
      // 确保以下字段存在并格式正确
      model: params.model || params.sdModel, // 兼容sdModel参数
      cfg_scale: params.cfg_scale || params.cfgScale || 7.0,
      clip_skip: params.clip_skip || params.clipSkip || 1,
      vae: params.vae || params.sdVae || 'ae.sft' // 兼容sdVae参数
    };

    console.log('处理后的参数:', processedParams);

    // 生成图像
    const result = await generateImage(processedParams, prompt, (progressInfo) => {
      // 可以在这里更新进度信息
      console.log('生成进度:', progressInfo);
    });

    if (!result.success) {
      throw new Error(result.error || '图像生成失败');
    }

    // 返回处理结果
    return {
      success: true,
      data: result.data,
      stamina: result.stamina
    };
  } catch (error) {
    console.error('SillyTavern图像生成失败:', error);
    return {
      success: false,
      error: error.message || '生成失败'
    };
  }
};