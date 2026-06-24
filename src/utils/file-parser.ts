/**
 * 文件文本提取工具
 *
 * 作用：把 PDF / Word / TXT 文件变成纯文字字符串，
 * 因为 LLM 只能读文字，不能直接读二进制文件。
 */
import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";
import WordExtractor from "word-extractor";

/**
 * 根据文件扩展名选择不同的解析方式
 * @param filePath  磁盘上的文件绝对路径
 * @param fileName  原始文件名（用来判断 .pdf / .docx 等）
 */
export async function extractResumeText(
  filePath: string,
  fileName: string,
): Promise<string> {
  const ext = path.extname(fileName).toLowerCase(); // 取 ".pdf" 这类后缀

  if (ext === ".txt") {
    return readTextFile(filePath);
  }

  if (ext === ".pdf") {
    const buffer = fs.readFileSync(filePath); // 读成二进制 Buffer
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText(); // pdf-parse 库提取文字
    return ensureNotEmpty(result.text, "PDF");
  }

  if (ext === ".doc" || ext === ".docx") {
    const extractor = new WordExtractor();
    const doc = await extractor.extract(filePath);
    return ensureNotEmpty(doc.getBody(), "Word");
  }

  throw new Error(
    `不支持的文件格式 ${ext}，请上传 .txt / .pdf / .doc / .docx`,
  );
}

/** 读取 UTF-8 文本文件 */
function readTextFile(filePath: string): string {
  const text = fs.readFileSync(filePath, "utf-8").trim();
  return ensureNotEmpty(text, "文本");
}

/** 去掉多余空白，若为空则抛错 */
function ensureNotEmpty(text: string, label: string): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) {
    throw new Error(`${label} 文件未能提取到有效文字，请检查文件内容`);
  }
  return trimmed;
}
