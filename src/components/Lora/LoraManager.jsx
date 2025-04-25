import React, { useState, useEffect } from 'react';
import LoraEntry from './LoraEntry';
import { useDrawing } from '../../contexts/DrawingContext';
import { useNotepad } from '../../contexts/NotepadContext';
import { validateLoras, showToast, addLoraToPrompt } from '../../utils/paramProcessor';

/**
 * Lora管理器组件
 * 用于管理所有Lora条目
 */
function LoraManager() {
  const { state, loras, updateLoras, addToPrompt } = useDrawing();
  const notepad = useNotepad();
  
  // 确保loras是数组以防止错误
  const safeLoras = Array.isArray(loras) ? loras : (state && Array.isArray(state.loras) ? state.loras : []);
  
  // 添加状态来强制重新渲染
  const [renderKey, setRenderKey] = useState(Date.now());
  
  // 组件挂载时强制一次渲染
  useEffect(() => {
    // 初始强制渲染
    setTimeout(() => setRenderKey(Date.now()), 0);
    
    // 如果没有loras但state中有，则更新
    if ((!loras || loras.length === 0) && state?.loras?.length > 0) {
      updateLoras([...state.loras]);
    }
  }, []);
  
  // 添加新的Lora条目
  const handleAddLora = () => {
    const newLoras = [...safeLoras, { model: '', weight: 1 }];
    updateLoras(newLoras);
    // 添加后强制更新
    setTimeout(() => setRenderKey(Date.now()), 10);
  };

  // 从列表中移除Lora条目
  const handleRemoveLora = (index) => {
    const newLoras = safeLoras.filter((_, i) => i !== index);
    updateLoras(newLoras);
    // 删除后强制更新
    setTimeout(() => setRenderKey(Date.now()), 10);
  };

  // 更新特定Lora条目的属性
  const handleUpdateLora = (index, property, value) => {
    const newLoras = [...safeLoras];
    newLoras[index] = { ...newLoras[index], [property]: value };
    updateLoras(newLoras);
  };
  
  // 添加到记事本
  const handleAddToNotepad = (model) => {
    if (!model || typeof model !== 'string' || !model.trim()) {
      showToast('无法添加空的Lora模型到记事本', 3000, true);
      return;
    }
    
    try {
      const loraModel = model.trim();
      // 检查记事本中是否有空条目可以使用
      const entries = notepad.entries || [];
      let foundEmptyEntry = false;

      // 先遍历查找空的条目
      for (let i = 0; i < entries.length; i++) {
        if (!entries[i].value || entries[i].value.trim() === '') {
          // 找到空条目，更新它
          notepad.updateEntry(entries[i].id, {
            value: loraModel,
            category: 'Lora'
          });
          foundEmptyEntry = true;
          break;
        }
      }

      // 如果没有找到空条目，创建新条目
      if (!foundEmptyEntry) {
        notepad.addEntry({
          category: 'Lora',
          value: loraModel,
          trigger: ''
        });
      }

      showToast(`已添加 ${loraModel} 到记事本`, 2000, false);
    } catch (error) {
      console.error('添加Lora到记事本时出错:', error);
      showToast('添加Lora到记事本时出错', 3000, true);
    }
  };
  
  // 在提交前验证所有Lora
  const validateAllLoras = () => {
    const errors = validateLoras(safeLoras);
    if (errors.length > 0) {
      // 显示错误消息
      errors.forEach(error => {
        showToast(`错误: ${error}`, 3000, true);
      });
      return false;
    }
    return true;
  };

  // 确保始终有Lora条目显示，即使数组为空
  const displayLoras = safeLoras.length > 0 ? safeLoras : [{ model: '', weight: 1 }];

  return (
    <div className="lora-manager" key={`lora-manager-${renderKey}`}>
      <div className="lora-entries">
        {displayLoras.map((lora, index) => (
          <LoraEntry
            key={`lora-${index}-${renderKey}`} // 使用renderKey确保组件更新
            index={index}
            lora={lora}
            onUpdate={handleUpdateLora}
            onRemove={handleRemoveLora}
            onAddToNotepad={handleAddToNotepad}
          />
        ))}
      </div>
      <button 
        className="add-lora" 
        type="button"
        onClick={handleAddLora}
      >
        + 添加Lora
      </button>
    </div>
  );
}

export default LoraManager; 