import { db } from "../../config/database.js";
import { findRoleByName } from "../auth/auth.repository.js";
import { CreateEmployeeInput } from "./employee.types.js";
import { findRoleById } from "./employee.repository.js";


export async function authorizeEmployeeCreation(
  roleId: number
): Promise<void> {
  const connection = await db.getConnection();

  try {
    const requesterRole = await findRoleById(connection, roleId);

    if (!requesterRole || requesterRole.name !== "organization_admin") {
      throw new Error("FORBIDDEN_EMPLOYEE_CREATION");
    }
  } finally {
    connection.release();
  }
}


export async function createEmployee(
  input: CreateEmployeeInput,
  organizationId: number
) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

  const role = await findRoleByName(connection, input.role);

if (!role) {
  throw new Error("Requested role not found");
}

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}