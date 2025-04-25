import React, { createContext, useReducer, useContext, useEffect, useCallback, useState } from 'react';
import { saveSettings as saveSettingsToStorage, loadSettings as loadSettingsFromStorage } from '../services/storage';
import { addLoraToPrompt, processLoraInput, processLoraWeight } from '../utils/paramProcessor';
import { getApiKeyStamina } from '../utils/api';

// 初始状态
const initialState = {
  // 模型和参数
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
    // 锁定状态，用于宽高互斥
    aspectRatioLocked: false,
  },
  // Lora 设置
  loras: [
    { model: '', weight: 1 },
    { model: '', weight: 1 },
    { model: '', weight: 1 }
  ],
  // 提示词
  prompt: '',
  negativePrompt: '',
  originalPrompt: '', // 原始提示词，用于自动填充
  // API 和设置
  apiKey: '',
  imageDisplayMode: 'add',
  imageMaxHeight: '40vh',
  buttonWidth: 100,
  buttonHeight: 100,
  // 是否自动填充提示词
  autoFillPrompt: true,
  // 状态
  isGenerating: false,
  error: null,
  // 体力值
  stamina: {
    used: 0,
    total: 10000,
    lastUpdate: null,
    isLoading: false,
  },
  // 高清修复
  upscaler: {
    enabled: false,
    model: '4x-UltraSharp',
    resizeX: 1024,
    resizeY: 1024,
    steps: 20,
    denoisingStrength: 0.3,
  },

  // 当前标签页
  activeTab: 'generate',
  // 当前显示的面板
  showSettings: false,
  // 显示的标题栏
  activeHeader: 'default',
  // 记事本(兼容性占位，具体实现在NotepadContext中)
  notepadEntries: [],
  // UI状态
  uiState: {
    showSettings: false,
    showNotepad: false,
  },
  isOpen: false,
};

// 动作类型
const actionTypes = {
  SET_MODEL_PARAM: 'SET_MODEL_PARAM',
  TOGGLE_CUSTOM_MODEL: 'TOGGLE_CUSTOM_MODEL',
  TOGGLE_ASPECT_RATIO_LOCK: 'TOGGLE_ASPECT_RATIO_LOCK',
  SET_PROMPT: 'SET_PROMPT',
  SET_NEGATIVE_PROMPT: 'SET_NEGATIVE_PROMPT',
  ADD_LORA: 'ADD_LORA',
  UPDATE_LORA: 'UPDATE_LORA',
  REMOVE_LORA: 'REMOVE_LORA',
  SET_API_KEY: 'SET_API_KEY',
  SET_IMAGE_DISPLAY_MODE: 'SET_IMAGE_DISPLAY_MODE',
  SET_IMAGE_MAX_HEIGHT: 'SET_IMAGE_MAX_HEIGHT',
  SET_BUTTON_SIZE: 'SET_BUTTON_SIZE',
  SET_GENERATING: 'SET_GENERATING',
  SET_ERROR: 'SET_ERROR',
  UPDATE_STAMINA: 'UPDATE_STAMINA',
  TOGGLE_UPSCALER: 'TOGGLE_UPSCALER',
  SET_UPSCALER_PARAM: 'SET_UPSCALER_PARAM',
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  TOGGLE_SETTINGS: 'TOGGLE_SETTINGS',
  SET_ACTIVE_HEADER: 'SET_ACTIVE_HEADER',
  LOAD_SETTINGS: 'LOAD_SETTINGS',
  ADD_TO_PROMPT: 'ADD_TO_PROMPT',
  UPDATE_LORAS: 'UPDATE_LORAS',
  UPDATE_NOTEPAD_ENTRIES: 'UPDATE_NOTEPAD_ENTRIES',
  TOGGLE_UI_STATE: 'TOGGLE_UI_STATE',
  TOGGLE_AUTO_FILL_PROMPT: 'TOGGLE_AUTO_FILL_PROMPT',
};

