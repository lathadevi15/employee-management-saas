
import { Router } from "express";
import {
  authenticate,
  authorizeRoles,
} from "../../middleware/auth.middleware.js";
import {
  createDepartmentController,
  getDepartmentsController,
} from "./department.controller.js";

const router = Router();

// Any authenticated user in the organization can view departments.
router.get("/", authenticate, getDepartmentsController);

// Only organization admins can create departments.
router.post(
  "/",
  authenticate,
  authorizeRoles("organization_admin"),
  createDepartmentController
);

export default router;
