import React, { useState } from 'react';
import ApiKeyModal from '../../Api/ApiKeyModal';
import { useDrawing } from '../../../contexts/DrawingContext';
import { useApiNotification } from '../../../contexts/ApiNotificationContext';

/**
 * 使用技巧标签页组件
 * 提供AI绘图相关的使用说明和技巧，以及API密钥设置入口
 */
function TipsTab() {
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const { state } = useDrawing();
  const { apiKey, stamina } = state;
  const { showApiToast } = useApiNotification();

  // 打开API密钥设置模态框
  const handleOpenApiKeyModal = () => {
    setIsApiKeyModalOpen(true);
  };

  // 关闭API密钥设置模态框
  const handleCloseApiKeyModal = () => {
    setIsApiKeyModalOpen(false);
  };

  // 计算体力值百分比
  const staminaPercentage = stamina ? Math.round((stamina.used / stamina.total) * 100) : 0;

  // 计算剩余体力
  const remainingStamina = stamina ? stamina.total - stamina.used : 0;

  return (
    <div className="tips-container">
      {/* API密钥设置区域 */}
      <div className="api-key-section">
        <div className="api-key-card">
          <div className="api-key-header">
            <h4>API 密钥</h4>
            <button
              className="api-key-settings-btn"
              onClick={handleOpenApiKeyModal}
            >
              点击设置
            </button>
          </div>
          <div className="api-key-description">
            <p>设置您的API密钥以使用扩展功能。</p>
            {apiKey ? (
              <div className="api-key-status success">
                <div className="status-line">
                  API密钥已配置成功！
                </div>
              </div>
            ) : (
              <div className="api-key-status warning">
                未配置API密钥，请先设置API密钥。
              </div>
            )}
          </div>
        </div>
      </div>

      {/* API密钥模态框 */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={handleCloseApiKeyModal}
      />

      <h3>使用技巧</h3>

      <div className="tips-content">
        <div className="tips-section">
          <h4>基础生图</h4>
          <ul className="tips-list">
            <li>确保有魔法，启动后端程序并成功运行</li>
            <li>点击设置，输入正确API密钥，进行测试并保存</li>
            <li>打开画图设置面板输入提示词和选好画图参数</li>
            <li>选择添加新消息模式，点击生成图片按钮，等待生成结果</li>
          </ul>
        </div>

        <div className="tips-section">
          <h4>进阶技巧</h4>
          <ul className="tips-list">
            <li>酒馆世界书添加画图指南，设置好正则，聊天消息中生成画图按钮</li>
            <li>可以选择替换当前消息显示图片模式或更新按钮背景模式</li>
            <li>可以选择预设的模型或者从 <a href="https://tensor.art/models">🌏其它网站</a>中导入模型和lora</li>
            <li>正提示词输入框放常用的质量提示词，AI回复消息提示词正则替换为按钮</li>
            <li>点击正则替换的按钮生成图片，显示在消息末尾或更新按钮背景</li>
          </ul>
        </div>

        <div className="tips-section">
          <h4>参数建议</h4>
          <ul className="tips-list">
            <li>画图前可点击测试API按钮或者图片上的🔑预估消耗体力值</li>
            <li>步数: 通常20-30步能获得较好效果，步数越多越丰富消耗体力越多</li>
            <li>CFG Scale默认7，种子: 使用固定种子可以获得可重复的结果</li>
            <li>单次画图任务数量上限4张</li>
          </ul>
        </div>

        <div className="tips-section">
          <h4>高级用法</h4>
          <ul className="tips-list">
            <li>记事本功能可以保存常用的提示词和模型ID并且方便快速调用</li>
            <li>画图面板中绿色三角形可切换体力值界面支持手动刷新</li>
            <li>点击消息中生成的图片可以快速实现打开面板、ROLL图、预估体力、取消任务</li>
            <li>使用/qx、/QX斜杠命令以及"✂"按钮可以取消未running的任务</li>
          </ul>
        </div>

        <div className="tips-section">
          <h4>常见问题</h4>
          <ul className="tips-list">
            <li>遇到报错可查看后端程序排查，一般500是网络问题，400是参数非法问题</li>
            <li>画图任务时间包括排队等待时间和运行时间，受图片复杂程度、服务器拥挤程度影响，如若遇到长时间排队可取消任务</li>
            <li>图片下载到本地文件夹，向浏览器提供3天缓存，如若遇到图片不显示请确保后端程序在运行</li>
            <li>如果遇到其它问题可以在爱发电或者QQ上联系开发者</li>
          </ul>
        </div>
      </div>

      <div className="tips-footer">
      <div className="section info-section">
        <ul className="info-links">
          <li><a href="https://github.com/Writer-z/jjdd-huatu-st" target="_blank" rel="noopener noreferrer">在GitHub获取最新版本</a></li>
          <li><a href="https://afdian.com/a/jjdd-huatu" target="_blank" rel="noopener noreferrer">联系开发者</a></li>
        </ul>
        <div className="api-notice">
          欢迎使用简简单单画图扩展~有任何问题都可以联系作者！
        </div>
      </div>
      </div>
    </div>
  );
}

export default TipsTab;