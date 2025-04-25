/**
 * DOM更新辅助工具
 * 提供在DOM更新后立即添加按钮的功能
 */
import { addButtonsToImageContainer, isJjddHuatuImage } from './imageMoreButtons';

/**
 * 在DOM更新后立即添加按钮
 * @param {HTMLElement|jQuery} element - 消息元素或jQuery对象
 * @param {Object} message - 消息对象
 * @returns {boolean} 是否成功添加按钮
 */
export const addButtonsAfterDomUpdate = (element, message) => {
  try {
    // 确保有jQuery
    const $ = window.jQuery || window.$;
    if (!$) {
      console.warn('DOM更新后添加按钮失败: jQuery不可用');
      return false;
    }

    // 获取jQuery元素
    const $element = element.jquery ? element : $(element);

    // 延迟执行，确保DOM已完全更新
    setTimeout(() => {
      try {
        // 查找图片容器
        const $imgContainers = $element.find('.mes_img_container');

        if ($imgContainers.length === 0) {
          return;
        }

        // 处理每个图片容器
        $imgContainers.each(function() {
          const imgContainer = this;

          // 检查是否是jjdd-huatu生成的图片
          if (isJjddHuatuImage(imgContainer, $element[0])) {
            // 添加按钮
            addButtonsToImageContainer(imgContainer, $element[0], true);

            // 强制显示按钮（用于调试）
            const buttonContainer = imgContainer.querySelector('.jjdd-huatu-more-buttons-container');
            if (buttonContainer) {
              // 临时显示按钮，然后淡出
              buttonContainer.style.opacity = '1';
              setTimeout(() => {
                buttonContainer.style.opacity = '0';
              }, 1000);
            }
          }
        });
      } catch (delayedError) {
        console.error('延迟添加按钮失败:', delayedError);
      }
    }, 100); // 延迟100毫秒，确保DOM已完全更新

    return true;
  } catch (error) {
    console.error('DOM更新后添加按钮失败:', error);
    return false;
  }
};

/**
 * 监听图片容器的鼠标事件
 * 确保在鼠标悬停时显示按钮
 */
export const setupImageContainerHoverListeners = () => {
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
};

export default {
  addButtonsAfterDomUpdate,
  setupImageContainerHoverListeners
};
