import axios from "axios";
import { getAccessToken } from "@/features/auth/auth-storage";

const apiClient = axios.create({
  baseURL: "http://localhost:5000/api",
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


export interface UpdateEmployeeInput {
  name: string;
  email: string;
  phone?: string;
  role: "manager" | "employee";
  employeeCode: string;
  jobTitle?: string;
  department?: string;
  joiningDate?: string;
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

export default apiClient;