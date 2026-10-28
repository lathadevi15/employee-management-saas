
import {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

import { db } from "../../config/database.js";


interface RoleRow extends RowDataPacket {
  id: number;
  name: string;
}


interface ExistingUserRow extends RowDataPacket {
  id: number;
}



export async function createEmployeeProfile(
  connection: PoolConnection,
  userId: number,
  employeeCode: string,
  jobTitle: string | undefined,
  departmentId: number | undefined,
  joiningDate: string | undefined
): Promise<number> {
  const [result] = await connection.execute<ResultSetHeader>(
    `
      INSERT INTO employee_profiles (
        user_id,
        employee_code,
        job_title,
        department_id,
        joining_date
      )
      VALUES (?, ?, ?, ?, ?)
    `,
    [
      userId,
      employeeCode,
      jobTitle ?? null,
      departmentId ?? null,
      joiningDate ?? null,
    ]
  );

  return result.insertId;
}



export async function findRoleById(
  connection: PoolConnection,
  roleId: number
): Promise<RoleRow | null> {
  const [rows] = await connection.execute<RoleRow[]>(
    `
      SELECT id, name
      FROM roles
      WHERE id = ?
      LIMIT 1
    `,
    [roleId]
  );

  return rows.length > 0 ? rows[0] : null;
}



export async function findUserByEmailInOrganization(
  connection: PoolConnection,
  organizationId: number,
  email: string
): Promise<ExistingUserRow | null> {
  const [rows] = await connection.execute<ExistingUserRow[]>(
    `
      SELECT id
      FROM users
      WHERE organization_id = ?
        AND email = ?
      LIMIT 1
    `,
    [organizationId, email]
  );

  return rows.length > 0 ? rows[0] : null;
}



export async function findEmployeeCodeInOrganization(
  connection: PoolConnection,
  organizationId: number,
  employeeCode: string
): Promise<ExistingUserRow | null> {
  const [rows] = await connection.execute<ExistingUserRow[]>(
    `
      SELECT u.id
      FROM employee_profiles AS ep
      INNER JOIN users AS u ON u.id = ep.user_id
      WHERE u.organization_id = ?
        AND ep.employee_code = ?
      LIMIT 1
    `,
    [organizationId, employeeCode]
  );

  return rows.length > 0 ? rows[0] : null;
}



export async function findEmployeesByOrganization(
  connection: PoolConnection,
  organizationId: number
) {
  const [rows] = await connection.execute(
    `SELECT
       u.id,
       u.name,
       u.email,
       u.phone,
       u.status,
       r.name AS role,
       ep.employee_code AS employeeCode,
       ep.job_title AS jobTitle,
       ep.department_id AS departmentId,
       d.name AS department,
       ep.joining_date AS joiningDate
     FROM users u
     INNER JOIN employee_profiles ep
       ON ep.user_id = u.id
     INNER JOIN roles r
       ON r.id = u.role_id
     LEFT JOIN departments d
       ON d.id = ep.department_id
      AND d.organization_id = u.organization_id
     WHERE u.organization_id = ?
     ORDER BY u.created_at DESC`,
    [organizationId]
  );

  return rows;
}


export async function updateEmployeeUser(
  connection: PoolConnection,
  userId: number,
  organizationId: number,
  data: {
    name: string;
    email: string;
    phone?: string;
    roleId: number;
    status: "active" | "inactive";
  }
) {
  const [result] = await connection.execute(
    `UPDATE users
     SET name = ?,
         email = ?,
         phone = ?,
         role_id = ?,status = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?
       AND organization_id = ?`,
    [
      data.name,
      data.email,
      data.phone || null,
      data.roleId,
      data.status,
      userId,
      organizationId,
    ]
  );

  return result;
}


export async function updateEmployeeProfile(
  connection: PoolConnection,
  userId: number,
  data: {
    employeeCode: string;
    jobTitle?: string;
    departmentId?: number;
    joiningDate?: string;
  }
) {
  const [result] = await connection.execute(
    `UPDATE employee_profiles
     SET employee_code = ?,
         job_title = ?,
         department_id = ?,
         joining_date = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`,
    [
      data.employeeCode,
      data.jobTitle || null,
      data.departmentId ?? null,
      data.joiningDate || null,
      userId,
    ]
  );

  return result;
}



export async function deleteEmployee(
  connection: PoolConnection,
  userId: number,
  organizationId: number
) {
  const [result] = await connection.execute(
    `DELETE FROM users
     WHERE id = ?
       AND organization_id = ?`,
    [userId, organizationId]
  );

  return result;
}


export async function findDepartmentByIdInOrganization(
  connection: PoolConnection,
  organizationId: number,
  departmentId: number
): Promise<boolean> {
  const [rows] = await connection.execute<RowDataPacket[]>(
    `SELECT id
     FROM departments
     WHERE id = ?
       AND organization_id = ?
     LIMIT 1`,
    [departmentId, organizationId]
  );

  return rows.length > 0;
}



export async function findActiveManagersByOrganization(
  organizationId: number
) {
  const [rows] = await db.execute<
    (RowDataPacket & {
      id: number;
      name: string;
      email: string;
    })[]
  >(
    `SELECT
       u.id,
       u.name,
       u.email
     FROM users u
     INNER JOIN roles r ON r.id = u.role_id
     WHERE u.organization_id = ?
       AND r.name = 'manager'
       AND u.status = 'active'
     ORDER BY u.name ASC`,
    [organizationId]
  );

  return rows;
}
