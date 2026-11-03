
import { db } from "../../config/database.js";
import { createProjectSchema, addProjectMembersSchema, updateProjectSchema  } from "./project.schema.js";
import {
  addProjectMember,
  createProject,
  findProjectById,
  findProjectsByOrganization ,findProjectMembers,
  findAvailableProjectMembers, addProjectMembers, removeProjectMember, findProjectsByEmployee,
  updateProject 
} from "./project.repository.js";
import { RowDataPacket } from "mysql2/promise";

interface ProjectActor {
  userId: number;
  organizationId: number;
  roleId: number;
}

// Matches your existing roles table:
// 2 = organization_admin, 3 = manager.
const ORGANIZATION_ADMIN_ROLE_ID = 2;
const MANAGER_ROLE_ID = 3;

export async function createProjectService(
  actor: ProjectActor,
  input: unknown
) {
  const validation = createProjectSchema.safeParse(input);

  if (!validation.success) {
    throw new Error("VALIDATION_ERROR");
  }

  const data = validation.data;

  // Determine the manager according to the caller's role.
  let managerId: number;

  if (actor.roleId === ORGANIZATION_ADMIN_ROLE_ID) {
    if (!data.managerId) {
      throw new Error("MANAGER_REQUIRED");
    }

    managerId = data.managerId;
  } else if (actor.roleId === MANAGER_ROLE_ID) {
    managerId = actor.userId;
  } else {
    throw new Error("FORBIDDEN");
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Verify that the manager belongs to this organization,
    // has the manager role, and is active.
    const [managerRows] = await connection.execute<
      (import("mysql2/promise").RowDataPacket & {
        id: number;
      })[]
    >(
      `SELECT u.id
       FROM users u
       INNER JOIN roles r ON r.id = u.role_id
       WHERE u.id = ?
         AND u.organization_id = ?
         AND r.name = 'manager'
         AND u.status = 'active'
       LIMIT 1
       FOR UPDATE`,
      [managerId, actor.organizationId]
    );

    if (managerRows.length === 0) {
      throw new Error("INVALID_PROJECT_MANAGER");
    }

    const projectId = await createProject(connection, {
      organizationId: actor.organizationId,
      name: data.name,
      description: data.description ?? null,
      clientName: data.clientName ?? null,
      startDate: data.startDate ?? null,
      deadline: data.deadline ?? null,
      status: data.status,
      priority: data.priority,
      budget: data.budget ?? null,
      managerId,
      createdBy: actor.userId,
    });

    // Automatically make the assigned manager a project member.
    await addProjectMember(connection, projectId, managerId);

    const project = await findProjectById(
      connection,
      actor.organizationId,
      projectId
    );

    if (!project) {
      throw new Error("PROJECT_CREATION_FAILED");
    }

    await connection.commit();

    return project;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}




export async function getProjectsService(actor: ProjectActor) {
  if (actor.roleId === ORGANIZATION_ADMIN_ROLE_ID) {
    return await findProjectsByOrganization(actor.organizationId);
  }

  if (actor.roleId === MANAGER_ROLE_ID) {
    const projects = await findProjectsByOrganization(
      actor.organizationId
    );

    return projects.filter(
      (project) => project.manager_id === actor.userId
    );
  }

  if (actor.roleId === 4) {
    return await findProjectsByEmployee(
      actor.organizationId,
      actor.userId
    );
  }

  throw new Error("FORBIDDEN");
}


export async function getProjectByIdService(
  actor: ProjectActor,
  projectId: number
) {
  if (
    actor.roleId !== ORGANIZATION_ADMIN_ROLE_ID &&
    actor.roleId !== MANAGER_ROLE_ID &&
    actor.roleId !== 4
  ) {
    throw new Error("FORBIDDEN");
  }

  if (!Number.isSafeInteger(projectId) || projectId <= 0) {
    throw new Error("INVALID_PROJECT_ID");
  }

  const connection = await db.getConnection();

  try {
    const project = await findProjectById(
      connection,
      actor.organizationId,
      projectId
    );

    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    // Managers can view only their own projects.
    if (
      actor.roleId === MANAGER_ROLE_ID &&
      project.manager_id !== actor.userId
    ) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    // Employees can view only projects assigned to them.
    if (actor.roleId === 4) {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT id
         FROM project_members
         WHERE project_id = ?
           AND user_id = ?
         LIMIT 1`,
        [projectId, actor.userId]
      );

      if (rows.length === 0) {
        throw new Error("PROJECT_NOT_FOUND");
      }
    }

    return project;
  } finally {
    connection.release();
  }
}




export async function getProjectMembersService(
  actor: ProjectActor,
  projectId: number
) {
  if (
    actor.roleId !== ORGANIZATION_ADMIN_ROLE_ID &&
    actor.roleId !== MANAGER_ROLE_ID &&
    actor.roleId !== 4
  ) {
    throw new Error("FORBIDDEN");
  }

  if (!Number.isSafeInteger(projectId) || projectId <= 0) {
    throw new Error("INVALID_PROJECT_ID");
  }

  const connection = await db.getConnection();

  try {
    const project = await findProjectById(
      connection,
      actor.organizationId,
      projectId
    );

    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    // Managers can access teams only for their own projects.
    if (
      actor.roleId === MANAGER_ROLE_ID &&
      project.manager_id !== actor.userId
    ) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    // Employees can view teams only for assigned projects.
    if (actor.roleId === 4) {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT id
         FROM project_members
         WHERE project_id = ?
           AND user_id = ?
         LIMIT 1`,
        [projectId, actor.userId]
      );

      if (rows.length === 0) {
        throw new Error("PROJECT_NOT_FOUND");
      }
    }

    return await findProjectMembers(
      actor.organizationId,
      projectId
    );
  } finally {
    connection.release();
  }
}



