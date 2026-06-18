import type { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password, nickname } = req.body;
    const data = await authService.register(email, password, nickname);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;
    const data = await authService.login(email, password);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await authService.getProfile(req.userId!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
