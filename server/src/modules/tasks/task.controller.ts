import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import {
  createTaskService,
  getTasksService,
  getTaskByIdService,
} from "./task.service";

export async function createTaskController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const result = await createTaskService(
      {
        userId: req.user!.userId,
        organizationId: req.user!.organizationId,
        roleId: req.user!.roleId,
      },
      req.body
    );

    return res.status(201).json({
      message: "Task created successfully",
      ...result,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "VALIDATION_ERROR") {
        return res.status(400).json({
          message: "Invalid task information",
        });
      }

      if (error.message === "FORBIDDEN") {
        return res.status(403).json({
          message: "Access forbidden",
        });
      }

      if (error.message === "PROJECT_NOT_FOUND") {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      if (error.message === "INVALID_ASSIGNEE") {
        return res.status(400).json({
          message: "Invalid or inactive employee",
        });
      }

      if (error.message === "ASSIGNEE_NOT_PROJECT_MEMBER") {
        return res.status(400).json({
          message: "Employee is not a member of this project",
        });
      }
    }

    console.error("Create task error:", error);

    return res.status(500).json({
      message: "Failed to create task",
    });
  }
}

export async function getTasksController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const tasks = await getTasksService({
      userId: req.user!.userId,
      organizationId: req.user!.organizationId,
      roleId: req.user!.roleId,
    });

    return res.status(200).json({ tasks });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return res.status(403).json({
        message: "Access forbidden",
      });
    }

    console.error("Get tasks error:", error);

    return res.status(500).json({
      message: "Failed to retrieve tasks",
    });
  }
}


export async function getTaskByIdController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const taskId = Number(req.params.id);

    const task = await getTaskByIdService(
      {
        userId: req.user!.userId,
        organizationId: req.user!.organizationId,
        roleId: req.user!.roleId,
      },
      taskId
    );

    return res.status(200).json({ task });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INVALID_TASK_ID") {
        return res.status(400).json({
          message: "Invalid task ID",
        });
      }

      if (error.message === "TASK_NOT_FOUND") {
        return res.status(404).json({
          message: "Task not found",
        });
      }

      if (error.message === "FORBIDDEN") {
        return res.status(403).json({
          message: "Access forbidden",
        });
      }
    }

    console.error("Get task error:", error);

    return res.status(500).json({
      message: "Failed to retrieve task",
    });
  }
}