export async function getAvailableProjectMembersService(
  actor: ProjectActor,
  projectId: number
) {
  if (
    actor.roleId !== ORGANIZATION_ADMIN_ROLE_ID &&
    actor.roleId !== MANAGER_ROLE_ID
  ) {
    throw new Error("FORBIDDEN");
  }

  if (!Number.isSafeInteger(projectId) || projectId <= 0) {
    throw new Error("INVALID_PROJECT_ID");
  }

  const connection = await db.getConnection();

  try {
    const project = await findProjectById(
      connection,
      actor.organizationId,
      projectId
    );

    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    // Managers can manage members only on their own projects.
    if (
      actor.roleId === MANAGER_ROLE_ID &&
      project.manager_id !== actor.userId
    ) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    return await findAvailableProjectMembers(
      actor.organizationId,
      projectId
    );
  } finally {
    connection.release();
  }
}


export async function addProjectMembersService(
  actor: ProjectActor,
  projectId: number,
  input: unknown
) {
  if (
    actor.roleId !== ORGANIZATION_ADMIN_ROLE_ID &&
    actor.roleId !== MANAGER_ROLE_ID
  ) {
    throw new Error("FORBIDDEN");
  }

  if (!Number.isSafeInteger(projectId) || projectId <= 0) {
    throw new Error("INVALID_PROJECT_ID");
  }

  const parsed = addProjectMembersSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("VALIDATION_ERROR");
  }

  const userIds = [...new Set(parsed.data.userIds)];

  if (userIds.length !== parsed.data.userIds.length) {
    throw new Error("DUPLICATE_USER_IDS");
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const project = await findProjectById(
      connection,
      actor.organizationId,
      projectId
    );

    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    if (
      actor.roleId === MANAGER_ROLE_ID &&
      project.manager_id !== actor.userId
    ) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    const placeholders = userIds.map(() => "?").join(", ");

    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT u.id
       FROM users u
       INNER JOIN roles r ON r.id = u.role_id
       WHERE u.organization_id = ?
         AND u.status = 'active'
         AND r.name = 'employee'
         AND u.id IN (${placeholders})
       FOR UPDATE`,
      [actor.organizationId, ...userIds]
    );

    if (rows.length !== userIds.length) {
      throw new Error("INVALID_PROJECT_MEMBERS");
    }

    const [existingRows] = await connection.execute<RowDataPacket[]>(
      `SELECT user_id
       FROM project_members
       WHERE project_id = ?
         AND user_id IN (${placeholders})`,
      [projectId, ...userIds]
    );

    if (existingRows.length > 0) {
      throw new Error("MEMBERS_ALREADY_ASSIGNED");
    }

    await addProjectMembers(connection, projectId, userIds);

    await connection.commit();

    return { addedCount: userIds.length };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}


export async function removeProjectMemberService(
  actor: ProjectActor,
  projectId: number,
  userId: number
) {
  if (
    actor.roleId !== ORGANIZATION_ADMIN_ROLE_ID &&
    actor.roleId !== MANAGER_ROLE_ID
  ) {
    throw new Error("FORBIDDEN");
  }

  if (
    !Number.isSafeInteger(projectId) ||
    projectId <= 0 ||
    !Number.isSafeInteger(userId) ||
    userId <= 0
  ) {
    throw new Error("INVALID_ID");
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const project = await findProjectById(
      connection,
      actor.organizationId,
      projectId
    );

    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    if (
      actor.roleId === MANAGER_ROLE_ID &&
      project.manager_id !== actor.userId
    ) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    if (project.manager_id === userId) {
      throw new Error("CANNOT_REMOVE_PROJECT_MANAGER");

      // Verify that the target user is an employee
// belonging to the same organization.
const [targetRows] = await connection.execute<RowDataPacket[]>(
  `SELECT u.id
   FROM users u
   INNER JOIN roles r ON r.id = u.role_id
   WHERE u.id = ?
     AND u.organization_id = ?
     AND r.name = 'employee'
   LIMIT 1
   FOR UPDATE`,
  [userId, actor.organizationId]
);

if (targetRows.length === 0) {
  throw new Error("INVALID_PROJECT_MEMBER");
}
    }

    const result = await removeProjectMember(
      connection,
      projectId,
      userId
    );

    if (result.affectedRows === 0) {
      throw new Error("PROJECT_MEMBER_NOT_FOUND");
    }

    await connection.commit();

    return { removedUserId: userId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}



export async function updateProjectService(
  actor: ProjectActor,
  projectId: number,
  input: unknown
) {
  if (
    actor.roleId !== ORGANIZATION_ADMIN_ROLE_ID &&
    actor.roleId !== MANAGER_ROLE_ID
  ) {
    throw new Error("FORBIDDEN");
  }

  if (!Number.isSafeInteger(projectId) || projectId <= 0) {
    throw new Error("INVALID_PROJECT_ID");
  }

  const parsed = updateProjectSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("VALIDATION_ERROR");
  }

  const data = parsed.data;

  // Managers cannot change the project manager.
  if (
    actor.roleId === MANAGER_ROLE_ID &&
    data.managerId !== undefined
  ) {
    throw new Error("MANAGER_CANNOT_REASSIGN_PROJECT");
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const project = await findProjectById(
      connection,
      actor.organizationId,
      projectId
    );

    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    // Managers can edit only their assigned projects.
    if (
      actor.roleId === MANAGER_ROLE_ID &&
      project.manager_id !== actor.userId
    ) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    // Only admins can assign a different project manager.
    if (
      actor.roleId === ORGANIZATION_ADMIN_ROLE_ID &&
      data.managerId !== undefined
    ) {
      const [managerRows] =
        await connection.execute<RowDataPacket[]>(
          `SELECT u.id
           FROM users u
           INNER JOIN roles r ON r.id = u.role_id
           WHERE u.id = ?
             AND u.organization_id = ?
             AND u.status = 'active'
             AND r.name = 'manager'
           LIMIT 1
           FOR UPDATE`,
          [data.managerId, actor.organizationId]
        );

      if (managerRows.length === 0) {
        throw new Error("INVALID_PROJECT_MANAGER");
      }
    }

    const updateData = {
      ...data,
      description: data.description ?? null,
      clientName: data.clientName ?? null,
      startDate: data.startDate ?? null,
      deadline: data.deadline ?? null,
      budget: data.budget ?? null,
      ...(actor.roleId === MANAGER_ROLE_ID
        ? { managerId: undefined }
        : {}),
    };

    await updateProject(
      connection,
      actor.organizationId,
      projectId,
      updateData
    );

    // Keep the assigned project manager in project_members.
    if (
      actor.roleId === ORGANIZATION_ADMIN_ROLE_ID &&
      data.managerId !== undefined &&
      data.managerId !== project.manager_id
    ) {
      await connection.execute(
        `INSERT INTO project_members (project_id, user_id)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`,
        [projectId, data.managerId]
      );
    }

    const updatedProject = await findProjectById(
      connection,
      actor.organizationId,
      projectId
    );

    await connection.commit();

    return updatedProject;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}


