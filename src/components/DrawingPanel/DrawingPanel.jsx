import React, { useEffect, useRef } from 'react';
import { useDrawing } from '../../contexts/DrawingContext';
import SwitchableHeader from './SwitchableHeader.jsx';
import TabSystem from './TabSystem.jsx';
import ErrorBoundary from '../common/ErrorBoundary.jsx';
import useDrawingEvents from '../../hooks/useDrawingEvents';

/**
 * 画图面板组件
 * 包含标题栏和标签页系统
 */
function DrawingPanel() {
  const { state, dispatch, actionTypes } = useDrawing();
  const panelRef = useRef(null);
  const { handleGenerateButtonClick } = useDrawingEvents();

  // 事件监听器
  useEffect(() => {
    // 监听设置切换事件
    const handleToggleSettings = (e) => {
      dispatch({
        type: actionTypes.TOGGLE_SETTINGS,
        value: e.detail === undefined ? true : e.detail
      });
    };

    // 监听生成图片事件（打开设置面板）
    const handleGenerate = (e) => {
      // 获取提示词和原始提示词
      const prompt = e.detail && e.detail.prompt;
      const originalPrompt = e.detail && e.detail.originalPrompt;

      // 如果有提示词，则设置
      if (prompt) {
        dispatch({
          type: actionTypes.SET_PROMPT,
          value: prompt,
          originalPrompt: originalPrompt || prompt // 如果有原始提示词则使用，否则使用当前提示词
        });
      }
      // 如果没有提示词但有原始提示词
      else if (originalPrompt) {
        dispatch({
          type: actionTypes.SET_PROMPT,
          value: '', // 不设置提示词
          originalPrompt: originalPrompt // 但设置原始提示词供自动填充使用
        });
      }

      dispatch({ type: actionTypes.TOGGLE_SETTINGS, value: true });
      dispatch({ type: actionTypes.SET_ACTIVE_TAB, value: 'generate' });
    };

    // 监听直接生成图片事件（不打开设置面板）
    const handleGenerateDirect = async (e) => {
      const prompt = e.detail && e.detail.prompt;
      if (prompt) {
        dispatch({ type: actionTypes.SET_PROMPT, value: prompt });
      }
      // 直接调用生成函数
      await handleGenerateButtonClick();
    };

    // 添加事件监听器
    document.addEventListener('jjdd_huatu_toggle_settings', handleToggleSettings);
    document.addEventListener('jjdd_huatu_generate', handleGenerate);
    document.addEventListener('jjdd_huatu_generate_direct', handleGenerateDirect);

    // 清理事件监听器
    return () => {
      document.removeEventListener('jjdd_huatu_toggle_settings', handleToggleSettings);
      document.removeEventListener('jjdd_huatu_generate', handleGenerate);
      document.removeEventListener('jjdd_huatu_generate_direct', handleGenerateDirect);
    };
  }, [dispatch, actionTypes, handleGenerateButtonClick]);

  // 关闭按钮点击处理
  const handleClose = () => {
    dispatch({ type: actionTypes.TOGGLE_SETTINGS, value: false });
  };

  // 遮罩层点击处理
  const handleOverlayClick = (e) => {
    // 阻止事件冒泡，确保不会影响子元素
    e.stopPropagation();
    // 关闭面板
    dispatch({ type: actionTypes.TOGGLE_SETTINGS, value: false });
  };

  // 如果面板不可见，则不渲染
  if (!state.showSettings) {
    return null;
  }

  return (
    <>
      {/* 遮罩层 - 添加点击和触摸事件 */}
      <div
        className="modal-overlay"
        onClick={handleOverlayClick}
        onTouchStart={handleOverlayClick}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 999,
          touchAction: 'auto'
        }}
      ></div>

      {/* 画图设置容器 */}
      <div
        id="drawing-settings-container"
        className="ht-body"
        ref={panelRef}
        onClick={(e) => e.stopPropagation()} // 防止点击面板时关闭
        onTouchStart={(e) => e.stopPropagation()} // 防止触摸面板时关闭
      >
        <button className="close-button" title="关闭" onClick={handleClose}>×</button>

        {/* 可切换的标题栏 */}
        <ErrorBoundary
          componentName="标题栏"
          fallback={(error, retry) => (
            <div className="header-error">
              <span className="error-message">标题栏加载失败</span>
              <button onClick={retry}>重试</button>
            </div>
          )}
        >
          <SwitchableHeader />
        </ErrorBoundary>

        {/* 标签页系统 */}
        <ErrorBoundary
          componentName="标签页系统"
          fallback={(error, retry) => (
            <div className="drawing-panel-error">
              <h3>画图面板出错</h3>
              <p>{error && error.toString()}</p>
              <div className="error-actions">
                <button onClick={retry}>重试</button>
                <button onClick={handleClose}>关闭面板</button>
              </div>
            </div>
          )}
        >
          <TabSystem />
        </ErrorBoundary>
      </div>
    </>
  );
}

export default DrawingPanel;