import React, { useState } from 'react';
import { useDrawing } from '../../contexts/DrawingContext';
import TabContainer from '../common/TabContainer.jsx';
import GenerateTab from './Tabs/GenerateTab.jsx';
import ParamsTab from './Tabs/ParamsTab.jsx';
import NotepadTab from './Tabs/NotepadTab.jsx';
import UpscaleTab from './Tabs/UpscaleTab.jsx';
import WorkflowTab from './Tabs/WorkflowTab.jsx';
import TipsTab from './Tabs/TipsTab.jsx';

/**
 * 标签页系统组件
 * 管理不同的功能标签页
 */
function TabSystem() {
  const { state, setActiveTab } = useDrawing();
  const { activeTab } = state;
  const [error, setError] = useState(null);

  // 切换标签页
  const handleTabChange = (tabId) => {
    try {
      setActiveTab(tabId);
      setError(null);
    } catch (err) {
      console.error('切换标签页出错:', err);
      setError(`切换标签页出错: ${err.message}`);
    }
  };

  // 标签页配置
  const tabs = [
    { 
      id: 'generate', 
      label: '生成参数', 
      content: <GenerateTab /> 
    },
    { 
      id: 'params', 
      label: '出图设置', 
      content: <ParamsTab /> 
    },
    { 
      id: 'notepad', 
      label: '记事本',
      content: <NotepadTab /> 
    },
    { 
      id: 'upscale', 
      label: '高清修复', 
      content: <UpscaleTab /> 
    },
    { 
      id: 'workflow', 
      label: '工作流', 
      content: <WorkflowTab /> 
    },
    { 
      id: 'tips', 
      label: '使用技巧', 
      content: <TipsTab /> 
    },
  ];

  return (
    <div className="tab-system">
      {/* 错误提示 */}
      {error && (
        <div className="tab-error-container">
          <div className="tab-error">{error}</div>
          <button 
            className="tab-error-close" 
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* 使用新的TabContainer组件 */}
      <TabContainer
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        className="drawing-tabs"
      />
    </div>
  );
}

export default TabSystem; 