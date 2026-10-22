
import { findDepartmentsByOrganization } from "./department.repository.js";
import { createDepartmentSchema } from "./department.schema.js";
import {
  createDepartment,
  findDepartmentByName,
} from "./department.repository.js";

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
    const error = new Error("VALIDATION_ERROR");
    throw error;
  }

  const { name } = validationResult.data;

  const existingDepartment = await findDepartmentByName(
    organizationId,
    name
  );

  if (existingDepartment) {
    throw new Error("DEPARTMENT_ALREADY_EXISTS");
  }

  const department = await createDepartment(organizationId, name);

  return {
    id: department.id,
    name: department.name,
  };
}
