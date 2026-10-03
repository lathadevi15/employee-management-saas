import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
  getCurrentUser,
  login,
  register,
} from "./auth.controller.js";
const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getCurrentUser);

export default router;