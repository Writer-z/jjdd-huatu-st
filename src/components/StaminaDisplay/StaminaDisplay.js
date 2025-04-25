import React, { useState } from 'react';
import { useDrawing } from '../../contexts/DrawingContext';
import { getApiKeyStamina } from '../../utils/api';
import { showToast } from '../../utils/ui';

/**
 * 体力值显示组件
 * 显示当前已用体力和总体力，包含进度条和刷新按钮
 */
function StaminaDisplay() {
  const { state, refreshStamina } = useDrawing();
  const { stamina, apiKey } = state;
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 手动刷新体力值
  const handleRefresh = async () => {
    if (!apiKey) {
      showToast('未设置API密钥，无法获取体力值', 3000, true);
      return;
    }

    setIsRefreshing(true);
    
    try {
      await refreshStamina();
      showToast('体力值更新成功', 1500, false);
    } catch (error) {
      console.error('刷新体力值失败:', error);
      showToast(`刷新体力值失败: ${error.message}`, 3000, true);
    } finally {
      setIsRefreshing(false);
    }
  };

  // 计算体力值百分比
  const staminaPercentage = Math.max(0, Math.min(100, (stamina.used / stamina.total) * 100));
  
  // 计算剩余体力
  const remainingStamina = stamina.total - stamina.used;
  
  // 格式化最后更新时间
  const lastUpdateText = stamina.lastUpdate 
    ? `最后更新: ${new Date(stamina.lastUpdate).toLocaleString()}`
    : '';

  return (
    <div className="stamina-container">
      <div className="stamina-top">
        <span className="stamina-label">体力值</span>
        <div className="stamina-inputs">
          <span id="used-stamina" className="stamina-text used-stamina">
            {stamina.used}
          </span>
          <span className="stamina-separator">/</span>
          <span id="total-stamina" className="stamina-text total-stamina">
            {stamina.total}
          </span>
          <span className="stamina-remaining">
            (剩余: {remainingStamina})
          </span>
        </div>
        <button 
          className="refresh-stamina" 
          title="刷新体力值" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <i className={`fas fa-sync-alt ${isRefreshing ? 'fa-spin' : ''}`}></i>
        </button>
      </div>
      <div className="stamina-wrapper">
        <div className="stamina-progress-container">
          <div 
            className="stamina-progress-bar" 
            id="stamina-progress-bar"
            style={{ width: `${staminaPercentage}%` }}
          ></div>
        </div>
      </div>
      {lastUpdateText && (
        <div className="stamina-update-time">{lastUpdateText}</div>
      )}
    </div>
  );
}

export default StaminaDisplay; 