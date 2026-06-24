/**
 * 面试 Controller — HTTP 层
 *
 * 四个接口对应面试的四个阶段：
 *   startInterview  → 开始，Agent 出第一题
 *   getSession      → 恢复会话
 *   submitAnswer    → 每轮提交回答
 *   finishInterview → 结束，触发评估报告
 */
import type { Request, Response, NextFunction } from "express";
import { interviewService } from "../services/interview.service";

/** POST /api/interviews — 开始面试 */
export const startInterview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { resumeId, jobDescription } = req.body;

    if (!resumeId || !jobDescription?.trim()) {
      res.status(400).json({
        success: false,
        error: "缺少 resumeId 或 jobDescription",
      });
      return;
    }

    const data = await interviewService.startInterview(
      resumeId,           // 上一步简历解析得到的 ID
      jobDescription,     // 用户在首页填写的岗位描述
      req.userId!,        // JWT 里的当前用户 ID
    );

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/** GET /api/interviews/:id — 获取会话详情（页面刷新时用） */
export const getSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await interviewService.getSession(String(req.params.id), req.userId!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/** POST /api/interviews/:id/answer — 提交回答 */
export const submitAnswer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      res.status(400).json({ success: false, error: "回答内容不能为空" });
      return;
    }
    const data = await interviewService.submitAnswer(
      String(req.params.id),
      content,
      req.userId!,
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/** POST /api/interviews/:id/finish — 结束面试 */
export const finishInterview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await interviewService.finishInterview(
      String(req.params.id),
      req.userId!,
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
