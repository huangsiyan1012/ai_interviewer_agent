import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import config from "../config/config";

/**
 * 语音 Service — 文字转语音（TTS）
 *
 * 前端录音识别（STT）在浏览器完成，后端只负责 TTS 代理，
 * 避免在前端暴露第三方语音服务细节，并提供统一的 MP3 输出。
 */
export class VoiceService {
  /** 将文字合成为 MP3 音频 Buffer */
  async synthesize(text: string): Promise<Buffer> {
    const trimmed = text.trim();
    if (!trimmed) throw new Error("合成内容不能为空");

    const content = trimmed.slice(0, config.voice.maxTextLength);
    const tts = new MsEdgeTTS();

    await tts.setMetadata(
      config.voice.ttsVoice,
      OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3,
    );

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const { audioStream } = tts.toStream(content);

      audioStream.on("data", (chunk: Buffer) => chunks.push(chunk));
      audioStream.on("close", () => resolve(Buffer.concat(chunks)));
      audioStream.on("error", reject);
    });
  }
}

export const voiceService = new VoiceService();
