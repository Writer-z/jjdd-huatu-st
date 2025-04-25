import React from 'react';

/**
 * 标签页按钮组件
 * 用于渲染单个标签页按钮
 * 
 * @param {Object} props 组件属性
 * @param {string} props.id 标签页ID
 * @param {string} props.label 标签页标签文本
 * @param {boolean} props.isActive 是否为活动标签页
 * @param {Function} props.onClick 点击处理函数
 * @param {string} [props.icon] 可选的图标类名
 */
function TabButton({ id, label, isActive, onClick, icon = null }) {
  return (
    <button
      className={`tab-button ${isActive ? 'active' : ''}`}
      data-tab={id}
      onClick={onClick}
      title={label}
    >
      {icon && <i className={`tab-icon ${icon}`}></i>}
      <span className="tab-label">{label}</span>
    </button>
  );
}

export default TabButton; 