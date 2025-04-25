import React, { useState, useEffect, useRef } from 'react';
import { useDrawing } from '../../../contexts/DrawingContext';
import { validateNumberRange } from '../../../utils/validators';

/**
 * 高清修复标签页组件
 * 用于图像放大和优化
 */
function UpscaleTab() {
  const { state, toggleUpscaler, setUpscalerParam } = useDrawing();
  const { upscaler } = state;

  // 本地输入状态管理
  const [localInputs, setLocalInputs] = useState({
    resizeX: upscaler.resizeX,
    resizeY: upscaler.resizeY,
    steps: upscaler.steps,
    denoisingStrength: upscaler.denoisingStrength
  });

  // 输入错误状态管理
  const [inputErrors, setInputErrors] = useState({
    resizeX: null,
    resizeY: null,
    steps: null,
    denoisingStrength: null
  });

  // 添加宽高比锁定状态
  const [lockDimensions, setLockDimensions] = useState(false);

  // 维度更改标记
  const lastChangedDimension = useRef(null);

  // 当上层状态变化时更新本地状态
  useEffect(() => {
    setLocalInputs({
      resizeX: upscaler.resizeX,
      resizeY: upscaler.resizeY,
      steps: upscaler.steps,
      denoisingStrength: upscaler.denoisingStrength
    });
  }, [upscaler]);

  // 切换高清修复功能
  const handleToggleUpscaler = () => {
    toggleUpscaler();
  };

  // 切换尺寸锁定
  const toggleDimensionLock = () => {
    setLockDimensions(!lockDimensions);
  };

  // 处理输入框变更
  const handleInputChange = (param, value) => {
    // 更新本地输入状态
    setLocalInputs(prev => ({
      ...prev,
      [param]: value
    }));

    // 清除相关错误
    setInputErrors(prev => ({
      ...prev,
      [param]: null
    }));
  };

  // 验证并应用数值参数
  const validateAndApplyParam = (param, value) => {
    // 允许空值输入
    if (value === '') {
      return;
    }

    // 将值转换为数字
    const numValue = Number(value);

    // 根据不同参数执行验证
    let validationResult;

    switch (param) {
      case 'resizeX':
        validationResult = validateNumberRange(numValue, 512, 2300, '目标宽度');
        break;
      case 'resizeY':
        validationResult = validateNumberRange(numValue, 512, 3200, '目标高度');
        break;
      case 'steps':
        validationResult = validateNumberRange(numValue, 10, 60, '步数');
        break;
      case 'denoisingStrength':
        validationResult = validateNumberRange(numValue, 0.0, 1.0, '降噪强度');
        break;
      default:
        validationResult = { isValid: true, error: null };
    }

    // 更新错误状态
    setInputErrors(prev => ({
      ...prev,
      [param]: validationResult.error
    }));

    // 如果验证通过，则应用参数
    if (validationResult.isValid) {
      setUpscalerParam(param, numValue);
    }
  };

  // 处理输入框失焦事件
  const handleInputBlur = (param, value) => {
    validateAndApplyParam(param, value);

    // 如果是尺寸参数且锁定开启，则进行宽高比维护
    if ((param === 'resizeX' || param === 'resizeY') && value !== '' && lockDimensions) {
      handleMaintainAspectRatio(param, value);
    }
  };

  // 处理尺寸输入变更，包含锁定宽高比的逻辑
  const handleDimensionChange = (param, value) => {
    // 更新本地状态
    handleInputChange(param, value);

    // 特殊处理空值
    if (value === '') {
      return;
    }

    // 记录最后更改的维度
    lastChangedDimension.current = param;

    // 进行参数验证
    const min = 512;
    const max = param === 'resizeX' ? 2300 : 3200;

    // 验证数值范围
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < min || numValue > max) {
      return; // 等待失焦时进行验证和错误提示
    }

    // 在锁定状态下才维持宽高比
    if (lockDimensions) {
      const currentWidth = upscaler.resizeX || 1024;
      const currentHeight = upscaler.resizeY || 1024;
      const aspectRatio = currentWidth / currentHeight;

      if (param === 'resizeX') {
        // 如果改变宽度，则根据宽高比调整高度
        const newHeight = Math.round(numValue / aspectRatio);
        const validHeight = Math.max(512, Math.min(3200, newHeight));
        handleInputChange('resizeY', validHeight.toString());
        // 暂不更新全局状态，等待失焦时更新
      } else {
        // 如果改变高度，则根据宽高比调整宽度
        const newWidth = Math.round(numValue * aspectRatio);
        const validWidth = Math.max(512, Math.min(2300, newWidth));
        handleInputChange('resizeX', validWidth.toString());
        // 暂不更新全局状态，等待失焦时更新
      }
    }
  };

  // 维持宽高比例 (用于失焦时更新全局状态)
  const handleMaintainAspectRatio = (changedParam, value) => {
    if (!upscaler.enabled) return;

    const numValue = Number(value);
    if (isNaN(numValue) || numValue <= 0) return;

    // 获取当前有效的宽高值
    const currentWidth = upscaler.resizeX || 1024;
    const currentHeight = upscaler.resizeY || 1024;

    // 计算当前宽高比
    const aspectRatio = currentWidth / currentHeight;

    if (changedParam === 'resizeX') {
      // 如果改变宽度，则根据宽高比调整高度
      const newHeight = Math.round(numValue / aspectRatio);
      const validHeight = Math.max(512, Math.min(3200, newHeight));
      handleInputChange('resizeY', validHeight.toString());
      setUpscalerParam('resizeY', validHeight);
    } else {
      // 如果改变高度，则根据宽高比调整宽度
      const newWidth = Math.round(numValue * aspectRatio);
      const validWidth = Math.max(512, Math.min(2300, newWidth));
      handleInputChange('resizeX', validWidth.toString());
      setUpscalerParam('resizeX', validWidth);
    }
  };

  return (
    <div className="upscale-container">
      <div className="upscale-header">
        <h3>高清修复</h3>
        <div className="upscale-toggle">
          <label className="switch">
            <input
              type="checkbox"
              checked={upscaler.enabled}
              onChange={handleToggleUpscaler}
            />
            <span className="slider"></span>
          </label>
          <span>启用高清修复</span>
        </div>
      </div>

      <div className={`upscale-settings ${!upscaler.enabled ? 'disabled' : ''}`}>
        <div className="input-group">
          <label htmlFor="upscaler-model">放大模型</label>
          <select
            id="upscaler-model"
            value={upscaler.model}
            onChange={(e) => setUpscalerParam('model', e.target.value)}
            disabled={!upscaler.enabled}
          >
            <option value="4x-UltraSharp">4x-UltraSharp</option>
            <option value="4x-AnimeSharp">4x-AnimeSharp</option>
            <option value="SwinIR_4x">SwinIR_4x</option>
            <option value="ESRGAN_4x">ESRGAN_4x</option>
            <option value="R-ESRGAN 4x+">R-ESRGAN 4x+</option>
            <option value="R-ESRGAN 4x+ Anime6B">R-ESRGAN 4x+ Anime6B</option>
            <option value="4x_foolhardy_Remacri">4x_foolhardy_Remacri</option>
            <option value="4x_NMKD-Siax_200k">4x_NMKD-Siax_200k</option>
            <option value="4x_NMKD-Superscale-SP_178000_G">4x_NMKD-Superscale-SP</option>
            <option value="8x_NMKD-Superscale_150000_G">8x_NMKD-Superscale</option>
            <option value="Latent">Latent</option>
          </select>
        </div>

        <div className="params-grid">
          <div className="input-group">
            <label htmlFor="resize-x">
              目标宽度:
              <button
                className="dimension-lock-btn"
                title={lockDimensions ? "解除宽高比锁定" : "锁定宽高比"}
                onClick={toggleDimensionLock}
                disabled={!upscaler.enabled}
              >
                <i className={`fa ${lockDimensions ? 'fa-lock' : 'fa-unlock'}`}></i>
              </button>
            </label>
            <input
              type="text"
              id="resize-x"
              value={localInputs.resizeX}
              onChange={(e) => handleDimensionChange('resizeX', e.target.value)}
              onBlur={(e) => handleInputBlur('resizeX', e.target.value)}
              disabled={!upscaler.enabled}
              placeholder="512-2300"
            />
            {inputErrors.resizeX && (
              <div className="input-error">{inputErrors.resizeX}</div>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="resize-y">目标高度</label>
            <input
              type="text"
              id="resize-y"
              value={localInputs.resizeY}
              onChange={(e) => handleDimensionChange('resizeY', e.target.value)}
              onBlur={(e) => handleInputBlur('resizeY', e.target.value)}
              disabled={!upscaler.enabled}
              placeholder="512-3200"
            />
            {inputErrors.resizeY && (
              <div className="input-error">{inputErrors.resizeY}</div>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="upscale-steps">步数</label>
            <input
              type="text"
              id="upscale-steps"
              value={localInputs.steps}
              onChange={(e) => handleInputChange('steps', e.target.value)}
              onBlur={(e) => handleInputBlur('steps', e.target.value)}
              disabled={!upscaler.enabled}
              placeholder="10-60"
            />
            {inputErrors.steps && (
              <div className="input-error">{inputErrors.steps}</div>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="denoising-strength">降噪强度</label>
            <input
              type="text"
              id="denoising-strength"
              value={localInputs.denoisingStrength}
              onChange={(e) => handleInputChange('denoisingStrength', e.target.value)}
              onBlur={(e) => handleInputBlur('denoisingStrength', e.target.value)}
              disabled={!upscaler.enabled}
              placeholder="0.0-1.0"
            />
            {inputErrors.denoisingStrength && (
              <div className="input-error">{inputErrors.denoisingStrength}</div>
            )}
          </div>
        </div>

        <div className="upscale-description">
          <p>高清修复将在图像生成后自动应用，可能会增加排队等待和处理时间</p>
        </div>

        <div className="upscale-tips">
          <h4>使用提示</h4>
          <ul>
            <li>点击宽度旁的锁头图标可锁定/解锁宽高比</li>
            <li>降噪强度越大，修复的创造性越强，但可能偏离原图</li>
            <li>步数越多，效果越好，但处理时间也越长</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default UpscaleTab;