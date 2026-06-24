/**
 * 简历 Controller — HTTP 层
 *
 * 职责：接收前端请求 → 做最基础的参数校验 → 调用 Service → 返回 JSON
 * 不做 AI 逻辑，不直接操作数据库。
 */
import type { Request, Response, NextFunction } from "express";
import { resumeService } from "../services/resume.service";

/** POST /api/resumes — 上传简历文件 */
export const uploadResume = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // upload 中间件把文件存到磁盘后，文件信息在 req.file
    if (!req.file) {
      res.status(400).json({ success: false, error: "请上传简历文件" });
      return;
    }

    // req.userId 由 authMiddleware 从 JWT 解析出来
    const data = await resumeService.uploadResume(req.file, req.userId!);

    res.json({ success: true, data });
  } catch (err) {
    // 出错交给全局 errorHandler 统一处理
    next(err);
  }
};

/** POST /api/resumes/text — 粘贴文字简历 */
export const uploadResumeText = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { content } = req.body;

    if (!content?.trim()) {
      res.status(400).json({ success: false, error: "简历内容不能为空" });
      return;
    }

    const data = await resumeService.uploadResumeFromText(content, req.userId!);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/** GET /api/resumes/:id — 查询简历 */
export const getResume = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await resumeService.getResume(String(req.params.id));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
