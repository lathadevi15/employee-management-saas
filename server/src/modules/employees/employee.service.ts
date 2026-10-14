import { db } from "../../config/database.js";
import { CreateEmployeeInput } from "./employee.types.js";
import bcrypt from "bcrypt";
import {
  createUser,
  findRoleByName,
} from "../auth/auth.repository.js";
import {
  createEmployeeProfile,
  findEmployeeCodeInOrganization,
  findRoleById,
  findUserByEmailInOrganization,
  findEmployeesByOrganization
} from "./employee.repository.js";



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

    // 1. Confirm the requested role exists.
    const role = await findRoleByName(connection, input.role);

    if (!role || !["manager", "employee"].includes(role.name)) {
      throw new Error("INVALID_EMPLOYEE_ROLE");
    }

    // 2. Check for a duplicate email in this organization.
    const existingEmail = await findUserByEmailInOrganization(
      connection,
      organizationId,
      input.email
    );

    if (existingEmail) {
      throw new Error("EMPLOYEE_EMAIL_EXISTS");
    }

    // 3. Check for a duplicate employee code in this organization.
    const existingCode = await findEmployeeCodeInOrganization(
      connection,
      organizationId,
      input.employeeCode
    );

    if (existingCode) {
      throw new Error("EMPLOYEE_CODE_EXISTS");
    }

    // 4. Hash the password before storing it.
    const passwordHash = await bcrypt.hash(input.password, 10);

    // 5. Create the user's login and identity record.
    const userId = await createUser(
      connection,
      organizationId,
      role.id,
      input.name,
      input.email,
      input.phone,
      passwordHash
    );

    // 6. Create the employment profile.
    const employeeProfileId = await createEmployeeProfile(
      connection,
      userId,
      input.employeeCode,
      input.jobTitle,
      input.department,
      input.joiningDate
    );

    // 7. Commit both inserts together.
    await connection.commit();

    return {
      id: userId,
      employeeProfileId,
      organizationId,
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      role: role.name,
      status: "active",
      employeeCode: input.employeeCode,
      jobTitle: input.jobTitle ?? null,
      department: input.department ?? null,
      joiningDate: input.joiningDate ?? null,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}


export async function getEmployees(organizationId: number) {
  const connection = await db.getConnection();

  try {
    const employees = await findEmployeesByOrganization(
      connection,
      organizationId
    );

    return employees;
  } finally {
    connection.release();
  }
}