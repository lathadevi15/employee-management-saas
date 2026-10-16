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
  findEmployeesByOrganization,
  updateEmployeeUser,
updateEmployeeProfile,
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


export async function updateEmployee(
  userId: number,
  organizationId: number,
  input: {
    name: string;
    email: string;
    phone?: string;
    role: "manager" | "employee";
    employeeCode: string;
    jobTitle?: string;
    department?: string;
    joiningDate?: string;
  }
) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Verify the employee belongs to this organization.
    const [existingRows] = await connection.execute(
      `SELECT u.id
       FROM users u
       INNER JOIN employee_profiles ep ON ep.user_id = u.id
       WHERE u.id = ? AND u.organization_id = ?
       FOR UPDATE`,
      [userId, organizationId]
    );

    if ((existingRows as { id: number }[]).length === 0) {
      throw new Error("EMPLOYEE_NOT_FOUND");
    }

    // 2. Resolve the requested role.
    const [roleRows] = await connection.execute(
      `SELECT id, name FROM roles
       WHERE name = ?`,
      [input.role]
    );

    const roles = roleRows as { id: number; name: string }[];

    if (roles.length === 0) {
      throw new Error("INVALID_EMPLOYEE_ROLE");
    }

    // 3. Check that the email isn't used by another account
    // in the same organization.
    const [emailRows] = await connection.execute(
      `SELECT id FROM users
       WHERE organization_id = ?
         AND email = ?
         AND id <> ?`,
      [organizationId, input.email, userId]
    );

    if ((emailRows as { id: number }[]).length > 0) {
      throw new Error("EMPLOYEE_EMAIL_EXISTS");
    }

    // 4. Check employee code uniqueness in the organization.
    const [codeRows] = await connection.execute(
      `SELECT ep.user_id
       FROM employee_profiles ep
       INNER JOIN users u ON u.id = ep.user_id
       WHERE u.organization_id = ?
         AND ep.employee_code = ?
         AND ep.user_id <> ?`,
      [organizationId, input.employeeCode, userId]
    );

    if ((codeRows as { user_id: number }[]).length > 0) {
      throw new Error("EMPLOYEE_CODE_EXISTS");
    }

    // 5. Update both tables within the same transaction.
    await updateEmployeeUser(
      connection,
      userId,
      organizationId,
      {
        name: input.name,
        email: input.email,
        phone: input.phone,
        roleId: roles[0].id,
      }
    );

    await updateEmployeeProfile(connection, userId, {
      employeeCode: input.employeeCode,
      jobTitle: input.jobTitle,
      department: input.department,
      joiningDate: input.joiningDate,
    });

    await connection.commit();

    return {
      id: userId,
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      role: input.role,
      employeeCode: input.employeeCode,
      jobTitle: input.jobTitle || null,
      department: input.department || null,
      joiningDate: input.joiningDate || null,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
