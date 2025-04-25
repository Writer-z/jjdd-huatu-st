import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import './styles/components/apiKeyModal.css';
import './styles/components/tipstab.css';
import './styles/components/notepadTab.css';
import { DrawingProvider } from './contexts/DrawingContext';
import { registerDebugTools } from './utils/debugTools';
import { cancelDrawingTask, setupJobIdListener } from './utils/cancelTaskUtils';
import { initializeImageMoreButtons, setupImageContainerHoverListeners } from './utils/imageMoreButtons';

// 尝试导入SillyTavern的斜杠命令类
let SlashCommand;
let SlashCommandParser;

try {
    // 动态导入SillyTavern的斜杠命令类
    SlashCommand = window.SlashCommand || (window.SillyTavern && window.SillyTavern.SlashCommand);
    SlashCommandParser = window.SlashCommandParser || (window.SillyTavern && window.SillyTavern.SlashCommandParser);

    // 删除无法通过webpack解析的相对路径导入
    if (!SlashCommand || !SlashCommandParser) {
        console.warn('无法从全局对象导入斜杠命令类, 将在运行时再次尝试');
    }
} catch (error) {
    console.warn('导入斜杠命令类失败:', error);
}

// 使用懒加载来减小主包体积
const LazyDrawingPanel = lazy(() => import('./components/DrawingPanel/DrawingPanel'));

// 添加全局命令注册方法，以便SillyTavern可以主动调用
window.jjddHuatuRegisterCommands = function() {
    console.log('SillyTavern主动调用了jjddHuatuRegisterCommands');
    try {
        addSlashCommands();
        return true;
    } catch (error) {
        console.error('主动调用命令注册失败:', error);
        return false;
    }
};

// 检查命令是否已经被注册，避免重复注册
function isCommandRegistered(commandName) {
    try {
        // 方法1: 使用SillyTavern的getSlashCommandList方法
        if (typeof window.SillyTavern !== 'undefined' &&
            typeof window.SillyTavern.getSlashCommandList === 'function') {
            const commands = window.SillyTavern.getSlashCommandList();
            if (Array.isArray(commands) && commands.some(cmd => cmd.name === commandName)) {
                return true;
            }
        }

        // 方法2: 使用SlashCommandParser的getCommands方法
        const parser = window.SlashCommandParser ||
            (window.SillyTavern && window.SillyTavern.SlashCommandParser);

        if (parser && typeof parser.getCommands === 'function') {
            const commands = parser.getCommands();
            if (Array.isArray(commands) && commands.some(cmd => cmd.name === commandName)) {
                return true;
            }
        }

        // 方法3: 尝试直接从全局对象中获取命令列表
        if (typeof window.getContext === 'function') {
            const context = window.getContext();
            if (context && context.SlashCommandParser && typeof context.SlashCommandParser.getCommands === 'function') {
                const commands = context.SlashCommandParser.getCommands();
                if (Array.isArray(commands) && commands.some(cmd => cmd.name === commandName)) {
                    return true;
                }
            }
        }

        // 方法4: 尝试直接测试命令是否可用
        try {
            // 尝试执行一个空命令，如果命令存在则不会抛出错误
            if (typeof window.executeSlashCommands === 'function') {
                // 测试命令是否存在，但不实际执行
                const testCommand = `/${commandName} --test-only`;
                // 这里不实际执行，只是检查命令是否被识别
                // window.executeSlashCommands(testCommand, true);
                // 注意：这种方法可能不可靠，因为它可能会实际执行命令
            }
        } catch (e) {
            // 如果抛出错误，忽略它
        }

        // 所有方法都失败，返回false
        return false;
    } catch (error) {
        console.warn('检查命令注册状态失败:', error);
        return false;
    }
}

// 加载占位符组件
function LoadingPlaceholder() {
    return (
        <div className="loading-placeholder">
            <div className="spinner"></div>
            <p>正在加载绘图面板...</p>
        </div>
    );
}

