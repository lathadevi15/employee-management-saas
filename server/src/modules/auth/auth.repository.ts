import {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
interface UserRow extends RowDataPacket {
  id: number;
  organization_id: number;
  role_id: number;
  name: string;
  email: string;
  password_hash: string;
  status: "active" | "inactive";
  email_verified: boolean;
}
interface RoleRow extends RowDataPacket {
  id: number;
  name: string;
}

export async function createOrganization(
  connection: PoolConnection,
  name: string,
  slug: string
): Promise<number> {
  const [result] = await connection.execute<ResultSetHeader>(
    `
      INSERT INTO organizations (name, slug)
      VALUES (?, ?)
    `,
    [name, slug]
  );

  return result.insertId;
}

export async function findRoleByName(
  connection: PoolConnection,
  roleName: string
): Promise<RoleRow | null> {
  const [rows] = await connection.execute<RoleRow[]>(
    `
      SELECT id, name
      FROM roles
      WHERE name = ?
      LIMIT 1
    `,
    [roleName]
  );

  return rows.length > 0 ? rows[0] : null;
}

export async function createUser(
  connection: PoolConnection,
  organizationId: number,
  roleId: number,
  name: string,
  email: string,
  phone: string | undefined,
  passwordHash: string
): Promise<number> {
  const [result] = await connection.execute<ResultSetHeader>(
    `
      INSERT INTO users (
        organization_id,
        role_id,
        name,
        email,
        phone,
        password_hash
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      organizationId,
      roleId,
      name,
      email,
      phone ?? null,
      passwordHash,
    ]
  );

  return result.insertId;
}

export async function findUserByEmail(
  connection: PoolConnection,
  email: string
): Promise<UserRow | null> {
  const [rows] = await connection.execute<UserRow[]>(
    `
      SELECT
        id,
        organization_id,
        role_id,
        name,
        email,
        password_hash,
        status,
        email_verified
      FROM users
      WHERE email = ?
      LIMIT 1
    `,
    [email]
  );

  return rows.length > 0 ? rows[0] : null;
}