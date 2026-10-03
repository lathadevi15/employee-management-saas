import apiClient from "@/services/api-client";
import type { RegisterFormValues } from "./schemas";
import type { LoginFormValues } from "./schemas";

export async function registerUser(data: RegisterFormValues) {
  const response = await apiClient.post("/auth/register", data);

  return response.data;
}

export async function loginUser(data: LoginFormValues) {
  const response = await apiClient.post("/auth/login", data);

  return response.data;
}