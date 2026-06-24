// backend/src/config/config.ts
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  // 服务端口
  port: Number(process.env.PORT) || 3001,

  // 数据库配置
  mysql: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "123456",
    database: process.env.DB_NAME || "ai_interview",
    charset: "utf8mb4",
    connectionLimit: 10,
  },

  // DeepSeek 大模型配置
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || "your-deepseek-api-key",
    baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
    model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
    temperature: 0.7,
    maxTokens: 2048,
  },

  // RAG 知识库（Markdown 检索，默认关闭）
  rag: {
    enabled: process.env.RAG_ENABLED === "true",
  },

  // Agent Executor 图递归上限（每轮 model + tool 各计一步）
  agent: {
    recursionLimit: Number(process.env.AGENT_RECURSION_LIMIT) || 40,
  },

  // 面试轮次：LLM 动态决定结束时机，min/max 为安全边界
  interview: {
    minRounds: Number(process.env.INTERVIEW_MIN_ROUNDS) || 3,
    maxRounds: Number(process.env.INTERVIEW_MAX_ROUNDS) || 12,
  },

  // 语音合成（TTS 代理，隐藏 Edge TTS 调用细节）
  voice: {
    ttsVoice: process.env.TTS_VOICE || "zh-CN-XiaoxiaoNeural",
    maxTextLength: 800,
  },

  // Chroma 向量数据库配置
  chroma: {
    url: process.env.CHROMA_URL || "http://localhost:8000",
    collectionName: "job_knowledge",
  },

  // 文件上传配置
  upload: {
    dir: path.join(__dirname, "../../uploads"),
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [".pdf", ".doc", ".docx", ".txt"],
  },

  // JWT 配置（后续扩展用）
  jwt: {
    secret: process.env.JWT_SECRET || "your-jwt-secret",
    expiresIn: "7d",
  },
};

export default config;
