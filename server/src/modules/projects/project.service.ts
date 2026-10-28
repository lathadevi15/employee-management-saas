
import { db } from "../../config/database.js";
import { createProjectSchema } from "./project.schema.js";
import {
  addProjectMember,
  createProject,
  findProjectById,
  findProjectsByOrganization ,
} from "./project.repository.js";

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



export async function getProjectsService(
  actor: ProjectActor
) {
  if (
    actor.roleId !== ORGANIZATION_ADMIN_ROLE_ID &&
    actor.roleId !== MANAGER_ROLE_ID
  ) {
    throw new Error("FORBIDDEN");
  }

  const projects = await findProjectsByOrganization(
    actor.organizationId
  );

  // Managers can initially see only projects assigned to them.
  if (actor.roleId === MANAGER_ROLE_ID) {
    return projects.filter(
      (project) => project.manager_id === actor.userId
    );
  }

  return projects;
}
