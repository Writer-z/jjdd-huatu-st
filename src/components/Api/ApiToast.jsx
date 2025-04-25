import React, { useState, useEffect, useRef } from 'react';

/**
 * API操作提示组件
 * 用于显示API操作的通知消息
 */
function ApiToast({ message, duration = 3000, isError = false, onClose }) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // 如果有消息，显示Toast
    if (message) {
      setVisible(true);
      
      // 设置自动关闭计时器
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);
    }
    
    // 组件卸载时清除计时器
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [message, duration, onClose]);

  // 手动关闭Toast
  const handleClose = () => {
    setVisible(false);
    clearTimeout(timeoutRef.current);
    if (onClose) onClose();
  };

  // 如果不可见或没有消息，不渲染
  if (!visible || !message) return null;

  return (
    <div className={`api-toast ${isError ? 'error' : ''}`}>
      <span id="api-toast-message">{message}</span>
      <button 
        className="close-api-toast"
        onClick={handleClose}
        aria-label="关闭通知"
      >
        ×
      </button>
    </div>
  );
}

export default ApiToast; 