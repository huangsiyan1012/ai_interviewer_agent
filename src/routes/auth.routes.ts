import { Router } from "express";
import { getProfile, login, register } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getProfile);

export default router;
