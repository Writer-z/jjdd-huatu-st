import { useEffect, useCallback } from 'react';
import { useDrawing } from '../contexts/DrawingContext';
import useImageGeneration from './useImageGeneration';
import { generateImageForSillyTavern } from '../services/api';
import { 
  getContext, 
  addMessageWithImage, 
  replaceMessageImage, 
  applyImageToButton,
  observeCustomButtons,
  getMessageIdFromElement
} from '../utils/sillyTavernIntegration';
import { showToast } from '../utils/ui';

/**
 * 处理画图相关事件的Hook
 */
function useDrawingEvents() {
  const { state, dispatch, actionTypes } = useDrawing();
  const { getDrawingParams } = useImageGeneration();
  
  // 处理生成按钮点击
  const handleGenerateButtonClick = useCallback(async () => {
    if (state.isGenerating) return;
    
    try {
      dispatch({ type: actionTypes.SET_GENERATING, payload: true });
      
      // 获取SillyTavern上下文
      const context = getContext();
      if (!context) {
        throw new Error('无法获取SillyTavern上下文');
      }
      
      console.log('生成前的聊天记录长度:', context.chat.length);
      
      // 获取画图参数
      const drawingResult = getDrawingParams();
      if (!drawingResult.params) {
        throw new Error(drawingResult.error || '获取画图参数失败');
      }
      
      // 如果有错误但仍有参数，记录错误但继续执行
      if (drawingResult.error) {
        console.warn('画图参数存在问题，但仍将继续: ', drawingResult.error);
      }
      
      const params = drawingResult.params;
      
      // 添加显示模式
      params.imageDisplayMode = state.imageDisplayMode;
      params.buttonWidth = state.buttonWidth;
      params.buttonHeight = state.buttonHeight;
      
      // 生成图像
      const result = await generateImageForSillyTavern(params, '', context);
      
      // 处理生成结果
      if (result.success) {
        const imageData = result.data;
        console.log('图片生成成功, 图片数量:', imageData.length);
        
        // 根据显示模式处理生成的图像
        if (state.imageDisplayMode === 'add') {
          console.log('使用添加新消息模式');
          const addResult = await addMessageWithImage(context, imageData, state.prompt);
          if (addResult.success) {
            console.log(`图片已添加到新消息，消息ID: ${addResult.messageId}, 索引: ${addResult.messageIndex}`);
            showToast('图片已生成并添加到新消息 ✓', 2000);
          } else {
            console.error('添加图片消息失败:', addResult.error);
            showToast(`添加图片消息失败: ${addResult.error}`, 3000, true);
          }
        } else if (state.imageDisplayMode === 'replace') {
          console.log('使用替换当前消息模式');
          // 获取最后一条消息索引
          const lastMessageIndex = context.chat.length - 1;
          if (lastMessageIndex < 0) {
            throw new Error('聊天记录为空，无法替换消息');
          }
          console.log(`替换消息索引: ${lastMessageIndex}`);
          const replaceResult = await replaceMessageImage(context, imageData, lastMessageIndex, state.prompt);
          if (replaceResult.success) {
            console.log(`图片已替换消息，消息ID: ${replaceResult.messageId}, 索引: ${replaceResult.messageIndex}`);
            showToast('图片已生成并替换当前消息 ✓', 2000);
          } else {
            console.error('替换图片消息失败:', replaceResult.error);
            showToast(`替换图片消息失败: ${replaceResult.error}`, 3000, true);
          }
        } else if (state.imageDisplayMode === 'button') {
          console.log('使用按钮模式，但未选择具体按钮');
          showToast('选择了按钮模式，但没有选择具体按钮 ✓', 2000);
        }
        
        // 关闭设置面板
        dispatch({ type: actionTypes.TOGGLE_SETTINGS, value: false });
      } else {
        throw new Error(result.error || '生成图像失败');
      }
    } catch (error) {
      console.error('生成图像失败:', error);
      showToast(`生成图像失败: ${error.message}`, 3000, true);
    } finally {
      dispatch({ type: actionTypes.SET_GENERATING, payload: false });
    }
  }, [state, getDrawingParams, actionTypes, dispatch]);
  
  // 处理消息中按钮点击事件
  const handleCustomButtonClick = useCallback(async (event) => {
    if (state.isGenerating) return;
    
    const button = event.currentTarget;
    const prompt = button.getAttribute('data-prompt') || '';
    const messageIndex = getMessageIdFromElement(button);

    // 保存按钮原始文本内容
    const originalButtonText = button.textContent || '';
    
    try {
      // 修改按钮状态显示"画图中..."并禁用
      button.textContent = "画图中...";
      button.disabled = true;
      button.setAttribute('data-generating', 'true');
      
      dispatch({ type: actionTypes.SET_GENERATING, payload: true });
      
      // 获取SillyTavern上下文
      const context = getContext();
      if (!context) {
        throw new Error('无法获取SillyTavern上下文');
      }
      
      console.log('按钮点击 - 消息索引:', messageIndex, '聊天记录长度:', context.chat.length);
      
      // 检查消息索引是否有效
      if (messageIndex < 0 || messageIndex >= context.chat.length) {
        throw new Error(`消息索引无效: ${messageIndex}`);
      }
      
      // 获取画图参数
      const drawingResult = getDrawingParams();
      if (!drawingResult.params) {
        throw new Error(drawingResult.error || '获取画图参数失败');
      }
      
      // 如果有错误但仍有参数，记录错误但继续执行
      if (drawingResult.error) {
        console.warn('画图参数存在问题，但仍将继续: ', drawingResult.error);
      }
      
      const params = drawingResult.params;
      
      // 添加显示模式和按钮尺寸
      params.imageDisplayMode = state.imageDisplayMode;
      params.buttonWidth = state.buttonWidth;
      params.buttonHeight = state.buttonHeight;
      
      // 生成图像
      const result = await generateImageForSillyTavern(params, prompt, context);
      
      // 处理生成结果
      if (result.success) {
        const imageData = result.data;
        const combinedPrompt = `${state.prompt}, ${prompt}`.trim();
        console.log('图片生成成功, 图片数量:', imageData.length);
        
        // 根据显示模式处理生成的图像
        if (state.imageDisplayMode === 'add') {
          console.log('使用添加新消息模式');
          const addResult = await addMessageWithImage(context, imageData, combinedPrompt);
          if (addResult.success) {
            console.log(`图片已添加到新消息，消息ID: ${addResult.messageId}, 索引: ${addResult.messageIndex}`);
            showToast('图片已生成并添加到新消息 ✓', 2000);
          } else {
            console.error('添加图片消息失败:', addResult.error);
            showToast(`添加图片消息失败: ${addResult.error}`, 3000, true);
          }
        } else if (state.imageDisplayMode === 'replace') {
          console.log(`使用替换消息模式，替换索引: ${messageIndex}`);
          const replaceResult = await replaceMessageImage(context, imageData, messageIndex, combinedPrompt);
          if (replaceResult.success) {
            console.log(`图片已替换消息，消息ID: ${replaceResult.messageId}, 索引: ${replaceResult.messageIndex}`);
            showToast('图片已生成并替换当前消息 ✓', 2000);
          } else {
            console.error('替换图片消息失败:', replaceResult.error);
            showToast(`替换图片消息失败: ${replaceResult.error}`, 3000, true);
          }
        } else if (state.imageDisplayMode === 'button') {
          console.log('使用按钮背景模式');
          await applyImageToButton(button, imageData[0].url, state.buttonWidth, state.buttonHeight);
          showToast('图片已应用到按钮背景 ✓', 2000);
          
          // 在按钮模式下，成功后清空按钮文本，因为已经显示图片
          button.textContent = '';
          button.disabled = false;
          return; // 提前返回，不执行finally块中的恢复文本操作
        }
      } else {
        throw new Error(result.error || '生成图像失败');
      }
    } catch (error) {
      console.error('生成图像失败:', error);
      showToast(`生成图像失败: ${error.message}`, 3000, true);
    } finally {
      // 恢复按钮状态，但只有在不是使用button模式时才恢复文本
      // 因为button模式下成功后是显示图片，不需要恢复原文本
      if (state.imageDisplayMode !== 'button' || !button.style.backgroundImage) {
        button.textContent = originalButtonText;
      }
      button.disabled = false;
      button.removeAttribute('data-generating');
      dispatch({ type: actionTypes.SET_GENERATING, payload: false });
    }
  }, [state, getDrawingParams, actionTypes, dispatch]);
  
  // 设置按钮事件监听
  useEffect(() => {
    // 为消息中的画图按钮绑定事件
    const bindCustomButtons = () => {
      const buttons = document.querySelectorAll('.custom-image-prompt-button, .image-prompt-button');
      
      // 先移除旧事件
      buttons.forEach(button => {
        button.removeEventListener('click', handleCustomButtonClick);
      });
      
      // 添加新事件
      buttons.forEach(button => {
        button.addEventListener('click', handleCustomButtonClick);
      });
      
      console.log(`已为${buttons.length}个画图按钮绑定事件`);
    };
    
    // 初始绑定
    bindCustomButtons();
    
    // 设置观察器
    const stopObserving = observeCustomButtons(bindCustomButtons);
    
    // 清理
    return () => {
      const buttons = document.querySelectorAll('.custom-image-prompt-button, .image-prompt-button');
      buttons.forEach(button => {
        button.removeEventListener('click', handleCustomButtonClick);
      });
      
      stopObserving();
    };
  }, [handleCustomButtonClick]);
  
  return {
    handleGenerateButtonClick,
    handleCustomButtonClick
  };
}

export default useDrawingEvents; 