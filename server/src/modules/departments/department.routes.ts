
import { Router } from "express";
import {
  authenticate,
  authorizeRoles,
} from "../../middleware/auth.middleware.js";
import {
  createDepartmentController,
  getDepartmentsController,
  updateDepartmentController,
  deleteDepartmentController,
} from "./department.controller.js";

const router = Router();

// Any authenticated user can view departments.
router.get("/", authenticate, getDepartmentsController);

// Only organization admins can create departments.
router.post(
  "/",
  authenticate,
  authorizeRoles("organization_admin"),
  createDepartmentController
);

// Only organization admins can update departments.
router.put(
  "/:id",
  authenticate,
  authorizeRoles("organization_admin"),
  updateDepartmentController
);
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("organization_admin"),
  deleteDepartmentController
);

export default router;
