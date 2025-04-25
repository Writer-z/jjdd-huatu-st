/**
 * 存储服务
 * 用于处理本地存储操作，包括保存和加载设置和记事本等
 */
import { processLoraWeight } from '../utils/paramProcessor';

// 存储键名
const STORAGE_KEYS = {
  SETTINGS: 'jjddHuatuSettings',
  NOTEPAD: 'jjddHuatuNotepad',
  JOB_ID: 'jjddHuatuLastJobId',
};

/**
 * 安全地将对象转换为JSON字符串
 * @param {Object} obj - 要转换的对象
 * @returns {string} JSON字符串
 */
const safeStringify = (obj) => {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.error('JSON序列化错误:', error);
    return '{}';
  }
};

/**
 * 安全地解析JSON字符串为对象
 * @param {string} str - 要解析的JSON字符串
 * @param {Object} defaultValue - 解析失败时返回的默认值
 * @returns {Object} 解析后的对象
 */
const safeParse = (str, defaultValue = null) => {
  if (!str) return defaultValue;
  try {
    return JSON.parse(str);
  } catch (error) {
    console.error('JSON解析错误:', error);
    return defaultValue;
  }
};

/**
 * 保存设置到本地存储
 * @param {Object} settings - 要保存的设置对象
 * @returns {boolean} 是否保存成功
 */
