
import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
  createEmployeeController,
  getEmployeesController,
} from "./employee.controller.js";

const router = Router();

router.post("/", authenticate, createEmployeeController);
router.get("/", authenticate, getEmployeesController);

export default router;
