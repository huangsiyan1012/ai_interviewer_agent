import { Router } from "express";
import { getJob, listJobs } from "../controllers/job.controller";

const router = Router();

router.get("/", listJobs);
router.get("/:id", getJob);

export default router;
