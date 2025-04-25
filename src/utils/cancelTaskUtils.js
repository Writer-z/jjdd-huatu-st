/**
 * 取消任务工具函数
 * 提供取消当前画图任务的功能
 */
import { showToast } from './ui';
import { getLastJobId, saveLastJobId } from '../services/storage';
import { cancelGenerationTask, cancelAllRequests } from '../services/api';

// 是否有正在进行的取消任务操作
let isCancellingTask = false;

/**
 * 执行取消画图任务
 * @returns {Promise<string>} 执行结果消息
 */
export async function cancelDrawingTask() {
    if (isCancellingTask) {
        showToast("正在取消任务，请稍候...", 2000, true);
        return "正在取消任务，请稍候...";
    }

    try {
        isCancellingTask = true;

        // 从本地存储获取API密钥（同时检查两个可能的键名）
        let apiKey = localStorage.getItem('jjdd_api_key');

        // 如果使用新键名没有找到，则尝试使用旧键名
        if (!apiKey) {
            apiKey = localStorage.getItem('jjddHuatuApiKey');
        }

        if (!apiKey) {
            isCancellingTask = false;
            showToast("请先设置API密钥", 3000, true);
            return "请先设置API密钥";
        }

        // 验证API密钥格式
        if (!apiKey.startsWith('jjdd-') || apiKey.length < 15) {
            isCancellingTask = false;
            showToast("API密钥格式不正确", 3000, true);
            return "API密钥格式不正确";
        }

        // 获取最近的任务ID
        const jobId = getLastJobId();
        if (!jobId) {
            isCancellingTask = false;
            showToast("没有找到正在进行的画图任务", 3000, true);
            return "没有找到正在进行的画图任务";
        }

        showToast("正在尝试取消画图任务...", 2000);

        // 发送取消请求
        const success = await cancelGenerationTask(jobId, apiKey);
        isCancellingTask = false;

        if (success) {
            // 清除保存的任务ID（使用多种方式确保彻底清除）
            saveLastJobId(null);

            // 直接使用localStorage操作也清除一次，确保彻底清除
            try {
                localStorage.removeItem('jjddHuatuLastJobId');
                console.log('直接从 localStorage 清除任务ID');
            } catch (e) {
                console.warn('直接清除任务ID失败:', e);
            }

            // 取消所有正在进行的网络请求
            cancelAllRequests();

            // 发送取消事件通知
            try {
                // 尝试通过多种方式获取eventSource
                const eventSource =
                    (typeof window.eventSource !== 'undefined' && window.eventSource) ||
                    (typeof window.SillyTavern !== 'undefined' && window.SillyTavern.eventSource) ||
                    (typeof window.getContext === 'function' && window.getContext().eventSource);

                if (eventSource && typeof eventSource.emit === 'function') {
                    eventSource.emit('jjdd_huatu_job_canceled', jobId);
                    console.log(`成功发送任务取消事件: ${jobId}`);
                }
            } catch (e) {
                console.warn('发送取消事件失败:', e);
            }

            showToast("画图任务已取消", 3000, false);
            console.log("取消成功, 任务ID:", jobId);
            return "画图任务已取消";
        } else {
            const errorMsg = "取消任务失败，可能任务已完成或不存在";
            showToast(errorMsg, 3000, true);
            console.error("取消失败，任务ID:", jobId);
            return errorMsg;
        }
    } catch (error) {
        isCancellingTask = false;
        console.error("取消画图任务时出错:", error);
        const errorMsg = `取消画图任务时出错: ${error.message}`;
        showToast(errorMsg, 3000, true);
        return errorMsg;
    }
}

/**
 * 设置任务ID监听器
 * 监听绘图任务开始事件，保存任务ID
 */
