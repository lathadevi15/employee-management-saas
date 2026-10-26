
import apiClient from "@/services/api-client";


export interface CreateEmployeeInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: "manager" | "employee";
  employeeCode: string;
  jobTitle?: string;
  departmentId?: number | "";
  joiningDate?: string;
}

export interface CreatedEmployee {
  id: number;
  employeeProfileId: number;
  organizationId: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  employeeCode: string;
  jobTitle: string | null;
  department: string | null;
  joiningDate: string | null;
}

interface CreateEmployeeResponse {
  success: boolean;
  message: string;
  data: CreatedEmployee;
}

export async function createEmployee(
  input: CreateEmployeeInput
): Promise<CreatedEmployee> {
  const response = await apiClient.post<CreateEmployeeResponse>(
    "/employees",
    input
  );

  return response.data.data;
}

export interface Employee {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  role: string;
  employeeCode: string;
  jobTitle: string | null;
  department: string | null;
  departmentId: number | null;
  joiningDate: string | null;
}

interface GetEmployeesResponse {
  success: boolean;
  data: Employee[];
}

export async function getEmployees(): Promise<Employee[]> {
  const response =
    await apiClient.get<GetEmployeesResponse>("/employees");

  return response.data.data;
}


export interface UpdateEmployeeInput {
  name: string;
  email: string;
  phone?: string;
  role: "manager" | "employee";
  employeeCode: string;
  jobTitle?: string;
  departmentId?: number;
  joiningDate?: string;
  status: "active" | "inactive";
}

export async function updateEmployee(
  userId: number,
  input: UpdateEmployeeInput
) {
  const response = await apiClient.put(
    `/employees/${userId}`,
    input
  );

  return response.data.data;
}

export async function deleteEmployee(userId: number): Promise<void> {
  await apiClient.delete(`/employees/${userId}`);
}

