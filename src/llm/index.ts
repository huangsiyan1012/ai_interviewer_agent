// backend/src/llm/index.ts
// 这个文件的作用：创建一个可以调用 DeepSeek 大模型的对象

import { ChatOpenAI } from "@langchain/openai";
import config from "../config/config";

/**
 * 创建 DeepSeek 聊天模型实例
 * 注意：DeepSeek 兼容 OpenAI 的 API 格式，所以我们用 ChatOpenAI 来连接它
 */
export const createDeepSeekModel = () => {
  const model = new ChatOpenAI({
    // DeepSeek 的 API 地址（兼容 OpenAI 格式）
    apiKey: config.deepseek.apiKey,
    configuration: {
      baseURL: config.deepseek.baseUrl,
    },
    // 使用的模型名称
    model: config.deepseek.model,
    // 温度：控制回答的创造性（0=保守，1=有创意）
    temperature: config.deepseek.temperature,
    // 最大输出 token 数
    maxTokens: config.deepseek.maxTokens,
  });

  return model;
};

/**
 * 创建一个低温度的模型（用于需要精确回答的场景，如评分）
 */
export const createPreciseModel = () => {
  const model = new ChatOpenAI({
    apiKey: config.deepseek.apiKey,
    configuration: {
      baseURL: config.deepseek.baseUrl,
    },
    model: config.deepseek.model,
    temperature: 0.2, // 低温度，更保守更精确
    maxTokens: config.deepseek.maxTokens,
  });

  return model;
};
