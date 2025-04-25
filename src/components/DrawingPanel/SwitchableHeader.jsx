import React, { useEffect, useState } from 'react';
import { useDrawing } from '../../contexts/DrawingContext';
import { checkStamina } from '../../services/api';
import { showToast } from '../../utils/ui';

/**
 * 可切换标题栏组件
 * 在默认标题和体力值显示之间切换
 */
function SwitchableHeader() {
  const { state, dispatch, actionTypes, refreshStamina } = useDrawing();
  const { activeHeader, stamina, apiKey } = state;
  const [refreshing, setRefreshing] = useState(false);

  // 组件初始化时确保activeHeader状态正确
  useEffect(() => {
    // 获取本地存储中的设置，确认activeHeader状态
    const savedSettings = localStorage.getItem('jjddHuatuSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings && settings.activeHeader) {
          dispatch({
            type: actionTypes.SET_ACTIVE_HEADER,
            payload: settings.activeHeader
          });
        }
      } catch (error) {
        console.error('解析标题栏设置出错:', error);
        // 防错：解析出错时使用默认标题
        dispatch({
          type: actionTypes.SET_ACTIVE_HEADER,
          payload: 'default'
        });
      }
    }
  }, [dispatch, actionTypes]);

  // 当API密钥更改时，自动获取体力信息
  useEffect(() => {
    if (apiKey) {
      // 如果当前是体力值显示模式，立即刷新体力值
      if (activeHeader === 'stamina') {
        fetchLatestStaminaInfo();
      }
    }
  }, [apiKey]);

  // 当切换到体力值显示时，自动刷新体力信息
  useEffect(() => {
    if (activeHeader === 'stamina' && apiKey) {
      fetchLatestStaminaInfo();
    }
  }, [activeHeader]);

  // 切换到默认标题
  const switchToDefaultHeader = () => {
    dispatch({
      type: actionTypes.SET_ACTIVE_HEADER,
      payload: 'default'
    });
  };

  // 切换到体力值显示
  const switchToStaminaHeader = () => {
    dispatch({
      type: actionTypes.SET_ACTIVE_HEADER,
      payload: 'stamina'
    });

    // 切换到体力值显示时，刷新体力值
    fetchLatestStaminaInfo();
  };

  // 获取最新体力信息
  const fetchLatestStaminaInfo = async () => {
    if (!apiKey) {
      showToast('未设置API密钥，无法获取体力信息', 3000, true);
      return;
    }

    setRefreshing(true);

    try {
      // 调用服务器API获取体力信息
      const staminaInfo = await checkStamina(apiKey);

      // 更新状态
      dispatch({
        type: actionTypes.UPDATE_STAMINA,
        payload: {
          used: staminaInfo.used || 0,
          total: staminaInfo.total || 10000,
          lastUpdate: new Date().toISOString()
        }
      });

      // 可选：显示更新成功消息
      console.log('体力信息更新成功', staminaInfo);
    } catch (error) {
      console.error('获取体力信息失败:', error);
      showToast(`获取体力信息失败: ${error.message}`, 3000, true);

      // 防止UI崩溃，设置默认值
      dispatch({
        type: actionTypes.UPDATE_STAMINA,
        payload: {
          used: 0,
          total: 10000
        }
      });
    } finally {
      // 无论成功失败，都停止刷新动画
      setRefreshing(false);
    }
  };

  // 手动刷新体力值
  const handleRefreshStamina = (e) => {
    e.stopPropagation(); // 阻止事件冒泡
    fetchLatestStaminaInfo();
  };

  // 计算体力值百分比 - 添加防错机制
  const staminaUsed = stamina?.used || 0;
  const staminaTotal = stamina?.total || 10000;
  const staminaPercentage = Math.max(0, Math.min(100, (staminaUsed / staminaTotal) * 100));

  // 获取最后更新时间
  const lastUpdateText = stamina?.lastUpdate
    ? `最后更新: ${new Date(stamina.lastUpdate).toLocaleString()}`
    : '';

  return (
    <div className="switchable-header">
      {/* 默认标题栏 */}
      <div className={`header-default ${activeHeader === 'default' ? 'active' : ''}`}>
        <button
          className="triangle-button left-triangle"
          title="切换到体力值显示"
          onClick={switchToStaminaHeader}
        >
          <i className="fas fa-caret-left"></i>
        </button>
        <h3>简单画图</h3>
      </div>

      {/* 体力值标题栏 */}
      <div className={`header-stamina ${activeHeader === 'stamina' ? 'active' : ''}`}>
        <div className="stamina-container">
          <div className="stamina-top">
            <div className="stamina-header-group">
              <button
                className="triangle-button right-triangle"
                title="切换到简单画图"
                onClick={switchToDefaultHeader}
              >
                <i className="fas fa-caret-right"></i>
              </button>
              <span className="stamina-label">已用体力</span>
            </div>
            <div className="stamina-inputs">
              <span id="used-stamina" className="stamina-text used-stamina">{staminaUsed}</span>
              <span className="stamina-separator">/</span>
              <span id="total-stamina" className="stamina-text total-stamina">{staminaTotal}</span>
            </div>
            <button
              className="refresh-stamina"
              title="刷新体力信息"
              onClick={handleRefreshStamina}
              disabled={refreshing}
            >
              <i className={`fas fa-sync-alt ${refreshing ? 'fa-spin' : ''}`}></i>
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
      </div>
    </div>
  );
}

export default SwitchableHeader;