
import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { createProjectService, getProjectsService, } from "./project.service.js";

export async function createProjectController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const project = await createProjectService(
      {
        userId: req.user.userId,
        organizationId: req.user.organizationId,
        roleId: req.user.roleId,
      },
      req.body
    );

    return res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case "VALIDATION_ERROR":
          return res.status(400).json({
            message: "Invalid project data",
          });

        case "MANAGER_REQUIRED":
          return res.status(400).json({
            message: "Please select a project manager",
          });

        case "INVALID_PROJECT_MANAGER":
          return res.status(400).json({
            message: "The selected manager is invalid or inactive",
          });

        case "FORBIDDEN":
          return res.status(403).json({
            message: "You are not allowed to create projects",
          });

        case "PROJECT_CREATION_FAILED":
          return res.status(500).json({
            message: "Project creation failed",
          });
      }
    }

    console.error("Create project error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}



export async function getProjectsController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const projects = await getProjectsService({
      userId: req.user.userId,
      organizationId: req.user.organizationId,
      roleId: req.user.roleId,
    });

    return res.status(200).json({
      projects,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return res.status(403).json({
        message: "You are not allowed to view projects",
      });
    }

    console.error("Get projects error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}
