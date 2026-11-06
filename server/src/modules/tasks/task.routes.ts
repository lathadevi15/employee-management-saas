import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";

import {
  createTaskController,
  getTasksController,
  getTaskByIdController,
} from "./task.controller";

const router = Router();

router.post("/", authenticate, createTaskController);

router.get("/", authenticate, getTasksController);

router.get("/:id", authenticate, getTaskByIdController);

export default router;