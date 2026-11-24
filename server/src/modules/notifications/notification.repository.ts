
import {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

import {
  CreateNotificationInput,
  NotificationRow,
} from "./notification.types";

// MySQL rows must extend RowDataPacket.
interface NotificationDbRow
  extends NotificationRow, RowDataPacket {}

interface CountRow extends RowDataPacket {
  total: number;
  unread: number;
}

// Create a notification.
export async function createNotification(
  connection: PoolConnection,
  data: CreateNotificationInput
): Promise<number> {
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO notifications (
      organization_id,
      user_id,
      actor_id,
      type,
      title,
      message,
      entity_type,
      entity_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.organizationId,
      data.userId,
      data.actorId,
      data.type,
      data.title,
      data.message,
      data.entityType,
      data.entityId,
    ]
  );

  return result.insertId;
}

// Fetch notifications for a specific user.
export async function findNotificationsByUser(
  connection: PoolConnection,
  organizationId: number,
  userId: number,
  limit: number,
  offset: number
): Promise<NotificationDbRow[]> {
  const [rows] = await connection.execute<NotificationDbRow[]>(
    `SELECT
      id,
      organization_id,
      user_id,
      actor_id,
      type,
      title,
      message,
      entity_type,
      entity_id,
      is_read,
      read_at,
      created_at
    FROM notifications
    WHERE organization_id = ?
      AND user_id = ?
    ORDER BY created_at DESC, id DESC
    LIMIT ? OFFSET ?`,
    [organizationId, userId, limit, offset]
  );

  return rows;
}

// Count total and unread notifications.
export async function getNotificationCounts(
  connection: PoolConnection,
  organizationId: number,
  userId: number
): Promise<CountRow> {
  const [rows] = await connection.execute<CountRow[]>(
    `SELECT
      COUNT(*) AS total,
      COALESCE(SUM(is_read = 0), 0) AS unread
    FROM notifications
    WHERE organization_id = ?
      AND user_id = ?`,
    [organizationId, userId]
  );

  return rows[0];
}

// Mark one notification as read.
export async function markNotificationAsRead(
  connection: PoolConnection,
  organizationId: number,
  userId: number,
  notificationId: number
): Promise<boolean> {
  const [result] = await connection.execute<ResultSetHeader>(
    `UPDATE notifications
     SET
       is_read = 1,
       read_at = CURRENT_TIMESTAMP
     WHERE id = ?
       AND organization_id = ?
       AND user_id = ?
       AND is_read = 0`,
    [notificationId, organizationId, userId]
  );

  return result.affectedRows > 0;
}

// Mark all unread notifications as read.
export async function markAllNotificationsAsRead(
  connection: PoolConnection,
  organizationId: number,
  userId: number
): Promise<number> {
  const [result] = await connection.execute<ResultSetHeader>(
    `UPDATE notifications
     SET
       is_read = 1,
       read_at = CURRENT_TIMESTAMP
     WHERE organization_id = ?
       AND user_id = ?
       AND is_read = 0`,
    [organizationId, userId]
  );

  return result.affectedRows;
}

// Delete one notification.
export async function deleteNotification(
  connection: PoolConnection,
  organizationId: number,
  userId: number,
  notificationId: number
): Promise<boolean> {
  const [result] = await connection.execute<ResultSetHeader>(
    `DELETE FROM notifications
     WHERE id = ?
       AND organization_id = ?
       AND user_id = ?`,
    [notificationId, organizationId, userId]
  );

  return result.affectedRows > 0;
}