// Reducer 函数
function drawingReducer(state, action) {
  try {
    switch (action.type) {
      case actionTypes.SET_MODEL_PARAM:
        return {
          ...state,
          model: {
            ...state.model,
            [action.payload.param]: action.payload.value,
          },
        };
      case actionTypes.TOGGLE_CUSTOM_MODEL:
        return {
          ...state,
          model: {
            ...state.model,
            useCustomModel: !state.model.useCustomModel,
          },
        };
      case actionTypes.TOGGLE_ASPECT_RATIO_LOCK:
        return {
          ...state,
          model: {
            ...state.model,
            aspectRatioLocked: !state.model.aspectRatioLocked,
          },
        };
      case actionTypes.SET_PROMPT:
        return {
          ...state,
          prompt: action.value,
          // 如果有原始提示词参数，则设置原始提示词
          originalPrompt: action.originalPrompt !== undefined ? action.originalPrompt : state.originalPrompt,
        };
      case actionTypes.SET_NEGATIVE_PROMPT:
        return {
          ...state,
          negativePrompt: action.value,
        };
      case actionTypes.ADD_LORA:
        return {
          ...state,
          loras: [...state.loras, { model: '', weight: 0.8 }],
        };
      case actionTypes.UPDATE_LORA:
        return {
          ...state,
          loras: state.loras.map((lora, index) =>
            index === action.index
              ? { ...lora, [action.param]: action.value }
              : lora
          ),
        };
      case actionTypes.REMOVE_LORA:
        return {
          ...state,
          loras: state.loras.filter((_, index) => index !== action.index),
        };
      case actionTypes.SET_API_KEY:
        return {
          ...state,
          apiKey: action.payload,
        };
      case actionTypes.SET_IMAGE_DISPLAY_MODE:
        return {
          ...state,
          imageDisplayMode: action.payload,
        };
      case actionTypes.SET_IMAGE_MAX_HEIGHT:
        return {
          ...state,
          imageMaxHeight: action.payload,
        };
      case actionTypes.SET_BUTTON_SIZE:
        return {
          ...state,
          buttonWidth: action.width || state.buttonWidth,
          buttonHeight: action.height || state.buttonHeight,
        };
      case actionTypes.SET_GENERATING:
        return {
          ...state,
          isGenerating: action.payload,
        };
      case actionTypes.SET_ERROR:
        return {
          ...state,
          error: action.payload,
        };
      case actionTypes.UPDATE_STAMINA:
        return {
          ...state,
          stamina: {
            ...state.stamina,
            ...action.payload,
          },
        };
      case actionTypes.TOGGLE_UPSCALER:
        return {
          ...state,
          upscaler: {
            ...state.upscaler,
            enabled: !state.upscaler.enabled,
          },
        };
      case actionTypes.SET_UPSCALER_PARAM:
        return {
          ...state,
          upscaler: {
            ...state.upscaler,
            [action.param]: action.value,
          },
        };

      case actionTypes.SET_ACTIVE_TAB:
        return {
          ...state,
          activeTab: action.payload,
        };
      case actionTypes.TOGGLE_SETTINGS:
        return {
          ...state,
          showSettings: action.value !== undefined ? action.value : !state.showSettings,
        };
      case actionTypes.SET_ACTIVE_HEADER:
        return {
          ...state,
          activeHeader: action.payload,
        };
      case actionTypes.LOAD_SETTINGS:
        // 确保加载的设置中 loras 始终为有效数组
        const payload = action.payload || {};
        if (!payload.loras || !Array.isArray(payload.loras) || payload.loras.length === 0) {
          payload.loras = [...initialState.loras];
        }
        return {
          ...state,
          ...payload,
        };
      case actionTypes.ADD_TO_PROMPT:
        return {
          ...state,
          prompt: action.payload,
        };
      case actionTypes.UPDATE_LORAS:
        return {
          ...state,
          loras: action.payload,
        };
      case actionTypes.UPDATE_NOTEPAD_ENTRIES:
        return {
          ...state,
          notepadEntries: action.payload,
        };
      case actionTypes.TOGGLE_UI_STATE:
        return {
          ...state,
          uiState: {
            ...state.uiState,
            [action.payload.key]: action.payload.value,
          },
        };
      case actionTypes.TOGGLE_AUTO_FILL_PROMPT:
        return {
          ...state,
          autoFillPrompt: action.payload !== undefined ? action.payload : !state.autoFillPrompt,
        };
      default:
        return state;
    }
  } catch (error) {
    console.error('Error in drawingReducer:', error);
    return { ...state, error: error.message };
  }
}

