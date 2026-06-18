-- 用户认证迁移（已有数据库执行此脚本）
USE ai_interview;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- candidates 关联用户（已有数据 user_id 为 NULL）
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS user_id VARCHAR(36) NULL;

-- MySQL 8.0.12 以下不支持 IF NOT EXISTS on ADD COLUMN，可手动执行：
-- ALTER TABLE candidates ADD COLUMN user_id VARCHAR(36) NULL;
