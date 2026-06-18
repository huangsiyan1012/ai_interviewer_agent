// backend/src/middleware/upload.ts
import multer from "multer";
import path from "path";
import config from "../config/config";
import { ensureUploadDir } from "../utils/file";

// 确保上传目录存在
ensureUploadDir();

// 配置文件存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.upload.dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

// 文件类型过滤
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (config.upload.allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `不支持的文件格式: ${ext}，请上传 ${config.upload.allowedTypes.join(", ")}`,
      ),
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxSize,
  },
});

export default upload;
