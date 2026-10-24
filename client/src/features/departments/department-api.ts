import apiClient from "@/services/api-client";

export interface Department {
  id: number;
  name: string;
}
interface CreateDepartmentResponse {
  success: boolean;
  message: string;
  data: Department;
}
interface GetDepartmentsResponse {
  success: boolean;
  data: Department[];
}

export async function getDepartments(): Promise<Department[]> {
  const response = await apiClient.get<GetDepartmentsResponse>("/departments");
  return response.data.data;
}

export async function createDepartment(
  name: string
): Promise<Department> {
  const response = await apiClient.post<CreateDepartmentResponse>(
    "/departments",
    { name }
  );

  return response.data.data;
}


interface UpdateDepartmentResponse {
  success: boolean;
  message: string;
  data: Department;
}

export async function updateDepartment(
  id: number,
  name: string
): Promise<Department> {
  const response = await apiClient.put<UpdateDepartmentResponse>(
    `/departments/${id}`,
    { name }
  );

  return response.data.data;
}
