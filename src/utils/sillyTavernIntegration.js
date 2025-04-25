/**
 * SillyTavern集成工具
 * 提供与SillyTavern交互的实用函数
 */
import { showToast } from './ui';
import sillyTavernAPI from './sillyTavernAPI';
import { rebindSwipeEvents } from './swipeUtils';
import { addButtonsToImageContainer, isJjddHuatuImage, scanAllMessages } from './imageMoreButtons';

/**
 * 获取SillyTavern上下文
 * @returns {Object|null} SillyTavern上下文对象
 */
export const getContext = () => {
  if (typeof window.SillyTavern !== 'undefined' && typeof window.SillyTavern.getContext === 'function') {
    return window.SillyTavern.getContext();
  }

  // 兼容旧版API
  if (typeof window.getContext === 'function') {
    return window.getContext();
  }

  return null;
};

/**
 * 向现有消息的图片滑动序列添加新图片
 * @param {Object} context - SillyTavern上下文
 * @param {Array} imageData - 新图像数据数组
 * @param {number} targetMessageId - 目标消息ID
 * @param {string} prompt - 生成图像的提示词
 * @returns {Object} 处理结果对象
 */
export const addImagesToExistingSwipeSequence = async (context, imageData, targetMessageId, prompt) => {
  if (!context || !imageData || imageData.length === 0 || targetMessageId === -1) {
    console.error('向滑动序列添加图片失败：无效的参数');
    return { success: false, error: '无效的参数' };
  }

  try {
    // 确保targetMessageId是有效的索引
    if (targetMessageId < 0 || targetMessageId >= context.chat.length) {
      const errorMsg = `向滑动序列添加图片失败：目标消息索引无效 ${targetMessageId}, 聊天长度: ${context.chat.length}`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    console.log(`向滑动序列添加图片 - 目标索引: ${targetMessageId}, 聊天长度: ${context.chat.length}`);

    const message = context.chat[targetMessageId];
    if (!message) {
      const errorMsg = `向滑动序列添加图片失败：未找到目标消息 ${targetMessageId}`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    // 确保消息有图片滑动序列
    if (!message.extra || !Array.isArray(message.extra.image_swipes)) {
      const errorMsg = `向滑动序列添加图片失败：目标消息没有图片滑动序列`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    // 获取原始滑动序列
    const originalSwipes = [...message.extra.image_swipes];
    const originalLength = originalSwipes.length;

    // 获取新图片URL
    const newImageUrls = imageData.map(item => item.url);

    // 将新图片添加到滑动序列
    message.extra.image_swipes = [...originalSwipes, ...newImageUrls];

    // 更新标题，添加新图片链接
    for (let i = 0; i < newImageUrls.length; i++) {
      message.extra.title += `\n链接: ${newImageUrls[i]}`;
    }

    console.log(`已向滑动序列添加${newImageUrls.length}张新图片，原始数量: ${originalLength}, 新数量: ${message.extra.image_swipes.length}`);

    // 更新UI显示
    // 使用增强的API更新消息
    console.log(`使用增强的API更新滑动序列`);
    try {
      // 尝试使用增强的API更新消息块
      const updateResult = await sillyTavernAPI.updateMessageBlock(targetMessageId, message);
      if (updateResult) {
        console.log(`滑动序列已通过增强的API更新成功`);

        // 强制触发DOM更新
        sillyTavernAPI.forceUpdate();

        // 重新绑定滑动按钮事件
        const $ = window.jQuery || window.$;
        const targetElement = $(`#chat [mesid="${targetMessageId}"]`);
        if (targetElement.length) {
          console.log(`重新绑定滑动按钮事件，消息ID: ${targetMessageId}`);
          rebindSwipeEvents(targetElement, message);

          // 为图片容器添加按钮
          console.log(`为消息ID ${targetMessageId} 添加“生成更多”和“画图设置”按钮`);
          const imgContainers = targetElement.find('.mes_img_container');
          imgContainers.each(function() {
            if (isJjddHuatuImage(this, targetElement[0])) {
              addButtonsToImageContainer(this, targetElement[0], true);
            }
          });
        }

        // 保存聊天记录
        sillyTavernAPI.saveChat().then(() => {
          console.log(`聊天记录已保存`);
        }).catch(error => {
          console.warn(`保存聊天记录失败:`, error);
        });

        return {
          success: true,
          messageId: targetMessageId,
          originalCount: originalLength,
          newCount: message.extra.image_swipes.length
        };
      }
    } catch (updateError) {
      console.error(`通过增强的API更新滑动序列失败:`, updateError);
      // 更新失败时继续尝试手动DOM操作
    }

    // 2. 如果API不可用或更新失败，尝试直接操作DOM
    // 查找目标DOM元素
    const targetElement = document.querySelector(`#chat .mes[mesid="${targetMessageId}"]`);

    if (targetElement) {
      console.log(`找到目标DOM元素，使用增强的API更新滑动序列UI`);

      try {
        // 使用增强的API添加媒体到消息
        const $ = window.jQuery || window.$;
        const result = sillyTavernAPI.appendMediaToMessage(message, $(targetElement), false);

        if (result) {
          console.log(`滑动序列已通过增强的appendMediaToMessage更新成功`);

          // 强制触发DOM更新
          sillyTavernAPI.forceUpdate();

          // 保存聊天记录
          sillyTavernAPI.saveChat().then(() => {
            console.log(`聊天记录已保存`);
          }).catch(error => {
            console.warn(`保存聊天记录失败:`, error);
          });
        }
      } catch (error) {
        console.error(`使用增强的API更新滑动序列UI失败:`, error);

        // 如果增强的API失败，尝试手动更新DOM
        console.log(`尝试手动更新滑动序列UI`);

        try {
          // 更新图像容器
          const imgContainer = targetElement.querySelector('.mes_img_container');

          if (imgContainer) {
            // 确保容器有正确的类
            imgContainer.classList.add('img_extra', 'img_swipes');

            // 更新计数器
            let counter = imgContainer.querySelector('.mes_img_swipe_counter');
            if (counter) {
              counter.textContent = `1/${message.extra.image_swipes.length}`;
            }

            // 强制触发DOM更新
            setTimeout(() => {
              window.dispatchEvent(new Event('resize'));
            }, 10);
          }
        } catch (domError) {
          console.error(`手动更新滑动序列UI失败:`, domError);
        }
      }
    } else {
      console.warn(`未找到目标DOM元素，无法更新滑动序列UI`);
    }

    // 保存聊天记录
    if (typeof context.saveChat === 'function') {
      await context.saveChat();
      console.log(`聊天记录已保存，滑动序列更新完成`);
    } else {
      console.warn(`saveChat方法不可用，无法保存聊天记录`);
    }

    return {
      success: true,
      messageId: targetMessageId,
      originalCount: originalLength,
      newCount: message.extra.image_swipes.length
    };
  } catch (error) {
    console.error('向滑动序列添加图片失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 初始化图片滑动事件监听
 * 监听SillyTavern的IMAGE_SWIPED事件，确保滑动时正确更新DOM
 */
export const initializeImageSwipeSupport = () => {
  // 确保window._jjddSwipeState存在
  if (typeof window._jjddSwipeState === 'undefined') {
    window._jjddSwipeState = {};
  }

  // 如果eventSource存在
  if (typeof window.eventSource !== 'undefined' && typeof window.eventSource.on === 'function') {
    // 移除可能存在的旧事件监听器
    if (window._jjddSwipeListener) {
      window.eventSource.removeListener('IMAGE_SWIPED', window._jjddSwipeListener);
    }

    // 创建新的事件监听器
    window._jjddSwipeListener = (data) => {
      try {
        const { message, element, direction } = data;
        if (!message || !message.extra || !element) return;

        console.log(`图片滑动事件: 方向=${direction}, message=`, message);

        // 使用jQuery包装元素（如果需要）
        const $element = element.jquery ? element : $(element);
        const messageId = $element.attr('mesid');

        if (messageId) {
          // 记录滑动状态
          window._jjddSwipeState[messageId] = {
            timestamp: Date.now(),
            direction: direction,
            message: message,
            element: element[0] || element
          };

          // 确保图片正确显示
          const context = getContext();
          if (context) {
            // 检查是否为最后一张图片的右滑（可能需要生成新图片）
            const imageSwipes = message.extra.image_swipes;
            if (Array.isArray(imageSwipes)) {
              const currentIndex = imageSwipes.indexOf(message.extra.image);
              const isLastImage = currentIndex === imageSwipes.length - 1;

              console.log(`图片滑动: 当前索引=${currentIndex}, 总数=${imageSwipes.length}, 是否最后一张=${isLastImage}`);

              // 正常滑动，使用增强的API更新图片
              console.log(`使用增强的API更新滑动后的图片`);
              try {
                const result = sillyTavernAPI.appendMediaToMessage(message, $element, false);
                if (result) {
                  // 强制触发DOM更新
                  sillyTavernAPI.forceUpdate();

                  // 重新绑定滑动按钮事件
                  rebindSwipeEvents($element, message);
                }
              } catch (error) {
                console.error(`使用增强的API更新滑动后的图片失败:`, error);
              }

              console.log(`图片已更新: ${message.extra.image}`);
            }
          }
        }
      } catch (error) {
        console.error('处理图片滑动事件出错:', error);
      }
    };

    // 注册事件监听器
    window.eventSource.on('IMAGE_SWIPED', window._jjddSwipeListener);
    console.log('已注册图片滑动事件监听器');
  } else {
    console.warn('无法注册图片滑动事件监听器: eventSource不可用');
  }
};

/**
 * 获取消息元素的messageId
 * @param {HTMLElement} element - 消息元素或其子元素
 * @returns {number} 消息ID或-1
 */
export const getMessageIdFromElement = (element) => {
  const messageElement = element?.closest?.('.mes');
  return messageElement ? Number(messageElement.getAttribute('mesid')) : -1;
};

/**
 * 向聊天上下文添加包含图像的新消息
 * @param {Object} context - SillyTavern上下文
 * @param {Array} imageData - 图像数据数组
 * @param {string} prompt - 生成图像的提示词
 */
export const addMessageWithImage = async (context, imageData, prompt) => {
  if (!context || !imageData || imageData.length === 0) {
    console.error('添加图像消息失败：无效的参数');
    return;
  }

  try {
    // 确定发送者信息
    const characterName = context.characters[context.characterId]?.name || context.name2 || 'AI';
    const character = context.characters.find(c => c.name === characterName);
    const avatar = character?.avatar || 'img/logo.png';

    // 获取正确的消息ID
    const lastMessageId = context.chat.length > 0 ?
      (context.chat[context.chat.length - 1].mes_id !== undefined ?
        context.chat[context.chat.length - 1].mes_id :
        context.chat.length - 1) : -1;
    const newMessageId = lastMessageId + 1;

    console.log(`添加新消息 - 上一条消息ID: ${lastMessageId}, 新消息ID: ${newMessageId}, 当前聊天长度: ${context.chat.length}`);

    // 构建消息对象
    const message = {
      name: characterName,
      is_user: false,
      is_system: false,
      send_date: Date.now(),
      mes: `以下是生成的图片`,
      mes_id: newMessageId,  // 设置正确的递增消息ID
      extra: {
        image: imageData[0].url,
        image_swipes: imageData.map(item => item.url),
        title: `提示词: ${prompt}\n链接: ${imageData[0].url}`,
        inline_image: true,
      },
      swipe_id: 0,  // 设置为0表示这是一条新消息，不是变体
      avatar: avatar,
    };

    // 添加所有图片链接到标题
    for (let i = 1; i < imageData.length; i++) {
      message.extra.title += `\n链接: ${imageData[i].url}`;
    }

    // 添加消息到聊天数组
    console.log(`将消息添加到聊天数组，当前长度: ${context.chat.length}`);
    context.chat.push(message);
    const messageIndex = context.chat.length - 1;
    console.log(`消息已添加到聊天数组，新长度: ${context.chat.length}, 消息索引: ${messageIndex}`);

    // 添加消息到UI
    try {
      // 尝试使用增强的API添加消息
      console.log(`使用增强的API添加消息，消息ID: ${newMessageId}, 索引: ${messageIndex}`);

      // 如果context中有addOneMessage函数，优先使用
      if (typeof context.addOneMessage === 'function') {
        await context.addOneMessage(message, {
          forceId: messageIndex,  // 使用正确的索引作为forceId
          scroll: true,           // 滚动到新消息
          showSwipes: false       // 不显示滑动按钮
        });
        console.log(`图像消息已通过context.addOneMessage添加到UI`);
      } else {
        // 尝试触发事件来更新UI
        if (typeof window.eventSource?.emit === 'function') {
          window.eventSource.emit('chatUpdated');
          console.log(`已触发chatUpdated事件更新UI`);
        } else {
          console.warn(`无法触发事件更新UI`);
        }
      }

      // 强制触发DOM更新
      sillyTavernAPI.forceUpdate();

      // 保存聊天记录
      await sillyTavernAPI.saveChat();
      console.log(`聊天记录已保存，消息ID: ${newMessageId}, 索引: ${messageIndex}`);
    } catch (error) {
      console.error(`使用增强的API添加消息失败:`, error);

      // 尝试使用原始方法
      try {
        // 保存聊天记录
        if (typeof context.saveChat === 'function') {
          await context.saveChat();
          console.log(`聊天记录已保存（原始方法）`);
        }

        // 触发聊天更新事件
        if (typeof window.eventSource?.emit === 'function') {
          window.eventSource.emit('chatUpdated');
          console.log(`已触发chatUpdated事件（原始方法）`);
        }
      } catch (fallbackError) {
        console.error(`原始方法也失败:`, fallbackError);
      }
    }

    // 最后再次保存聊天记录，确保所有更改都被保存
    if (typeof context.saveChat === 'function') {
      await context.saveChat();
      console.log(`聊天记录已最终保存，确保消息ID正确`);
    }

    return { success: true, messageId: newMessageId, messageIndex: messageIndex };
  } catch (error) {
    console.error('添加图像消息失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 替换现有消息中的图像
 * @param {Object} context - SillyTavern上下文
 * @param {Array} imageData - 图像数据数组
 * @param {number} targetMessageId - 目标消息ID
 * @param {string} prompt - 生成图像的提示词
 * @returns {Object} 处理结果对象
 */
export const replaceMessageImage = async (context, imageData, targetMessageId, prompt) => {
  if (!context || !imageData || imageData.length === 0 || targetMessageId === -1) {
    console.error('替换图像失败：无效的参数');
    return { success: false, error: '无效的参数' };
  }

  try {
    // 确保targetMessageId是有效的索引
    if (targetMessageId < 0 || targetMessageId >= context.chat.length) {
      const errorMsg = `替换图像失败：目标消息索引无效 ${targetMessageId}, 聊天长度: ${context.chat.length}`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    console.log(`替换消息图像 - 目标索引: ${targetMessageId}, 聊天长度: ${context.chat.length}`);

    const message = context.chat[targetMessageId];
    if (!message) {
      const errorMsg = `替换图像失败：未找到目标消息 ${targetMessageId}`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    // 保存原始消息属性
    const originalIsUser = message.is_user;
    const originalIsSystem = message.is_system;
    const originalAvatar = message.avatar;
    const originalName = message.name;
    const originalMesId = message.mes_id !== undefined ? message.mes_id : targetMessageId;

    console.log(`目标消息信息 - 名称: ${originalName}, ID: ${originalMesId}, 是否用户消息: ${originalIsUser}`);

    // 更新图像数据
    message.extra = message.extra || {};
    message.extra.title = `提示词: ${prompt}\n链接: ${imageData[0].url}`;
    message.extra.image = imageData[0].url;
    message.extra.image_swipes = imageData.map(item => item.url);
    message.extra.inline_image = true;

    // 添加所有图片链接到标题
    for (let i = 1; i < imageData.length; i++) {
      message.extra.title += `\n链接: ${imageData[i].url}`;
    }

    // 恢复原始属性
    message.is_user = originalIsUser;
    message.is_system = originalIsSystem;
    message.avatar = originalAvatar;
    message.name = originalName;
    message.mes_id = originalMesId;

    console.log(`已更新消息对象的图像数据，图片数量: ${imageData.length}`);

    // 1. 使用增强的API访问方法
    console.log(`使用增强的API访问方法更新消息，目标索引: ${targetMessageId}, 消息ID: ${originalMesId}`);
    try {
      // 尝试使用增强的API更新消息块
      const updateResult = await sillyTavernAPI.updateMessageBlock(targetMessageId, message);
      if (updateResult) {
        console.log(`消息图像已通过增强的API替换成功, 消息ID: ${originalMesId}`);

        // 强制触发DOM更新
        sillyTavernAPI.forceUpdate();
        return {
          success: true,
          messageId: originalMesId,
          messageIndex: targetMessageId
        };
      }
    } catch (updateError) {
      console.error(`通过增强的API更新消息失败:`, updateError);
      // 更新失败时继续尝试手动DOM操作
    }

    // 2. 如果API不可用或更新失败，尝试直接操作DOM
    // 查找目标DOM元素，优先使用mes_id，然后尝试使用索引
    let targetElement = null;

    // 尝试使用mes_id查找
    if (originalMesId !== undefined) {
      targetElement = document.querySelector(`#chat .mes[mesid="${originalMesId}"]`);
      console.log(`尝试使用mes_id查找DOM元素: ${originalMesId}, 结果:`, targetElement ? "找到" : "未找到");
    }

    // 如果使用mes_id没找到，尝试使用索引
    if (!targetElement) {
      targetElement = document.querySelector(`#chat .mes[mesid="${targetMessageId}"]`);
      console.log(`尝试使用索引查找DOM元素: ${targetMessageId}, 结果:`, targetElement ? "找到" : "未找到");
    }

    // 如果找到目标元素，手动更新DOM
    if (targetElement) {
      console.log(`找到目标DOM元素，更新图像数据`);

      // 使用增强的API更新消息内容
      console.log(`使用增强的API更新消息内容`);
      try {
        // 使用增强的API添加媒体到消息
        const $ = window.jQuery || window.$;
        const result = sillyTavernAPI.appendMediaToMessage(message, $(targetElement), false);

        if (result) {
          console.log(`消息图像已通过增强的appendMediaToMessage替换成功`);

          // 强制触发DOM更新
          sillyTavernAPI.forceUpdate();

          // 为图片容器添加按钮
          console.log(`为消息ID ${originalMesId} 添加“生成更多”和“画图设置”按钮`);
          const imgContainers = $(targetElement).find('.mes_img_container');
          imgContainers.each(function() {
            if (isJjddHuatuImage(this, targetElement)) {
              addButtonsToImageContainer(this, targetElement, true);
            }
          });

          // 保存聊天记录
          sillyTavernAPI.saveChat().then(() => {
            console.log(`聊天记录已保存`);
          }).catch(error => {
            console.warn(`保存聊天记录失败:`, error);
          });

          return {
            success: true,
            messageId: originalMesId,
            messageIndex: targetMessageId
          };
        }
      } catch (error) {
        console.error(`使用增强的API更新图像失败:`, error);
      }

      // 如果增强的API失败，尝试手动更新DOM
      console.log(`增强的API失败，尝试手动更新DOM元素`);

      try {
        // 更新图像容器
        const imgContainer = targetElement.querySelector('.mes_img_container');
        const imgElement = targetElement.querySelector('.mes_img');

        if (imgElement) {
          // 更新主图像
          imgElement.src = imageData[0].url;
          imgElement.title = `提示词: ${prompt}`;
          imgElement.classList.add('img_inline');

          // 强制重新加载图片
          imgElement.onload = () => {
            console.log(`图片已重新加载`);
            // 触发窗口大小调整事件，强制SillyTavern重新计算布局
            window.dispatchEvent(new Event('resize'));
          };
          imgElement.src = message.extra.image + '?t=' + Date.now(); // 添加时间戳避免缓存

          console.log(`更新了图像元素src: ${imageData[0].url}`);

          // 处理多图片滑动
          if (imageData.length > 1 && imgContainer) {
            // 确保容器有正确的类
            imgContainer.classList.add('img_extra', 'img_swipes');

            // 更新计数器
            let counter = imgContainer.querySelector('.mes_img_swipe_counter');
            if (!counter) {
              // 如果计数器不存在，创建一个
              counter = document.createElement('div');
              counter.className = 'mes_img_swipe_counter';
              imgContainer.appendChild(counter);
            }
            counter.textContent = `1/${imageData.length}`;

            // 确保左右滑动按钮存在
            let leftSwipe = imgContainer.querySelector('.mes_img_swipe_left');
            let rightSwipe = imgContainer.querySelector('.mes_img_swipe_right');

            if (!leftSwipe) {
              leftSwipe = document.createElement('div');
              leftSwipe.className = 'mes_img_swipe_left';
              leftSwipe.innerHTML = '‹';
              imgContainer.appendChild(leftSwipe);
            }

            if (!rightSwipe) {
              rightSwipe = document.createElement('div');
              rightSwipe.className = 'mes_img_swipe_right';
              rightSwipe.innerHTML = '›';
              imgContainer.appendChild(rightSwipe);
            }

            console.log(`已更新滑动UI元素，总图片数: ${imageData.length}`);
          }
        } else {
          console.warn(`未找到图像元素，需要完全重建`);

          // 如果没有找到图像元素，可能需要完全重建消息
          const mesText = targetElement.querySelector('.mes_text');
          if (mesText) {
            // 创建图像容器结构
            const newImgContainer = document.createElement('div');
            newImgContainer.className = 'mes_img_container img_extra';
            if (imageData.length > 1) newImgContainer.classList.add('img_swipes');

            // 创建图像元素
            const newImg = document.createElement('img');
            newImg.className = 'mes_img img_inline';
            newImg.src = imageData[0].url;
            newImg.title = `提示词: ${prompt}`;
            newImgContainer.appendChild(newImg);

            // 如果有多张图片，添加滑动UI
            if (imageData.length > 1) {
              const counter = document.createElement('div');
              counter.className = 'mes_img_swipe_counter';
              counter.textContent = `1/${imageData.length}`;
              newImgContainer.appendChild(counter);

              const leftSwipe = document.createElement('div');
              leftSwipe.className = 'mes_img_swipe_left';
              leftSwipe.innerHTML = '‹';
              newImgContainer.appendChild(leftSwipe);

              const rightSwipe = document.createElement('div');
              rightSwipe.className = 'mes_img_swipe_right';
              rightSwipe.innerHTML = '›';
              newImgContainer.appendChild(rightSwipe);
            }

            // 插入到消息中
            const mesBlock = targetElement.querySelector('.mes_block');
            if (mesBlock) {
              mesBlock.insertBefore(newImgContainer, mesText);
              console.log(`完全重建了图像容器元素`);
            }
          }
        }
      } catch (domError) {
        console.error(`手动更新DOM失败:`, domError);
      }

      console.log(`DOM更新完成`);
    } else {
      console.warn(`未找到目标DOM元素，无法更新UI`);
    }

    // 保存聊天记录
    if (typeof context.saveChat === 'function') {
      await context.saveChat();
      console.log(`聊天记录已保存`);
    } else {
      console.warn(`saveChat方法不可用，无法保存聊天记录`);
    }

    return {
      success: true,
      messageId: originalMesId,
      messageIndex: targetMessageId
    };
  } catch (error) {
    console.error('替换图像失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 应用图像到按钮背景
 * @param {HTMLElement} button - 按钮元素
 * @param {string} imageUrl - 图像URL
 * @param {number} width - 按钮宽度
 * @param {number} height - 按钮高度
 */
export const applyImageToButton = async (button, imageUrl, width, height) => {
  if (!button || !imageUrl) {
    console.error('应用图像到按钮失败：无效的参数');
    return;
  }

  try {
    // 获取按钮数据
    const prompt = button.getAttribute('data-prompt') || '';
    const messageId = getMessageIdFromElement(button);
    const context = getContext();

    if (!context || messageId === -1) {
      console.error('应用图像到按钮失败：无法获取上下文或消息ID');
      return;
    }

    // 创建图像对象预加载图像
    const img = new Image();

    img.onload = () => {
      // 更新按钮样式
      button.style.display = 'inline-block';
      button.style.width = `${width}px`;
      button.style.height = `${height}px`;
      button.style.backgroundImage = `url(${imageUrl})`;
      button.style.backgroundSize = 'cover';
      button.style.backgroundRepeat = 'no-repeat';
      button.style.backgroundPosition = 'center';
      button.style.border = 'none';
      button.style.padding = '0px';
      button.textContent = ''; // 清空文本内容
      button.disabled = false; // 确保按钮可点击
      button.removeAttribute('data-generating'); // 移除生成中状态

      // 更新消息中的按钮HTML
      const message = context.chat[messageId];
      if (message) {
        // 处理特殊字符
        const escapedPrompt = prompt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+');

        // 创建更精确的匹配按钮的正则表达式
        const buttonRegex = new RegExp(
          `<button\\s+data-prompt="\\s*${escapedPrompt}\\s*"\\s+class="(image-prompt-button|custom-image-prompt-button)"[^>]*>.*?<\/button>`,
          'i'
        );

        // 创建新的按钮HTML
        const newButtonHtml = `<button data-prompt="${prompt}" class="custom-image-prompt-button" style="display: inline-block; width: ${width}px; height: ${height}px; background-image: url(${imageUrl}); background-size: cover; background-repeat: no-repeat; background-position: center; border: none; padding: 0px;"> </button>`;

        // 检查是否存在匹配的按钮
        if (buttonRegex.test(message.mes)) {
          console.log('找到匹配的按钮，进行替换');
          // 替换按钮HTML
          message.mes = message.mes.replace(buttonRegex, newButtonHtml);
        } else {
          console.warn('未找到匹配的按钮，无法替换');
        }

        // 更新消息块
        // 尝试使用增强的API更新消息块
        sillyTavernAPI.updateMessageBlock(messageId, message)
          .then(updateResult => {
            if (updateResult) {
              console.log('消息块已通过增强的API更新成功');

              // 强制触发DOM更新
              sillyTavernAPI.forceUpdate();
            } else if (typeof context.updateMessageBlock === 'function') {
              // 如果增强的API失败，尝试使用原始方法
              context.updateMessageBlock(messageId, message);
              console.log('消息块已通过原始方法更新成功');
            }

            // 保存聊天
            return sillyTavernAPI.saveChat();
          })
          .then(() => {
            console.log('图像已应用到按钮背景，聊天记录已保存');
          })
          .catch(error => {
            console.error('更新消息块或保存聊天记录失败:', error);

            // 尝试使用原始方法
            if (typeof context.updateMessageBlock === 'function') {
              context.updateMessageBlock(messageId, message);
            }

            // 保存聊天
            if (typeof context.saveChat === 'function') {
              context.saveChat();
            }

            console.log('图像已应用到按钮背景（原始方法）');
          });
      }
    };

    img.onerror = () => {
      console.error('加载图像失败:', imageUrl);
      button.disabled = false; // 确保按钮仍然可点击，即使图像加载失败
      button.removeAttribute('data-generating'); // 移除生成中状态
    };

    // 开始加载图像
    img.src = imageUrl;
  } catch (error) {
    console.error('应用图像到按钮失败:', error);
    // 确保按钮可点击状态被恢复
    if (button) {
      button.disabled = false;
      button.removeAttribute('data-generating');
    }
  }
};

/**
 * 设置DOM观察器，监听新增的画图按钮
 * @param {Function} onCustomButtonAdded - 当有新按钮添加时的回调
 * @returns {Function} 停止观察的函数
 */
export const observeCustomButtons = (onCustomButtonAdded) => {
  const chatContainer = document.getElementById('chat');
  if (!chatContainer || !onCustomButtonAdded) {
    console.error('设置观察器失败：无效的参数');
    return () => {};
  }

  const observer = new MutationObserver((mutations) => {
    let buttonAdded = false;

    mutations.forEach(mutation => {
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          if (node instanceof HTMLElement) {
            // 检查节点本身是否为目标按钮
            if (node.classList &&
                (node.classList.contains('custom-image-prompt-button') ||
                 node.classList.contains('image-prompt-button'))) {
              buttonAdded = true;
            }

            // 检查节点内部是否包含目标按钮
            const buttons = node.querySelectorAll('.custom-image-prompt-button, .image-prompt-button');
            if (buttons.length > 0) {
              buttonAdded = true;
            }
          }
        });
      }
    });

    if (buttonAdded) {
      onCustomButtonAdded();
    }
  });

  // 开始观察
  observer.observe(chatContainer, { childList: true, subtree: true });

  // 返回停止观察的函数
  return () => observer.disconnect();
};
