/**
 * API配置文件
 * 包含API相关的基础配置
 */

// API基础URL
export const API_BASE_URL = "http://localhost:1314";
// API端点
export const API_ENDPOINTS = {
  // 测试API密钥
  TEST_API_KEY: `/test_api_key`,
  // 获取体力值信息
  GET_STAMINA: `/get_stamina`,
  // 生成图像
  GENERATE_IMAGE: `/generate`,
  // 获取任务结果
  GET_JOB_RESULT: `/jobResult`,
  // 取消任务
  CANCEL_TASK: `/cancelTask`
};

// 默认请求超时时间(毫秒)
export const DEFAULT_TIMEOUT = 30000;

// 默认画图参数(用于API测试)
export const DEFAULT_DRAWING_PARAMS = {
  正提示词: "a beautiful landscape",
  负提示词: "ugly, deformed",
  width: 512,
  height: 512,
  steps: 20,
  cfgScale: 7,
  seed: -1,
  sampler: "Euler",
  sdVae: "None",
  sdModel: "748070388543653861", // 默认模型ID
  count: 1,
  clipSkip: 1
};