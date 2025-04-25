import React, { useState, useEffect } from 'react';
import { useDrawing } from '../../../contexts/DrawingContext';

/**
 * 参数设置标签页
 * 控制图片显示模式和按钮尺寸等设置
 */
function ParamsTab() {
  const { state, setImageDisplayMode, setButtonSize, setImageMaxHeight } = useDrawing();
  const { imageDisplayMode, buttonWidth, buttonHeight, imageMaxHeight } = state;

  // 本地状态，用于直接控制输入框的值
  const [localButtonWidth, setLocalButtonWidth] = useState(buttonWidth?.toString() || '');
  const [localButtonHeight, setLocalButtonHeight] = useState(buttonHeight?.toString() || '');

  // 初始化时同步本地状态和全局状态
  useEffect(() => {
    setLocalButtonWidth(buttonWidth?.toString() || '');
    setLocalButtonHeight(buttonHeight?.toString() || '');
  }, [buttonWidth, buttonHeight]);

  // 处理图片显示模式变更
  const handleDisplayModeChange = (e) => {
    setImageDisplayMode(e.target.value);
  };

  // 处理按钮宽度变更
  const handleButtonWidthChange = (e) => {
    const inputValue = e.target.value;
    setLocalButtonWidth(inputValue); // 直接更新输入框显示的值

    // 仅当输入框失去焦点时才更新全局状态
    if (e.type === 'blur') {
      const value = inputValue === '' ? '' : Number(inputValue);
    setButtonSize(value, buttonHeight);
    }
  };

  // 处理按钮高度变更
  const handleButtonHeightChange = (e) => {
    const inputValue = e.target.value;
    setLocalButtonHeight(inputValue); // 直接更新输入框显示的值

    // 仅当输入框失去焦点时才更新全局状态
    if (e.type === 'blur') {
      const value = inputValue === '' ? '' : Number(inputValue);
      setButtonSize(buttonWidth, value);
    }
  };

  // 按键处理函数，在按下Enter时更新全局状态
  const handleKeyDown = (e, type) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (type === 'width') {
        const value = localButtonWidth === '' ? '' : Number(localButtonWidth);
        setButtonSize(value, buttonHeight);
      } else if (type === 'height') {
        const value = localButtonHeight === '' ? '' : Number(localButtonHeight);
    setButtonSize(buttonWidth, value);
      }
      e.target.blur(); // 失去焦点
    }
  };

  // 处理图片最大高度变更
  const handleImageMaxHeightChange = (e) => {
    setImageMaxHeight(e.target.value);
    // 不需要调用updateImageStyle，因为在DrawingContext中已经实现了实时监听
  };



  // 更新图片样式函数已移至DrawingContext中实现



  // 初始化移动设备识别
  useEffect(() => {
    // 添加辅助函数识别移动设备
    if (typeof window.isMobile !== 'function') {
      window.isMobile = function() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      };
    }
  }, []);

  return (
    <div className="params-container">
      <div className="input-group">
        <label htmlFor="imageDisplayMode">图片显示模式</label>
        <select
          id="imageDisplayMode"
          value={imageDisplayMode}
          onChange={handleDisplayModeChange}
        >
          <option value="add">添加新消息</option>
          <option value="replace">替换当前消息</option>
          <option value="button">更新按钮背景</option>
        </select>
      </div>

      <div className="image-settings">
        <h4>图片最大高度</h4>
        <div className="settings-group">
          <select
            id="imageMaxHeight"
            value={imageMaxHeight}
            onChange={handleImageMaxHeightChange}
          >
            <option value="40vh">40%</option>
            <option value="60vh">60%</option>
            <option value="80vh">80%</option>
            <option value="100vh">100%</option>
          </select>
        </div>
      </div>

      <div className="button-size-settings">
        <h4>按钮尺寸设置</h4>
        <div className="settings-row">
          <div className="settings-group">
            <label htmlFor="buttonWidth">宽度:</label>
            <input
              type="number"
              id="buttonWidth"
              value={localButtonWidth}
              onChange={handleButtonWidthChange}
              onBlur={handleButtonWidthChange}
              onKeyDown={(e) => handleKeyDown(e, 'width')}
            />
          </div>
          <div className="settings-group">
            <label htmlFor="buttonHeight">高度:</label>
            <input
              type="number"
              id="buttonHeight"
              value={localButtonHeight}
              onChange={handleButtonHeightChange}
              onBlur={handleButtonHeightChange}
              onKeyDown={(e) => handleKeyDown(e, 'height')}
            />
          </div>
        </div>
      </div>

      <div className="display-info-container">
        <h4>图片显示说明</h4>
        <div className="info-content">
          <p>目前支持三种在酒馆消息中显示图片方式，后续根据反馈会持续优化</p>
          <ul>
            <li><strong>添加新消息</strong>: 生成一条带画图结果的新消息，最普通的方式</li>
            <li><strong>替换当前消息</strong>: 在画图按钮所在消息楼层末尾显示图片，适合省token</li>
            <li><strong>更新按钮背景</strong>: 在按钮显示图片，方法灵活优化后适合前端卡</li>
          </ul>
          <p><strong>图片最大高度</strong>: 调整新增、替换消息图片模式的图片大小</p>
          <p><strong>按钮尺寸</strong>: 调整更新按钮背景模式的图片大小</p>
        </div>
      </div>
    </div>
  );
}

export default ParamsTab;