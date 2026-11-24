
import { db } from "../../config/database.js";

import {
  findNotificationsByUser,
  getNotificationCounts,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "./notification.repository.js";

import { getNotificationsSchema } from "./notification.schema.js";
import { NotificationActor } from "./notification.types.js";

// Get notifications for the authenticated user.
export async function getNotificationsService(
  actor: NotificationActor,
  query: unknown
) {
  const validatedQuery = getNotificationsSchema.parse(query);

  const { page, limit } = validatedQuery;
  const offset = (page - 1) * limit;

  const connection = await db.getConnection();

  try {
    // Fetch notifications and counts for this user.
    const [notifications, counts] = await Promise.all([
      findNotificationsByUser(
        connection,
        actor.organizationId,
        actor.userId,
        limit,
        offset
      ),

      getNotificationCounts(
        connection,
        actor.organizationId,
        actor.userId
      ),
    ]);

    const total = Number(counts.total);
    const unreadCount = Number(counts.unread);

    return {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } finally {
    connection.release();
  }
}

// Mark one notification as read.
export async function markNotificationReadService(
  actor: NotificationActor,
  notificationId: number
) {
  const connection = await db.getConnection();

  try {
    const updated = await markNotificationAsRead(
      connection,
      actor.organizationId,
      actor.userId,
      notificationId
    );

    if (!updated) {
      throw new Error("NOTIFICATION_NOT_FOUND");
    }

    return {
      message: "Notification marked as read successfully",
    };
  } finally {
    connection.release();
  }
}

// Mark all notifications as read.
export async function markAllNotificationsReadService(
  actor: NotificationActor
) {
  const connection = await db.getConnection();

  try {
    const updatedCount = await markAllNotificationsAsRead(
      connection,
      actor.organizationId,
      actor.userId
    );

    return {
      updatedCount,
      message: "All notifications marked as read",
    };
  } finally {
    connection.release();
  }
}

// Delete one notification.
export async function deleteNotificationService(
  actor: NotificationActor,
  notificationId: number
) {
  const connection = await db.getConnection();

  try {
    const deleted = await deleteNotification(
      connection,
      actor.organizationId,
      actor.userId,
      notificationId
    );

    if (!deleted) {
      throw new Error("NOTIFICATION_NOT_FOUND");
    }

    return {
      message: "Notification deleted successfully",
    };
  } finally {
    connection.release();
  }
}
