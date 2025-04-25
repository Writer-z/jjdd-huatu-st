import React, { useState, useRef } from 'react';
import { useDrawing } from '../../contexts/DrawingContext';
import { useNotepad } from '../../contexts/NotepadContext';
import { processModelInput, showInputError, showToast, getFullModelParams } from '../../utils/paramProcessor';
import { testApiKey } from '../../services/api';

/**
 * 模型选择器组件
 * 支持预设模型和自定义模型ID输入，符合截图中的UI界面
 */
function ModelSelector({ onError }) {
  const { state, dispatch, actionTypes } = useDrawing();
  const { model, upscaler } = state;
  const notepad = useNotepad();
  const customModelInputRef = useRef(null);
  const [isTesting, setIsTesting] = useState(false);

  // 预设模型列表
  const presetModels = [
    { value: "", label: "请选择模型" },
    { value: "802157190875069619", label: "FLUX-kg_09" },
    { value: "773719306170204263", label: "FLUX-XIZ" },
    { value: "755422449136357169", label: "SD3-Mccc" },
    { value: "748070388543653861", label: "可图" },
    { value: "797033333545650793", label: "SD3.5L-Rolo_hu" },
    { value: "784137028519452011", label: "Pony-WAI0731" },
    { value: "785591093992441279", label: "Pony 3D" },
    { value: "787353065419253689", label: "SDXL" }
  ];

  // 切换自定义模型
  const toggleCustomModel = () => {
    dispatch({ type: actionTypes.TOGGLE_CUSTOM_MODEL });
  };

  // 处理模型选择变更
  const handleModelChange = (e) => {
    dispatch({
      type: actionTypes.SET_MODEL_PARAM,
      payload: { param: 'selectedModel', value: e.target.value }
    });
  };

  // 处理自定义模型ID输入
  const handleCustomModelIdChange = (e) => {
    const value = e.target.value;
    dispatch({
      type: actionTypes.SET_MODEL_PARAM,
      payload: { param: 'customModelId', value }
    });
  };

  // 处理自定义模型输入框失去焦点事件
  const handleCustomModelIdBlur = () => {
    if (!model.customModelId.trim()) return;
    
    const result = processModelInput(model.customModelId);
    if (result.isValid) {
      if (result.value !== model.customModelId) {
        // 如果提取出的ID与输入不同（说明是URL），更新显示
        dispatch({
          type: actionTypes.SET_MODEL_PARAM,
          payload: { param: 'customModelId', value: result.value }
        });
      }
    } else {
      // 显示错误提示
      if (customModelInputRef.current) {
        showInputError(customModelInputRef.current, '请输入有效的模型ID或tensor.art链接');
      }
    }
  };

  // 添加到记事本
  const addToNotepad = () => {
    // 获取当前的模型ID值
    let modelId = '';
    if (model.useCustomModel) {
      modelId = model.customModelId.trim();
    } else {
      modelId = model.selectedModel ? model.selectedModel.trim() : '';
    }

    // 验证模型ID不为空
    if (!modelId) {
      showToast('没有可保存的模型ID', 3000, true);
      return;
    }

    // 检查记事本中是否有空条目可以使用
    const entries = notepad.entries || [];
    let foundEmptyEntry = false;

    // 先遍历查找空的条目
    for (let i = 0; i < entries.length; i++) {
      if (!entries[i].value || entries[i].value.trim() === '') {
        // 找到空条目，更新它
        notepad.updateEntry(entries[i].id, {
          value: modelId,
          category: '模型ID'
        });
        foundEmptyEntry = true;
        break;
      }
    }

    // 如果没有找到空条目，创建新条目
    if (!foundEmptyEntry) {
      notepad.addEntry({
        category: '模型ID',
        value: modelId,
        trigger: ''
      });
    }

    showToast('已保存模型ID到记事本', 2000);
  };

  // 头部按钮组，包含API密钥、刷新体力和清空选择等按钮
  const TopButtons = ({ apiKey, onOpenApiKey, onRefreshStamina, onClearModel }) => {
    return (
      <div className="model-selector-buttons">
        <button
          className="set-api-key-button"
          onClick={onOpenApiKey}
          title="设置API密钥"
        >
          API密钥
        </button>
        {apiKey && (
          <button
            className="refresh-stamina-button"
            onClick={onRefreshStamina}
            title="刷新体力值信息"
          >
            刷新体力
          </button>
        )}
        <button
          className="clear-model-button"
          onClick={onClearModel}
          title="清空当前选择的模型"
        >
          清空选择
        </button>
      </div>
    );
  };

  return (
    <div className="model-selector">
      <div className="model-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '10px' 
      }}>
        <label style={{ marginRight: '10px' }}>选择模型:</label>
        <div className="model-toggle" style={{ 
          display: 'flex', 
          alignItems: 'center'
        }}>
          <label className="switch" style={{ marginRight: '5px' }}>
            <input 
              type="checkbox" 
              checked={model.useCustomModel}
              onChange={toggleCustomModel}
            />
            <span className="slider"></span>
          </label>
          <label className="toggle-label">使用自定义模型</label>
        </div>
      </div>
      
      <div className="model-input-container">
        {!model.useCustomModel ? (
          <div id="model-select-container">
            <select 
              id="Modelname"
              value={model.selectedModel}
              onChange={handleModelChange}
              style={{ width: '100%' }}
            >
              {presetModels.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div id="custom-model-container" className="input-with-button">
            <input 
              ref={customModelInputRef}
              type="text" 
              id="sdModel"
              placeholder="输入模型ID或网址链接"
              value={model.customModelId}
              onChange={handleCustomModelIdChange}
              onBlur={handleCustomModelIdBlur}
              style={{ width: 'calc(100% - 40px)' }}
            />
            <button 
              className="add-to-notepad" 
              type="button"
              title="添加到记事本"
              onClick={addToNotepad}
            >
              +N
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ModelSelector; 