// 创建 Context
const DrawingContext = createContext();

// Provider 组件
export function DrawingProvider({ children }) {
  const [state, dispatch] = useReducer(drawingReducer, initialState);
  const [staminaTimer, setStaminaTimer] = useState(null);

  // 在组件挂载时加载设置
  useEffect(() => {
    const loadStoredSettings = () => {
      try {
        const settings = loadSettingsFromStorage();
        if (settings) {
          // 确保 loras 始终为数组
          if (!settings.loras || !Array.isArray(settings.loras)) {
            settings.loras = [...initialState.loras];
          } else if (settings.loras.length === 0) {
            // 如果 loras 是空数组，添加初始值
            settings.loras = [...initialState.loras];
          }

          dispatch({
            type: actionTypes.LOAD_SETTINGS,
            payload: settings
          });
        }
      } catch (error) {
        console.error('加载设置出错:', error);
        dispatch({
          type: actionTypes.SET_ERROR,
          payload: '设置加载失败: ' + error.message
        });
      }
    };

    loadStoredSettings();
  }, []);

  // 保存设置到 localStorage (使用节流)
  useEffect(() => {
    // 状态变化时保存设置，使用节流避免频繁保存
    const timeoutId = setTimeout(() => {
      try {
        const settingsToSave = {
          model: state.model,
          loras: state.loras,
          prompt: state.prompt,
          negativePrompt: state.negativePrompt,
          apiKey: state.apiKey,
          imageDisplayMode: state.imageDisplayMode,
          imageMaxHeight: state.imageMaxHeight,
          buttonWidth: state.buttonWidth,
          buttonHeight: state.buttonHeight,
          stamina: state.stamina,
          upscaler: state.upscaler,
          activeHeader: state.activeHeader,
          autoFillPrompt: state.autoFillPrompt,
        };

        // 验证Lora - 严格检查模型ID格式
        const validLoras = settingsToSave.loras.filter(lora => {
          // 过滤掉没有模型ID的Lora
          if (!lora.model || lora.model.trim() === '') {
            return false;
          }

          // 检查模型ID格式 - 只允许纯数字ID或tensor.art链接
          const modelId = lora.model.trim();
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

        // 替换原始loras数组，确保不会为空数组
        if (validLoras.length > 0) {
          settingsToSave.loras = validLoras;
        } else {
          // 保留默认的 lora 结构
          settingsToSave.loras = [...initialState.loras];
        }

        saveSettingsToStorage(settingsToSave);
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [state]);

  // 监听图片最大高度变化，实时更新样式
  useEffect(() => {
    const updateImageStyle = (maxHeight) => {
      const styleId = 'jjdd-huatu-style';
      let styleElement = document.getElementById(styleId);

      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }

      const maxHeightValue = maxHeight || '40vh';
      styleElement.textContent = `
        .mes_img {
          max-height: ${maxHeightValue} !important;
        }
      `;
    };

    // 当图片最大高度变化时，立即更新样式
    updateImageStyle(state.imageMaxHeight);
  }, [state.imageMaxHeight]);

  // 从本地存储加载API密钥
  useEffect(() => {
    // 尝试从所有可能的存储位置获取API密钥
    let apiKey = null;

    // 1. 先尝试从主要存储位置获取
    const savedApiKey = localStorage.getItem('jjdd_api_key');
    if (savedApiKey) {
      apiKey = savedApiKey;
      console.log('从 jjdd_api_key 获取到API密钥');
    } else {
      // 2. 如果没有，尝试从设置中获取
      try {
        const settingsStr = localStorage.getItem('jjddHuatuSettings');
        if (settingsStr) {
          const settings = JSON.parse(settingsStr);
          if (settings.apiKey) {
            apiKey = settings.apiKey;
            console.log('从 jjddHuatuSettings 获取到API密钥');
            // 同步到主要存储位置
            localStorage.setItem('jjdd_api_key', apiKey);
          }
        }
      } catch (error) {
        console.warn('从设置中获取API密钥失败:', error);
      }

      // 3. 如果还是没有，尝试从旧的存储位置获取
      if (!apiKey) {
        const oldApiKey = localStorage.getItem('jjdd_huatu_api_key');
        if (oldApiKey) {
          apiKey = oldApiKey;
          console.log('从 jjdd_huatu_api_key 获取到API密钥');
          // 同步到主要存储位置
          localStorage.setItem('jjdd_api_key', apiKey);
        }
      }
    }

    // 如果找到了API密钥，设置并获取体力信息
    if (apiKey) {
      dispatch({ type: actionTypes.SET_API_KEY, payload: apiKey });
      // 获取体力信息
      fetchStaminaInfo(apiKey);

      // 输出调试信息
      const maskedApiKey = apiKey.substring(0, 5) + '...' + apiKey.substring(apiKey.length - 5);
      console.log(`成功加载API密钥: ${maskedApiKey}`);
    } else {
      console.log('未找到API密钥，需要用户手动设置');
    }
  }, []);

  // 获取体力信息
  const fetchStaminaInfo = async (apiKey) => {
    if (!apiKey) return null;

    dispatch({
      type: actionTypes.UPDATE_STAMINA,
      payload: {
        isLoading: true
      }
    });

    try {
      const result = await getApiKeyStamina(apiKey);

      if (result.success) {
        const staminaInfo = {
          used: result.usedStamina,
          total: result.totalStamina,
          lastUpdate: result.lastUpdate,
          isLoading: false
        };

        dispatch({
          type: actionTypes.UPDATE_STAMINA,
          payload: staminaInfo
        });

        return staminaInfo;
      } else {
        console.error('获取体力信息失败:', result.error);
        dispatch({
          type: actionTypes.UPDATE_STAMINA,
          payload: {
            isLoading: false
          }
        });
        throw new Error(result.error || '获取体力信息失败');
      }
    } catch (error) {
      console.error('获取体力信息时出错:', error);
      dispatch({
        type: actionTypes.UPDATE_STAMINA,
        payload: {
          isLoading: false
        }
      });
      throw error;
    }
  };

  // 打开绘图面板
  const openDrawingPanel = (tab = 'generate') => {
    dispatch({
      type: actionTypes.SET_ACTIVE_TAB,
      payload: tab
    });

    // 如果有API密钥，刷新体力信息
    if (state.apiKey) {
      fetchStaminaInfo(state.apiKey);
    }
  };

  // 关闭绘图面板
  const closeDrawingPanel = () => {
    dispatch({
      type: actionTypes.TOGGLE_SETTINGS,
      value: false
    });
  };

  // 切换标签页
  const switchTab = (tab) => {
    dispatch({
      type: actionTypes.SET_ACTIVE_TAB,
      payload: tab
    });

    // 如果切换到"使用技巧"标签页且有API密钥，刷新体力信息
    if (tab === 'tips' && state.apiKey) {
      fetchStaminaInfo(state.apiKey);
    }
  };

  // 更新体力信息
  const updateStaminaInfo = (staminaInfo) => {
    dispatch({
      type: actionTypes.UPDATE_STAMINA,
      payload: {
        ...staminaInfo,
        lastUpdate: new Date().toISOString()
      }
    });
  };

  // 手动刷新体力信息
  const refreshStamina = async (apiKey = null) => {
    const keyToUse = apiKey || state.apiKey;

    if (!keyToUse) {
      const error = new Error('没有有效的API密钥');
      dispatch({
        type: actionTypes.SET_ERROR,
        payload: error.message
      });
      throw error;
    }

    try {
      // 使用已经修复的getApiKeyStamina函数来获取体力信息
      dispatch({
        type: actionTypes.UPDATE_STAMINA,
        payload: {
          isLoading: true
        }
      });

      const result = await getApiKeyStamina(keyToUse);

      if (result.success) {
        const staminaInfo = {
          used: result.usedStamina,
          total: result.totalStamina,
          lastUpdate: result.lastUpdate,
          isLoading: false
        };

        dispatch({
          type: actionTypes.UPDATE_STAMINA,
          payload: staminaInfo
        });

        return staminaInfo;
      } else {
        throw new Error(result.error || '获取体力信息失败');
      }
    } catch (error) {
      console.error('刷新体力信息时出错:', error);
      dispatch({
        type: actionTypes.UPDATE_STAMINA,
        payload: {
          isLoading: false
        }
      });
      dispatch({
        type: actionTypes.SET_ERROR,
        payload: '刷新体力信息失败: ' + error.message
      });
      throw error;
    }
  };

  // 暴露的便捷操作方法
  const setModelParam = useCallback((param, value) => {
    dispatch({ type: actionTypes.SET_MODEL_PARAM, payload: { param, value } });
  }, []);

  const toggleCustomModel = useCallback(() => {
    dispatch({ type: actionTypes.TOGGLE_CUSTOM_MODEL });
  }, []);

  const toggleAspectRatioLock = useCallback(() => {
    dispatch({ type: actionTypes.TOGGLE_ASPECT_RATIO_LOCK });
  }, []);

  const setPrompt = useCallback((value) => {
    dispatch({ type: actionTypes.SET_PROMPT, value });
  }, []);

  const setNegativePrompt = useCallback((value) => {
    dispatch({ type: actionTypes.SET_NEGATIVE_PROMPT, value });
  }, []);

  const addLora = useCallback(() => {
    dispatch({ type: actionTypes.ADD_LORA });
  }, []);

  const updateLora = useCallback((index, param, value) => {
    if (param === 'model') {
      // 严格验证模型ID
      const result = processLoraInput(value);
      if (result.isValid) {
        dispatch({ type: actionTypes.UPDATE_LORA, index, param, value: result.value });
      } else if (value.trim() === '') {
        // 允许空值，方便用户清除输入
        dispatch({ type: actionTypes.UPDATE_LORA, index, param, value: '' });
      }
      // 对于其他无效值，不更新状态
    } else if (param === 'weight') {
      // 处理权重值，确保在有效范围内
      const processedWeight = processLoraWeight(value);
      dispatch({ type: actionTypes.UPDATE_LORA, index, param, value: processedWeight });
    } else {
      // 其他参数直接更新
      dispatch({ type: actionTypes.UPDATE_LORA, index, param, value });
    }
  }, []);

  const removeLora = useCallback((index) => {
    dispatch({ type: actionTypes.REMOVE_LORA, index });
  }, []);

  const setApiKey = useCallback((apiKey) => {
    dispatch({ type: actionTypes.SET_API_KEY, payload: apiKey });

    // 保存到本地存储
    if (apiKey) {
      // 保存到主要存储位置
      localStorage.setItem('jjdd_api_key', apiKey);

      // 同时保存到设置中，确保在不同位置都能获取到
      try {
        const settingsStr = localStorage.getItem('jjddHuatuSettings');
        if (settingsStr) {
          const settings = JSON.parse(settingsStr);
          settings.apiKey = apiKey;
          localStorage.setItem('jjddHuatuSettings', JSON.stringify(settings));
          console.log('已将API密钥保存到jjddHuatuSettings中');
        }
      } catch (error) {
        console.warn('将API密钥保存到jjddHuatuSettings失败:', error);
      }

      // 为了兼容性，也保存到旧的存储位置
      localStorage.setItem('jjdd_huatu_api_key', apiKey);

      // 获取体力信息
      fetchStaminaInfo(apiKey);
    } else {
      // 删除所有存储位置的API密钥
      localStorage.removeItem('jjdd_api_key');
      localStorage.removeItem('jjdd_huatu_api_key');

      // 从设置中删除API密钥
      try {
        const settingsStr = localStorage.getItem('jjddHuatuSettings');
        if (settingsStr) {
          const settings = JSON.parse(settingsStr);
          settings.apiKey = '';
          localStorage.setItem('jjddHuatuSettings', JSON.stringify(settings));
        }
      } catch (error) {
        console.warn('从设置中删除API密钥失败:', error);
      }

      // 清空体力信息
      dispatch({
        type: actionTypes.UPDATE_STAMINA,
        payload: {
          used: 0,
          total: 10000,
          lastUpdate: null,
          isLoading: false
        }
      });
    }
  }, []);

  const setImageDisplayMode = useCallback((value) => {
    dispatch({ type: actionTypes.SET_IMAGE_DISPLAY_MODE, payload: value });
  }, []);

  const setImageMaxHeight = useCallback((value) => {
    dispatch({ type: actionTypes.SET_IMAGE_MAX_HEIGHT, payload: value });
  }, []);

  const setButtonSize = useCallback((width, height) => {
    dispatch({ type: actionTypes.SET_BUTTON_SIZE, width, height });
  }, []);

  const setGenerating = useCallback((value) => {
    dispatch({ type: actionTypes.SET_GENERATING, payload: value });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: actionTypes.SET_ERROR, payload: error });
  }, []);

  const toggleUpscaler = useCallback(() => {
    dispatch({ type: actionTypes.TOGGLE_UPSCALER });
  }, []);

  const setUpscalerParam = useCallback((param, value) => {
    dispatch({ type: actionTypes.SET_UPSCALER_PARAM, param, value });
  }, []);



  const setActiveTab = useCallback((value) => {
    dispatch({ type: actionTypes.SET_ACTIVE_TAB, payload: value });
  }, []);

  const toggleSettings = useCallback((value) => {
    dispatch({ type: actionTypes.TOGGLE_SETTINGS, value });
  }, []);

  const setActiveHeader = useCallback((value) => {
    dispatch({ type: actionTypes.SET_ACTIVE_HEADER, payload: value });
  }, []);

  const addToPrompt = useCallback((text) => {
    const currentPrompt = state.prompt || '';
    const newPrompt = currentPrompt ? `${currentPrompt}, ${text}` : text;

    dispatch({
      type: actionTypes.SET_PROMPT,
      value: newPrompt
    });
  }, [state.prompt]);

  const updateLoras = useCallback((loras) => {
    dispatch({ type: actionTypes.UPDATE_LORAS, payload: loras });
  }, []);

  const updateNotepadEntries = useCallback((entries) => {
    dispatch({ type: actionTypes.UPDATE_NOTEPAD_ENTRIES, payload: entries });
  }, []);

  const toggleUiState = useCallback((key, value) => {
    dispatch({ type: actionTypes.TOGGLE_UI_STATE, payload: { key, value } });
  }, []);

  // 切换是否自动填充提示词
  const toggleAutoFillPrompt = useCallback((value) => {
    dispatch({ type: actionTypes.TOGGLE_AUTO_FILL_PROMPT, payload: value });
  }, []);

  // 加载设置函数
  const loadSettings = useCallback(() => {
    try {
      const settings = loadSettingsFromStorage();
      if (settings) {
        dispatch({
          type: actionTypes.LOAD_SETTINGS,
          payload: settings
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('加载设置出错:', error);
      dispatch({
        type: actionTypes.SET_ERROR,
        payload: '设置加载失败: ' + error.message
      });
      return false;
    }
  }, []);

  // 创建包含状态和操作的值对象
  const contextValue = {
    state,
    dispatch,
    actionTypes,
    // 直接导出loras数组以方便访问
    loras: state.loras || [],
    // 便捷操作方法
    setModelParam,
    toggleCustomModel,
    toggleAspectRatioLock,
    setPrompt,
    setNegativePrompt,
    addLora,
    updateLora,
    removeLora,
    setApiKey,
    setImageDisplayMode,
    setImageMaxHeight,
    setButtonSize,
    setGenerating,
    setError,
    updateStaminaInfo,
    refreshStamina,
    toggleUpscaler,
    setUpscalerParam,
    setActiveTab,
    toggleSettings,
    setActiveHeader,
    addToPrompt,
    updateLoras,
    updateNotepadEntries,
    toggleUiState,
    toggleAutoFillPrompt,
    loadSettings,
    openDrawingPanel,
    closeDrawingPanel,
    switchTab,
  };

  return (
    <DrawingContext.Provider value={contextValue}>
      {children}
    </DrawingContext.Provider>
  );
}

// 自定义 Hook 方便使用 Context
export function useDrawing() {
  const context = useContext(DrawingContext);
  if (!context) {
    throw new Error('useDrawing must be used within a DrawingProvider');
  }
  return context;
}

export default DrawingContext;