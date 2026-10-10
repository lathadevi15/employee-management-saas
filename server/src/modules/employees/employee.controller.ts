
import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { authorizeEmployeeCreation } from "./employee.service.js";

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

  try {
    const { roleId } = req.user;

    await authorizeEmployeeCreation(roleId);

    return res.status(501).json({
      success: false,
      message: "Authorization passed. Employee creation is not implemented yet.",
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "FORBIDDEN_EMPLOYEE_CREATION"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to create employees",
      });
    }

    console.error("Employee authorization error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to authorize employee creation",
    });
  }
}
