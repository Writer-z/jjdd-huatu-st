/**
 * SillyTavern API 访问工具
 * 提供更可靠的方式访问SillyTavern的API
 */

/**
 * 获取SillyTavern API
 * 尝试多种方式获取SillyTavern的API
 * @returns {Object} SillyTavern API对象
 */
export const getSillyTavernAPI = () => {
  // 尝试从全局对象获取
  const ST = window.SillyTavern || {};
  
  // 创建API对象
  const API = {
    // 获取上下文
    getContext: () => {
      // 尝试从SillyTavern对象获取
      if (typeof ST.getContext === 'function') {
        return ST.getContext();
      }
      
      // 尝试从全局函数获取
      if (typeof window.getContext === 'function') {
        return window.getContext();
      }
      
      console.warn('无法获取SillyTavern上下文');
      return null;
    },
    
    // 更新消息块
    updateMessageBlock: async (messageId, message) => {
      const context = API.getContext();
      
      // 尝试使用上下文中的方法
      if (context && typeof context.updateMessageBlock === 'function') {
        return await context.updateMessageBlock(messageId, message);
      }
      
      // 尝试使用全局函数
      if (typeof window.updateMessageBlock === 'function') {
        return await window.updateMessageBlock(messageId, message);
      }
      
      // 尝试使用jQuery更新DOM
      try {
        const $ = window.jQuery || window.$;
        if ($) {
          const messageElement = $(`#chat [mesid="${messageId}"]`);
          if (messageElement.length) {
            // 更新文本
            const text = message?.extra?.display_text ?? message.mes;
            messageElement.find('.mes_text').html(text);
            
            // 更新图片
            API.appendMediaToMessage(message, messageElement, false);
            return true;
          }
        }
      } catch (error) {
        console.error('使用jQuery更新DOM失败:', error);
      }
      
      console.warn('无法更新消息块');
      return false;
    },
    
    // 添加媒体到消息
    appendMediaToMessage: (message, messageElement, adjustScroll = false) => {
      // 尝试使用SillyTavern对象的方法
      if (typeof ST.appendMediaToMessage === 'function') {
        const result = ST.appendMediaToMessage(message, messageElement, adjustScroll);
        
        // 尝试添加按钮
        try {
          setTimeout(() => {
            // 延迟执行，确保DOM已完全更新
            const $ = window.jQuery || window.$;
            if ($) {
              const $messageElement = $(messageElement);
              const imgContainers = $messageElement.find('.mes_img_container');
              
              // 动态导入imageMoreButtons模块
              import('./imageMoreButtons').then(({ addButtonsToImageContainer, isJjddHuatuImage }) => {
                imgContainers.each(function() {
                  if (isJjddHuatuImage(this, $messageElement[0])) {
                    addButtonsToImageContainer(this, $messageElement[0], true);
                  }
                });
              }).catch(error => {
                console.error('导入imageMoreButtons模块失败:', error);
              });
            }
          }, 100);
        } catch (buttonError) {
          console.error('添加按钮失败:', buttonError);
        }
        
        return result;
      }
      
      // 尝试使用全局函数
      if (typeof window.appendMediaToMessage === 'function') {
        const result = window.appendMediaToMessage(message, messageElement, adjustScroll);
        
        // 尝试添加按钮
        try {
          setTimeout(() => {
            // 延迟执行，确保DOM已完全更新
            const $ = window.jQuery || window.$;
            if ($) {
              const $messageElement = $(messageElement);
              const imgContainers = $messageElement.find('.mes_img_container');
              
              // 动态导入imageMoreButtons模块
              import('./imageMoreButtons').then(({ addButtonsToImageContainer, isJjddHuatuImage }) => {
                imgContainers.each(function() {
                  if (isJjddHuatuImage(this, $messageElement[0])) {
                    addButtonsToImageContainer(this, $messageElement[0], true);
                  }
                });
              }).catch(error => {
                console.error('导入imageMoreButtons模块失败:', error);
              });
            }
          }, 100);
        } catch (buttonError) {
          console.error('添加按钮失败:', buttonError);
        }
        
        return result;
      }
      
      // 手动实现基本的图片更新逻辑
      try {
        const $ = window.jQuery || window.$;
        if ($ && message.extra?.image) {
          console.log('手动更新图片: 开始处理');
          const $messageElement = $(messageElement);
          
          // 查找消息块
          let $mesBlock = $messageElement.find('.mes_block');
          if (!$mesBlock.length) {
            console.warn('未找到.mes_block元素，无法添加图片');
            return false;
          }
          
          // 查找或创建图片容器
          let $imgContainer = $messageElement.find('.mes_img_container');
          let containerCreated = false;
          
          if (!$imgContainer.length) {
            console.log('创建新的图片容器');
            $imgContainer = $('<div class="mes_img_container"></div>');
            containerCreated = true;
            
            // 查找消息文本元素，如果存在，将图片容器插入到它之前
            const $mesText = $mesBlock.find('.mes_text');
            if ($mesText.length) {
              console.log('将图片容器插入到消息文本元素之前');
              $mesText.before($imgContainer);
            } else {
              // 如果没有消息文本元素，将图片容器添加到消息块的开头
              console.log('将图片容器添加到消息块的开头');
              $mesBlock.prepend($imgContainer);
            }
          } else {
            console.log('使用现有的图片容器');
          }
          
          // 查找或创建图片元素
          let $imgElement = $imgContainer.find('.mes_img');
          if (!$imgElement.length) {
            console.log('创建新的图片元素');
            $imgElement = $('<img class="mes_img img_inline" />');
            $imgContainer.append($imgElement);
          } else {
            console.log('使用现有的图片元素');
            // 确保图片元素有正确的类
            $imgElement.addClass('img_inline');
          }
          
          // 设置图片属性
          console.log('设置图片属性: ' + message.extra.image);
          
          // 添加加载事件处理程序
          $imgElement.on('load', function() {
            console.log('图片加载成功，触发重新布局');
            window.dispatchEvent(new Event('resize'));
          });
          
          $imgElement.on('error', function() {
            console.error('图片加载失败: ' + message.extra.image);
          });
          
          // 添加时间戳避免缓存
          const timestamp = Date.now();
          $imgElement.attr('src', message.extra.image + '?t=' + timestamp);
          $imgElement.attr('title', message.extra.title || '');
          
          // 处理滑动图片
          if (Array.isArray(message.extra.image_swipes) && message.extra.image_swipes.length > 1) {
            console.log('处理滑动图片，总数: ' + message.extra.image_swipes.length);
            $imgContainer.addClass('img_extra img_swipes');
            
            // 添加或更新计数器
            let $counter = $imgContainer.find('.mes_img_swipe_counter');
            if (!$counter.length) {
              console.log('创建新的计数器');
              $counter = $('<div class="mes_img_swipe_counter"></div>');
              $imgContainer.append($counter);
            }
            $counter.text(`1/${message.extra.image_swipes.length}`);
            
            // 添加滑动按钮
            if (!$imgContainer.find('.mes_img_swipe_left').length) {
              console.log('添加左滑动按钮');
              $imgContainer.append('<div class="mes_img_swipe_left"><i class="fa-solid fa-chevron-left"></i></div>');
            }
            if (!$imgContainer.find('.mes_img_swipe_right').length) {
              console.log('添加右滑动按钮');
              $imgContainer.append('<div class="mes_img_swipe_right"><i class="fa-solid fa-chevron-right"></i></div>');
            }
            
            // 重新绑定滑动按钮事件
            if (typeof window.eventSource !== 'undefined' && typeof window.eventSource.emit === 'function') {
              const event_types = window.event_types || { IMAGE_SWIPED: 'IMAGE_SWIPED' };
              
              // 重新绑定左滑按钮事件
              $imgContainer.find('.mes_img_swipe_left').off('click').on('click', function () {
                console.log('左滑按钮点击');
                window.eventSource.emit(event_types.IMAGE_SWIPED, { 
                  message: message, 
                  element: $messageElement, 
                  direction: 'left' 
                });
              });
              
              // 重新绑定右滑按钮事件
              $imgContainer.find('.mes_img_swipe_right').off('click').on('click', function () {
                console.log('右滑按钮点击');
                window.eventSource.emit(event_types.IMAGE_SWIPED, { 
                  message: message, 
                  element: $messageElement, 
                  direction: 'right' 
                });
              });
              
              console.log('滑动按钮事件已重新绑定');
            } else {
              console.warn('无法重新绑定滑动按钮事件: eventSource不可用');
            }
          } else {
            // 如果只有一张图片，确保容器有正确的类
            $imgContainer.addClass('img_extra');
          }
          
          // 强制触发DOM更新
          setTimeout(() => {
            // 触发窗口大小调整事件，强制SillyTavern重新计算布局
            window.dispatchEvent(new Event('resize'));
            
            // 触发滚动事件
            if (adjustScroll) {
              const chatElement = document.getElementById('chat');
              if (chatElement) {
                chatElement.scrollTop = chatElement.scrollHeight;
              }
            }
            
            // 尝试添加按钮
            try {
              // 动态导入imageMoreButtons模块
              import('./imageMoreButtons').then(({ addButtonsToImageContainer, isJjddHuatuImage }) => {
                const imgContainers = $messageElement.find('.mes_img_container');
                imgContainers.each(function() {
                  if (isJjddHuatuImage(this, $messageElement[0])) {
                    addButtonsToImageContainer(this, $messageElement[0], true);
                  }
                });
              }).catch(error => {
                console.error('导入imageMoreButtons模块失败:', error);
              });
            } catch (buttonError) {
              console.error('添加按钮失败:', buttonError);
            }
          }, 100);
          
          return true;
        }
      } catch (error) {
        console.error('手动更新图片失败:', error);
      }
      
      console.warn('无法添加媒体到消息');
      return false;
    },
    
    // 保存聊天记录
    saveChat: async () => {
      const context = API.getContext();
      
      // 尝试使用上下文中的方法
      if (context && typeof context.saveChat === 'function') {
        return await context.saveChat();
      }
      
      // 尝试使用全局函数
      if (typeof window.saveChatConditional === 'function') {
        return await window.saveChatConditional();
      }
      
      console.warn('无法保存聊天记录');
      return false;
    },
    
    // 强制更新DOM
    forceUpdate: () => {
      try {
        console.log('强制更新DOM: 开始处理');
        
        // 触发窗口大小调整事件，强制SillyTavern重新计算布局
        window.dispatchEvent(new Event('resize'));
        console.log('已触发resize事件');
        
        // 尝试使用jQuery刷新聊天区域
        const $ = window.jQuery || window.$;
        if ($) {
          // 触发所有图片的加载事件
          $('#chat').find('.mes_img').trigger('load');
          console.log('已触发所有图片的load事件');
          
          // 尝试触发SillyTavern的聊天更新事件
          if (typeof window.eventSource?.emit === 'function') {
            window.eventSource.emit('chatUpdated');
            console.log('已触发chatUpdated事件');
          }
          
          // 尝试强制重绘所有消息容器
          $('#chat').find('.mes').each(function() {
            // 触发显示更新
            $(this).css('opacity', '0.99').animate({opacity: '1'}, 10);
          });
          console.log('已强制重绘所有消息容器');
          
          // 尝试强制重绘图片容器
          $('#chat').find('.mes_img_container').each(function() {
            // 触发显示更新
            $(this).css('opacity', '0.99').animate({opacity: '1'}, 10);
          });
          console.log('已强制重绘所有图片容器');
          
          // 尝试添加按钮
          try {
            // 延迟执行，确保DOM已完全更新
            setTimeout(() => {
              // 动态导入imageMoreButtons模块
              import('./imageMoreButtons').then(({ scanAllMessages }) => {
                // 扫描所有消息，为jjdd-huatu生成的图片添加按钮
                scanAllMessages(true);
              }).catch(error => {
                console.error('导入imageMoreButtons模块失败:', error);
              });
            }, 200);
          } catch (buttonError) {
            console.error('添加按钮失败:', buttonError);
          }
        }
        
        // 使用延迟再次触发resize事件，确保布局更新
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
          console.log('已延迟触发第二次resize事件');
        }, 100);
        
        return true;
      } catch (error) {
        console.error('强制更新DOM失败:', error);
        return false;
      }
    }
  };
  
  return API;
};

// 导出默认API实例
export default getSillyTavernAPI();
