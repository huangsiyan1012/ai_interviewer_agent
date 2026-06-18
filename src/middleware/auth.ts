import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

/** 必须登录 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "请先登录" });
    return;
  }

  try {
    const payload = verifyToken(header.slice(7));
    req.userId = payload.userId;
    req.userEmail = payload.email;
    next();
  } catch {
    res.status(401).json({ success: false, error: "登录已过期，请重新登录" });
  }
}
