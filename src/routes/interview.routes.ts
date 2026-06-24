/**
 * 面试相关路由
 *
 * 前缀：/api/interviews（在 app.ts 挂载）
 * 所有接口需要登录（authMiddleware）。
 */
import { Router } from "express";
import {
  finishInterview,
  getSession,
  startInterview,
  submitAnswer,
} from "../controllers/interview.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

// POST /api/interviews              — 开始面试（需 resumeId + jobDescription）
router.post("/", startInterview);

// GET  /api/interviews/:id          — 获取会话（刷新页面恢复对话）
router.get("/:id", getSession);

// POST /api/interviews/:id/answer   — 提交一轮回答
router.post("/:id/answer", submitAnswer);

// POST /api/interviews/:id/finish   — 结束面试，生成报告
router.post("/:id/finish", finishInterview);

export default router;
