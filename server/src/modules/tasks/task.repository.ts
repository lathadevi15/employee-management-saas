import { PoolConnection, ResultSetHeader } from "mysql2/promise";
import { CreateTaskInput } from "./task.schema";
import { RowDataPacket } from "mysql2/promise";


interface CreateTaskData extends CreateTaskInput {
  organizationId: number;
  createdBy: number;
}

export async function createTask(
  connection: PoolConnection,
  data: CreateTaskData
): Promise<number> {
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO tasks (
      organization_id,
      project_id,
      title,
      description,
      status,
      priority,
      start_date,
      due_date,
      assigned_to,
      created_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.organizationId,
      data.projectId ?? null,
      data.title,
      data.description ?? null,
      data.status,
      data.priority,
      data.startDate ?? null,
      data.dueDate ?? null,
      data.assignedTo ?? null,
      data.createdBy,
    ]
  );

  return result.insertId;
}


export interface TaskRow extends RowDataPacket {
  id: number;
  organization_id: number;
  project_id: number | null;
  project_name: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  start_date: string | null;
  due_date: string | null;
  assigned_to: number | null;
  assignee_name: string | null;
  created_by: number;
  creator_name: string;
  created_at: Date;
  updated_at: Date;
}


export async function findTaskById(
  connection: PoolConnection,
  organizationId: number,
  taskId: number
): Promise<TaskRow | null> {
  const [rows] = await connection.execute<TaskRow[]>(
    `SELECT
      t.id,
      t.organization_id,
      t.project_id,
      p.name AS project_name,
      t.title,
      t.description,
      t.status,
      t.priority,
      DATE_FORMAT(t.start_date, '%Y-%m-%d') AS start_date,
      DATE_FORMAT(t.due_date, '%Y-%m-%d') AS due_date,
      t.assigned_to,
      assignee.name AS assignee_name,
      t.created_by,
      creator.name AS creator_name,
      t.created_at,
      t.updated_at
    FROM tasks t
    LEFT JOIN projects p
      ON p.id = t.project_id
    LEFT JOIN users assignee
      ON assignee.id = t.assigned_to
    INNER JOIN users creator
      ON creator.id = t.created_by
    WHERE t.id = ?
      AND t.organization_id = ?
    LIMIT 1`,
    [taskId, organizationId]
  );

  return rows[0] ?? null;
}


export async function findTasksByOrganization(
  connection: PoolConnection,
  organizationId: number
): Promise<TaskRow[]> {
  const [rows] = await connection.execute<TaskRow[]>(
    `SELECT
      t.id,
      t.organization_id,
      t.project_id,
      p.name AS project_name,
      t.title,
      t.description,
      t.status,
      t.priority,
      DATE_FORMAT(t.start_date, '%Y-%m-%d') AS start_date,
      DATE_FORMAT(t.due_date, '%Y-%m-%d') AS due_date,
      t.assigned_to,
      assignee.name AS assignee_name,
      t.created_by,
      creator.name AS creator_name,
      t.created_at,
      t.updated_at
    FROM tasks t
    LEFT JOIN projects p
      ON p.id = t.project_id
    LEFT JOIN users assignee
      ON assignee.id = t.assigned_to
    INNER JOIN users creator
      ON creator.id = t.created_by
    WHERE t.organization_id = ?
    ORDER BY t.created_at DESC`,
    [organizationId]
  );

  return rows;
}
export async function findTasksByManager(
  connection: PoolConnection,
  organizationId: number,
  managerId: number
): Promise<TaskRow[]> {
  const [rows] = await connection.execute<TaskRow[]>(
    `SELECT
      t.id,
      t.organization_id,
      t.project_id,
      p.name AS project_name,
      t.title,
      t.description,
      t.status,
      t.priority,
      DATE_FORMAT(t.start_date, '%Y-%m-%d') AS start_date,
      DATE_FORMAT(t.due_date, '%Y-%m-%d') AS due_date,
      t.assigned_to,
      assignee.name AS assignee_name,
      t.created_by,
      creator.name AS creator_name,
      t.created_at,
      t.updated_at
    FROM tasks t
    LEFT JOIN projects p
      ON p.id = t.project_id
    LEFT JOIN users assignee
      ON assignee.id = t.assigned_to
    INNER JOIN users creator
      ON creator.id = t.created_by
    WHERE t.organization_id = ?
      AND (
        p.manager_id = ?
        OR (t.created_by = ?
            OR t.assigned_to = ?)
      )
    ORDER BY t.created_at DESC`,
    [organizationId, managerId, managerId, managerId]
  );

  return rows;
}

export async function findTasksByEmployee(
  connection: PoolConnection,
  organizationId: number,
  employeeId: number
): Promise<TaskRow[]> {
  const [rows] = await connection.execute<TaskRow[]>(
    `SELECT
      t.id,
      t.organization_id,
      t.project_id,
      p.name AS project_name,
      t.title,
      t.description,
      t.status,
      t.priority,
      DATE_FORMAT(t.start_date, '%Y-%m-%d') AS start_date,
      DATE_FORMAT(t.due_date, '%Y-%m-%d') AS due_date,
      t.assigned_to,
      assignee.name AS assignee_name,
      t.created_by,
      creator.name AS creator_name,
      t.created_at,
      t.updated_at
    FROM tasks t
    LEFT JOIN projects p
      ON p.id = t.project_id
    LEFT JOIN users assignee
      ON assignee.id = t.assigned_to
    INNER JOIN users creator
      ON creator.id = t.created_by
    WHERE t.organization_id = ?
      AND t.assigned_to = ?
    ORDER BY t.created_at DESC`,
    [organizationId, employeeId]
  );

  return rows;
}

export const findAvailableAssigneesForProject = async (
  connection: PoolConnection,
  organizationId: number,
  projectId: number
) => {
  const [rows] = await connection.query<RowDataPacket[]>(
    `
    SELECT
      u.id,
      u.name,
      u.email,
      ep.employee_code,
      ep.job_title
    FROM project_members pm
    INNER JOIN users u ON u.id = pm.user_id
    LEFT JOIN employee_profiles ep ON ep.user_id = u.id
    WHERE pm.project_id = ?
      AND u.organization_id = ?
      AND u.role_id = 4
      AND u.status = 'active'
    ORDER BY u.name ASC
    `,
    [projectId, organizationId]
  );

  return rows;
};

export const findAvailableAssigneesForOrganization = async (
  connection: PoolConnection,
  organizationId: number
) => {
  const [rows] = await connection.query<RowDataPacket[]>(
    `
    SELECT
      u.id,
      u.name,
      u.email,
      ep.employee_code,
      ep.job_title
    FROM users u
    LEFT JOIN employee_profiles ep ON ep.user_id = u.id
    WHERE u.organization_id = ?
      AND u.role_id = 4
      AND u.status = 'active'
    ORDER BY u.name ASC
    `,
    [organizationId]
  );

  return rows;
};

export const updateTaskAssignee = async (
  connection: PoolConnection,
  organizationId: number,
  taskId: number,
  assignedTo: number | null
): Promise<void> => {
  await connection.query(
    `
    UPDATE tasks
    SET assigned_to = ?
    WHERE id = ?
      AND organization_id = ?
    `,
    [assignedTo, taskId, organizationId]
  );
};