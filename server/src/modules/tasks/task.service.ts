import { db } from "../../config/database";
import {
  createTask,
  findTaskById,
  findTasksByOrganization,
  findTasksByManager,
  findTasksByEmployee,
   findAvailableAssigneesForProject,
  findAvailableAssigneesForOrganization,
  updateTaskAssignee
} from "./task.repository";
import { createTaskSchema } from "./task.schema";
import { RowDataPacket } from "mysql2/promise";

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

    // Verify the assigned employee.
    if (data.assignedTo !== null && data.assignedTo !== undefined) {
      const [users] = await connection.execute<any[]>(
        `SELECT id
         FROM users
         WHERE id = ?
           AND organization_id = ?
           AND role_id = ?
           AND status = 'active'
         LIMIT 1`,
        [
          data.assignedTo,
          actor.organizationId,
          EMPLOYEE_ROLE_ID,
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

    const taskId = await createTask(connection, {
      ...data,
      organizationId: actor.organizationId,
      createdBy: actor.userId,
    });

    return { taskId };
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
      } else if (
        task.created_by !== actor.userId &&
        task.assigned_to !== actor.userId
      ) {
        throw new Error("FORBIDDEN");
      }
    }

    if (task.project_id !== null) {
      return await findAvailableAssigneesForProject(
        connection,
        actor.organizationId,
        task.project_id
      );
    }

    return await findAvailableAssigneesForOrganization(
      connection,
      actor.organizationId
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
      } else if (
        task.created_by !== actor.userId &&
        task.assigned_to !== actor.userId
      ) {
        throw new Error("FORBIDDEN");
      }
    }

    // If an employee ID is provided, validate the employee.
    if (assignedTo !== null) {
      const [employees] = await connection.query<RowDataPacket[]>(
        `
        SELECT id
        FROM users
        WHERE id = ?
          AND organization_id = ?
          AND role_id = 4
          AND status = 'active'
        `,
        [assignedTo, actor.organizationId]
      );

      if (employees.length === 0) {
        throw new Error("INVALID_ASSIGNEE");
      }

      // Project-linked tasks require project membership.
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

    await updateTaskAssignee(
      connection,
      actor.organizationId,
      taskId,
      assignedTo
    );

    return {
      taskId,
      assignedTo,
    };
  } finally {
    connection.release();
  }
};