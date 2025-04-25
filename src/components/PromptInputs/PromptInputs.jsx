import React from 'react';
import { useDrawing } from '../../contexts/DrawingContext';
import './PromptInputs.css';

/**
 * 提示词输入组件
 * 包含正向提示词和负向提示词输入框，符合截图中的UI界面
 */
function PromptInputs({ onError }) {
  const { state, dispatch, actionTypes, toggleAutoFillPrompt } = useDrawing();

  // 更新正向提示词
  const handlePromptChange = (e) => {
    dispatch({
      type: actionTypes.SET_PROMPT,
      value: e.target.value
    });
  };

  // 更新负向提示词
  const handleNegativePromptChange = (e) => {
    dispatch({
      type: actionTypes.SET_NEGATIVE_PROMPT,
      value: e.target.value
    });
  };

  // 处理自动填充提示词开关状态变化
  const handleAutoFillPromptChange = (e) => {
    toggleAutoFillPrompt(e.target.checked);
  };

  return (
    <div className="prompt-inputs-container">
      <div className="prompt-group">
        <div className="prompt-header">
          <label htmlFor="positive-prompt">正向提示词:</label>
          <div className="auto-fill-toggle">
            <input
              type="checkbox"
              id="auto-fill-prompt"
              checked={state.autoFillPrompt}
              onChange={handleAutoFillPromptChange}
            />
            <label htmlFor="auto-fill-prompt">自动填充提示词</label>
          </div>
        </div>
        <textarea
          id="positive-prompt"
          className="prompt-textarea"
          placeholder="输入正向提示词"
          value={state.prompt}
          onChange={handlePromptChange}
          data-original-prompt={state.originalPrompt || ''}
          onFocus={(e) => {
            // 如果输入框为空且有原始提示词且自动填充开关已开启
            if (!e.target.value && e.target.dataset.originalPrompt && state.autoFillPrompt) {
              // 将原始提示词填充到输入框
              dispatch({
                type: actionTypes.SET_PROMPT,
                value: e.target.dataset.originalPrompt
              });
            }
          }}
        />
      </div>

      <div className="prompt-group">
        <label htmlFor="negative-prompt">负向提示词:</label>
        <textarea
          id="negative-prompt"
          className="prompt-textarea"
          placeholder="输入负向提示词"
          value={state.negativePrompt}
          onChange={handleNegativePromptChange}
        />
      </div>

      <div className="section info-section">
        <ul className="info-links">
          <li><a href="https://github.com/Writer-z/jjdd-huatu-st" target="_blank" rel="noopener noreferrer">在GitHub获取最新版本</a></li>
          <li><a href="https://afdian.com/a/jjdd-huatu" target="_blank" rel="noopener noreferrer">联系开发者</a></li>
        </ul>
        <div className="api-notice">
          欢迎使用简简单单画图扩展~有任何问题都可以联系作者！
        </div>
      </div>
    </div>
  );
}

export default PromptInputs;