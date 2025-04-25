import React from 'react';

/**
 * 工作流标签页组件
 * 用于管理和运行预设的图像生成流程
 */
function WorkflowTab() {
  return (
    <div className="workflow-container">
      <div className="workflow-header">
        <h3>工作流画图待开发中...</h3>
      </div>
      
      <div className="workflow-image-container">
        <img 
          src="https://www.now61.com/f/Dzbpiq/IMG_20250412_163939.jpg" 
          alt="简简单单" 
          className="workflow-preview-image"
        />
        <div className="image-caption">
          暂时偷懒放一张图在这...
        </div>
      </div>
    </div>
  );
}

export default WorkflowTab; 