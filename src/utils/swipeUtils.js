/**
 * 滑动功能工具函数
 * 提供图片滑动相关的辅助函数
 */

/**
 * 重新绑定滑动按钮的点击事件
 * 在更新图片序列后调用此函数，确保滑动按钮能够正常工作
 * @param {HTMLElement|jQuery} element - 消息元素或jQuery对象
 * @param {Object} message - 消息对象
 * @returns {boolean} 是否成功绑定事件
 */
export const rebindSwipeEvents = (element, message) => {
  try {
    console.log('重新绑定滑动按钮事件: 开始处理');
    
    // 确保有jQuery
    const $ = window.jQuery || window.$;
    if (!$ || !message?.extra?.image_swipes) {
      console.warn('无法重新绑定滑动按钮事件: jQuery不可用或消息没有滑动序列');
      return false;
    }
    
    // 确保有eventSource
    if (!window.eventSource || typeof window.eventSource.emit !== 'function') {
      console.warn('无法重新绑定滑动按钮事件: eventSource不可用');
      return false;
    }
    
    // 确保有event_types
    const event_types = window.event_types || { IMAGE_SWIPED: 'IMAGE_SWIPED' };
    
    // 获取jQuery元素
    const $element = element.jquery ? element : $(element);
    const messageId = $element.attr('mesid');
    
    if (!messageId) {
      console.warn('无法重新绑定滑动按钮事件: 未找到消息ID');
      return false;
    }
    
    console.log(`重新绑定滑动按钮事件: 消息ID=${messageId}, 图片数量=${message.extra.image_swipes.length}`);
    
    // 获取图片容器
    const $imgContainer = $element.find('.mes_img_container');
    if (!$imgContainer.length) {
      console.warn('无法重新绑定滑动按钮事件: 未找到图片容器');
      return false;
    }
    
    // 更新计数器
    const $counter = $imgContainer.find('.mes_img_swipe_counter');
    const currentImage = message.extra.image_swipes.indexOf(message.extra.image) + 1;
    $counter.text(`${currentImage}/${message.extra.image_swipes.length}`);
    
    // 重新绑定左滑按钮事件
    const $swipeLeft = $imgContainer.find('.mes_img_swipe_left');
    $swipeLeft.off('click').on('click', function () {
      console.log('左滑按钮点击');
      window.eventSource.emit(event_types.IMAGE_SWIPED, { 
        message: message, 
        element: $element, 
        direction: 'left' 
      });
    });
    
    // 重新绑定右滑按钮事件
    const $swipeRight = $imgContainer.find('.mes_img_swipe_right');
    $swipeRight.off('click').on('click', function () {
      console.log('右滑按钮点击');
      window.eventSource.emit(event_types.IMAGE_SWIPED, { 
        message: message, 
        element: $element, 
        direction: 'right' 
      });
    });
    
    console.log('滑动按钮事件已重新绑定');
    return true;
  } catch (error) {
    console.error('重新绑定滑动按钮事件失败:', error);
    return false;
  }
};

/**
 * 模拟滑动按钮点击
 * 用于以编程方式触发滑动事件
 * @param {HTMLElement|jQuery} element - 消息元素或jQuery对象
 * @param {Object} message - 消息对象
 * @param {string} direction - 滑动方向 ('left' 或 'right')
 * @returns {boolean} 是否成功触发事件
 */
export const simulateSwipe = (element, message, direction) => {
  try {
    // 确保有jQuery
    const $ = window.jQuery || window.$;
    if (!$ || !message?.extra?.image_swipes) {
      console.warn('无法模拟滑动: jQuery不可用或消息没有滑动序列');
      return false;
    }
    
    // 获取jQuery元素
    const $element = element.jquery ? element : $(element);
    
    // 获取滑动按钮
    const $button = direction === 'left' 
      ? $element.find('.mes_img_swipe_left') 
      : $element.find('.mes_img_swipe_right');
    
    if (!$button.length) {
      console.warn(`无法模拟滑动: 未找到${direction}滑动按钮`);
      return false;
    }
    
    // 模拟点击
    $button.click();
    return true;
  } catch (error) {
    console.error('模拟滑动失败:', error);
    return false;
  }
};

export default {
  rebindSwipeEvents,
  simulateSwipe
};
