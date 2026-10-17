
import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { createEmployeeSchema, updateEmployeeSchema } from "./employee.schema.js";
import {
  authorizeEmployeeCreation,
  createEmployee,
  getEmployees,
  updateEmployee,
  removeEmployee,
} from "./employee.service.js";


export async function createEmployeeController(
  req: AuthenticatedRequest,
  res: Response
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  // 1. Validate the request body.
  const validationResult = createEmployeeSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: validationResult.error.flatten().fieldErrors,
    });
  }

  try {
    // 2. Authorize the requester.
    await authorizeEmployeeCreation(req.user.roleId);

    // 3. Create the employee using the verified organization ID.
    const employee = await createEmployee(
      validationResult.data,
      req.user.organizationId
    );

    return res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: employee,
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      return res.status(500).json({
        success: false,
        message: "An unexpected error occurred",
      });
    }

    switch (error.message) {
      case "FORBIDDEN_EMPLOYEE_CREATION":
        return res.status(403).json({
          success: false,
          message: "You are not allowed to create employees",
        });

      case "INVALID_EMPLOYEE_ROLE":
        return res.status(400).json({
          success: false,
          message: "Invalid employee role",
        });

      case "EMPLOYEE_EMAIL_EXISTS":
        return res.status(409).json({
          success: false,
          message: "An account with this email already exists",
        });

      case "EMPLOYEE_CODE_EXISTS":
        return res.status(409).json({
          success: false,
          message: "This employee code is already in use",
        });

      default:
        console.error("Employee creation error:", error);

        return res.status(500).json({
          success: false,
          message: "Unable to create employee",
        });
    }
  }
}

export async function getEmployeesController(
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
    // Always use the organization from the authenticated user.
    const employees = await getEmployees(
      req.user.organizationId
    );

    return res.status(200).json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error("Get employees error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch employees",
    });
  }
}


export async function updateEmployeeController(
  req: AuthenticatedRequest,
  res: Response
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const employeeId = Number(req.params.id);

  if (!Number.isSafeInteger(employeeId) || employeeId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid employee ID",
    });
  }

  const validationResult = updateEmployeeSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: validationResult.error.flatten().fieldErrors,
    });
  }

  try {
    // Only organization admins may update employees.
    await authorizeEmployeeCreation(req.user.roleId);

    const employee = await updateEmployee(
      employeeId,
      req.user.organizationId,
      validationResult.data
    );

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: employee,
    });
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case "FORBIDDEN_EMPLOYEE_CREATION":
          return res.status(403).json({
            success: false,
            message: "You are not allowed to update employees",
          });

        case "EMPLOYEE_NOT_FOUND":
          return res.status(404).json({
            success: false,
            message: "Employee not found",
          });

        case "INVALID_EMPLOYEE_ROLE":
          return res.status(400).json({
            success: false,
            message: "Invalid employee role",
          });

        case "EMPLOYEE_EMAIL_EXISTS":
          return res.status(409).json({
            success: false,
            message: "An account with this email already exists",
          });

        case "EMPLOYEE_CODE_EXISTS":
          return res.status(409).json({
            success: false,
            message: "This employee code is already in use",
          });
      }
    }

    console.error("Employee update error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update employee",
    });
  }
}


export async function deleteEmployeeController(
  req: AuthenticatedRequest,
  res: Response
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const employeeId = Number(req.params.id);

  if (!Number.isSafeInteger(employeeId) || employeeId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid employee ID",
    });
  }

  try {
    // Only organization admins may delete employees.
    await authorizeEmployeeCreation(req.user.roleId);

    await removeEmployee(
      employeeId,
      req.user.organizationId
    );

    return res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case "FORBIDDEN_EMPLOYEE_CREATION":
          return res.status(403).json({
            success: false,
            message: "You are not allowed to delete employees",
          });

        case "EMPLOYEE_NOT_FOUND":
          return res.status(404).json({
            success: false,
            message: "Employee not found",
          });
      }
    }

    console.error("Employee deletion error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete employee",
    });
  }
}
