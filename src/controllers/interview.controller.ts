import type { Request, Response, NextFunction } from "express";
import { interviewService } from "../services/interview.service";

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
      resumeId,
      jobDescription,
      req.userId!,
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

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
