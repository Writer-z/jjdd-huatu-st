import React from 'react';
import { useDrawing } from '../../contexts/DrawingContext';

/**
 * 高级参数输入组件
 * 负责VAE、采样器和Clip Skip等高级参数
 */
function AdvancedParamsInput() {
  const { state, dispatch, actionTypes } = useDrawing();
  const { vae, sampler, clipSkip } = state.model;

  // 更新参数
  const handleParamChange = (param, value) => {
    dispatch({
      type: actionTypes.SET_MODEL_PARAM,
      param,
      value: param === 'clipSkip' ? parseInt(value, 10) : value
    });
  };

  // VAE选项
  const vaeOptions = [
    { value: 'ae.sft', label: 'ae.sft' },
    { value: 'vae-ft-mse', label: 'vae-ft-mse' },
    { value: 'kl-f8-anime2', label: 'kl-f8-anime2' },
    { value: 'None', label: 'None' }
  ];

  // 采样器选项
  const samplerOptions = [
    { value: 'Euler', label: 'Euler' },
    { value: 'Euler a', label: 'Euler a' },
    { value: 'DPM++ 2M Karras', label: 'DPM++ 2M Karras' },
    { value: 'DPM++ SDE Karras', label: 'DPM++ SDE Karras' },
    { value: 'UniPC', label: 'UniPC' }
  ];

  return (
    <div className="advanced-params-container">
      {/* VAE选择 */}
      <div className="params-row">
        <div className="param-group">
          <label htmlFor="vae">VAE:</label>
          <select
            id="vae"
            value={vae}
            onChange={(e) => handleParamChange('vae', e.target.value)}
          >
            {vaeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 采样器 */}
      <div className="params-row">
        <div className="param-group">
          <label htmlFor="sampler">采样器:</label>
          <select
            id="sampler"
            value={sampler}
            onChange={(e) => handleParamChange('sampler', e.target.value)}
          >
            {samplerOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clip Skip */}
      <div className="params-row">
        <div className="param-group">
          <label htmlFor="clipSkip">Clip Skip:</label>
          <input
            type="number"
            id="clipSkip"
            value={clipSkip}
            onChange={(e) => handleParamChange('clipSkip', e.target.value)}
            min="1"
            max="2"
            step="1"
          />
        </div>
      </div>
    </div>
  );
}

export default AdvancedParamsInput; 