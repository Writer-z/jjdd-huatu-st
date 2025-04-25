import React from 'react';
import { useDrawing } from '../contexts/DrawingContext';
import ModelSelector from './ModelSelector/ModelSelector';
import BasicParamsInput from './ParamsInput/BasicParamsInput';
import AdvancedParamsInput from './ParamsInput/AdvancedParamsInput';
import LoraManager from './Lora/LoraManager';
import PromptInputs from './PromptInputs/PromptInputs';

/**
 * 生成参数标签页
 * 包含模型选择、参数设置、Lora管理和提示词输入等功能
 */
function GenerationTab() {
  const { state, dispatch } = useDrawing();

  // 切换Lora设置折叠面板
  const toggleLoraAccordion = () => {
    const accordionContent = document.querySelector('.accordion-content');
    const accordionIcon = document.querySelector('.accordion-icon');

    if (accordionContent.classList.contains('show')) {
      accordionContent.classList.remove('show');
      accordionIcon.classList.remove('rotated');
    } else {
      accordionContent.classList.add('show');
      accordionIcon.classList.add('rotated');
    }
  };

  return (
    <div className="generate-tab-container">
      {/* 模型选择区域 */}
      <div className="section">
        <h4 className="section-title">选择模型</h4>
        <ModelSelector />
      </div>

      {/* 基本参数设置 */}
      <div className="section">
        <h4 className="section-title">基本参数</h4>
        <BasicParamsInput />
      </div>

      {/* 高级参数设置 */}
      <div className="section">
        <h4 className="section-title">高级参数</h4>
        <AdvancedParamsInput />
      </div>

      {/* Lora设置 - 折叠面板 */}
      <div className="section accordion">
        <div className="accordion-header" onClick={toggleLoraAccordion}>
          <h4 className="section-title">Lora 设置</h4>
          <span className="accordion-icon">▼</span>
        </div>
        <div className="accordion-content">
          <LoraManager />
        </div>
      </div>

      {/* 提示词输入 */}
      <div className="section">
        <h4 className="section-title">提示词</h4>
        <PromptInputs />
      </div>

      {/* 底部链接和提示信息 */}
      <div className="section info-section">
        <ul className="info-links">
          <li><a href="https://github.com/Writer-z/jjdd-huatu-st" target="_blank" rel="noopener noreferrer">在 GitHub 发布问题</a></li>
          <li><a href="https://afdian.com/a/jjdd-huatu" target="_blank" rel="noopener noreferrer">联系开发者</a></li>
        </ul>
        <div className="api-notice">
          欢迎使用简简单单画图扩展~有任何问题都可以联系作者！
        </div>
      </div>
    </div>
  );
}

export default GenerationTab;