
import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import {
  getDepartments,
  createDepartmentService,
  updateDepartmentService,
  deleteDepartmentService,
  getDepartmentEmployeesService,
} from "./department.service.js";

export async function getDepartmentsController(
  req: AuthenticatedRequest,
  res: Response
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  try {
    // Always use the organization ID from the authenticated user.
    const departments = await getDepartments(
      req.user.organizationId
    );

    return res.status(200).json({
      success: true,
      data: departments,
    });
  } catch (error) {
    console.error("Get departments error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch departments",
    });
  }
}


export async function createDepartmentController(
  req: AuthenticatedRequest,
  res: Response
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  try {
    const department = await createDepartmentService(
      req.user.organizationId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: department,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "VALIDATION_ERROR") {
        return res.status(400).json({
          success: false,
          message: "Invalid department name. It must contain 2–100 characters.",
        });
      }

      if (error.message === "DEPARTMENT_ALREADY_EXISTS") {
        return res.status(409).json({
          success: false,
          message: "A department with this name already exists.",
        });
      }
    }

    console.error("Create department error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create department",
    });
  }
}


export async function updateDepartmentController(
  req: AuthenticatedRequest,
  res: Response
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const departmentId = Number(req.params.id);

  if (
    !Number.isSafeInteger(departmentId) ||
    departmentId <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid department ID",
    });
  }

  try {
    const department = await updateDepartmentService(
      req.user.organizationId,
      departmentId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Department updated successfully",
      data: department,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "VALIDATION_ERROR") {
        return res.status(400).json({
          success: false,
          message: "Invalid department name",
        });
      }

      if (error.message === "DEPARTMENT_ALREADY_EXISTS") {
        return res.status(409).json({
          success: false,
          message: "A department with this name already exists",
        });
      }

      if (error.message === "DEPARTMENT_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }
    }

    console.error("Update department error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update department",
    });
  }
}



export async function deleteDepartmentController(
  req: AuthenticatedRequest,
  res: Response
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const departmentId = Number(req.params.id);

  if (!Number.isSafeInteger(departmentId) || departmentId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid department ID",
    });
  }

  try {
    await deleteDepartmentService(
      req.user.organizationId,
      departmentId
    );

    return res.status(200).json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "DEPARTMENT_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }

      if (error.message === "DEPARTMENT_HAS_EMPLOYEES") {
        return res.status(409).json({
          success: false,
          message:
            "Cannot delete this department because employees are assigned to it. Reassign them first.",
        });
      }

      if (
        "code" in error &&
        (error as Error & { code?: string }).code ===
          "ER_ROW_IS_REFERENCED_2"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Cannot delete this department because employees are assigned to it. Reassign them first.",
        });
      }
    }

    console.error("Delete department error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete department",
    });
  }
}



export async function getDepartmentEmployeesController(
  req: AuthenticatedRequest,
  res: Response
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const departmentId = Number(req.params.id);

  if (!Number.isSafeInteger(departmentId) || departmentId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid department ID",
    });
  }

  try {
    const data = await getDepartmentEmployeesService(
      req.user.organizationId,
      departmentId
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message === "DEPARTMENT_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    console.error("Get department employees error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve department employees",
    });
  }
}