// 添加扩展菜单按钮
function addExtensionButtons() {
    // 检查扩展菜单是否存在
    const extensionsMenu = document.getElementById('extensionsMenu');
    if (!extensionsMenu) {
        console.warn('扩展菜单未找到，将在菜单加载后重试');
        setTimeout(addExtensionButtons, 1000);
        return;
    }

    // 检查按钮是否已存在
    if (document.getElementById('jjdd_huatu_settings_button') ||
        document.getElementById('jjdd_huatu_generate_button')) {
        console.log('画图扩展按钮已存在');
        return;
    }

    // 创建画图设置按钮
    const settingsButtonHtml = `
    <div class="extension_container interactable" id="jjdd_huatu_settings_container" tabindex="0">
        <div class="list-group-item flex-container flexGap5 interactable" id="jjdd_huatu_settings_button" tabindex="0">
            <div class="fa-fw fa-solid fa-palette extensionsMenuExtensionButton"></div>
            <span data-i18n="Drawing Settings">画图设置</span>
        </div>
    </div>`;

    // 创建生成图片按钮
    const generateButtonHtml = `
    <div class="extension_container interactable" id="jjdd_huatu_generate_container" tabindex="0">
        <div class="list-group-item flex-container flexGap5 interactable" id="jjdd_huatu_generate_button" tabindex="0">
            <div class="fa-fw fa-solid fa-image extensionsMenuExtensionButton"></div>
            <span data-i18n="Generate Image">快速生图</span>
        </div>
    </div>`;

    // 添加按钮到菜单
    extensionsMenu.insertAdjacentHTML('beforeend', settingsButtonHtml);
    extensionsMenu.insertAdjacentHTML('beforeend', generateButtonHtml);

    // 绑定点击事件
    document.getElementById('jjdd_huatu_settings_button').addEventListener('click', function() {
        // 显示设置界面
        const event = new CustomEvent('jjdd_huatu_toggle_settings', { detail: true });
        document.dispatchEvent(event);
    });

    document.getElementById('jjdd_huatu_generate_button').addEventListener('click', function() {
        // 获取当前输入框中的文本作为提示词
        const textarea = document.getElementById('send_textarea');
        const currentPrompt = textarea ? textarea.value.trim() : '';

        // 触发直接生成图片事件（不打开设置面板）
        const event = new CustomEvent('jjdd_huatu_generate_direct', {
            detail: { prompt: currentPrompt }
        });
        document.dispatchEvent(event);
    });
}

// 初始化扩展
function initializeExtension() {


    // 添加扩展菜单按钮
    addExtensionButtons();

    // 创建React根元素 - 先为按钮区域创建容器
    const rootContainer = document.getElementById('extensions_settings');
    if (!rootContainer) {
        console.error('找不到扩展设置容器');
        return;
    }

    // 检查根元素是否已存在
    let rootElement = document.getElementById('jjdd_huatu_root');
    if (!rootElement) {
        rootElement = document.createElement('div');
        rootElement.id = 'jjdd_huatu_root';
        rootContainer.appendChild(rootElement);
    }

    // 创建面板容器 - 这将直接附加到body，确保面板是固定位置弹窗
    let panelContainer = document.getElementById('jjdd_huatu_panel_container');
    if (!panelContainer) {
        panelContainer = document.createElement('div');
        panelContainer.id = 'jjdd_huatu_panel_container';
        document.body.appendChild(panelContainer);
    }

    // 设置图片容器的鼠标悬停监听器，确保按钮能够正确显示
    setupImageContainerHoverListeners();

    // 渲染按钮区域的React应用
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <App panelContainerId="jjdd_huatu_panel_container" />
        </React.StrictMode>
    );


}

