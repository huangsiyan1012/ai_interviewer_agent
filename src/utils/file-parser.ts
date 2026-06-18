import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";
import WordExtractor from "word-extractor";

/**
 * 从简历文件中提取纯文本
 * 支持：.txt / .pdf / .doc / .docx
 */
export async function extractResumeText(
  filePath: string,
  fileName: string,
): Promise<string> {
  const ext = path.extname(fileName).toLowerCase();

  if (ext === ".txt") {
    return readTextFile(filePath);
  }

  if (ext === ".pdf") {
    const buffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
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

function readTextFile(filePath: string): string {
  const text = fs.readFileSync(filePath, "utf-8").trim();
  return ensureNotEmpty(text, "文本");
}

function ensureNotEmpty(text: string, label: string): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) {
    throw new Error(`${label} 文件未能提取到有效文字，请检查文件内容`);
  }
  return trimmed;
}
