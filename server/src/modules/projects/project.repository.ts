
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


