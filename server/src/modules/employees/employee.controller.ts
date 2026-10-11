
import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { createEmployeeSchema } from "./employee.schema.js";
import {
  authorizeEmployeeCreation,
  createEmployee,
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