// 添加slash命令
function addSlashCommands() {
    try {
        // 检查SillyTavern是否已完全初始化
        if (typeof window.SillyTavern === 'undefined') {
            console.warn('SillyTavern全局对象不可用，可能还未初始化完成');
        }

        // 检查命令是否已注册，避免重复注册
        const drawRegistered = isCommandRegistered('draw');
        const qxRegistered = isCommandRegistered('qx');
        const QXRegistered = isCommandRegistered('QX');

        // 如果所有命令都已注册，跳过注册过程
        if (drawRegistered && qxRegistered && QXRegistered) {
            return true;
        }

        // 运行时动态获取SlashCommand和SlashCommandParser对象
        let runtimeSlashCommand = null;
        let runtimeSlashCommandParser = null;

        // 方法1: 直接从全局对象获取
        if (typeof window.SlashCommand !== 'undefined') {
            runtimeSlashCommand = window.SlashCommand;
        } else if (typeof window.SillyTavern !== 'undefined' && window.SillyTavern.SlashCommand) {
            runtimeSlashCommand = window.SillyTavern.SlashCommand;
        } else if (typeof SlashCommand !== 'undefined') {
            runtimeSlashCommand = SlashCommand;
        }

        if (typeof window.SlashCommandParser !== 'undefined') {
            runtimeSlashCommandParser = window.SlashCommandParser;
        } else if (typeof window.SillyTavern !== 'undefined' && window.SillyTavern.SlashCommandParser) {
            runtimeSlashCommandParser = window.SillyTavern.SlashCommandParser;
        } else if (typeof SlashCommandParser !== 'undefined') {
            runtimeSlashCommandParser = SlashCommandParser;
        }

        // 方法2: 尝试从getContext获取
        if ((!runtimeSlashCommand || !runtimeSlashCommandParser) && typeof window.getContext === 'function') {
            const context = window.getContext();
            if (context) {
                if (!runtimeSlashCommand && context.SlashCommand) {
                    runtimeSlashCommand = context.SlashCommand;
                }
                if (!runtimeSlashCommandParser && context.SlashCommandParser) {
                    runtimeSlashCommandParser = context.SlashCommandParser;
                }
            }
        }

        // 方法3: 尝试从SillyTavern.getContext获取
        if ((!runtimeSlashCommand || !runtimeSlashCommandParser) &&
            typeof window.SillyTavern !== 'undefined' &&
            typeof window.SillyTavern.getContext === 'function') {
            const context = window.SillyTavern.getContext();
            if (context) {
                if (!runtimeSlashCommand && context.SlashCommand) {
                    runtimeSlashCommand = context.SlashCommand;
                }
                if (!runtimeSlashCommandParser && context.SlashCommandParser) {
                    runtimeSlashCommandParser = context.SlashCommandParser;
                }
            }
        }



        // 首先尝试使用新API注册
        if (typeof window.SillyTavern !== 'undefined' &&
            typeof window.SillyTavern.registerSlashCommand === 'function') {

            // 注册 /draw 命令 (如果尚未注册)
            if (!drawRegistered) {
            window.SillyTavern.registerSlashCommand('draw', (args) => {
                const prompt = args.trim();
                if (prompt) {
                    // 触发生成图片事件
                    const event = new CustomEvent('jjdd_huatu_generate_direct', {
                        detail: { prompt }
                    });
                    document.dispatchEvent(event);
                    return true; // 命令处理成功
                }
                return false; // 命令处理失败
            }, '使用提示词生成图片', ['image', 'picture'], true);

            }

            // 取消画图任务命令的回调函数
            const qxCommandCallback = async () => {
                const result = await cancelDrawingTask();
                return result || ''; // 确保返回非null/undefined值
            };

            // 注册/qx命令 (如果尚未注册)
            if (!qxRegistered) {
                window.SillyTavern.registerSlashCommand(
                    'qx',
                    qxCommandCallback,
                    '取消正在进行的画图任务',
                    [],  // 没有别名
                    false // 非隐藏命令
                );

            }

            // 注册/QX命令（大写版本）(如果尚未注册)
            if (!QXRegistered) {
                window.SillyTavern.registerSlashCommand(
                    'QX',
                    qxCommandCallback, // 使用同一个回调函数
                    '取消正在进行的画图任务',
                    [],  // 没有别名
                    false // 非隐藏命令
                );

            }


            return true;
        }
        // 然后尝试使用旧API注册斜杠命令
        else if (runtimeSlashCommandParser &&
                 typeof runtimeSlashCommandParser.addCommandObject === 'function' &&
                 runtimeSlashCommand &&
                 typeof runtimeSlashCommand.fromProps === 'function') {

            // 注册 /draw 命令
            try {
                // 检查现有命令，避免重复注册

                // 定义通用的帮助文本
                const qxHelpString = `
                    <div>
                        取消正在进行的画图任务。
                    </div>
                    <div>
                        <strong>示例:</strong>
                        <ul>
                            <li>
                                <pre><code class="language-stscript">/qx</code></pre>
                                取消当前进行中的画图任务
                            </li>
                            <li>
                                <pre><code class="language-stscript">/QX</code></pre>
                                同上，大小写均可
                            </li>
                        </ul>
                    </div>
                `;

                // 注册 /draw 命令 (如果尚未注册)
                if (!drawRegistered) {
                    runtimeSlashCommandParser.addCommandObject(
                        runtimeSlashCommand.fromProps({
                            name: 'draw',
                            callback: (args) => {
                                const prompt = args.trim();
                                if (prompt) {
                                    // 触发生成图片事件
                                    const event = new CustomEvent('jjdd_huatu_generate_direct', {
                                        detail: { prompt }
                                    });
                                    document.dispatchEvent(event);
                                    return true; // 命令处理成功
                                }
                                return false; // 命令处理失败
                            },
                            returns: '生成图片的结果',
                            helpString: `
                                <div>
                                    使用提示词生成图片。
                                </div>
                                <div>
                                    <strong>示例:</strong>
                                    <ul>
                                        <li>
                                            <pre><code class="language-stscript">/draw 一只可爱的猫</code></pre>
                                            快速调用api用提示词输入框内容生成图片
                                        </li>
                                    </ul>
                                </div>
                            `,
                        })
                    );

                }


                // 注册 /qx 命令（小写）(如果尚未注册)
                if (!qxRegistered) {
                    runtimeSlashCommandParser.addCommandObject(
                        runtimeSlashCommand.fromProps({
                            name: 'qx',
                            callback: async () => {
                                console.log("执行取消画图任务命令");
                                const result = await cancelDrawingTask();
                                return result || ''; // 确保返回非null/undefined值
                            },
                            returns: '取消绘图任务的结果',
                            helpString: qxHelpString,
                        })
                    );

                }

                // 注册 /QX 命令（大写）(如果尚未注册)
                if (!QXRegistered) {
                    runtimeSlashCommandParser.addCommandObject(
                        runtimeSlashCommand.fromProps({
                            name: 'QX',
                            callback: async () => {
                                console.log("执行取消画图任务命令");
                                const result = await cancelDrawingTask();
                                return result || ''; // 确保返回非null/undefined值
                            },
                            returns: '取消绘图任务的结果',
                            helpString: qxHelpString,
                        })
                    );

                }

                // 验证命令是否成功注册
                if (typeof runtimeSlashCommandParser.getCommands === 'function') {
                    const registeredCmds = runtimeSlashCommandParser.getCommands();
                    const hasDraw = registeredCmds.some(cmd => cmd.name === 'draw');
                    const hasQx = registeredCmds.some(cmd => cmd.name === 'qx');
                    const hasQX = registeredCmds.some(cmd => cmd.name === 'QX');

                    // 如果至少有一个命令注册成功，返回true
                    if (hasDraw || hasQx || hasQX) {
                        return true;
                    }
                }

                return false; // 无法验证命令是否注册成功
            } catch (parserError) {
                console.error('注册命令到SlashCommandParser失败:', parserError);
                return false;
            }
        } else {
            console.warn('无法找到可用的斜杠命令API，无法注册命令');

            // 尝试直接获取SlashCommandParser对象
            try {
                // 尝试从window对象获取
                const globalKeys = Object.keys(window).filter(key =>
                    key.includes('Slash') || key.includes('slash') || key.includes('Command') || key.includes('command')
                );
                console.log('可能的相关全局对象:', globalKeys.join(', '));

                // 尝试从document对象获取
                if (typeof document.querySelector === 'function') {
                    const scriptTags = document.querySelectorAll('script');
                    const slashScripts = Array.from(scriptTags).filter(script =>
                        script.src && (script.src.includes('slash') || script.src.includes('command'))
                    );
                    console.log('可能包含斜杠命令的脚本:', slashScripts.map(s => s.src).join(', '));
                }

                // 尝试使用全局注册方法
                if (typeof window.registerSlashCommand === 'function') {
                    console.log('发现全局registerSlashCommand函数，尝试使用它注册命令');

                    try {
                        // 注册/qx命令
                        if (!qxRegistered) {
                            window.registerSlashCommand('qx', async () => {
                                const result = await cancelDrawingTask();
                                return result || '';
                            }, [], '取消正在进行的画图任务');
                            console.log('已通过全局函数注册 /qx 命令');
                        }

                        // 注册/QX命令
                        if (!QXRegistered) {
                            window.registerSlashCommand('QX', async () => {
                                const result = await cancelDrawingTask();
                                return result || '';
                            }, [], '取消正在进行的画图任务');
                            console.log('已通过全局函数注册 /QX 命令');
                        }

                        return true;
                    } catch (regError) {
                        console.error('使用全局registerSlashCommand函数注册命令失败:', regError);
                    }
                }
            } catch (e) {
                console.error('尝试诊断斜杠命令API时出错:', e);
            }

            return false;
        }

        return false; // 默认返回false
    } catch (error) {
        console.error('注册slash命令失败:', error);
        return false;
    }
}

