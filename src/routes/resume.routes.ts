/**
 * 简历相关路由
 *
 * 所有 /api/resumes 下的请求都会先经过 authMiddleware（必须登录）。
 */
import { Router } from "express";
import {
  getResume,
  uploadResume,
  uploadResumeText,
} from "../controllers/resume.controller";
import { authMiddleware } from "../middleware/auth";
import upload from "../middleware/upload";

const router = Router();

// 本路由下所有接口都需要 JWT 登录
router.use(authMiddleware);

// POST /api/resumes       — 上传 PDF/Word/TXT 文件（字段名 file）
router.post("/", upload.single("file"), uploadResume);

// POST /api/resumes/text  — 粘贴纯文字简历
router.post("/text", uploadResumeText);

// GET  /api/resumes/:id   — 查询某份简历详情
router.get("/:id", getResume);

export default router;