export const saveSettings = (settings) => {
  try {
    if (!settings || typeof settings !== 'object') {
      console.warn('保存设置失败: 无效的设置对象');
      return false;
    }

    // 去除可能导致循环引用的属性和临时状态属性
    const safeSettings = { ...settings };
    delete safeSettings.error;
    delete safeSettings.isGenerating;

    // 处理loras数组，确保每项都是有效的
    if (Array.isArray(safeSettings.loras)) {
      // 验证Lora - 严格检查模型ID格式
      safeSettings.loras = safeSettings.loras.filter(lora => {
        // 过滤掉没有模型ID的Lora
        if (!lora || typeof lora !== 'object' || !lora.model) return false;

        // 空值不保存
        const modelId = lora.model.trim();
        if (modelId === '') return false;

        // 检查模型ID格式 - 只允许纯数字ID或tensor.art链接
        const idPattern = /^\d+$/;
        const urlPattern = /^(?:https?:\/\/)?tensor\.art\/models\/(\d+)(?:\/[^\/?#]*)?/;

        return idPattern.test(modelId) || urlPattern.test(modelId);
      }).map(lora => {
        // 提取和处理ID
        let modelId = lora.model.trim();
        const urlMatch = modelId.match(/^(?:https?:\/\/)?tensor\.art\/models\/(\d+)(?:\/[^\/?#]*)?/);
        if (urlMatch) {
          modelId = urlMatch[1];
        }

        return {
          model: modelId,
          weight: processLoraWeight(lora.weight)
        };
      });
    }

    // 确保保存核心设置项
    const essentialSettings = {
      model: safeSettings.model || {},
      loras: safeSettings.loras || [],
      prompt: safeSettings.prompt || '',
      negativePrompt: safeSettings.negativePrompt || '',
      apiKey: safeSettings.apiKey || '',
      imageDisplayMode: safeSettings.imageDisplayMode || 'add',
      imageMaxHeight: safeSettings.imageMaxHeight || '40vh',
      buttonWidth: safeSettings.buttonWidth || 100,
      buttonHeight: safeSettings.buttonHeight || 100,
      upscaler: safeSettings.upscaler || {},
      swipe: safeSettings.swipe || {},
      // 添加标题栏和体力值状态
      stamina: safeSettings.stamina || { used: 0, total: 10000 },
      activeHeader: safeSettings.activeHeader || 'default',
    };

    localStorage.setItem(STORAGE_KEYS.SETTINGS, safeStringify(essentialSettings));
    console.log('画图设置已保存', essentialSettings);

    // 同步API密钥到主要存储位置
    if (essentialSettings.apiKey) {
      localStorage.setItem('jjdd_api_key', essentialSettings.apiKey);
      // 为了兼容性，也保存到旧的存储位置
      localStorage.setItem('jjdd_huatu_api_key', essentialSettings.apiKey);
      console.log('已同步API密钥到所有存储位置');
    }

    return true;
  } catch (error) {
    console.error('保存设置出错:', error);
    return false;
  }
};

/**
 * 从本地存储加载设置
 * @returns {Object|null} 加载的设置对象或null（如果加载失败）
 */
export const loadSettings = () => {
  try {
    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const settings = safeParse(savedSettings, null);

    // 验证设置对象结构
    if (settings && typeof settings === 'object') {
      // 确保核心属性存在
      const defaultSettings = {
        model: {
          useCustomModel: false,
          selectedModel: '',
          customModelId: '',
          width: 512,
          height: 512,
          count: 1,
          steps: 20,
          cfgScale: 7,
          seed: -1,
          vae: 'ae.sft',
          sampler: 'Euler',
          clipSkip: 1,
        },
        loras: [],
        prompt: '',
        negativePrompt: '',
        apiKey: '',
        imageDisplayMode: 'add',
        imageMaxHeight: '40vh',
        buttonWidth: 100,
        buttonHeight: 100,
        upscaler: {
          enabled: false,
          model: '4x-UltraSharp',
          resizeX: 1024,
          resizeY: 1024,
          steps: 20,
          denoisingStrength: 0.3,
        },
        swipe: {
          timeoutMs: 3500,
          debugMode: false,
        },
        // 添加标题栏和体力值默认值
        stamina: {
          used: 0,
          total: 10000,
        },
        activeHeader: 'default',
      };

      // 验证并处理loras数组
      let validatedLoras = [];
      if (Array.isArray(settings.loras)) {
        validatedLoras = settings.loras
          .filter(lora => {
            // 过滤掉没有模型ID的Lora
            if (!lora || typeof lora !== 'object' || !lora.model) return false;

            // 空值不保存
            const modelId = lora.model.trim();
            if (modelId === '') return false;

            // 检查模型ID格式 - 只允许纯数字ID或tensor.art链接
            const idPattern = /^\d+$/;
            const urlPattern = /^(?:https?:\/\/)?tensor\.art\/models\/(\d+)(?:\/[^\/?#]*)?/;

            return idPattern.test(modelId) || urlPattern.test(modelId);
          })
          .map(lora => {
            // 提取和处理ID
            let modelId = lora.model.trim();
            const urlMatch = modelId.match(/^(?:https?:\/\/)?tensor\.art\/models\/(\d+)(?:\/[^\/?#]*)?/);
            if (urlMatch) {
              modelId = urlMatch[1];
            }

            return {
              model: modelId,
              weight: processLoraWeight(lora.weight)
            };
          });
      }

      // 合并默认设置和已保存设置
      const mergedSettings = {
        ...defaultSettings,
        ...settings,
        // 确保model对象完整
        model: {
          ...defaultSettings.model,
          ...settings.model,
        },
        // 使用验证后的loras
        loras: validatedLoras,
        // 确保upscaler对象完整
        upscaler: {
          ...defaultSettings.upscaler,
          ...settings.upscaler,
        },
        // 确保swipe对象完整
        swipe: {
          ...defaultSettings.swipe,
          ...settings.swipe,
        },
        // 确保stamina对象完整
        stamina: {
          ...defaultSettings.stamina,
          ...(settings.stamina || {}),
        },
      };

      console.log('画图设置已加载', mergedSettings);
      return mergedSettings;
    }

    return null;
  } catch (error) {
    console.error('加载设置出错:', error);
    return null;
  }
};

/**
 * 保存记事本内容到本地存储
 * @param {Array} entries - 记事本条目数组
 * @returns {boolean} 是否保存成功
 */
export const saveNotepad = (entries) => {
  try {
    if (!Array.isArray(entries)) {
      console.warn('保存记事本失败: 无效的记事本条目');
      return false;
    }

    localStorage.setItem(STORAGE_KEYS.NOTEPAD, safeStringify(entries));
    return true;
  } catch (error) {
    console.error('保存记事本出错:', error);
    return false;
  }
};

/**
 * 从本地存储加载记事本内容
 * @returns {Array} 记事本条目数组
 */
export const loadNotepad = () => {
  try {
    const savedEntries = localStorage.getItem(STORAGE_KEYS.NOTEPAD);
    const entries = safeParse(savedEntries, []);

    // 确保返回数组
    return Array.isArray(entries) ? entries : [];
  } catch (error) {
    console.error('加载记事本出错:', error);
    return [];
  }
};

/**
 * 保存最近任务ID
 * @param {string|null} jobId - 任务ID，null表示清除任务ID
 * @returns {boolean} 是否保存成功
 */
export const saveLastJobId = (jobId) => {
  try {
    // 如果jobId为null，则清除任务ID
    if (jobId === null) {
      localStorage.removeItem(STORAGE_KEYS.JOB_ID);
      console.log('已清除任务ID');
      return true;
    }

    // 验证jobId是否为有效字符串
    if (!jobId || typeof jobId !== 'string') {
      console.warn('无效的任务ID:', jobId);
      return false;
    }

    localStorage.setItem(STORAGE_KEYS.JOB_ID, jobId);
    console.log(`已保存任务ID: ${jobId}`);
    return true;
  } catch (error) {
    console.error('保存任务ID出错:', error);
    return false;
  }
};

/**
 * 获取最近任务ID
 * @returns {string|null} 任务ID
 */
export const getLastJobId = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.JOB_ID);
  } catch (error) {
    console.error('获取任务ID出错:', error);
    return null;
  }
};

/**
 * 清除所有存储的数据
 * @returns {boolean} 是否清除成功
 */
export const clearAllData = () => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error('清除数据出错:', error);
    return false;
  }
};

/**
 * 保存设置项
 * @param {string} key - 设置项键名
 * @param {any} value - 设置项值
 * @returns {boolean} 是否保存成功
 */
export const saveSettingItem = (key, value) => {
  try {
    if (!key || typeof key !== 'string') {
      return false;
    }

    const settings = loadSettings() || {};
    settings[key] = value;
    return saveSettings(settings);
  } catch (error) {
    console.error(`保存设置项[${key}]出错:`, error);
    return false;
  }
};

/**
 * 获取设置项
 * @param {string} key - 设置项键名
 * @param {any} defaultValue - 默认值
 * @returns {any} 设置项值或默认值
 */
export const getSettingItem = (key, defaultValue = null) => {
  try {
    const settings = loadSettings();
    return settings && settings[key] !== undefined ? settings[key] : defaultValue;
  } catch (error) {
    console.error(`获取设置项[${key}]出错:`, error);
    return defaultValue;
  }
};

/**
 * 检查是否有已保存的设置
 * @returns {boolean} 是否有已保存的设置
 */
export const hasStoredSettings = () => {
  try {
    return !!localStorage.getItem(STORAGE_KEYS.SETTINGS);
  } catch (error) {
    console.error('检查设置存在性出错:', error);
    return false;
  }
};

/**
 * 检查是否有已保存的记事本
 * @returns {boolean} 是否有已保存的记事本
 */
export const hasStoredNotepad = () => {
  try {
    return !!localStorage.getItem(STORAGE_KEYS.NOTEPAD);
  } catch (error) {
    console.error('检查记事本存在性出错:', error);
    return false;
  }
};