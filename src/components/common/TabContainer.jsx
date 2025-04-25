import React, { useState, useEffect } from 'react';
import TabButton from './TabButton.jsx';
import TabContent from './TabContent.jsx';

/**
 * 标签容器组件
 * 管理标签页系统，处理标签切换和内容显示
 * 
 * @param {Object} props 组件属性
 * @param {Array} props.tabs 标签页配置数组，每个项目包含{id, label, icon, content}
 * @param {string} props.activeTab 当前活动标签页ID
 * @param {Function} props.setActiveTab 设置活动标签页的回调函数
 * @param {string} props.className 额外的CSS类名
 */
function TabContainer({ tabs, activeTab, setActiveTab, className = '' }) {
  // 处理标签页点击
  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    
    // 保存到本地存储以便下次使用
    try {
      localStorage.setItem('jjdd_huatu_last_tab', tabId);
    } catch (e) {
      console.warn('无法保存最后使用的标签页:', e);
    }
  };

  // 组件挂载时，尝试从本地存储中恢复上次使用的标签页
  useEffect(() => {
    try {
      const lastTab = localStorage.getItem('jjdd_huatu_last_tab');
      if (lastTab && tabs.some(tab => tab.id === lastTab)) {
        setActiveTab(lastTab);
      }
    } catch (e) {
      console.warn('无法恢复上次使用的标签页:', e);
    }
  }, []);

  return (
    <div className={`tab-container ${className}`}>
      <div className="tab-buttons">
        {tabs.map(tab => (
          <TabButton
            key={tab.id}
            id={tab.id}
            label={tab.label}
            icon={tab.icon}
            isActive={activeTab === tab.id}
            onClick={() => handleTabClick(tab.id)}
          />
        ))}
      </div>
      <div className="tab-contents">
        {tabs.map(tab => (
          <TabContent
            key={tab.id}
            id={tab.id}
            isActive={activeTab === tab.id}
            title={tab.label}
            fallbackForEmpty={!tab.content}
          >
            {tab.content}
          </TabContent>
        ))}
      </div>
    </div>
  );
}

export default TabContainer; 