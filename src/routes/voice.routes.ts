import { Router } from "express";
import { synthesize } from "../controllers/voice.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);
router.post("/tts", synthesize);

export default router;
