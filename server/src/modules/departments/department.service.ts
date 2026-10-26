import {
  findDepartmentsByOrganization,
  createDepartment,
  findDepartmentByName,
  updateDepartment,
  countEmployeesByDepartment,
  deleteDepartment,
  findEmployeesByDepartment,
  findDepartmentByIdInOrganization,
} from "./department.repository.js";
import { createDepartmentSchema } from "./department.schema.js";


export async function getDepartments(organizationId: number) {
  const departments = await findDepartmentsByOrganization(
    organizationId
  );

  return departments.map((department) => ({
    id: department.id,
    name: department.name,
  }));
}


export async function createDepartmentService(
  organizationId: number,
  input: unknown
) {
  const validationResult = createDepartmentSchema.safeParse(input);

  if (!validationResult.success) {
    throw new Error("VALIDATION_ERROR");
  }

  const { name } = validationResult.data;

  const existingDepartment = await findDepartmentByName(
    organizationId,
    name
  );

  if (existingDepartment) {
    throw new Error("DEPARTMENT_ALREADY_EXISTS");
  }

  try {
    const department = await createDepartment(organizationId, name);

    return {
      id: department.id,
      name: department.name,
    };
  } catch (error: unknown) {
    // MySQL duplicate-key error.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      throw new Error("DEPARTMENT_ALREADY_EXISTS");
    }

    throw error;
  }
}



export async function updateDepartmentService(
  organizationId: number,
  departmentId: number,
  input: unknown
) {
  const validationResult = createDepartmentSchema.safeParse(input);

  if (!validationResult.success) {
    throw new Error("VALIDATION_ERROR");
  }

  const { name } = validationResult.data;

  const existingDepartment = await findDepartmentByName(
    organizationId,
    name
  );

  if (
    existingDepartment &&
    existingDepartment.id !== departmentId
  ) {
    throw new Error("DEPARTMENT_ALREADY_EXISTS");
  }

  try {
    const department = await updateDepartment(
      organizationId,
      departmentId,
      name
    );

    if (!department) {
      throw new Error("DEPARTMENT_NOT_FOUND");
    }

    return {
      id: department.id,
      name: department.name,
    };
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      throw new Error("DEPARTMENT_ALREADY_EXISTS");
    }

    throw error;
  }
}



export async function deleteDepartmentService(
  organizationId: number,
  departmentId: number
) {
  const assignedEmployees = await countEmployeesByDepartment(
    organizationId,
    departmentId
  );

  if (assignedEmployees > 0) {
    throw new Error("DEPARTMENT_HAS_EMPLOYEES");
  }

  const deleted = await deleteDepartment(organizationId, departmentId);

  if (!deleted) {
    throw new Error("DEPARTMENT_NOT_FOUND");
  }

  return { id: departmentId };
}


export async function getDepartmentEmployeesService(
  organizationId: number,
  departmentId: number
) {
  const department = await findDepartmentByIdInOrganization(
    organizationId,
    departmentId
  );

  if (!department) {
    throw new Error("DEPARTMENT_NOT_FOUND");
  }

  const employees = await findEmployeesByDepartment(
    organizationId,
    departmentId
  );

  return {
    department: {
      id: department.id,
      name: department.name,
    },
    employees,
  };
}
