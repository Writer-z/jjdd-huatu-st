import React, { Suspense } from 'react';

/**
 * 标签页内容组件
 * 用于渲染单个标签页内容，提供错误处理和加载状态
 * 
 * @param {Object} props 组件属性
 * @param {boolean} props.isActive 是否为活动标签页
 * @param {string} props.id 标签页ID
 * @param {React.ReactNode} props.children 标签页内容
 * @param {boolean} props.fallbackForEmpty 是否为未实现内容提供空白占位
 * @param {string} props.title 标签页标题，用于错误提示
 */
function TabContent({ isActive, id, children, fallbackForEmpty = false, title = '标签页' }) {
  // 如果标签页不是活动的，不渲染内容
  if (!isActive) {
    return null;
  }

  // 渲染标签页内容
  return (
    <div id={`${id}-tab`} className="tab-content active">
      <Suspense fallback={<div className="loading-placeholder">加载中...</div>}>
        {children || (fallbackForEmpty && (
          <div className="empty-tab-placeholder">
            <div className="placeholder-content">
              <h3>{title}功能正在开发中</h3>
              <p>此功能将在后续版本中实现，敬请期待！</p>
            </div>
          </div>
        ))}
      </Suspense>
    </div>
  );
}

export default TabContent; 