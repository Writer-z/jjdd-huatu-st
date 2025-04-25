import React, { useState, useEffect, useRef } from 'react';
import { useDrawing } from '../../../contexts/DrawingContext';
import { useNotepad } from '../../../contexts/NotepadContext';
import { validateNumberRange } from '../../../utils/validators';

/**
 * 记事本标签页组件
 * 参考gege-huatu设计，重新实现记事本功能
 */
function NotepadTab() {
  const { state, dispatch, actionTypes, setActiveTab, setPrompt, setModelParam, toggleCustomModel } = useDrawing();
  const notepad = useNotepad();
  const [error, setError] = useState(null);
  
  // 添加新条目
  const handleAddEntry = () => {
    try {
      // 创建一个新的空条目
      notepad.addEntry({
        category: '类别/说明',
        value: '',
        trigger: '',
      });
    } catch (err) {
      setError(`添加失败: ${err.message}`);
      setTimeout(() => setError(null), 3000);
    }
  };
  
  // 删除条目
  const handleDeleteEntry = (id) => {
    notepad.removeEntry(id);
  };

  // 添加到模型
  const handleAddToModel = (value) => {
    if (value && typeof value === 'string' && value.trim()) {
      // 设置自定义模型ID
      setModelParam('customModelId', value.trim());
      // 启用自定义模型
      toggleCustomModel();
      // 切换到生成参数标签页
      setActiveTab('generate');
    } else {
      setError("无法添加到模型：内容为空");
      setTimeout(() => setError(null), 3000);
    }
  };

  // 添加到Lora
  const handleAddToLora = (value) => {
    if (value && typeof value === 'string' && value.trim()) {
      const loras = [...state.loras];
      
      // 查找第一个空的Lora或添加新的
      let added = false;
      for (let i = 0; i < loras.length; i++) {
        if (!loras[i].model || !loras[i].model.trim()) {
          loras[i] = {...loras[i], model: value.trim()};
          added = true;
          break;
        }
      }
      
      // 如果没有找到空的，添加新的Lora
      if (!added) {
        loras.push({ model: value.trim(), weight: 0.8 });
      }
      
      // 更新Lora列表
      dispatch({
        type: actionTypes.UPDATE_LORAS,
        payload: loras
      });
      
      // 切换到生成参数标签页
      setActiveTab('generate');
    } else {
      setError("无法添加到Lora：内容为空");
      setTimeout(() => setError(null), 3000);
    }
  };

  // 添加到提示词
  const handleAddToPrompt = (value) => {
    if (value && typeof value === 'string' && value.trim()) {
      const currentPrompt = state.prompt ? state.prompt.trim() : '';
      const newPrompt = currentPrompt 
        ? `${currentPrompt}, ${value.trim()}` 
        : value.trim();
      
      setPrompt(newPrompt);
      // 切换到生成参数标签页
      setActiveTab('generate');
    } else {
      setError("无法添加到提示词：内容为空");
      setTimeout(() => setError(null), 3000);
    }
  };

  // 更新条目字段
  const handleUpdateEntry = (id, field, value) => {
    notepad.updateEntry(id, { [field]: value });
  };

  // 验证输入
  const validateInput = (value, type = 'text') => {
    if (type === 'numeric') {
      // 对于模型ID和数值类输入做简单验证
      return validateNumberRange(value, 0, Number.MAX_SAFE_INTEGER);
    }
    return { isValid: true, message: '', value };
  };

  // 创建表单引用以支持粘贴操作
  const handlePaste = (e, id, field) => {
    e.preventDefault();
    // 获取剪贴板中的文本
    const pastedText = e.clipboardData.getData('text');
    if (pastedText) {
      // 根据字段类型进行验证
      if (field === 'value') {
        const result = validateInput(pastedText, 'numeric');
        if (result.isValid) {
          handleUpdateEntry(id, field, result.value);
        }
      } else {
        handleUpdateEntry(id, field, pastedText);
      }
    }
  };

  return (
    <div className="notepad-container">
      {error && (
        <div className="notepad-error">
          {error}
          <button className="error-close" onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      <div className="notepad-header-controls">
        <button 
          className="notepad-add-button"
          onClick={handleAddEntry}
        >
          <i className="fas fa-plus"></i> 添加项目
        </button>
      </div>
      
      <div id="notepad-entries-container">
        {notepad.entries.length === 0 ? (
          <div className="empty-message">暂无记录，点击上方"添加项目"按钮创建</div>
        ) : (
          notepad.entries.map((entry, index) => (
            <div className="notepad-entry" key={entry.id || index}>
              <div className="entry-header">
                <div className="entry-number">{index + 1}</div>
                <div className="entry-actions">
                  <button 
                    className="add-to-model"
                    onClick={() => handleAddToModel(entry.value)}
                    title="添加到模型"
                  >
                    +M
                  </button>
                  <button 
                    className="add-to-lora"
                    onClick={() => handleAddToLora(entry.value)}
                    title="添加到Lora"
                  >
                    +L
                  </button>
                </div>
                <input 
                  type="text"
                  className="notepad-category-input"
                  placeholder="类别/说明"
                  value={entry.category || ''}
                  onChange={(e) => handleUpdateEntry(entry.id, 'category', e.target.value)}
                />
                <button 
                  className="add-to-prompt"
                  onClick={() => handleAddToPrompt(entry.trigger)}
                  title="添加到提示词"
                >
                  +P
                </button>
                <button 
                  className="delete-notepad"
                  onClick={() => handleDeleteEntry(entry.id)}
                  title="删除"
                >
                  ×
                </button>
              </div>
              <div className="entry-content">
                <input 
                  type="text"
                  className="notepad-numeric-input"
                  placeholder="输入数字内容"
                  value={entry.value || ''}
                  onChange={(e) => {
                    const result = validateInput(e.target.value, 'numeric');
                    if (result.isValid) {
                      handleUpdateEntry(entry.id, 'value', result.value);
                    }
                  }}
                  onPaste={(e) => handlePaste(e, entry.id, 'value')}
                />
                <input 
                  type="text"
                  className="notepad-trigger-input"
                  placeholder="触发词"
                  value={entry.trigger || ''}
                  onChange={(e) => handleUpdateEntry(entry.id, 'trigger', e.target.value)}
                  onPaste={(e) => handlePaste(e, entry.id, 'trigger')}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NotepadTab; 