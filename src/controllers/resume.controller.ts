import type { Request, Response, NextFunction } from "express";
import { resumeService } from "../services/resume.service";

export const uploadResume = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: "请上传简历文件" });
      return;
    }
    const data = await resumeService.uploadResume(req.file, req.userId!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

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
