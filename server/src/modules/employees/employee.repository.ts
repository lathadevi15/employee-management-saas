
import {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";



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
  department: string | undefined,
  joiningDate: string | undefined
): Promise<number> {
  const [result] = await connection.execute<ResultSetHeader>(
    `
      INSERT INTO employee_profiles (
        user_id,
        employee_code,
        job_title,
        department,
        joining_date
      )
      VALUES (?, ?, ?, ?, ?)
    `,
    [
      userId,
      employeeCode,
      jobTitle ?? null,
      department ?? null,
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
