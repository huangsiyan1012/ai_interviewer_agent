-- AI 智能面试官数据库初始化脚本
CREATE DATABASE IF NOT EXISTS ai_interview DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ai_interview;

-- 用户账号
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 候选人（关联登录用户）
CREATE TABLE IF NOT EXISTS candidates (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NULL,
  name VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 岗位
CREATE TABLE IF NOT EXISTS jobs (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  jd_text TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 简历
CREATE TABLE IF NOT EXISTS resumes (
  id VARCHAR(36) PRIMARY KEY,
  candidate_id VARCHAR(36) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  parsed_data JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

-- 面试会话
CREATE TABLE IF NOT EXISTS interview_sessions (
  id VARCHAR(36) PRIMARY KEY,
  candidate_id VARCHAR(36) NOT NULL,
  resume_id VARCHAR(36) NOT NULL,
  job_role VARCHAR(100) NOT NULL,
  status ENUM('created', 'in_progress', 'completed') DEFAULT 'created',
  current_round INT DEFAULT 0,
  max_rounds INT DEFAULT 8,
  graph_state JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

-- 面试问答记录
CREATE TABLE IF NOT EXISTS interview_records (
  id VARCHAR(36) PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL,
  round_num INT NOT NULL,
  question JSON NOT NULL,
  answer TEXT NOT NULL,
  score INT DEFAULT 0,
  score_detail JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE
);

-- 评估报告
CREATE TABLE IF NOT EXISTS final_reports (
  id VARCHAR(36) PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL UNIQUE,
  candidate_id VARCHAR(36) NOT NULL,
  job_role VARCHAR(100) NOT NULL,
  total_score INT NOT NULL,
  report_data JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

-- 预置岗位数据
INSERT IGNORE INTO jobs (id, title, category, jd_text) VALUES
('job-001', '前端开发', '技术', '负责 Web 前端开发，熟悉 Vue/React、TypeScript、前端工程化。'),
('job-002', 'Java后端', '技术', '负责后端服务开发，熟悉 Java、Spring Boot、MySQL、微服务架构。'),
('job-003', '测试工程师', '技术', '负责软件测试，熟悉功能测试、自动化测试、性能测试。'),
('job-004', '产品经理', '产品', '负责产品规划与需求分析，具备用户调研、原型设计能力。');
