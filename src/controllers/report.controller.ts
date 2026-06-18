import type { Request, Response, NextFunction } from "express";
import { reportService } from "../services/report.service";

export const getReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await reportService.getReport(
      String(req.params.id),
      req.userId!,
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getReportBySession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await reportService.getReportBySession(
      String(req.params.sessionId),
      req.userId!,
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const listMyReports = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await reportService.listMyReports(req.userId!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
