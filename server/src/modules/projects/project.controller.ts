
import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { createProjectService, getProjectsService, getProjectByIdService, getProjectMembersService,
  getAvailableProjectMembersService, addProjectMembersService, removeProjectMemberService
 } from "./project.service.js";

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

export async function getProjectByIdController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const projectId = Number(req.params.id);

    const project = await getProjectByIdService(
      {
        userId: req.user!.userId,
        organizationId: req.user!.organizationId,
        roleId: req.user!.roleId,
      },
      projectId
    );

    return res.status(200).json({ project });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "FORBIDDEN") {
        return res.status(403).json({ message: "Access forbidden" });
      }

      if (
        error.message === "PROJECT_NOT_FOUND" ||
        error.message === "INVALID_PROJECT_ID"
      ) {
        return res.status(404).json({ message: "Project not found" });
      }
    }

    console.error("Get project by ID error:", error);
    return res.status(500).json({ message: "Failed to retrieve project" });
  }
}


export async function getProjectMembersController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const projectId = Number(req.params.id);

    const members = await getProjectMembersService(
      {
        userId: req.user!.userId,
        organizationId: req.user!.organizationId,
        roleId: req.user!.roleId,
      },
      projectId
    );

    return res.status(200).json({ members });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "FORBIDDEN") {
        return res.status(403).json({
          message: "Access forbidden",
        });
      }

      if (
        error.message === "PROJECT_NOT_FOUND" ||
        error.message === "INVALID_PROJECT_ID"
      ) {
        return res.status(404).json({
          message: "Project not found",
        });
      }
    }

    console.error("Get project members error:", error);

    return res.status(500).json({
      message: "Failed to retrieve project members",
    });
  }
}



export async function getAvailableProjectMembersController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const projectId = Number(req.params.id);

    const members = await getAvailableProjectMembersService(
      {
        userId: req.user!.userId,
        organizationId: req.user!.organizationId,
        roleId: req.user!.roleId,
      },
      projectId
    );

    return res.status(200).json({ members });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "FORBIDDEN") {
        return res.status(403).json({
          message: "Access forbidden",
        });
      }

      if (
        error.message === "PROJECT_NOT_FOUND" ||
        error.message === "INVALID_PROJECT_ID"
      ) {
        return res.status(404).json({
          message: "Project not found",
        });
      }
    }

    console.error("Get available project members error:", error);

    return res.status(500).json({
      message: "Failed to retrieve available employees",
    });
  }
}

export async function addProjectMembersController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const projectId = Number(req.params.id);

    const result = await addProjectMembersService(
      {
        userId: req.user!.userId,
        organizationId: req.user!.organizationId,
        roleId: req.user!.roleId,
      },
      projectId,
      req.body
    );

    return res.status(201).json({
      message: "Project members added successfully",
      ...result,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "FORBIDDEN") {
        return res.status(403).json({ message: "Access forbidden" });
      }

      if (
        error.message === "PROJECT_NOT_FOUND" ||
        error.message === "INVALID_PROJECT_ID"
      ) {
        return res.status(404).json({ message: "Project not found" });
      }

      if (
        error.message === "VALIDATION_ERROR" ||
        error.message === "DUPLICATE_USER_IDS" ||
        error.message === "INVALID_PROJECT_MEMBERS" ||
        error.message === "MEMBERS_ALREADY_ASSIGNED"
      ) {
        return res.status(400).json({ message: error.message });
      }
    }

    console.error("Add project members error:", error);

    return res.status(500).json({
      message: "Failed to add project members",
    });
  }
}



export async function removeProjectMemberController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const projectId = Number(req.params.id);
    const userId = Number(req.params.userId);

    const result = await removeProjectMemberService(
      {
        userId: req.user!.userId,
        organizationId: req.user!.organizationId,
        roleId: req.user!.roleId,
      },
      projectId,
      userId
    );

    return res.status(200).json({
      message: "Project member removed successfully",
      ...result,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "FORBIDDEN") {
        return res.status(403).json({ message: "Access forbidden" });
      }

      if (error.message === "PROJECT_NOT_FOUND") {
        return res.status(404).json({ message: "Project not found" });
      }

      if (error.message === "PROJECT_MEMBER_NOT_FOUND") {
        return res.status(404).json({ message: "Project member not found" });
      }

      if (
        error.message === "INVALID_ID" ||
        error.message === "CANNOT_REMOVE_PROJECT_MANAGER"
      ) {
        return res.status(400).json({ message: error.message });
      }
    }

    console.error("Remove project member error:", error);

    return res.status(500).json({
      message: "Failed to remove project member",
    });
  }
}
