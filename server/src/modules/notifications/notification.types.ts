
export type NotificationType =
  | "task_assigned"
  | "task_reassigned"
  | "task_status_updated"
  | "task_completed"
  | "project_invitation"
  | "project_updated";

export type NotificationEntityType =
  | "task"
  | "project"
  | null;

export interface NotificationRow {
  id: number;
  organization_id: number;
  user_id: number;
  actor_id: number | null;
  type: NotificationType;
  title: string;
  message: string;
  entity_type: NotificationEntityType;
  entity_id: number | null;
  is_read: boolean;
  read_at: Date | null;
  created_at: Date;
}

export interface NotificationActor {
  userId: number;
  organizationId: number;
  roleId: number;
}

export interface CreateNotificationInput {
  organizationId: number;
  userId: number;
  actorId: number | null;
  type: NotificationType;
  title: string;
  message: string;
  entityType: NotificationEntityType;
  entityId: number | null;
}
