import React, { createContext, useReducer, useContext, useEffect, useCallback } from 'react';
import { saveSettings as saveSettingsToStorage, loadSettings as loadSettingsFromStorage } from '../services/storage';
import { addLoraToPrompt, processLoraInput, processLoraWeight } from '../utils/paramProcessor';

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
  // API 和设置
  apiKey: '',
  imageDisplayMode: 'add',
  imageMaxHeight: '40vh',
  buttonWidth: 100,
  buttonHeight: 100,
  // 状态
  isGenerating: false,
  error: null,
  // 体力值
  stamina: {
    used: 0,
    total: 10000,
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
  // 滑动交互设置
  swipe: {
    timeoutMs: 3500,
    debugMode: false,
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
  SET_SWIPE_PARAM: 'SET_SWIPE_PARAM',
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  TOGGLE_SETTINGS: 'TOGGLE_SETTINGS',
  SET_ACTIVE_HEADER: 'SET_ACTIVE_HEADER',
  LOAD_SETTINGS: 'LOAD_SETTINGS',
  ADD_TO_PROMPT: 'ADD_TO_PROMPT',
  UPDATE_LORAS: 'UPDATE_LORAS',
  UPDATE_NOTEPAD_ENTRIES: 'UPDATE_NOTEPAD_ENTRIES',
  TOGGLE_UI_STATE: 'TOGGLE_UI_STATE',
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
          prompt: action.payload,
        };
      case actionTypes.SET_NEGATIVE_PROMPT:
        return {
          ...state,
          negativePrompt: action.payload,
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
      case actionTypes.SET_SWIPE_PARAM:
        return {
          ...state,
          swipe: {
            ...state.swipe,
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
          showSettings: action.payload !== undefined ? action.payload : !state.showSettings,
        };
      case actionTypes.SET_ACTIVE_HEADER:
        return {
          ...state,
          activeHeader: action.payload,
        };
      case actionTypes.LOAD_SETTINGS:
        return {
          ...state,
          ...(action.payload || {}),
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

  // 在组件挂载时加载设置
  useEffect(() => {
    const loadStoredSettings = () => {
      try {
        const settings = loadSettingsFromStorage();
        if (settings) {
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
          swipe: state.swipe,
          activeHeader: state.activeHeader,
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
        
        // 替换原始loras数组
        settingsToSave.loras = validLoras;
        
        saveSettingsToStorage(settingsToSave);
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [state]);

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
    dispatch({ type: actionTypes.SET_PROMPT, payload: value });
  }, []);

  const setNegativePrompt = useCallback((value) => {
    dispatch({ type: actionTypes.SET_NEGATIVE_PROMPT, payload: value });
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

  const setApiKey = useCallback((value) => {
    dispatch({ type: actionTypes.SET_API_KEY, payload: value });
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

  const updateStamina = useCallback((staminaInfo) => {
    dispatch({ type: actionTypes.UPDATE_STAMINA, payload: staminaInfo });
  }, []);

  const toggleUpscaler = useCallback(() => {
    dispatch({ type: actionTypes.TOGGLE_UPSCALER });
  }, []);

  const setUpscalerParam = useCallback((param, value) => {
    dispatch({ type: actionTypes.SET_UPSCALER_PARAM, param, value });
  }, []);

  const setSwipeParam = useCallback((param, value) => {
    dispatch({ type: actionTypes.SET_SWIPE_PARAM, param, value });
  }, []);

  const setActiveTab = useCallback((value) => {
    dispatch({ type: actionTypes.SET_ACTIVE_TAB, payload: value });
  }, []);

  const toggleSettings = useCallback((value) => {
    dispatch({ type: actionTypes.TOGGLE_SETTINGS, payload: value });
  }, []);

  const setActiveHeader = useCallback((value) => {
    dispatch({ type: actionTypes.SET_ACTIVE_HEADER, payload: value });
  }, []);

  const addToPrompt = useCallback((newPrompt) => {
    dispatch({ type: actionTypes.ADD_TO_PROMPT, payload: newPrompt });
  }, []);

  const updateLoras = useCallback((loras) => {
    dispatch({ type: actionTypes.UPDATE_LORAS, payload: loras });
  }, []);

  const updateNotepadEntries = useCallback((entries) => {
    dispatch({ type: actionTypes.UPDATE_NOTEPAD_ENTRIES, payload: entries });
  }, []);

  const toggleUiState = useCallback((key, value) => {
    dispatch({ type: actionTypes.TOGGLE_UI_STATE, payload: { key, value } });
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
    updateStamina,
    toggleUpscaler,
    setUpscalerParam,
    setSwipeParam,
    setActiveTab,
    toggleSettings,
    setActiveHeader,
    addToPrompt,
    updateLoras,
    updateNotepadEntries,
    toggleUiState,
    loadSettings,
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