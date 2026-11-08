import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";

import {
  createTaskController,
  getTasksController,
  getTaskByIdController,
  getAvailableAssigneesController,
  updateTaskAssigneeController
} from "./task.controller";

const router = Router();

router.post("/", authenticate, createTaskController);

router.get("/", authenticate, getTasksController);

router.get("/:id", authenticate, getTaskByIdController);

router.get(
  "/:id/available-assignees",
  authenticate,
  getAvailableAssigneesController
);

router.patch(
  "/:id/assignee",
  authenticate,
  updateTaskAssigneeController
);

export default router;