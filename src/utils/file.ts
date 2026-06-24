// backend/src/utils/file.ts
import fs from "fs";
import path from "path";
import config from "../config/config.js";

// 确保上传目录存在
export const ensureUploadDir = (): void => {
  if (!fs.existsSync(config.upload.dir)) {
    fs.mkdirSync(config.upload.dir, { recursive: true });
  }
};

// 获取文件扩展名
export const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase();
};

// 检查文件类型是否允许
export const isAllowedFileType = (filename: string): boolean => {
  const ext = getFileExtension(filename);
  return config.upload.allowedTypes.includes(ext);
};

// 删除文件
export const deleteFile = (filePath: string): void => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};
