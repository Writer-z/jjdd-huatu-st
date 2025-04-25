import React, { useState, useEffect, useRef } from 'react';
import { useDrawing } from '../../../contexts/DrawingContext';
import ModelSelector from '../../ModelSelector/ModelSelector';
import LoraManager from '../../Lora/LoraManager';
import PromptInputs from '../../PromptInputs/PromptInputs';
import { validateNumberRange } from '../../../utils/validators';
import {
  validateAndProcessInput,
  adjustDimensions,
  showToast,
  showInputError,
  getFullModelParams
} from '../../../utils/paramProcessor';
import useDrawingEvents from '../../../hooks/useDrawingEvents';
import { getContext } from '../../../utils/sillyTavernIntegration';

/**
 * 生成标签页组件
 * 整合各个生成参数组件，根据截图实现UI界面
 */
function GenerateTab() {
  const { state, setModelParam } = useDrawing();
  const { model } = state;

  // Lora设置折叠状态
  const [loraExpanded, setLoraExpanded] = useState(true);

  // 添加强制渲染机制
  const [, forceUpdate] = useState({});

  // 组件挂载时强制一次渲染，确保Lora组件渲染正确
  useEffect(() => {
    // 短延时后强制更新，确保组件完全加载
    const timer1 = setTimeout(() => forceUpdate({}), 100);
    const timer2 = setTimeout(() => forceUpdate({}), 500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // 本地输入状态，用于控制输入框的值
  const [localInputs, setLocalInputs] = useState({
    width: model.width.toString(),
    height: model.height.toString(),
    count: model.count.toString(),
    steps: model.steps.toString(),
    cfgScale: model.cfgScale.toString(),
    seed: model.seed.toString(),
    clipSkip: model.clipSkip.toString(),
  });

  // 是否锁定尺寸，两者同步变化
  const [lockDimensions, setLockDimensions] = useState(false);

  // 维度更改标记
  const lastChangedDimension = useRef(null);

  const { handleGenerateButtonClick } = useDrawingEvents();

  // 切换Lora设置折叠状态
  const toggleLoraAccordion = () => {
    setLoraExpanded(!loraExpanded);
  };

  // 当model状态变化时更新本地输入状态
  useEffect(() => {
    setLocalInputs({
      width: model.width.toString(),
      height: model.height.toString(),
      count: model.count.toString(),
      steps: model.steps.toString(),
      cfgScale: model.cfgScale.toString(),
      seed: model.seed.toString(),
      clipSkip: model.clipSkip.toString(),
    });
  }, [model]);

  // 处理尺寸输入
  const handleDimensionChange = (param, value, inputElement) => {
    // 更新本地状态，允许输入任何值
    setLocalInputs(prev => ({
      ...prev,
      [param]: value
    }));

    // 特殊处理空值，允许完全删除输入框内容进行重新输入
    if (value === '') {
      return;
    }

    // 进行参数验证
    const min = 256;
    const max = param === 'width' ? 2300 : 3200;
    const result = validateAndProcessInput(value, 'numeric', {
      min,
      max,
      defaultValue: 512
    });

    // 如果输入无效，显示错误但不更改状态
    if (!result.isValid) {
      if (inputElement) {
        showInputError(inputElement, result.error);
      } else {
        showToast(result.error, 3000, true);
      }
      return;
    }

    // 记录最后更改的维度
    lastChangedDimension.current = param;

    let newWidth = param === 'width' ? result.value : model.width;
    let newHeight = param === 'height' ? result.value : model.height;

    // 如果锁定尺寸，则同步更新另一个维度
    if (lockDimensions) {
      const aspectRatio = model.width / model.height;
      if (param === 'width') {
        newHeight = Math.round(newWidth / aspectRatio);
        newHeight = Math.max(256, Math.min(3200, newHeight));
        setLocalInputs(prev => ({
          ...prev,
          height: newHeight.toString()
        }));
      } else {
        newWidth = Math.round(newHeight * aspectRatio);
        newWidth = Math.max(256, Math.min(2300, newWidth));
        setLocalInputs(prev => ({
          ...prev,
          width: newWidth.toString()
        }));
      }
    } else {
      // 解锁状态下不调用adjustDimensions，只检查各自的范围限制
      newWidth = Math.max(256, Math.min(2300, newWidth));
      newHeight = Math.max(256, Math.min(3200, newHeight));

      // 更新本地输入状态以反映范围限制后的值
      if (param === 'width' && newWidth !== result.value) {
        setLocalInputs(prev => ({
          ...prev,
          width: newWidth.toString()
        }));
      } else if (param === 'height' && newHeight !== result.value) {
        setLocalInputs(prev => ({
          ...prev,
          height: newHeight.toString()
        }));
      }
    }

    // 更新model状态
    if (param === 'width') {
      setModelParam('width', newWidth);
      if (lockDimensions) {
        setModelParam('height', newHeight);
      }
    } else {
      setModelParam('height', newHeight);
      if (lockDimensions) {
        setModelParam('width', newWidth);
      }
    }
  };

  // 处理数值参数变更
  const handleNumericChange = (param, value, inputElement) => {
    // 根据参数设置验证范围
    let min = 1, max = 9999;

    switch (param) {
      case 'count':
        min = 1;
        max = 4;
        break;
      case 'steps':
        min = 10;
        max = 60;
        break;
      case 'cfgScale':
        min = 1;
        max = 30;
        break;
      case 'seed':
        min = -1; // 允许-1作为特殊值(随机种子)
        max = Number.MAX_SAFE_INTEGER;
        break;
      case 'clipSkip':
        min = 1;
        max = 12;
        break;
      default:
        break;
    }

    // 更新本地状态
    setLocalInputs(prev => ({
      ...prev,
      [param]: value
    }));

    // 特殊处理空值
    if (value === '') {
      return;
    }

    // 验证并处理输入
    const result = validateAndProcessInput(value, 'numeric', {
      min,
      max,
      defaultValue: min
    });

    // 如果输入无效，显示错误
    if (!result.isValid) {
      if (inputElement) {
        showInputError(inputElement, result.error);
      } else {
        showToast(result.error, 3000, true);
      }
      return;
    }

    // 更新model状态
    setModelParam(param, result.value);
  };

  // 处理选择框变更
  const handleSelectChange = (param, value) => {
    setModelParam(param, value);
  };

  // 切换尺寸锁定
  const toggleDimensionLock = () => {
    setLockDimensions(!lockDimensions);
  };

  return (
    <div className="panel-container">
      {/* 模型选择器 */}
      <div className="input-group">
        <ModelSelector />
      </div>

      {/* 基本参数输入 */}
      <div className="params-group">
        <div className="grid-3">
          <div className="input-group">
            <label htmlFor="width">
              宽度:
              <button
                className="dimension-lock-btn"
                title={lockDimensions ? "解除宽高比锁定" : "锁定宽高比"}
                onClick={toggleDimensionLock}
              >
                <i className={`fa ${lockDimensions ? 'fa-lock' : 'fa-unlock'}`}></i>
              </button>
            </label>
            <input
              type="text"
              id="width"
              value={localInputs.width}
              onChange={(e) => handleDimensionChange('width', e.target.value, e.target)}
              onBlur={() => {
                // 当失去焦点时，如果为空则恢复model值
                if (localInputs.width === '') {
                  setLocalInputs(prev => ({
                    ...prev,
                    width: model.width.toString()
                  }));
                }
              }}
              placeholder="256-2300"
            />
          </div>
          <div className="input-group">
            <label htmlFor="height">高度:</label>
            <input
              type="text"
              id="height"
              value={localInputs.height}
              onChange={(e) => handleDimensionChange('height', e.target.value, e.target)}
              onBlur={() => {
                // 当失去焦点时，如果为空则恢复model值
                if (localInputs.height === '') {
                  setLocalInputs(prev => ({
                    ...prev,
                    height: model.height.toString()
                  }));
                }
              }}
              placeholder="256-3200"
            />
          </div>
          <div className="input-group">
            <label htmlFor="count">生成数量:</label>
            <input
              type="text"
              id="count"
              value={localInputs.count}
              onChange={(e) => handleNumericChange('count', e.target.value, e.target)}
              onBlur={() => {
                if (localInputs.count === '') {
                  setLocalInputs(prev => ({
                    ...prev,
                    count: model.count.toString()
                  }));
                }
              }}
              placeholder="1-4"
            />
          </div>
        </div>

        <div className="grid-3">
          <div className="input-group">
            <label htmlFor="steps">步数:</label>
            <input
              type="text"
              id="steps"
              value={localInputs.steps}
              onChange={(e) => handleNumericChange('steps', e.target.value, e.target)}
              onBlur={() => {
                if (localInputs.steps === '') {
                  setLocalInputs(prev => ({
                    ...prev,
                    steps: model.steps.toString()
                  }));
                }
              }}
              placeholder="10-60"
            />
          </div>
          <div className="input-group">
            <label htmlFor="cfgScale">CFG Scale:</label>
            <input
              type="text"
              id="cfgScale"
              value={localInputs.cfgScale}
              onChange={(e) => handleNumericChange('cfgScale', e.target.value, e.target)}
              onBlur={() => {
                if (localInputs.cfgScale === '') {
                  setLocalInputs(prev => ({
                    ...prev,
                    cfgScale: model.cfgScale.toString()
                  }));
                }
              }}
              placeholder="1-30"
            />
          </div>
          <div className="input-group">
            <label htmlFor="seed">种子:</label>
            <input
              type="text"
              id="seed"
              value={localInputs.seed}
              onChange={(e) => handleNumericChange('seed', e.target.value, e.target)}
              onBlur={() => {
                if (localInputs.seed === '') {
                  setLocalInputs(prev => ({
                    ...prev,
                    seed: model.seed.toString()
                  }));
                }
              }}
              placeholder="-1为随机"
            />
          </div>
        </div>

        <div className="grid-3">
          <div className="input-group">
            <label htmlFor="vae">VAE:</label>
            <select
              id="vae"
              value={model.vae}
              onChange={(e) => handleSelectChange('vae', e.target.value)}
            >
              <option value="ae.sft">ae.sft</option>
              <option value="Automatic">Automatic</option>
              <option value="None">None</option>
              <option value="vae-ft-mse-840000-ema-pruned.ckpt">vae-ft-mse-840000-ema-pruned</option>
              <option value="kl-f8-anime.ckpt">kl-f8-anime</option>
              <option value="kl-f8-anime2.ckpt">kl-f8-anime2</option>
              <option value="ClearVAE.safetensors">ClearVAE</option>
              <option value="cute_vae.safetensors">cute_vae</option>
              <option value="sdxl_vae.safetensors">sdxl_vae</option>
              <option value="sdxl-vae-fp16-fix.safetensors">sdxl-vae-fp16-fix</option>
              <option value="animevae.pt">animevae</option>
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="sampler">采样器:</label>
            <select
              id="sampler"
              value={model.sampler}
              onChange={(e) => handleSelectChange('sampler', e.target.value)}
            >
              <option value="Euler">Euler</option>
              <option value="Euler a">Euler a</option>
              <option value="DDIM">DDIM</option>
              <option value="DPM++ 2M">DPM++ 2M</option>
              <option value="DPM++ SDE">DPM++ SDE</option>
              <option value="DPM++ 2M SDE">DPM++ 2M SDE</option>
              <option value="DPM fast">DPM fast</option>
              <option value="DPM2 Karras">DPM2 Karras</option>
              <option value="DPM++ 2M Karras">DPM++ 2M Karras</option>
              <option value="DPM++ SDE Karras">DPM++ SDE Karras</option>
              <option value="DPM++ 2M SDE Karras">DPM++ 2M SDE Karras</option>
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="clipSkip">Clip Skip:</label>
            <input
              type="text"
              id="clipSkip"
              value={localInputs.clipSkip}
              onChange={(e) => handleNumericChange('clipSkip', e.target.value, e.target)}
              onBlur={() => {
                if (localInputs.clipSkip === '') {
                  setLocalInputs(prev => ({
                    ...prev,
                    clipSkip: model.clipSkip.toString()
                  }));
                }
              }}
              placeholder="1-12"
            />
          </div>
        </div>
      </div>

      {/* Lora设置 - 折叠面板 */}
      <div className="accordion">
        <div className="accordion-header" onClick={toggleLoraAccordion}>
          <div className="accordion-title">Lora 设置</div>
          <div className={`accordion-icon ${loraExpanded ? 'open' : ''}`}>▼</div>
        </div>
        <div className={`accordion-content ${loraExpanded ? 'open' : ''}`} style={{
          // 确保内容始终渲染，但根据折叠状态控制可见性
          display: 'block',
          height: loraExpanded ? 'auto' : '0',
          overflow: 'hidden',
          transition: 'height 0.3s ease',
          padding: loraExpanded ? '10px 0' : '0',
          opacity: loraExpanded ? '1' : '0'
        }}>
          <LoraManager />
        </div>
      </div>

      {/* 提示词输入 */}
      <PromptInputs />

      {/* Toast容器 */}
      <div id="jjdd-huatu-toast" className="jjdd-huatu-toast"></div>
    </div>
  );
}

export default GenerateTab;