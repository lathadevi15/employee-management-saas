
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { db } from "../config/database.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    organizationId: number;
    roleId: number;
  };
}

interface JwtPayload {
  userId: number;
  organizationId: number;
  roleId: number;
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const token = authHeader.slice("Bearer ".length).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET is not configured");

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }

    const decoded = jwt.verify(token, jwtSecret);

    if (typeof decoded !== "object" || decoded === null) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    const payload = decoded as jwt.JwtPayload & Partial<JwtPayload>;

   
if (
  typeof payload.userId !== "number" ||
  !Number.isSafeInteger(payload.userId) ||
  payload.userId <= 0 ||
  typeof payload.organizationId !== "number" ||
  !Number.isSafeInteger(payload.organizationId) ||
  payload.organizationId <= 0 ||
  typeof payload.roleId !== "number" ||
  !Number.isSafeInteger(payload.roleId) ||
  payload.roleId <= 0
) {
  return res.status(401).json({
    success: false,
    message: "Invalid authentication token",
  });
}


const [rows] = await db.execute(
  `SELECT status
   FROM users
   WHERE id = ? AND organization_id = ? AND role_id = ?
   LIMIT 1`,
  [
    payload.userId,
    payload.organizationId,
    payload.roleId,
  ]
);

const users = rows as { status: string }[];

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "User account not found or authentication is no longer valid",
      });
    }

    if (users[0].status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Contact your organization administrator.",
      });
    }

    req.user = {
      userId: payload.userId!,
      organizationId: payload.organizationId!,
      roleId: payload.roleId!,
    };

    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    console.error("Authentication middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to authenticate request",
    });
  }
}
