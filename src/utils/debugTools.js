/**
 * 调试工具
 */
import { showToast } from './ui';

/**
 * 测试画图功能
 */
export const testDrawingFunctions = async () => {
  console.group('画图功能测试');
  
  try {
    // 测试SillyTavern上下文获取
    console.log('测试获取SillyTavern上下文...');
    const context = window.SillyTavern?.getContext?.() || (typeof window.getContext === 'function' ? window.getContext() : null);
    console.log('上下文:', context ? '获取成功' : '获取失败');
    
    // 测试显示模式
    const imageDisplayMode = localStorage.getItem('jjdd_huatu_image_display_mode') || '未设置';
    console.log('当前设置的显示模式:', imageDisplayMode);
    
    // 测试按钮识别
    const buttons = document.querySelectorAll('.custom-image-prompt-button, .image-prompt-button');
    console.log(`找到${buttons.length}个可用的画图按钮`);
    
    // 测试API密钥
    const apiKey = localStorage.getItem('jjdd_huatu_api_key') || '';
    console.log('API密钥:', apiKey ? '已设置' : '未设置');
    
    showToast('调试信息已输出到控制台', 2000);
    console.log('所有测试完成');
  } catch (error) {
    console.error('测试过程中发生错误:', error);
    showToast(`测试失败: ${error.message}`, 3000, true);
  }
  
  console.groupEnd();
};

/**
 * 测试按钮事件绑定
 */
export const testButtonBindings = () => {
  console.group('测试按钮事件绑定');
  
  try {
    const buttons = document.querySelectorAll('.custom-image-prompt-button, .image-prompt-button');
    
    if (buttons.length === 0) {
      console.log('未找到任何画图按钮，请在聊天中先创建一些按钮');
      return;
    }
    
    console.log(`找到${buttons.length}个按钮，将显示它们的详细信息：`);
    
    buttons.forEach((button, index) => {
      const prompt = button.getAttribute('data-prompt');
      const messageElement = button.closest('.mes');
      const messageId = messageElement ? messageElement.getAttribute('mesid') : '未知';
      
      console.log(`按钮 ${index + 1}:`);
      console.log(`- 提示词: "${prompt}"`);
      console.log(`- 消息ID: ${messageId}`);
      console.log(`- 事件监听器数量: ${button._events?.click?.length || 0}`);
    });
    
    console.log('测试完成');
  } catch (error) {
    console.error('测试按钮绑定时出错:', error);
  }
  
  console.groupEnd();
};

// 导出调试对象
export const registerDebugTools = () => {
  if (process.env.NODE_ENV === 'development' || window.location.search.includes('debug=true')) {
    window.jjddHuatuDebug = {
      testDrawingFunctions,
      testButtonBindings,
      info: {
        version: '1.0.0',
        name: 'JJDD画图',
        description: '简简单单画图扩展'
      }
    };
    console.log('JJDD画图调试工具已注册，使用window.jjddHuatuDebug访问');
  }
}; 