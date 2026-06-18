import { Router } from "express";
import {
  finishInterview,
  getSession,
  startInterview,
  submitAnswer,
} from "../controllers/interview.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.post("/", startInterview);
router.get("/:id", getSession);
router.post("/:id/answer", submitAnswer);
router.post("/:id/finish", finishInterview);

export default router;
