
import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { createProjectController, getProjectsController,} from "./project.controller.js";

const router = Router();

router.post("/", authenticate, createProjectController);
router.get("/", authenticate, getProjectsController);

export default router;
