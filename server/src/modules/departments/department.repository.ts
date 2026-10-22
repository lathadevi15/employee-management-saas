
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