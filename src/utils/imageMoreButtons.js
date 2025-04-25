/**
 * 图片消息中的"生成更多"和"画图设置"按钮功能
 * 用于在mes_img_container中添加按钮，实现快速生成更多图片和打开画图设置面板
 */
import { showToast } from './ui';
import { getContext, getMessageIdFromElement, addImagesToExistingSwipeSequence } from './sillyTavernIntegration';
import { generateImageForSillyTavern, testApiKey } from '../services/api';
import { getDrawingParamsFromStorage } from './paramProcessor';
import sillyTavernAPI from './sillyTavernAPI';
import { cancelDrawingTask } from './cancelTaskUtils';

// 存储已添加按钮的消息ID，避免重复添加
const processedMessages = new Set();

// 按钮容器的样式
const buttonContainerStyle = `
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 10;
`;

// 按钮样式
const buttonStyle = `
  background-color: rgba(60, 60, 60, 0.1);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 5px 5px;
  cursor: pointer;
  font-size: 30px;
  transition: background-color 0.3s ease;
  position: absolute;
  pointer-events: auto;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// 按钮悬停样式
const buttonHoverStyle = `
  background-color: rgba(100, 100, 100, 0.9);
`;

/**
 * 从消息中提取提示词
 * @param {HTMLElement} messageElement - 消息元素
 * @returns {string} 提示词
 */
export function extractPromptFromMessage(messageElement) {
  try {
    // 尝试从消息对象中获取提示词
    const messageId = getMessageIdFromElement(messageElement);
    const context = getContext();

    if (context && messageId >= 0 && messageId < context.chat.length) {
      const message = context.chat[messageId];
      if (message && message.extra && message.extra.title) {
        // 从title中提取提示词
        const titleMatch = message.extra.title.match(/提示词:\s*(.*?)(?:\n|$)/);
        if (titleMatch && titleMatch[1]) {
          return titleMatch[1].trim();
        }
      }
    }

    // 如果无法从消息对象获取，尝试从DOM元素获取
    const imgElement = messageElement.querySelector('.mes_img');
    if (imgElement && imgElement.title) {
      const titleMatch = imgElement.title.match(/提示词:\s*(.*?)(?:\n|$)/);
      if (titleMatch && titleMatch[1]) {
        return titleMatch[1].trim();
      }
    }

    return '';
  } catch (error) {
    console.error('提取提示词失败:', error);
    return '';
  }
}

/**
 * 处理"生成更多"按钮点击事件
 * @param {Event} event - 点击事件
 */
export function handleGenerateMoreClick(event) {
  try {
    const button = event.currentTarget;
    const imgContainer = button.closest('.mes_img_container');
    const messageElement = imgContainer.closest('.mes');

    // 获取消息ID
    const messageId = getMessageIdFromElement(messageElement);
    if (messageId === -1) {
      throw new Error('无法获取消息ID');
    }

    // 获取上下文
    const context = getContext();
    if (!context) {
      throw new Error('无法获取SillyTavern上下文');
    }

    // 提取提示词
    const prompt = extractPromptFromMessage(messageElement);
    if (!prompt) {
      console.warn('未找到提示词，无法生成更多图片');
      showToast('未找到提示词，无法生成更多图片', 3000, true);
      return;
    }

    // 显示生成中状态
    button.disabled = true;
    button.textContent = '生成中...';
    showToast('正在生成更多图片...', 2000);

    // 异步生成图片并添加到滑动序列
    (async () => {
      try {
        // 从存储中获取画图参数
        const storedParams = getDrawingParamsFromStorage();

        if (!storedParams) {
          const errorMsg = '未找到画图参数，请先在画图设置中配置参数';
          console.warn(errorMsg);
          showToast(errorMsg, 3000, true);
          throw new Error(errorMsg);
        }

        // 确保API密钥存在
        if (!storedParams.jjddApiKey) {
          const errorMsg = '未找到API密钥，请先在画图设置中配置API密钥';
          console.warn(errorMsg);
          showToast(errorMsg, 3000, true);
          throw new Error(errorMsg);
        }

        // 使用当前消息的提示词覆盖存储的提示词
        storedParams.prompt = prompt;

        // 输出调试信息
        console.log('使用存储的画图参数生成图片:', storedParams);

        // 输出成功获取到API密钥的信息
        const maskedApiKey = storedParams.jjddApiKey.substring(0, 5) + '...' + storedParams.jjddApiKey.substring(storedParams.jjddApiKey.length - 5);
        console.log(`成功获取到API密钥: ${maskedApiKey}`);

        // 生成图片
        console.log('使用提示词生成更多图片:', prompt);
        const result = await generateImageForSillyTavern(storedParams, prompt, context);

        if (result.success) {
          // 将新图片添加到现有滑动序列
          const addResult = await addImagesToExistingSwipeSequence(context, result.data, messageId, prompt);

          if (addResult.success) {
            console.log(`新图片已添加到滑动序列，原始数量: ${addResult.originalCount}, 新数量: ${addResult.newCount}`);
            showToast(`已生成并添加${result.data.length}张新图片 ✓`, 2000);

            // 强制更新DOM，确保按钮正确显示
            sillyTavernAPI.forceUpdate();

            // 延迟执行，确保DOM已完全更新
            setTimeout(() => {
              // 重新扫描消息，确保按钮已添加
              scanAllMessages(true);
            }, 500);
          } else {
            console.error('添加图片到滑动序列失败:', addResult.error);
            showToast(`添加图片失败: ${addResult.error}`, 3000, true);
          }
        } else {
          console.error('生成图片失败:', result.error);
          showToast(`生成图片失败: ${result.error}`, 3000, true);
        }
      } catch (asyncError) {
        console.error('生成并添加图片失败:', asyncError);
        showToast(`生成并添加图片失败: ${asyncError.message}`, 3000, true);
      } finally {
        // 恢复按钮状态
        button.disabled = false;
        button.textContent = '🎲';
      }
    })();
  } catch (error) {
    console.error('生成更多图片失败:', error);
    showToast(`生成更多图片失败: ${error.message}`, 3000, true);

    // 确保按钮状态恢复
    const button = event.currentTarget;
    if (button) {
      button.disabled = false;
      button.textContent = '🎲';
    }
  }
}

/**
 * 处理"画图设置"按钮点击事件
 * @param {Event} event - 点击事件
 */
export function handleOpenSettingsClick(event) {
  try {
    const button = event.currentTarget;
    const imgContainer = button.closest('.mes_img_container');
    const messageElement = imgContainer.closest('.mes');

    // 提取提示词
    const prompt = extractPromptFromMessage(messageElement);

    // 检查是否自动填充提示词
    let shouldFillPrompt = false;

    // 从存储中获取设置
    if (typeof localStorage !== 'undefined') {
      try {
        const settingsStr = localStorage.getItem('jjddHuatuSettings');
        if (settingsStr) {
          const settings = JSON.parse(settingsStr);
          shouldFillPrompt = settings.autoFillPrompt !== false; // 默认为true
        }
      } catch (storageError) {
        console.warn('从存储中获取自动填充设置失败:', storageError);
        shouldFillPrompt = true; // 默认为true
      }
    }

    // 触发打开设置面板事件
    console.log('打开画图设置面板，提示词:', prompt, '自动填充:', shouldFillPrompt);

    // 创建自定义事件，传递提示词和自动填充设置
    const settingsEvent = new CustomEvent('jjdd_huatu_generate', {
      detail: {
        prompt: shouldFillPrompt ? prompt : '',
        originalPrompt: prompt // 始终保存原始提示词，以便用户可以手动填充
      }
    });

    // 分发事件
    document.dispatchEvent(settingsEvent);
  } catch (error) {
    console.error('打开画图设置面板失败:', error);
    showToast(`打开画图设置面板失败: ${error.message}`, 3000, true);
  }
}

/**
 * 处理"测试API"按钮点击事件
 * @param {Event} event - 点击事件
 */
export function handleTestApiClick(event) {
  try {
    const button = event.currentTarget;

    // 显示测试中状态
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = '测试中...';
    showToast('正在测试API密钥...', 2000);

    // 异步测试API
    (async () => {
      try {
        // 从存储中获取画图参数
        const storedParams = getDrawingParamsFromStorage();

        if (!storedParams) {
          const errorMsg = '未找到画图参数，请先在画图设置中配置参数';
          console.warn(errorMsg);
          showToast(errorMsg, 3000, true);
          throw new Error(errorMsg);
        }

        // 确保API密钥存在
        if (!storedParams.jjddApiKey) {
          const errorMsg = '未找到API密钥，请先在画图设置中配置API密钥';
          console.warn(errorMsg);
          showToast(errorMsg, 3000, true);
          throw new Error(errorMsg);
        }

        // 测试API密钥
        const result = await testApiKey(storedParams.jjddApiKey, storedParams);

        if (result.valid) {
          console.log('测试API密钥成功:', result);
          showToast(`API密钥有效 ✓ 体力: ${result.usedStamina}/${result.totalStamina} 预估消耗: ${result.consumeStamina}`, 3000);
        } else {
          console.error('测试API密钥失败:', result.error);
          showToast(`测试API密钥失败: ${result.error}`, 3000, true);
        }
      } catch (asyncError) {
        console.error('测试API密钥失败:', asyncError);
        showToast(`测试API密钥失败: ${asyncError.message}`, 3000, true);
      } finally {
        // 恢复按钮状态
        button.disabled = false;
        button.textContent = originalText;
      }
    })();
  } catch (error) {
    console.error('测试API密钥失败:', error);
    showToast(`测试API密钥失败: ${error.message}`, 3000, true);

    // 确保按钮状态恢复
    const button = event.currentTarget;
    if (button) {
      button.disabled = false;
      button.textContent = '🔑';
    }
  }
}

/**
 * 处理"取消任务"按钮点击事件
 * @param {Event} event - 点击事件
 */
export function handleCancelTaskClick(event) {
  try {
    const button = event.currentTarget;

    // 显示取消中状态
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = '取消中...';
    showToast('正在取消画图任务...', 2000);

    // 异步取消任务
    (async () => {
      try {
        // 调用取消任务函数
        const result = await cancelDrawingTask();
        console.log('取消任务结果:', result);

        // 显示结果消息
        showToast(result, 3000);
      } catch (asyncError) {
        console.error('取消任务失败:', asyncError);
        showToast(`取消任务失败: ${asyncError.message}`, 3000, true);
      } finally {
        // 恢复按钮状态
        button.disabled = false;
        button.textContent = originalText;
      }
    })();
  } catch (error) {
    console.error('取消任务失败:', error);
    showToast(`取消任务失败: ${error.message}`, 3000, true);

    // 确保按钮状态恢复
    const button = event.currentTarget;
    if (button) {
      button.disabled = false;
      button.textContent = '✂️';
    }
  }
}

/**
 * 为图片容器添加按钮
 * @param {HTMLElement} imgContainer - 图片容器元素
 * @param {HTMLElement} messageElement - 消息元素
 * @param {boolean} forceUpdate - 是否强制更新，忽略已处理标记
 * @returns {boolean} 是否成功添加按钮
 */
export function addButtonsToImageContainer(imgContainer, messageElement, forceUpdate = false) {
  try {
    // 检查是否已经添加过按钮
    if (imgContainer.querySelector('.jjdd-huatu-more-buttons-container')) {
      return false;
    }

    // 获取消息ID
    const messageId = getMessageIdFromElement(messageElement);

    // 如果消息ID无效，或者已经处理过且不是强制更新，则跳过
    if (messageId === -1 || (!forceUpdate && processedMessages.has(messageId))) {
      return false;
    }

    console.log(`为消息ID ${messageId} 添加"生成更多"和"画图设置"按钮`);

    // 创建按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'jjdd-huatu-more-buttons-container';
    buttonContainer.style.cssText = buttonContainerStyle;

    // 创建"画图设置"按钮 - 左侧中间偏上 (1)
    const openSettingsButton = document.createElement('button');
    openSettingsButton.className = 'jjdd-huatu-open-settings-button';
    openSettingsButton.textContent = '💻';
    openSettingsButton.title = '画图设置';
    openSettingsButton.style.cssText = buttonStyle + 'top: 35%; left: 10px;';
    openSettingsButton.addEventListener('click', handleOpenSettingsClick);

    // 创建"生成更多"按钮 - 右侧中间偏上 (2)
    const generateMoreButton = document.createElement('button');
    generateMoreButton.className = 'jjdd-huatu-generate-more-button';
    generateMoreButton.textContent = '🎲';
    generateMoreButton.title = '生成更多';
    generateMoreButton.style.cssText = buttonStyle + 'top: 35%; right: 10px;';
    generateMoreButton.addEventListener('click', handleGenerateMoreClick);

    // 创建"测试API"按钮 - 左侧中间偏下 (3)
    const testApiButton = document.createElement('button');
    testApiButton.className = 'jjdd-huatu-test-api-button';
    testApiButton.textContent = '🔑';
    testApiButton.title = '测试API';
    testApiButton.style.cssText = buttonStyle + 'top: 65%; left: 10px;';
    testApiButton.addEventListener('click', handleTestApiClick);

    // 创建"取消任务"按钮 - 右侧中间偏下 (4)
    const cancelTaskButton = document.createElement('button');
    cancelTaskButton.className = 'jjdd-huatu-cancel-task-button';
    cancelTaskButton.textContent = '✂️';
    cancelTaskButton.title = '取消任务';
    cancelTaskButton.style.cssText = buttonStyle + 'top: 65%; right: 10px;';
    cancelTaskButton.addEventListener('click', handleCancelTaskClick);

    // 添加所有按钮到容器
    buttonContainer.appendChild(openSettingsButton);
    buttonContainer.appendChild(generateMoreButton);
    buttonContainer.appendChild(testApiButton);
    buttonContainer.appendChild(cancelTaskButton);

    // 添加容器到图片容器
    imgContainer.appendChild(buttonContainer);

    // 添加鼠标悬停事件
    imgContainer.addEventListener('mouseenter', () => {
      buttonContainer.style.opacity = '1';
    });

    imgContainer.addEventListener('mouseleave', () => {
      buttonContainer.style.opacity = '0';
    });

    // 添加按钮悬停效果
    // 为每个按钮添加悬停效果，保留其位置信息
    openSettingsButton.addEventListener('mouseenter', () => {
      openSettingsButton.style.cssText = buttonStyle + buttonHoverStyle + 'top: 35%; left: 10px;';
    });
    openSettingsButton.addEventListener('mouseleave', () => {
      openSettingsButton.style.cssText = buttonStyle + 'top: 35%; left: 10px;';
    });

    generateMoreButton.addEventListener('mouseenter', () => {
      generateMoreButton.style.cssText = buttonStyle + buttonHoverStyle + 'top: 35%; right: 10px;';
    });
    generateMoreButton.addEventListener('mouseleave', () => {
      generateMoreButton.style.cssText = buttonStyle + 'top: 35%; right: 10px;';
    });

    testApiButton.addEventListener('mouseenter', () => {
      testApiButton.style.cssText = buttonStyle + buttonHoverStyle + 'top: 65%; left: 10px;';
    });
    testApiButton.addEventListener('mouseleave', () => {
      testApiButton.style.cssText = buttonStyle + 'top: 65%; left: 10px;';
    });

    cancelTaskButton.addEventListener('mouseenter', () => {
      cancelTaskButton.style.cssText = buttonStyle + buttonHoverStyle + 'top: 65%; right: 10px;';
    });
    cancelTaskButton.addEventListener('mouseleave', () => {
      cancelTaskButton.style.cssText = buttonStyle + 'top: 65%; right: 10px;';
    });

    // 记录已处理的消息ID
    processedMessages.add(messageId);
    return true;
  } catch (error) {
    console.error('添加按钮失败:', error);
    return false;
  }
}

/**
 * 检查图片是否由jjdd-huatu生成
 * @param {HTMLElement} imgContainer - 图片容器元素
 * @param {HTMLElement} messageElement - 消息元素
 * @returns {boolean} 是否由jjdd-huatu生成
 */
export function isJjddHuatuImage(imgContainer, messageElement) {
  try {
    // 检查图片标题是否包含"提示词:"
    const imgElement = imgContainer.querySelector('.mes_img');
    if (imgElement && imgElement.title) {
      // 检查标题是否包含提示词
      if (imgElement.title.includes('提示词:')) {
        return true;
      }

      // 检查标题是否包含jjdd-huatu相关关键词
      if (imgElement.title.includes('jjdd-huatu') ||
          imgElement.title.includes('jjdd_huatu') ||
          imgElement.title.includes('画图') ||
          imgElement.title.includes('SD') ||
          imgElement.title.includes('Stable Diffusion')) {
        return true;
      }
    }

    // 检查消息对象
    const messageId = getMessageIdFromElement(messageElement);
    const context = getContext();

    if (context && messageId >= 0 && messageId < context.chat.length) {
      const message = context.chat[messageId];

      // 检查extra.title
      if (message && message.extra && message.extra.title) {
        if (message.extra.title.includes('提示词:')) {
          return true;
        }

        if (message.extra.title.includes('jjdd-huatu') ||
            message.extra.title.includes('jjdd_huatu') ||
            message.extra.title.includes('画图') ||
            message.extra.title.includes('SD') ||
            message.extra.title.includes('Stable Diffusion')) {
          return true;
        }
      }

      // 检查是否有image_swipes，这是jjdd-huatu生成的图片特有的属性
      if (message && message.extra && Array.isArray(message.extra.image_swipes) && message.extra.image_swipes.length > 0) {
        return true;
      }
    }

    // 检查DOM结构特征
    // 检查是否有滑动指示器，这是jjdd-huatu生成的图片特有的UI元素
    const swipeIndicator = imgContainer.querySelector('.mes_img_swipe_indicator, .mes_img_swipe_counter');
    if (swipeIndicator) {
      return true;
    }

    // 检查图片容器类名
    if (imgContainer.classList.contains('img_swipes') || imgContainer.classList.contains('img_extra')) {
      return true;
    }

    // 检查图片URL
    const imgSrcElement = imgContainer.querySelector('img.mes_img');
    if (imgSrcElement && imgSrcElement.src) {
      // 检查图片URL是否包含jjdd相关关键词
      const imgSrc = imgSrcElement.src.toLowerCase();
      if (imgSrc.includes('jjdd') ||
          imgSrc.includes('huatu') ||
          imgSrc.includes('sd_') ||
          imgSrc.includes('stable_diffusion') ||
          imgSrc.includes('generated')) {
        return true;
      }

      // 检查是否是数据地址（base64）图片，这通常是生成的图片
      if (imgSrc.startsWith('data:image/') && imgContainer.querySelector('.mes_img_swipe_indicator')) {
        return true;
      }
    }

    // 默认情况下，假设所有图片都是jjdd-huatu生成的
    // 这是一个激进的策略，但可以确保按钮能够显示
    // 如果需要更精确的判断，可以注释掉这一行
    // console.log('默认判定为jjdd-huatu生成的图片');
    // return true;

    return false;
  } catch (error) {
    console.error('检查图片来源失败:', error);
    return false;
  }
}

/**
 * 处理新添加的消息
 * @param {HTMLElement} messageElement - 消息元素
 * @param {boolean} forceUpdate - 是否强制更新，忽略已处理标记
 */
export function processNewMessage(messageElement, forceUpdate = false) {
  try {
    // 查找图片容器
    const imgContainers = messageElement.querySelectorAll('.mes_img_container');

    imgContainers.forEach(imgContainer => {
      // 检查是否是jjdd-huatu生成的图片
      if (isJjddHuatuImage(imgContainer, messageElement)) {
        // 添加按钮
        addButtonsToImageContainer(imgContainer, messageElement, forceUpdate);
      }
    });
  } catch (error) {
    console.error('处理新消息失败:', error);
  }
}

/**
 * 扫描所有消息，为jjdd-huatu生成的图片添加按钮
 * @param {boolean} forceUpdate - 是否强制更新，忽略已处理标记
 */
export function scanAllMessages(forceUpdate = false) {
  try {
    // 获取聊天容器
    const chatContainer = document.getElementById('chat');
    if (!chatContainer) {
      console.warn('未找到聊天容器，无法扫描消息');
      return;
    }

    // 获取所有消息
    const allMessages = chatContainer.querySelectorAll('.mes');
    let processedCount = 0;

    // 处理每个消息
    allMessages.forEach(messageElement => {
      // 查找图片容器
      const imgContainers = messageElement.querySelectorAll('.mes_img_container');

      imgContainers.forEach(imgContainer => {
        // 检查是否是jjdd-huatu生成的图片
        if (isJjddHuatuImage(imgContainer, messageElement)) {
          // 添加按钮
          if (addButtonsToImageContainer(imgContainer, messageElement, forceUpdate)) {
            processedCount++;
          }
        }
      });
    });
  } catch (error) {
    console.error('扫描消息失败:', error);
  }
}

/**
 * 初始化MutationObserver，监听新消息添加
 */
export function initializeImageMoreButtons() {
  try {
    // 获取聊天容器
    const chatContainer = document.getElementById('chat');
    if (!chatContainer) {
      console.warn('未找到聊天容器，无法初始化图片按钮功能');
      return;
    }

    // 立即扫描所有消息
    scanAllMessages();

    // 创建MutationObserver监听新消息
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(node => {
            // 检查是否是消息元素
            if (node instanceof HTMLElement) {
              if (node.classList && node.classList.contains('mes')) {
                // 直接添加的消息元素
                processNewMessage(node, false);
              } else {
                // 检查子元素中是否有消息元素
                const messages = node.querySelectorAll('.mes');
                messages.forEach(message => processNewMessage(message, false));
              }
            }
          });
        }
      });
    });

    // 开始观察
    observer.observe(chatContainer, { childList: true, subtree: true });

    // 设置定期扫描，每10秒扫描一次，确保所有图片都添加了按钮
    const scanInterval = setInterval(scanAllMessages, 10000);

    // 设置图片容器的鼠标悬停事件，确保按钮能够正确显示
    setupImageContainerHoverListeners();

    // 将扫描函数挂载到全局对象，便于手动触发
    if (typeof window !== 'undefined') {
      window.jjddHuatuScanAllImages = (forceUpdate = true) => {
        scanAllMessages(forceUpdate);
        return '扫描完成';
      };
    }

    // 返回清理函数
    return () => {
      observer.disconnect();
      clearInterval(scanInterval);
      // 移除全局函数
      if (typeof window !== 'undefined') {
        delete window.jjddHuatuScanAllImages;
      }
    };
  } catch (error) {
    console.error('初始化图片按钮功能失败:', error);
  }
}

/**
 * 设置图片容器的鼠标悬停事件，确保按钮能够正确显示
 */
export function setupImageContainerHoverListeners() {
  try {
    // 确保有jQuery
    const $ = window.jQuery || window.$;
    if (!$) {
      console.warn('设置鼠标悬停监听器失败: jQuery不可用');
      return false;
    }

    // 移除可能存在的旧事件监听器
    $(document).off('mouseenter', '.mes_img_container');
    $(document).off('mouseleave', '.mes_img_container');

    // 添加鼠标进入事件监听器
    $(document).on('mouseenter', '.mes_img_container', function() {
      const buttonContainer = $(this).find('.jjdd-huatu-more-buttons-container');
      if (buttonContainer.length) {
        buttonContainer.css('opacity', '1');
      } else {
        // 如果按钮容器不存在，尝试添加按钮
        const messageElement = $(this).closest('.mes')[0];
        if (messageElement && isJjddHuatuImage(this, messageElement)) {
          addButtonsToImageContainer(this, messageElement, true);

          // 显示新添加的按钮
          const newButtonContainer = $(this).find('.jjdd-huatu-more-buttons-container');
          if (newButtonContainer.length) {
            newButtonContainer.css('opacity', '1');
          }
        }
      }
    });

    // 添加鼠标离开事件监听器
    $(document).on('mouseleave', '.mes_img_container', function() {
      const buttonContainer = $(this).find('.jjdd-huatu-more-buttons-container');
      if (buttonContainer.length) {
        buttonContainer.css('opacity', '0');
      }
    });

    return true;
  } catch (error) {
    console.error('设置图片容器鼠标悬停监听器失败:', error);
    return false;
  }
}

export default {
  addButtonsToImageContainer,
  isJjddHuatuImage,
  scanAllMessages,
  initializeImageMoreButtons,
  setupImageContainerHoverListeners,
  processNewMessage,
  extractPromptFromMessage,
  handleGenerateMoreClick,
  handleOpenSettingsClick,
  handleTestApiClick,
  handleCancelTaskClick
};
