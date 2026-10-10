
import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { createEmployeeController } from "./employee.controller.js";

const router = Router();

router.post("/", authenticate, createEmployeeController);

export default router;
