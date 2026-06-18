import { Router } from "express";
import {
  getResume,
  uploadResume,
  uploadResumeText,
} from "../controllers/resume.controller";
import { authMiddleware } from "../middleware/auth";
import upload from "../middleware/upload";

const router = Router();

router.use(authMiddleware);

router.post("/", upload.single("file"), uploadResume);
router.post("/text", uploadResumeText);
router.get("/:id", getResume);

export default router;
