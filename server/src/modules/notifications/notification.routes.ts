
import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware.js";

import {
  getNotificationsController,
  markNotificationReadController,
  markAllNotificationsReadController,
  deleteNotificationController,
} from "./notification.controller.js";

const router = Router();

// All notification routes require authentication.
router.use(authenticate);

// GET /notifications
router.get("/", getNotificationsController);

// PATCH /notifications/read-all
// Keep this route before /:id/read.
router.patch("/read-all", markAllNotificationsReadController);

// PATCH /notifications/:id/read
router.patch("/:id/read", markNotificationReadController);

// DELETE /notifications/:id
router.delete("/:id", deleteNotificationController);

export default router;
