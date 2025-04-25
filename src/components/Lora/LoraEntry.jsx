import React, { useState, useEffect, useRef } from 'react';
import { processLoraWeight, showInputError } from '../../utils/paramProcessor';

/**
 * Lora条目组件
 * 用于单个Lora条目的显示和编辑，符合截图中的UI界面
 */
function LoraEntry({ index, lora = {}, onUpdate, onRemove, onAddToNotepad }) {
  // 安全获取lora属性，确保即使lora是undefined也不会报错
  const safeModel = lora?.model || '';
  const safeWeight = lora?.weight ?? 1;
  
  // 本地状态用于控制输入值
  const [localModel, setLocalModel] = useState(safeModel);
  const [localWeight, setLocalWeight] = useState(safeWeight.toString());
  
  // 创建ref引用以直接访问DOM元素
  const modelInputRef = useRef(null);
  const weightInputRef = useRef(null);
  
  // 添加状态强制渲染
  const [rendered, setRendered] = useState(true); // 默认为true，确保始终显示
  
  // 跟踪初始化状态，避免重复处理
  const initializedRef = useRef(false);
  
  // 直接从字符串中提取tensor.art ID的简单函数
  function extractTensorId(text) {
    if (!text) return null;
    
    // 尝试提取ID
    try {
      // 检查是否包含tensor.art/models/
      if (text.includes('tensor.art/models/')) {
        // 简单粗暴地提取数字ID
        const matches = text.match(/tensor\.art\/models\/(\d+)/i);
        if (matches && matches[1]) {
          return matches[1];
        }
      }
      
      // 检查是否就是纯数字ID
      if (/^\d+$/.test(text.trim())) {
        return text.trim();
      }
    } catch (error) {
      console.error('提取ID出错:', error);
    }
    
    return null;
  }
  
  // 只在组件挂载时执行一次初始化，而不是每次lora属性更新都执行
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      
      // 确保输入框有正确的值
      if (modelInputRef.current) {
        modelInputRef.current.value = safeModel;
      }
      
      if (weightInputRef.current) {
        weightInputRef.current.value = safeWeight.toString();
      }
      
      // 初始时尝试提取ID
      if (safeModel) {
        const extractedId = extractTensorId(safeModel);
        if (extractedId && extractedId !== safeModel) {
          setLocalModel(extractedId);
          onUpdate(index, 'model', extractedId);
        } else {
          setLocalModel(safeModel);
        }
      }
      
      setLocalWeight(safeWeight.toString());
    }
  }, []);
  
  // 处理模型输入变化
  const handleModelChange = (e) => {
    const value = e.target.value;
    
    // 先更新显示值
    setLocalModel(value);
    
    // 如果为空，直接清除
    if (!value.trim()) {
      onUpdate(index, 'model', '');
      return;
    }
    
    // 不在onChange中实时提取ID，避免频繁更新和渲染
    onUpdate(index, 'model', value);
  };
  
  // 处理失去焦点事件
  const handleModelBlur = () => {
    // 如果为空，直接清除
    if (!localModel.trim()) {
      setLocalModel('');
      onUpdate(index, 'model', '');
      return;
    }
    
    // 在失去焦点时尝试提取ID
    const extractedId = extractTensorId(localModel);
    if (extractedId) {
      // 更新本地状态和全局状态
      setLocalModel(extractedId);
      onUpdate(index, 'model', extractedId);
    } else if (modelInputRef.current) {
      // 无效输入，显示错误
      showInputError(modelInputRef.current, '请输入有效的数字ID或tensor.art链接');
    }
  };
  
  // 处理粘贴事件
  const handlePaste = (e) => {
    try {
      const pastedText = e.clipboardData.getData('text');
      
      // 尝试提取ID
      const extractedId = extractTensorId(pastedText);
      if (extractedId) {
        // 阻止默认粘贴行为
        e.preventDefault();
        // 立即更新本地状态和全局状态
        setLocalModel(extractedId);
        onUpdate(index, 'model', extractedId);
      }
    } catch (error) {
      console.error(`Lora ${index} 处理粘贴出错:`, error);
    }
  };

  // 更新Lora权重
  const handleWeightChange = (e) => {
    const value = e.target.value;
    
    // 更新本地显示
    setLocalWeight(value);
    
    // 如果输入为空，不更新全局状态
    if (value === '') return;
    
    // 不在onChange时进行严格验证，避免频繁报错
    // 只允许输入数字和小数点
    const numericValue = value.replace(/[^\d.-]/g, '');
    if (numericValue !== value) {
      setLocalWeight(numericValue);
    }
  };
  
  // 权重失去焦点事件
  const handleWeightBlur = () => {
    try {
      // 如果为空，设置默认值
      if (!localWeight.trim()) {
        const defaultValue = '1.0';
        setLocalWeight(defaultValue);
        onUpdate(index, 'weight', 1.0);
        return;
      }
      
      const numValue = parseFloat(localWeight);
      
      if (isNaN(numValue)) {
        // 无效数字，恢复到默认值
        setLocalWeight('1.0');
        onUpdate(index, 'weight', 1.0);
        if (weightInputRef.current) {
          showInputError(weightInputRef.current, '请输入有效的数字');
        }
        return;
      }
      
      // 验证范围并格式化为一位小数
      if (numValue < 0 || numValue > 2) {
        // 显示错误提示
        if (weightInputRef.current) {
          showInputError(weightInputRef.current, '权重必须在0到2之间');
        }
        
        // 将值限制在有效范围内
        const processedWeight = Math.max(0, Math.min(2, numValue));
        const formattedWeight = processedWeight.toFixed(1);
        setLocalWeight(formattedWeight);
        onUpdate(index, 'weight', parseFloat(formattedWeight));
      } else {
        // 格式化为一位小数
        const formattedWeight = numValue.toFixed(1);
        setLocalWeight(formattedWeight);
        onUpdate(index, 'weight', parseFloat(formattedWeight));
      }
    } catch (error) {
      console.error(`验证权重出错:`, error);
      setLocalWeight('1.0');
      onUpdate(index, 'weight', 1.0);
    }
  };

  return (
    <div 
      className="lora-entry" 
      data-index={index}
    >
      <div className="lora-entry-header">
        <div className="lora-number">Lora {index + 1}:</div>
        <button 
          className="delete-lora" 
          type="button"
          onClick={() => onRemove(index)}
        >
          ×
        </button>
      </div>
      <div className="lora-entry-content" style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: '10px' 
      }}>
        <div className="lora-input-container" style={{ 
          flex: '3',
          display: 'flex'
        }}>
          <input 
            ref={modelInputRef}
            type="text" 
            className="lora-model-input"
            placeholder="输入Lora模型名称"
            value={localModel}
            onChange={handleModelChange}
            onBlur={handleModelBlur}
            onPaste={handlePaste}
            style={{ 
              flex: '1',
              minWidth: '180px' 
            }}
          />
          <button 
            className="add-to-notepad" 
            type="button" 
            title="添加到记事本"
            onClick={() => onAddToNotepad(localModel)}
          >
            +N
          </button>
        </div>
        <div className="lora-weight-container" style={{ 
          flex: '1',
          display: 'flex',
          alignItems: 'center'
        }}>
          <label className="lora-weight-label" style={{ marginRight: '5px' }}>权重:</label>
          <input 
            ref={weightInputRef}
            type="text" 
            className="lora-weight-input"
            value={localWeight}
            onChange={handleWeightChange}
            onBlur={handleWeightBlur}
            placeholder="0-2"
            style={{ 
              width: '60px',
              flex: 'none'
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default LoraEntry; 