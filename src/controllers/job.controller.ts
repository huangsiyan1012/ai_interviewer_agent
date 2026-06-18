import type { Request, Response, NextFunction } from "express";
import { jobService } from "../services/job.service";

export const listJobs = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await jobService.listJobs();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getJob = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await jobService.getJob(String(req.params.id));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
