
import {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import { db } from "../../config/database.js";

export interface ProjectRow extends RowDataPacket {
  id: number;
  organization_id: number;
  name: string;
  description: string | null;
  client_name: string | null;
  start_date: string | null;
  deadline: string | null;
  status: string;
  priority: string;
  budget: string | null;
  manager_id: number;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProjectData {
  organizationId: number;
  name: string;
  description: string | null;
  clientName: string | null;
  startDate: string | null;
  deadline: string | null;
  status: "planning" | "active" | "on_hold" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "critical";
  budget: number | null;
  managerId: number;
  createdBy: number;
}

export async function createProject(
  connection: PoolConnection,
  data: CreateProjectData
): Promise<number> {
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO projects (
      organization_id,
      name,
      description,
      client_name,
      start_date,
      deadline,
      status,
      priority,
      budget,
      manager_id,
      created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.organizationId,
      data.name,
      data.description,
      data.clientName,
      data.startDate,
      data.deadline,
      data.status,
      data.priority,
      data.budget,
      data.managerId,
      data.createdBy,
    ]
  );

  return result.insertId;
}

export async function addProjectMember(
  connection: PoolConnection,
  projectId: number,
  userId: number
): Promise<void> {
  await connection.execute(
    `INSERT INTO project_members (project_id, user_id)
     VALUES (?, ?)`,
    [projectId, userId]
  );
}

export async function findProjectById(
  connection: PoolConnection,
  organizationId: number,
  projectId: number
): Promise<ProjectRow | null> {
  const [rows] = await connection.execute<ProjectRow[]>(
    `SELECT
      id,
      organization_id,
      name,
      description,
      client_name,
      start_date,
      deadline,
      status,
      priority,
      budget,
      manager_id,
      created_by,
      created_at,
      updated_at
     FROM projects
     WHERE id = ? AND organization_id = ?
     LIMIT 1`,
    [projectId, organizationId]
  );

  return rows[0] ?? null;
}



export interface ProjectListRow extends RowDataPacket {
  id: number;
  name: string;
  description: string | null;
  client_name: string | null;
  start_date: string | null;
  deadline: string | null;
  status: string;
  priority: string;
  budget: string | null;
  manager_id: number;
  manager_name: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export async function findProjectsByOrganization(
  organizationId: number
): Promise<ProjectListRow[]> {
  const [rows] = await db.execute<ProjectListRow[]>(
    `SELECT
       p.id,
       p.name,
       p.description,
       p.client_name,
       p.start_date,
       p.deadline,
       p.status,
       p.priority,
       p.budget,
       p.manager_id,
       u.name AS manager_name,
       p.created_by,
       p.created_at,
       p.updated_at
     FROM projects p
     INNER JOIN users u ON u.id = p.manager_id
     WHERE p.organization_id = ?
     ORDER BY p.created_at DESC`,
    [organizationId]
  );

  return rows;
}


export interface ProjectMemberRow extends RowDataPacket {
  user_id: number;
  name: string;
  email: string;
  role: string;
  employee_code: string | null;
  job_title: string | null;
  joined_at: Date;
}

export async function findProjectMembers(
  organizationId: number,
  projectId: number
): Promise<ProjectMemberRow[]> {
  const [rows] = await db.execute<ProjectMemberRow[]>(
    `SELECT
       u.id AS user_id,
       u.name,
       u.email,
       r.name AS role,
       ep.employee_code,
       ep.job_title,
       pm.joined_at
     FROM project_members pm
     INNER JOIN projects p
       ON p.id = pm.project_id
     INNER JOIN users u
       ON u.id = pm.user_id
     INNER JOIN roles r
       ON r.id = u.role_id
     LEFT JOIN employee_profiles ep
       ON ep.user_id = u.id
     WHERE p.id = ?
       AND p.organization_id = ?
       AND u.organization_id = ?
     ORDER BY
       CASE WHEN u.id = p.manager_id THEN 0 ELSE 1 END,
       u.name ASC`,
    [projectId, organizationId, organizationId]
  );

  return rows;
}


export interface AvailableProjectMemberRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  employee_code: string | null;
  job_title: string | null;
}

export async function findAvailableProjectMembers(
  organizationId: number,
  projectId: number
): Promise<AvailableProjectMemberRow[]> {
  const [rows] = await db.execute<AvailableProjectMemberRow[]>(
    `SELECT
       u.id,
       u.name,
       u.email,
       ep.employee_code,
       ep.job_title
     FROM users u
     INNER JOIN roles r
       ON r.id = u.role_id
     LEFT JOIN employee_profiles ep
       ON ep.user_id = u.id
     WHERE u.organization_id = ?
       AND u.status = 'active'
       AND r.name = 'employee'
       AND NOT EXISTS (
         SELECT 1
         FROM project_members pm
         WHERE pm.project_id = ?
           AND pm.user_id = u.id
       )
     ORDER BY u.name ASC`,
    [organizationId, projectId]
  );

  return rows;
}


export async function addProjectMembers(
  connection: PoolConnection,
  projectId: number,
  userIds: number[]
): Promise<void> {
  for (const userId of userIds) {
    await connection.execute(
      `INSERT INTO project_members (project_id, user_id)
       VALUES (?, ?)`,
      [projectId, userId]
    );
  }
}


export async function removeProjectMember(
  connection: PoolConnection,
  projectId: number,
  userId: number
): Promise<ResultSetHeader> {
  const [result] = await connection.execute<ResultSetHeader>(
    `DELETE FROM project_members
     WHERE project_id = ?
       AND user_id = ?`,
    [projectId, userId]
  );

  return result;
}
