import React from 'react';
import { useDrawing } from '../../contexts/DrawingContext';

/**
 * 参数输入组件
 * 包含宽度、高度、数量、步数、CFG Scale、种子、VAE、采样器和Clip Skip
 */
function ParamsInput({ onError }) {
  const { state, dispatch, actionTypes } = useDrawing();
  const { model } = state;

  // 处理参数变更
  const handleParamChange = (param, value) => {
    // 尝试将值转换为数字（如果适用）
    const numericParams = ['width', 'height', 'count', 'steps', 'cfgScale', 'seed', 'clipSkip'];
    const finalValue = numericParams.includes(param) ? Number(value) : value;
    
    dispatch({
      type: actionTypes.SET_MODEL_PARAM,
      param,
      value: finalValue
    });
  };

  return (
    <>
      {/* 基本参数分组 */}
      <div className="params-group">
        <div className="input-group">
          <label htmlFor="width">宽度:</label>
          <input 
            type="number" 
            id="width" 
            value={model.width}
            onChange={(e) => handleParamChange('width', e.target.value)}
          />
        </div>
        <div className="input-group">
          <label htmlFor="height">高度:</label>
          <input 
            type="number" 
            id="height" 
            value={model.height}
            onChange={(e) => handleParamChange('height', e.target.value)}
          />
        </div>
        <div className="input-group">
          <label htmlFor="count">生成数量:</label>
          <input 
            type="number" 
            id="count" 
            value={model.count}
            min="1" 
            max="20"
            onChange={(e) => handleParamChange('count', e.target.value)}
          />
        </div>
      </div>

      {/* 高级参数分组 */}
      <div className="params-group">
        <div className="input-group">
          <label htmlFor="steps">步数:</label>
          <input 
            type="number" 
            id="steps" 
            value={model.steps}
            onChange={(e) => handleParamChange('steps', e.target.value)}
          />
        </div>
        <div className="input-group">
          <label htmlFor="cfgScale">CFG Scale:</label>
          <input 
            type="number" 
            id="cfgScale" 
            value={model.cfgScale}
            onChange={(e) => handleParamChange('cfgScale', e.target.value)}
          />
        </div>
        <div className="input-group">
          <label htmlFor="seed">种子:</label>
          <input 
            type="number" 
            id="seed" 
            value={model.seed}
            placeholder="-1为随机"
            onChange={(e) => handleParamChange('seed', e.target.value)}
          />
        </div>
      </div>

      {/* VAE、采样器和Clip Skip */}
      <div className="params-group">
        <div className="input-group">
          <label htmlFor="sdVae">VAE:</label>
          <select 
            id="sdVae"
            value={model.vae}
            onChange={(e) => handleParamChange('vae', e.target.value)}
          >
            <option value="ae.sft">ae.sft</option>
            <option value="vae-ft-mse-840000-ema-pruned.ckpt">vae-ft-mse</option>
            <option value="kl-f8-anime2.ckpt">kl-f8-anime2</option>
            <option value="None">None</option>
          </select>
        </div>
        <div className="input-group">
          <label htmlFor="sampler">采样器:</label>
          <select 
            id="sampler"
            value={model.sampler}
            onChange={(e) => handleParamChange('sampler', e.target.value)}
          >
            <option value="Euler">Euler</option>
            <option value="Euler a">Euler a</option>
            <option value="DPM++ 2M">DPM++ 2M</option>
            <option value="DPM++ SDE">DPM++ SDE</option>
            <option value="UniPC">UniPC</option>
          </select>
        </div>
        <div className="input-group">
          <label htmlFor="clipSkip">Clip Skip:</label>
          <input 
            type="number" 
            id="clipSkip" 
            value={model.clipSkip}
            onChange={(e) => handleParamChange('clipSkip', e.target.value)}
          />
        </div>
      </div>
    </>
  );
}

export default ParamsInput; 