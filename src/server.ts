// backend/src/server.ts
import app from "./app";
import config from "./config/config";
import { initKnowledgeIndex } from "./langchain/rag";
import { seedJobs } from "./utils/seed";

const PORT = config.port;

async function bootstrap() {
  initKnowledgeIndex();

  try {
    await seedJobs();
  } catch (err) {
    console.warn("岗位数据初始化跳过（请确认数据库已就绪）:", err);
  }

  app.listen(PORT, () => {
    console.log(`🚀 后端服务已启动: http://localhost:${PORT}`);
    console.log(`📋 健康检查: http://localhost:${PORT}/api/health`);
    console.log(`🗄️  数据库: ${config.mysql.database}`);
    console.log(`📁 上传目录: ${config.upload.dir}`);
  });
}

bootstrap();
