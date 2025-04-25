import React, { useState, useEffect } from 'react';
import { useDrawing } from '../contexts/DrawingContext';

/**
 * 调试面板组件
 * 用于显示和测试DrawingContext状态管理
 */
const DebugPanel = () => {
  const { state, setModelParam, toggleCustomModel, setPrompt, setNegativePrompt } = useDrawing();
  const [showDebug, setShowDebug] = useState(false);
  const [stateJson, setStateJson] = useState('');

  // 更新状态JSON显示
  useEffect(() => {
    setStateJson(JSON.stringify(state, null, 2));
  }, [state]);

  if (!showDebug) {
    return (
      <div className="debug-toggle">
        <button onClick={() => setShowDebug(true)} className="debug-toggle-button">
          显示调试面板
        </button>
      </div>
    );
  }

  return (
    <div className="debug-panel">
      <div className="debug-header">
        <h3>调试面板</h3>
        <button onClick={() => setShowDebug(false)}>关闭</button>
      </div>
      
      <div className="debug-controls">
        <h4>基本设置测试</h4>
        <div className="control-group">
          <label>宽度:</label>
          <input 
            type="number" 
            value={state.model.width} 
            onChange={(e) => setModelParam('width', parseInt(e.target.value) || 512)}
          />
        </div>
        
        <div className="control-group">
          <label>高度:</label>
          <input 
            type="number" 
            value={state.model.height} 
            onChange={(e) => setModelParam('height', parseInt(e.target.value) || 512)}
          />
        </div>
        
        <div className="control-group">
          <label>使用自定义模型:</label>
          <input 
            type="checkbox" 
            checked={state.model.useCustomModel} 
            onChange={toggleCustomModel}
          />
        </div>

        <div className="control-group">
          <label>正向提示词:</label>
          <textarea 
            value={state.prompt} 
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div className="control-group">
          <label>负向提示词:</label>
          <textarea 
            value={state.negativePrompt} 
            onChange={(e) => setNegativePrompt(e.target.value)}
          />
        </div>
      </div>

      <div className="debug-state">
        <h4>当前状态</h4>
        <pre>{stateJson}</pre>
      </div>

      <div className="debug-footer">
        <p>调试面板 v1.0 - 状态更新会自动保存到localStorage</p>
      </div>
    </div>
  );
};

export default DebugPanel; 