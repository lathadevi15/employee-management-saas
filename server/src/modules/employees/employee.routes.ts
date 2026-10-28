
import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
  createEmployeeController,
  getEmployeesController,
  updateEmployeeController,
  deleteEmployeeController,
  getActiveManagersController
} from "./employee.controller.js";

const router = Router();

router.post("/", authenticate, createEmployeeController);
router.get("/", authenticate, getEmployeesController);
router.put("/:id", authenticate, updateEmployeeController);
router.delete("/:id", authenticate, deleteEmployeeController);
router.get("/managers", authenticate, getActiveManagersController);

export default router;
