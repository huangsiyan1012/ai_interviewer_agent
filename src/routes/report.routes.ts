import { Router } from "express";
import {
  getReport,
  getReportBySession,
  listMyReports,
} from "../controllers/report.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.get("/my", listMyReports);
router.get("/session/:sessionId", getReportBySession);
router.get("/:id", getReport);

export default router;
