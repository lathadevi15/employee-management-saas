
import { Response } from "express";

import { AuthenticatedRequest } from "../../middleware/auth.middleware.js";

import {
  getNotificationsService,
  markNotificationReadService,
  markAllNotificationsReadService,
  deleteNotificationService,
} from "./notification.service.js";

// Get notifications for the authenticated user.
export async function getNotificationsController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const notifications = await getNotificationsService(
      {
        userId: req.user.userId,
        organizationId: req.user.organizationId,
        roleId: req.user.roleId,
      },
      req.query
    );

    return res.status(200).json({
      notifications,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ZodError") {
      return res.status(400).json({
        message: "Invalid pagination parameters",
      });
    }

    console.error("Get notifications error:", error);

    return res.status(500).json({
      message: "Failed to retrieve notifications",
    });
  }
}

// Mark one notification as read.
export async function markNotificationReadController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const notificationId = Number(req.params.id);

    if (!Number.isInteger(notificationId) || notificationId <= 0) {
      return res.status(400).json({
        message: "Invalid notification ID",
      });
    }

    const result = await markNotificationReadService(
      {
        userId: req.user!.userId,
        organizationId: req.user!.organizationId,
        roleId: req.user!.roleId,
      },
      notificationId
    );

    return res.status(200).json(result);
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message === "NOTIFICATION_NOT_FOUND"
    ) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    console.error("Mark notification as read error:", error);

    return res.status(500).json({
      message: "Failed to mark notification as read",
    });
  }
}

// Mark all notifications as read.
export async function markAllNotificationsReadController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const result = await markAllNotificationsReadService({
      userId: req.user!.userId,
      organizationId: req.user!.organizationId,
      roleId: req.user!.roleId,
    });

    return res.status(200).json(result);
  } catch (error: unknown) {
    console.error("Mark all notifications as read error:", error);

    return res.status(500).json({
      message: "Failed to mark all notifications as read",
    });
  }
}

// Delete one notification.
export async function deleteNotificationController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const notificationId = Number(req.params.id);

    if (!Number.isInteger(notificationId) || notificationId <= 0) {
      return res.status(400).json({
        message: "Invalid notification ID",
      });
    }

    const result = await deleteNotificationService(
      {
        userId: req.user!.userId,
        organizationId: req.user!.organizationId,
        roleId: req.user!.roleId,
      },
      notificationId
    );

    return res.status(200).json(result);
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message === "NOTIFICATION_NOT_FOUND"
    ) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    console.error("Delete notification error:", error);

    return res.status(500).json({
      message: "Failed to delete notification",
    });
  }
}
