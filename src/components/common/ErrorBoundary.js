import React, { Component } from 'react';

/**
 * 错误边界组件
 * 用于捕获子组件中的JavaScript错误，显示错误UI并防止整个应用崩溃
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // 更新状态，使下一次渲染显示错误UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // 记录错误信息
    console.error('组件错误:', error, errorInfo);
    this.setState({ errorInfo });
  }

  // 尝试恢复应用
  tryAgain = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    const { children, fallback, componentName = '组件' } = this.props;
    const { hasError, error } = this.state;

    if (hasError) {
      // 如果提供了自定义的错误UI，则使用它
      if (fallback) {
        return fallback(error, this.tryAgain);
      }

      // 否则使用默认的错误UI
      return (
        <div className="error-boundary">
          <div className="error-container">
            <h3>{componentName}出错了</h3>
            <p className="error-message">{error && error.toString()}</p>
            <button className="error-retry" onClick={this.tryAgain}>
              重试
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary; 