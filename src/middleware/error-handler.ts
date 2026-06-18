import type { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error("API Error:", err.message);
  const status = err.message.includes("不存在") ? 404 : 500;
  res.status(status).json({
    success: false,
    error: err.message || "服务器内部错误",
  });
};
