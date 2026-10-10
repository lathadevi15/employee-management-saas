
import {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";



interface RoleRow extends RowDataPacket {
  id: number;
  name: string;
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
