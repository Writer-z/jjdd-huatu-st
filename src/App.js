/* global SillyTavern */
import React, { useEffect, useState, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { DrawingProvider } from './contexts/DrawingContext.jsx';
import { NotepadProvider } from './contexts/NotepadContext.jsx';
import { ApiNotificationProvider } from './contexts/ApiNotificationContext.jsx';
import ReactDOM from 'react-dom/client';
import useDrawingEvents from './hooks/useDrawingEvents';

// 使用懒加载优化组件导入
const DrawingPanel = lazy(() => import('./components/DrawingPanel/DrawingPanel.jsx'));
const DebugPanel = lazy(() => import('./components/DebugPanel.jsx'));

// 加载占位符组件
function LoadingPlaceholder() {
    return (
        <div className="loading-placeholder">
            <div className="spinner"></div>
            <p>正在加载组件...</p>
        </div>
    );
}

/**
 * 检查是否启用调试模式
 */
const isDebugMode = () => {
    // 检查URL参数是否包含debug=true
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('debug') === 'true';
};

/**
 * 事件处理组件
 * 该组件必须在DrawingProvider内部使用
 */
function DrawingEventsHandler() {
    // 初始化画图事件处理
    useDrawingEvents();
    return null; // 这个组件不渲染任何UI
}

/**
 * 主应用组件
 */
function App({ panelContainerId = 'jjdd_huatu_panel_container' }) {
    const [debugEnabled] = useState(isDebugMode());
    
    // 监听自定义事件
    useEffect(() => {
        // 监听设置切换事件
        const handleToggleSettings = (e) => {
            console.log('接收到切换设置界面事件', e.detail);
            // 这里将在DrawingPanel组件中处理
        };

        // 监听生成图片事件
        const handleGenerate = (e) => {
            console.log('接收到生成图片事件', e.detail);
            // 这里将在DrawingPanel组件中处理
        };

        // 监听直接生成图片事件
        const handleGenerateDirect = (e) => {
            console.log('接收到直接生成图片事件', e.detail);
            // 这里将在DrawingPanel组件中处理
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
    }, []);

    // 获取面板容器元素
    const panelContainer = document.getElementById(panelContainerId);

    return (
        <ApiNotificationProvider>
            <DrawingProvider>
                <NotepadProvider>
                    {/* 将DrawingEventsHandler明确放在DrawingProvider内部 */}
                    <DrawingEventsHandler />
                    <div className="jjdd-huatu-container">
                        {debugEnabled && (
                            <Suspense fallback={<LoadingPlaceholder />}>
                                <DebugPanel />
                            </Suspense>
                        )}
                    </div>
                    {panelContainer && createPortal(
                        <Suspense fallback={<LoadingPlaceholder />}>
                            <DrawingPanel />
                        </Suspense>,
                        panelContainer
                    )}
                </NotepadProvider>
            </DrawingProvider>
        </ApiNotificationProvider>
    );
}

/**
 * 在指定容器中渲染绘图面板
 * @param {HTMLElement|string} container - DOM容器或容器ID
 * @param {React.ComponentType} ProviderComponent - 提供上下文的组件(可选)
 */
export function renderDrawingPanel(container, ProviderComponent = React.Fragment) {
    // 确保container是DOM元素
    const targetContainer = typeof container === 'string' 
        ? document.getElementById(container) 
        : container;
    
    if (!targetContainer) {
        console.error('找不到目标容器:', container);
        return;
    }
    
    try {
        // 创建React根元素
        const root = ReactDOM.createRoot(targetContainer);
        
        // 使用提供的Provider渲染DrawingPanel，确保也包含NotepadProvider
        root.render(
            <React.StrictMode>
                <ApiNotificationProvider>
                    <DrawingProvider>
                        <NotepadProvider>
                            <Suspense fallback={<LoadingPlaceholder />}>
                                <DrawingPanel standalone={true} />
                            </Suspense>
                        </NotepadProvider>
                    </DrawingProvider>
                </ApiNotificationProvider>
            </React.StrictMode>
        );
        
        console.log('绘图面板已渲染到容器:', targetContainer.id || '无ID容器');
        return root; // 返回根元素，以便可能需要的卸载操作
    } catch (error) {
        console.error('渲染绘图面板时出错:', error);
    }
}

export default App;