/**
 * 重写renderDrawingPanel函数，使用懒加载组件
 */
function renderOptimizedDrawingPanel(container, ProviderComponent = React.Fragment) {
    // 确保container是DOM元素
    const targetContainer = typeof container === 'string'
        ? document.getElementById(container)
        : container;

    if (!targetContainer) {
        console.error('找不到目标容器:', container);
        return;
    }

    try {
        // 创建React根元素
        const root = ReactDOM.createRoot(targetContainer);

        // 使用提供的Provider和懒加载组件渲染DrawingPanel
        root.render(
            <React.StrictMode>
                <ProviderComponent>
                    <DrawingProvider>
                        <Suspense fallback={<LoadingPlaceholder />}>
                            <LazyDrawingPanel standalone={true} />
                        </Suspense>
                    </DrawingProvider>
                </ProviderComponent>
            </React.StrictMode>
        );

        console.log('优化的绘图面板已渲染到容器:', targetContainer.id || '无ID容器');
        return root;
    } catch (error) {
        console.error('渲染绘图面板时出错:', error);
    }
}

/**
 * 初始化画画扩展
 */
function initializeDrawingExtension() {
    // 调用原有的初始化函数 - 此函数包含App组件的渲染，会正确渲染DrawingPanel
    initializeExtension();

    // 使用SillyTavern的APP_READY事件来确保在SillyTavern完全初始化后再注册命令
    const waitForSillyTavernReady = () => {
        try {
            // 尝试获取eventSource
            const eventSource =
                (typeof window.eventSource !== 'undefined' && window.eventSource) ||
                (typeof window.SillyTavern !== 'undefined' && window.SillyTavern.eventSource) ||
                (typeof window.getContext === 'function' && window.getContext().eventSource);

            if (eventSource && typeof eventSource.on === 'function') {


                // 监听APP_READY事件
                eventSource.on('app_ready', () => {

                    // 添加斜杠命令
                    setTimeout(() => {
                        addSlashCommands();
                        // 设置任务ID监听器
                        setupJobIdListener();
                    }, 1000); // 在APP_READY后再等待1秒，确保所有系统都已初始化
                });

                // 如果APP_READY事件已经触发过，则直接注册
                setTimeout(() => {
                    if (window.SillyTavern && window.SillyTavern.getContext) {
                        addSlashCommands();
                        setupJobIdListener();
                    }
                }, 2000);

                return true;
            } else {
                console.warn('未找到SillyTavern事件系统，将使用延迟注册方式');
                return false;
            }
        } catch (error) {
            console.error('等待SillyTavern准备就绪时出错:', error);
            return false;
        }
    };

    // 尝试使用事件系统，如果失败则回退到延迟注册
    if (!waitForSillyTavernReady()) {
        // 延迟添加斜杠命令，确保SillyTavern已完全加载
        setTimeout(() => {
            try {
    // 添加斜杠命令
    addSlashCommands();

                // 设置任务ID监听器
                setupJobIdListener();
            } catch (error) {
                console.error('初始化斜杠命令和监听器失败:', error);
            }
        }, 3000); // 延迟3秒执行，确保SillyTavern已加载完成

        // 添加额外的延迟尝试，多次尝试注册斜杠命令
        const retryDelays = [5000, 8000, 12000, 20000]; // 延迟5秒、8秒、12秒和20秒分别再次尝试

        retryDelays.forEach(delay => {
            setTimeout(() => {
                try {
                    // 查找全局对象中的SlashCommandParser
                    if (window.SlashCommandParser ||
                        (window.SillyTavern && window.SillyTavern.SlashCommandParser)) {

                        addSlashCommands();
                    } else {
                        // 尝试通过DOM查找可能包含斜杠命令的脚本
                        if (typeof document.querySelector === 'function') {
                            const slashScript = document.querySelector('script[src*="slash-commands"]');
                            if (slashScript) {

                                addSlashCommands();
                            }
                        }
                    }
                } catch (error) {
                    console.warn(`延迟${delay}ms尝试注册斜杠命令失败:`, error);
                }
            }, delay);
        });
    }

    // 注册调试工具
    registerDebugTools();

    // 初始化图片“生成更多”和“画图设置”按钮功能
    setTimeout(() => {
        try {
            // 初始化图片“生成更多”和“画图设置”按钮功能
            initializeImageMoreButtons();
            console.log('已初始化图片“生成更多”和“画图设置”按钮功能');
        } catch (error) {
            console.error('初始化图片相关功能失败:', error);
        }
    }, 2000); // 延迟2秒，确保SillyTavern的事件系统已加载
}

/**
 * 防抖函数，用于延迟执行频繁触发的函数
 */
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// 等待DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // 延迟初始化，确保SillyTavern UI已加载
        setTimeout(() => {
            initializeDrawingExtension();
        }, 1000);
    });
} else {
    // 如果文档已经加载完成，直接初始化
    setTimeout(() => {
        initializeDrawingExtension();
    }, 1500); // 稍微增加延迟时间
}
