import { Request, Response } from "express";
import { registerSchema, loginSchema } from "./auth.schema.js";
import { loginUser, registerUser } from "./auth.service.js";
import {
  AuthenticatedRequest,
} from "../../middleware/auth.middleware.js";

export async function register(
  req: Request,
  res: Response
)
 {
  try {
    const validationResult = registerSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationResult.error.flatten().fieldErrors,
      });
    }

    const result = await registerUser(validationResult.data);

    return res.status(201).json({
      success: true,
      message: "Organization and admin account created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
}

export async function login(
  req: Request,
  res: Response
) {
  try {
    const validationResult = loginSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationResult.error.flatten().fieldErrors,
      });
    }

    const { email, password } = validationResult.data;

    const result = await loginUser(email, password);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }
}

export async function getCurrentUser(
  req: AuthenticatedRequest,
  res: Response
) {
  return res.status(200).json({
    success: true,
    data: {
      userId: req.user!.userId,
      organizationId: req.user!.organizationId,
      roleId: req.user!.roleId,
    },
  });
}