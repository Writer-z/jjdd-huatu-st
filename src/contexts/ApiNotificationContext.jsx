import React, { createContext, useContext, useState, useCallback } from 'react';
import ApiToast from '../components/Api/ApiToast';

// 创建上下文
const ApiNotificationContext = createContext();

/**
 * API通知上下文提供者
 * 用于全局管理API操作的通知
 */
export function ApiNotificationProvider({ children }) {
  const [toast, setToast] = useState({
    message: '',
    isError: false,
    duration: 3000,
    visible: false,
  });

  // 显示通知
  const showApiToast = useCallback((message, isError = false, duration = 3000) => {
    setToast({
      message,
      isError,
      duration,
      visible: true,
    });
  }, []);

  // 隐藏通知
  const hideApiToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false, message: '' }));
  }, []);

  // 提供上下文值
  const contextValue = {
    showApiToast,
    hideApiToast,
  };

  return (
    <ApiNotificationContext.Provider value={contextValue}>
      {children}
      {toast.visible && (
        <ApiToast
          message={toast.message}
          isError={toast.isError}
          duration={toast.duration}
          onClose={hideApiToast}
        />
      )}
    </ApiNotificationContext.Provider>
  );
}

// 自定义Hook方便使用上下文
export function useApiNotification() {
  const context = useContext(ApiNotificationContext);
  if (!context) {
    throw new Error('useApiNotification must be used within ApiNotificationProvider');
  }
  return context;
}

export default ApiNotificationContext; 