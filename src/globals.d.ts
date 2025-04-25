/**
 * 全局类型声明文件
 * 为SillyTavern扩展定义全局对象和类型
 */

// 扩展Window接口
interface Window {
  // 滑动状态和工具
  _jjddSwipeState: Record<string, any>;
  _jjddSwipeListener: Function;
  _swipeDebugTimeout: any;
  gegeHuatuSwipeState: Record<string, any>;
  
  // SillyTavern API
  SillyTavern: {
    getContext: () => any;
    appendMediaToMessage: (message: any, element: any, adjustScroll?: boolean) => void;
    addOneMessage: (message: any, options?: any) => void;
    replaceCurrentMessage: (text: string) => void;
    registerSlashCommand: (
      name: string, 
      callback: (args: string) => boolean, 
      description: string, 
      aliases?: string[], 
      isHidden?: boolean
    ) => void;
  };
  
  // 工具函数
  getContext: () => any;
  appendMediaToMessage: (message: any, element: any, adjustScroll?: boolean) => void;
  isMobile: () => boolean;
  showToast: (message: string, duration?: number, isError?: boolean) => void;
  
  // 事件系统
  eventSource: {
    on: (event: string, callback: Function) => void;
    once: (event: string, callback: Function) => void;
    off: (event: string, callback: Function) => void;
    removeListener: (event: string, callback: Function) => void;
    emit: (event: string, data?: any) => Promise<void>;
  };
  
  // jQuery
  $: any;
  jQuery: any;
}

// 扩展全局命名空间
declare global {
  interface Window {
    _jjddSwipeState: Record<string, any>;
    _jjddSwipeListener: Function;
    _swipeDebugTimeout: any;
    gegeHuatuSwipeState: Record<string, any>;
    SillyTavern: any;
    getContext: () => any;
    appendMediaToMessage: (message: any, element: any, adjustScroll?: boolean) => void;
    isMobile: () => boolean;
    showToast: (message: string, duration?: number, isError?: boolean) => void;
    eventSource: any;
    $: any;
    jQuery: any;
  }
} 