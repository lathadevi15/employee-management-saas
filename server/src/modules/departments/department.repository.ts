
import { db } from "../../config/database.js";
import { RowDataPacket } from "mysql2/promise";

export interface DepartmentRow extends RowDataPacket {
  id: number;
  organization_id: number;
  name: string;
}

export async function findDepartmentsByOrganization(
  organizationId: number
): Promise<DepartmentRow[]> {
  const [rows] = await db.execute<DepartmentRow[]>(
    `SELECT id, organization_id, name
     FROM departments
     WHERE organization_id = ?
     ORDER BY name ASC`,
    [organizationId]
  );

  return rows;
}

export async function findDepartmentByName(
  organizationId: number,
  name: string
): Promise<DepartmentRow | null> {
  const [rows] = await db.execute<DepartmentRow[]>(
    `SELECT id, organization_id, name
     FROM departments
     WHERE organization_id = ? AND LOWER(name) = LOWER(?)
     LIMIT 1`,
    [organizationId, name]
  );

  return rows[0] ?? null;
}

export async function createDepartment(
  organizationId: number,
  name: string
): Promise<DepartmentRow> {
  const [result] = await db.execute(
    `INSERT INTO departments (organization_id, name)
     VALUES (?, ?)`,
    [organizationId, name]
  );

  const insertId = (result as { insertId: number }).insertId;

  const [rows] = await db.execute<DepartmentRow[]>(
    `SELECT id, organization_id, name
     FROM departments
     WHERE id = ? AND organization_id = ?
     LIMIT 1`,
    [insertId, organizationId]
  );

  if (!rows[0]) {
    throw new Error("Department was created but could not be retrieved.");
  }

  return rows[0];
}


export async function updateDepartment(
  organizationId: number,
  departmentId: number,
  name: string
): Promise<DepartmentRow | null> {
  await db.execute(
    `UPDATE departments
     SET name = ?
     WHERE id = ? AND organization_id = ?`,
    [name, departmentId, organizationId]
  );

  const [rows] = await db.execute<DepartmentRow[]>(
    `SELECT id, organization_id, name
     FROM departments
     WHERE id = ? AND organization_id = ?
     LIMIT 1`,
    [departmentId, organizationId]
  );

  return rows[0] ?? null;
}


export async function countEmployeesByDepartment(
  organizationId: number,
  departmentId: number
): Promise<number> {
  const [rows] = await db.execute<
    (RowDataPacket & { total: number })[]
  >(
    `SELECT COUNT(*) AS total
     FROM employee_profiles ep
     INNER JOIN users u ON u.id = ep.user_id
     WHERE u.organization_id = ?
       AND ep.department_id = ?`,
    [organizationId, departmentId]
  );

  return Number(rows[0]?.total ?? 0);
}

export async function deleteDepartment(
  organizationId: number,
  departmentId: number
): Promise<boolean> {
  const [result] = await db.execute(
    `DELETE FROM departments
     WHERE id = ? AND organization_id = ?`,
    [departmentId, organizationId]
  );

  return (result as { affectedRows: number }).affectedRows > 0;
}



export async function findEmployeesByDepartment(
  organizationId: number,
  departmentId: number
) {
  const [rows] = await db.execute<
    (RowDataPacket & {
      id: number;
      name: string;
      email: string;
      role: string;
      employeeCode: string;
      jobTitle: string | null;
      status: string;
    })[]
  >(
    `SELECT
       u.id,
       u.name,
       u.email,
       r.name AS role,
       ep.employee_code AS employeeCode,
       ep.job_title AS jobTitle,
       u.status
     FROM employee_profiles ep
     INNER JOIN users u
       ON u.id = ep.user_id
     INNER JOIN roles r
       ON r.id = u.role_id
     INNER JOIN departments d
       ON d.id = ep.department_id
      AND d.organization_id = u.organization_id
     WHERE u.organization_id = ?
       AND ep.department_id = ?
     ORDER BY u.name ASC`,
    [organizationId, departmentId]
  );

  return rows;
}


export async function findDepartmentByIdInOrganization(
  organizationId: number,
  departmentId: number
): Promise<DepartmentRow | null> {
  const [rows] = await db.execute<DepartmentRow[]>(
    `SELECT id, organization_id, name
     FROM departments
     WHERE id = ? AND organization_id = ?
     LIMIT 1`,
    [departmentId, organizationId]
  );

  return rows[0] ?? null;
}