export function setupJobIdListener() {
    try {
        // 尝试通过多种方式获取eventSource
        let eventSource = null;

        // 方法1: 从全局对象获取
        if (typeof window.eventSource !== 'undefined' && window.eventSource) {
            eventSource = window.eventSource;
            console.log('从全局window.eventSource获取事件系统');
        }
        // 方法2: 从SillyTavern对象获取
        else if (typeof window.SillyTavern !== 'undefined' && window.SillyTavern.eventSource) {
            eventSource = window.SillyTavern.eventSource;
            console.log('从SillyTavern对象获取事件系统');
        }
        // 方法3: 从getContext函数获取
        else if (typeof window.getContext === 'function') {
            const context = window.getContext();
            if (context && context.eventSource) {
                eventSource = context.eventSource;
                console.log('从getContext()获取事件系统');
            }
        }
        // 方法4: 从SillyTavern.getContext获取
        else if (typeof window.SillyTavern !== 'undefined' &&
                 typeof window.SillyTavern.getContext === 'function') {
            const context = window.SillyTavern.getContext();
            if (context && context.eventSource) {
                eventSource = context.eventSource;
                console.log('从SillyTavern.getContext()获取事件系统');
            }
        }

        // 检查事件系统是否可用
        if (eventSource && typeof eventSource.on === 'function') {
            // 移除可能存在的旧事件监听器，避免重复注册
            if (typeof eventSource.removeListener === 'function') {
                eventSource.removeListener('jjdd_huatu_job_started', window._jjddJobStartedListener);
            }

            // 创建新的事件监听器并保存到全局对象
            window._jjddJobStartedListener = (jobId) => {
                if (jobId) {
                    console.log(`监听到新的画图任务开始: ${jobId}`);
                    saveLastJobId(jobId);
                }
            };

            // 注册任务开始事件监听器
            eventSource.on('jjdd_huatu_job_started', window._jjddJobStartedListener);
            console.log("已成功设置画图任务开始监听器");

            // 移除可能存在的旧取消事件监听器
            if (typeof eventSource.removeListener === 'function') {
                eventSource.removeListener('jjdd_huatu_job_canceled', window._jjddJobCanceledListener);
            }

            // 创建新的取消事件监听器并保存到全局对象
            window._jjddJobCanceledListener = (jobId) => {
                if (jobId) {
                    console.log(`监听到画图任务取消: ${jobId}`);
                    // 清除任务ID
                    saveLastJobId(null);
                    // 直接清除localStorage
                    try {
                        localStorage.removeItem('jjddHuatuLastJobId');
                    } catch (e) {
                        console.warn('清除任务ID失败:', e);
                    }
                }
            };

            // 注册取消事件监听器
            eventSource.on('jjdd_huatu_job_canceled', window._jjddJobCanceledListener);
            console.log("已成功设置画图任务取消监听器");

            // 测试事件系统是否正常工作
            setTimeout(() => {
                try {
                    // 触发一个测试事件，检查事件系统是否正常
                    if (typeof eventSource.emit === 'function') {
                        console.log('测试事件系统连接...');
                        eventSource.emit('jjdd_huatu_test_event', { test: true });
                    }
                } catch (testError) {
                    console.warn('测试事件系统时出错:', testError);
                }
            }, 1000);

            return true;
        } else {
            console.warn("eventSource不可用或格式不正确，无法设置任务ID监听器");

            // 尝试在控制台输出更多调试信息
            console.log('当前可用的全局对象:',
                Object.keys(window).filter(key =>
                    key.includes('event') || key.includes('Event') ||
                    key.includes('silly') || key.includes('Silly') ||
                    key.includes('tavern') || key.includes('Tavern')
                ).join(', '));

            // 使用localStorage作为备用方案
            window.addEventListener('storage', (e) => {
                if (e.key === 'jjddHuatuLastJobId' && e.newValue) {
                    console.log(`从本地存储检测到新的任务ID: ${e.newValue}`);
                }
            });

            return false;
        }
    } catch (error) {
        console.error("设置任务ID监听器失败:", error);
        return false;
    }
}