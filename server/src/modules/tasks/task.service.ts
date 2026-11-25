import { db } from "../../config/database";
import {
  createTask,
  findTaskById,
  findTasksByOrganization,
  findTasksByManager,
  findTasksByEmployee,
   findAvailableAssigneesForProject,
  findAvailableAssigneesForOrganization,
  updateTaskAssignee,
  updateTaskStatus,
  updateTask,
  deleteTask 
} from "./task.repository";
import { createTaskSchema, updateTaskStatusSchema, updateTaskSchema  } from "./task.schema";
import { RowDataPacket } from "mysql2/promise";
import { createNotificationService } from "../notifications/notification.service";

export interface TaskActor {
  userId: number;
  organizationId: number;
  roleId: number;
}

const ORGANIZATION_ADMIN_ROLE_ID = 2;
const MANAGER_ROLE_ID = 3;
const EMPLOYEE_ROLE_ID = 4;


export async function createTaskService(
  actor: TaskActor,
  input: unknown
) {
  const validation = createTaskSchema.safeParse(input);

  if (!validation.success) {
    throw new Error("VALIDATION_ERROR");
  }

  if (
    actor.roleId !== ORGANIZATION_ADMIN_ROLE_ID &&
    actor.roleId !== MANAGER_ROLE_ID
  ) {
    throw new Error("FORBIDDEN");
  }

  const data = validation.data;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Verify project access when the task is project-linked.
    if (data.projectId !== null && data.projectId !== undefined) {
      const [projects] = await connection.execute<any[]>(
        `SELECT id, manager_id
         FROM projects
         WHERE id = ?
           AND organization_id = ?
         LIMIT 1`,
        [data.projectId, actor.organizationId]
      );

      if (projects.length === 0) {
        throw new Error("PROJECT_NOT_FOUND");
      }

      if (
        actor.roleId === MANAGER_ROLE_ID &&
        projects[0].manager_id !== actor.userId
      ) {
        throw new Error("FORBIDDEN");
      }
    }

    // Verify the assigned user.
    if (data.assignedTo !== null && data.assignedTo !== undefined) {
      const allowedRoleIds =
        actor.roleId === ORGANIZATION_ADMIN_ROLE_ID
          ? [MANAGER_ROLE_ID, EMPLOYEE_ROLE_ID]
          : [EMPLOYEE_ROLE_ID];

      const [users] = await connection.query<RowDataPacket[]>(
        `SELECT id
         FROM users
         WHERE id = ?
           AND organization_id = ?
           AND role_id IN (?)
           AND status = 'active'
         LIMIT 1`,
        [
          data.assignedTo,
          actor.organizationId,
          allowedRoleIds,
        ]
      );

      if (users.length === 0) {
        throw new Error("INVALID_ASSIGNEE");
      }

      // For project-linked tasks, verify project membership.
      if (data.projectId !== null && data.projectId !== undefined) {
        const [members] = await connection.execute<any[]>(
          `SELECT id
           FROM project_members
           WHERE project_id = ?
             AND user_id = ?
           LIMIT 1`,
          [data.projectId, data.assignedTo]
        );

        if (members.length === 0) {
          throw new Error("ASSIGNEE_NOT_PROJECT_MEMBER");
        }
      }
    }

    // Create the task.
    const taskId = await createTask(connection, {
      ...data,
      organizationId: actor.organizationId,
      createdBy: actor.userId,
    });

    // Create an in-app notification for the assignee.
    // Do not notify the actor about their own action.
    if (
      data.assignedTo !== null &&
      data.assignedTo !== undefined &&
      data.assignedTo !== actor.userId
    ) {
      await createNotificationService(connection, {
        organizationId: actor.organizationId,
        userId: data.assignedTo,
        actorId: actor.userId,
        type: "task_assigned",
        title: "New task assigned",
        message: `You have been assigned a new task: ${data.title}.`,
        entityType: "task",
        entityId: taskId,
      });
    }

    await connection.commit();

    return { taskId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}



export async function getTasksService(actor: TaskActor) {
  if (
    ![
      ORGANIZATION_ADMIN_ROLE_ID,
      MANAGER_ROLE_ID,
      EMPLOYEE_ROLE_ID,
    ].includes(actor.roleId)
  ) {
    throw new Error("FORBIDDEN");
  }

  const connection = await db.getConnection();

  try {
    if (actor.roleId === ORGANIZATION_ADMIN_ROLE_ID) {
      return await findTasksByOrganization(
        connection,
        actor.organizationId
      );
    }

    if (actor.roleId === MANAGER_ROLE_ID) {
      return await findTasksByManager(
        connection,
        actor.organizationId,
        actor.userId
      );
    }

    return await findTasksByEmployee(
      connection,
      actor.organizationId,
      actor.userId
    );
  } finally {
    connection.release();
  }
}

export async function getTaskByIdService(
  actor: TaskActor,
  taskId: number
) {
  if (!Number.isSafeInteger(taskId) || taskId <= 0) {
    throw new Error("INVALID_TASK_ID");
  }

  if (
    ![
      ORGANIZATION_ADMIN_ROLE_ID,
      MANAGER_ROLE_ID,
      EMPLOYEE_ROLE_ID,
    ].includes(actor.roleId)
  ) {
    throw new Error("FORBIDDEN");
  }

  const connection = await db.getConnection();

  try {
    const task = await findTaskById(
      connection,
      actor.organizationId,
      taskId
    );

    if (!task) {
      throw new Error("TASK_NOT_FOUND");
    }

    // Organization Admin can access all tasks in their organization.
    if (actor.roleId === ORGANIZATION_ADMIN_ROLE_ID) {
      return task;
    }

    // Manager can access tasks in their assigned projects
    // and standalone tasks created by them.
    if (actor.roleId === MANAGER_ROLE_ID) {
      if (
        task.project_id === null &&
        task.created_by === actor.userId||
   task.assigned_to === actor.userId
      ) {
        return task;
      }

      if (task.project_id !== null) {
        const [projects] = await connection.execute<any[]>(
          `SELECT id
           FROM projects
           WHERE id = ?
             AND organization_id = ?
             AND manager_id = ?
           LIMIT 1`,
          [
            task.project_id,
            actor.organizationId,
            actor.userId,
          ]
        );

        if (projects.length > 0) {
          return task;
        }
      }

      throw new Error("FORBIDDEN");
    }

    // Employee can access only tasks assigned to them.
    if (task.assigned_to === actor.userId) {
      return task;
    }

    throw new Error("FORBIDDEN");
  } finally {
    connection.release();
  }
}

export const getAvailableAssigneesService = async (
  actor: TaskActor,
  taskId: number
) => {
  if (!Number.isSafeInteger(taskId) || taskId <= 0) {
    throw new Error("INVALID_TASK_ID");
  }

  if (
    actor.roleId !== ORGANIZATION_ADMIN_ROLE_ID &&
    actor.roleId !== MANAGER_ROLE_ID
  ) {
    throw new Error("FORBIDDEN");
  }

  const connection = await db.getConnection();

  try {
    const task = await findTaskById(
      connection,
      actor.organizationId,
      taskId
    );

    if (!task) {
      throw new Error("TASK_NOT_FOUND");
    }

    if (actor.roleId === MANAGER_ROLE_ID) {
      if (task.project_id !== null) {
        const [projects] = await connection.query<RowDataPacket[]>(
          `
          SELECT id
          FROM projects
          WHERE id = ?
            AND organization_id = ?
            AND manager_id = ?
          `,
          [task.project_id, actor.organizationId, actor.userId]
        );

        if (projects.length === 0) {
          throw new Error("FORBIDDEN");
        }
      } else if (task.created_by !== actor.userId) {
        throw new Error("FORBIDDEN");
      }
    }

    const allowedRoleIds =
      actor.roleId === ORGANIZATION_ADMIN_ROLE_ID
        ? [MANAGER_ROLE_ID, EMPLOYEE_ROLE_ID]
        : [EMPLOYEE_ROLE_ID];

    if (task.project_id !== null) {
      return await findAvailableAssigneesForProject(
        connection,
        actor.organizationId,
        task.project_id,
        allowedRoleIds
      );
    }

    return await findAvailableAssigneesForOrganization(
      connection,
      actor.organizationId,
      allowedRoleIds
    );
  } finally {
    connection.release();
  }
};



export const updateTaskAssigneeService = async (
  actor: TaskActor,
  taskId: number,
  assignedTo: number | null
) => {
  if (!Number.isSafeInteger(taskId) || taskId <= 0) {
    throw new Error("INVALID_TASK_ID");
  }

  if (
    actor.roleId !== ORGANIZATION_ADMIN_ROLE_ID &&
    actor.roleId !== MANAGER_ROLE_ID
  ) {
    throw new Error("FORBIDDEN");
  }

  if (
    assignedTo !== null &&
    (!Number.isSafeInteger(assignedTo) || assignedTo <= 0)
  ) {
    throw new Error("INVALID_ASSIGNEE");
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const task = await findTaskById(
      connection,
      actor.organizationId,
      taskId
    );

    if (!task) {
      throw new Error("TASK_NOT_FOUND");
    }

    // Manager permission check
    if (actor.roleId === MANAGER_ROLE_ID) {
      if (task.project_id !== null) {
        const [projects] = await connection.query<RowDataPacket[]>(
          `
          SELECT id
          FROM projects
          WHERE id = ?
            AND organization_id = ?
            AND manager_id = ?
          `,
          [task.project_id, actor.organizationId, actor.userId]
        );

        if (projects.length === 0) {
          throw new Error("FORBIDDEN");
        }
      } else if (task.created_by !== actor.userId) {
        throw new Error("FORBIDDEN");
      }
    }

    // Validate the new assignee
    if (assignedTo !== null) {
      const allowedRoleIds =
        actor.roleId === ORGANIZATION_ADMIN_ROLE_ID
          ? [MANAGER_ROLE_ID, EMPLOYEE_ROLE_ID]
          : [EMPLOYEE_ROLE_ID];

      const [assignees] = await connection.query<RowDataPacket[]>(
        `
        SELECT id
        FROM users
        WHERE id = ?
          AND organization_id = ?
          AND role_id IN (?)
          AND status = 'active'
        `,
        [assignedTo, actor.organizationId, allowedRoleIds]
      );

      if (assignees.length === 0) {
        throw new Error("INVALID_ASSIGNEE");
      }

      // Project-linked tasks require project membership
      if (task.project_id !== null) {
        const [members] = await connection.query<RowDataPacket[]>(
          `
          SELECT id
          FROM project_members
          WHERE project_id = ?
            AND user_id = ?
          `,
          [task.project_id, assignedTo]
        );

        if (members.length === 0) {
          throw new Error("ASSIGNEE_NOT_PROJECT_MEMBER");
        }
      }
    }

    // Previous assignee
    const previousAssignee = task.assigned_to;

    // Avoid unnecessary updates and notifications
    if (previousAssignee === assignedTo) {
      await connection.commit();

      return {
        taskId,
        assignedTo,
      };
    }

    // Update task assignment
    await updateTaskAssignee(
      connection,
      actor.organizationId,
      taskId,
      assignedTo
    );

    // Notify previous assignee
    if (
      previousAssignee !== null &&
      previousAssignee !== actor.userId
    ) {
      await createNotificationService(connection, {
        organizationId: actor.organizationId,
        userId: previousAssignee,
        actorId: actor.userId,
        type: "task_reassigned",
        title: "Task reassigned",
        message: `The assignment of task "${task.title}" has changed.`,
        entityType: "task",
        entityId: taskId,
      });
    }

    // Notify new assignee
    if (
      assignedTo !== null &&
      assignedTo !== actor.userId
    ) {
      await createNotificationService(connection, {
        organizationId: actor.organizationId,
        userId: assignedTo,
        actorId: actor.userId,
        type: "task_reassigned",
        title: "New task assigned",
        message: `Task "${task.title}" has been assigned to you.`,
        entityType: "task",
        entityId: taskId,
      });
    }

    await connection.commit();

    return {
      taskId,
      assignedTo,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};



export const updateTaskStatusService = async (
  actor: TaskActor,
  taskId: number,
  input: unknown
) => {
  // Allow Admin, Manager, and Employee to update task status
  if (
    ![
      ORGANIZATION_ADMIN_ROLE_ID,
      MANAGER_ROLE_ID,
      EMPLOYEE_ROLE_ID,
    ].includes(actor.roleId)
  ) {
    throw new Error("FORBIDDEN");
  }

  if (!Number.isSafeInteger(taskId) || taskId <= 0) {
    throw new Error("INVALID_TASK_ID");
  }

  // Validate the requested status
  const validation = updateTaskStatusSchema.safeParse(input);

  if (!validation.success) {
    throw new Error("VALIDATION_ERROR");
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Find the task within the actor's organization
    const task = await findTaskById(
      connection,
      actor.organizationId,
      taskId
    );

    if (!task) {
      throw new Error("TASK_NOT_FOUND");
    }

    // Verify that the task is assigned to this user
    if (
      task.assigned_to === null ||
      task.assigned_to !== actor.userId
    ) {
      throw new Error("FORBIDDEN");
    }

    const newStatus = validation.data.status;

    // Avoid unnecessary updates and notifications
    if (task.status === newStatus) {
      await connection.commit();

      return {
        taskId,
        status: newStatus,
      };
    }

    // Update task status
    await updateTaskStatus(
      connection,
      actor.organizationId,
      taskId,
      newStatus
    );

    // Collect notification recipients
    const recipients = new Set<number>();

    // Task creator
    recipients.add(task.created_by);

    // Relevant Project Manager
    if (task.project_id !== null) {
      const [projects] = await connection.query<RowDataPacket[]>(
        `
        SELECT manager_id
        FROM projects
        WHERE id = ?
          AND organization_id = ?
        `,
        [task.project_id, actor.organizationId]
      );

      if (
        projects.length > 0 &&
        projects[0].manager_id !== null
      ) {
        recipients.add(projects[0].manager_id);
      }
    }

    // Select notification type and message
    const isCompleted = newStatus === "completed";

    const notificationType = isCompleted
      ? "task_completed"
      : "task_status_updated";

    const title = isCompleted
      ? "Task completed"
      : "Task status updated";

    const message = isCompleted
      ? `Task "${task.title}" has been completed.`
      : `The status of task "${task.title}" has been updated to ${newStatus.replace(/_/g, " ")}.`;

    // Create notifications, excluding the actor
    for (const recipientId of recipients) {
      if (recipientId === actor.userId) {
        continue;
      }

      await createNotificationService(connection, {
        organizationId: actor.organizationId,
        userId: recipientId,
        actorId: actor.userId,
        type: notificationType,
        title,
        message,
        entityType: "task",
        entityId: taskId,
      });
    }

    await connection.commit();

    return {
      taskId,
      status: newStatus,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const updateTaskService = async (
  actor: TaskActor,
  taskId: number,
  input: unknown
) => {
  // Only Admins and Managers can edit task details.
  if (
    actor.roleId !== ORGANIZATION_ADMIN_ROLE_ID &&
    actor.roleId !== MANAGER_ROLE_ID
  ) {
    throw new Error("FORBIDDEN");
  }

  if (!Number.isSafeInteger(taskId) || taskId <= 0) {
    throw new Error("INVALID_TASK_ID");
  }

  // Validate request data.
  const validation = updateTaskSchema.safeParse(input);

  if (!validation.success) {
    throw new Error("VALIDATION_ERROR");
  }

  const data = validation.data;

  const connection = await db.getConnection();

  try {
    // Find task within the actor's organization.
    const task = await findTaskById(
      connection,
      actor.organizationId,
      taskId
    );

    if (!task) {
      throw new Error("TASK_NOT_FOUND");
    }

    // Manager permission check.
    if (actor.roleId === MANAGER_ROLE_ID) {
      if (task.project_id !== null) {
        const [projects] = await connection.query<RowDataPacket[]>(
          `
          SELECT id
          FROM projects
          WHERE id = ?
            AND organization_id = ?
            AND manager_id = ?
          `,
          [task.project_id, actor.organizationId, actor.userId]
        );

        if (projects.length === 0) {
          throw new Error("FORBIDDEN");
        }
      } else if (task.created_by !== actor.userId) {
        throw new Error("FORBIDDEN");
      }
    }

    // Validate the new project if provided.
    if (data.projectId !== null) {
      const [projects] = await connection.query<RowDataPacket[]>(
        `
        SELECT id, manager_id
        FROM projects
        WHERE id = ?
          AND organization_id = ?
        `,
        [data.projectId, actor.organizationId]
      );

      if (projects.length === 0) {
        throw new Error("PROJECT_NOT_FOUND");
      }

      // Manager can only move tasks into projects they manage.
      if (
        actor.roleId === MANAGER_ROLE_ID &&
        projects[0].manager_id !== actor.userId
      ) {
        throw new Error("FORBIDDEN");
      }

      // Existing assignee must belong to the destination project.
      if (task.assigned_to !== null) {
        const [members] = await connection.query<RowDataPacket[]>(
          `
          SELECT id
          FROM project_members
          WHERE project_id = ?
            AND user_id = ?
          `,
          [data.projectId, task.assigned_to]
        );

        if (members.length === 0) {
          throw new Error("ASSIGNEE_NOT_PROJECT_MEMBER");
        }
      }
    }

    // Save task details.
    await updateTask(
      connection,
      actor.organizationId,
      taskId,
      data
    );

    return {
      taskId,
      ...data,
    };
  } finally {
    connection.release();
  }
};

export const deleteTaskService = async (
  actor: TaskActor,
  taskId: number
) => {
  // Only Admins and Managers can delete tasks.
  if (
    actor.roleId !== ORGANIZATION_ADMIN_ROLE_ID &&
    actor.roleId !== MANAGER_ROLE_ID
  ) {
    throw new Error("FORBIDDEN");
  }

  if (!Number.isSafeInteger(taskId) || taskId <= 0) {
    throw new Error("INVALID_TASK_ID");
  }

  const connection = await db.getConnection();

  try {
    // Find the task within the actor's organization.
    const task = await findTaskById(
      connection,
      actor.organizationId,
      taskId
    );

    if (!task) {
      throw new Error("TASK_NOT_FOUND");
    }

    // Manager permission check.
    if (actor.roleId === MANAGER_ROLE_ID) {
      if (task.project_id !== null) {
        const [projects] = await connection.query<RowDataPacket[]>(
          `
          SELECT id
          FROM projects
          WHERE id = ?
            AND organization_id = ?
            AND manager_id = ?
          `,
          [task.project_id, actor.organizationId, actor.userId]
        );

        if (projects.length === 0) {
          throw new Error("FORBIDDEN");
        }
      } else if (task.created_by !== actor.userId) {
        throw new Error("FORBIDDEN");
      }
    }

    await deleteTask(
      connection,
      actor.organizationId,
      taskId
    );

    return {
      taskId,
    };
  } finally {
    connection.release();
  }
};