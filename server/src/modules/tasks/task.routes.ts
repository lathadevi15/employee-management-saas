import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";

import {
  createTaskController,
  getTasksController,
  getTaskByIdController,
  getAvailableAssigneesController,
  updateTaskAssigneeController,
    updateTaskStatusController,
    updateTaskController
} from "./task.controller";

const router = Router();

router.post("/", authenticate, createTaskController);

router.get("/", authenticate, getTasksController);

router.get("/:id", authenticate, getTaskByIdController);

router.put("/:id", authenticate, updateTaskController);

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

router.patch(
  "/:id/status",
  authenticate,
  updateTaskStatusController
);

export default router;