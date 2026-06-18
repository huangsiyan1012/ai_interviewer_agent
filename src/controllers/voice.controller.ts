import type { Request, Response, NextFunction } from "express";
import { voiceService } from "../services/voice.service";

/** POST /api/voice/tts — 文字转 MP3 音频 */
export const synthesize = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      res.status(400).json({ success: false, error: "缺少 text 参数" });
      return;
    }

    const audio = await voiceService.synthesize(text);
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(audio);
  } catch (err) {
    next(err);
  }
};
