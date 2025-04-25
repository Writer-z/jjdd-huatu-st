import React from 'react';
import { useDrawing } from '../../contexts/DrawingContext';

/**
 * 基本参数输入组件
 * 负责宽度、高度、生成数量、步数、CFG Scale和种子等基本参数
 */
function BasicParamsInput() {
  const { state, dispatch, actionTypes } = useDrawing();
  const { width, height, count, steps, cfgScale, seed } = state.model;

  // 更新参数
  const handleParamChange = (param, value) => {
    dispatch({
      type: actionTypes.SET_MODEL_PARAM,
      param,
      value: param === 'cfgScale' ? parseFloat(value) : parseInt(value, 10)
    });
  };

  return (
    <div className="basic-params-container">
      {/* 宽度和高度 */}
      <div className="params-row">
        <div className="param-group">
          <label htmlFor="width">宽度:</label>
          <input
            type="number"
            id="width"
            value={width}
            onChange={(e) => handleParamChange('width', e.target.value)}
            min="256"
            max="1024"
            step="64"
          />
        </div>

        <div className="param-group">
          <label htmlFor="height">高度:</label>
          <input
            type="number"
            id="height"
            value={height}
            onChange={(e) => handleParamChange('height', e.target.value)}
            min="256"
            max="1024"
            step="64"
          />
        </div>
      </div>

      {/* 生成数量 */}
      <div className="params-row">
        <div className="param-group">
          <label htmlFor="count">生成数量:</label>
          <input
            type="number"
            id="count"
            value={count}
            onChange={(e) => handleParamChange('count', e.target.value)}
            min="1"
            max="4"
            step="1"
          />
        </div>
      </div>

      {/* 步数 */}
      <div className="params-row">
        <div className="param-group">
          <label htmlFor="steps">步数:</label>
          <input
            type="number"
            id="steps"
            value={steps}
            onChange={(e) => handleParamChange('steps', e.target.value)}
            min="10"
            max="50"
            step="1"
          />
        </div>
      </div>

      {/* CFG Scale */}
      <div className="params-row">
        <div className="param-group">
          <label htmlFor="cfgScale">CFG Scale:</label>
          <input
            type="number"
            id="cfgScale"
            value={cfgScale}
            onChange={(e) => handleParamChange('cfgScale', e.target.value)}
            min="1"
            max="20"
            step="0.5"
          />
        </div>
      </div>

      {/* 种子 */}
      <div className="params-row">
        <div className="param-group">
          <label htmlFor="seed">种子:</label>
          <input
            type="number"
            id="seed"
            value={seed}
            onChange={(e) => handleParamChange('seed', e.target.value)}
            min="-1"
            step="1"
          />
        </div>
      </div>
    </div>
  );
}

export default BasicParamsInput; 