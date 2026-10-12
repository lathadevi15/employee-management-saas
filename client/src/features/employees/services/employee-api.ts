
import apiClient from "@/services/api-client";

export interface CreateEmployeeInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: "manager" | "employee";
  employeeCode: string;
  jobTitle?: string;
  department?: string;
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
