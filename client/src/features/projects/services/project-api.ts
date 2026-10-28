
import apiClient from "@/services/api-client";

export interface Project {
  id: number;
  name: string;
  description: string | null;
  client_name: string | null;
  start_date: string | null;
  deadline: string | null;
  status: string;
  priority: string;
  budget: string | number | null;
  manager_id: number;
  manager_name: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

interface GetProjectsResponse {
  projects: Project[];
}

export async function getProjects(): Promise<Project[]> {
  const response =
    await apiClient.get<GetProjectsResponse>("/projects");

  return response.data.projects;
}


export interface ProjectManager {
  id: number;
  name: string;
  email: string;
}

interface GetManagersResponse {
  success: boolean;
  data: ProjectManager[];
}

export async function getActiveManagers(): Promise<ProjectManager[]> {
  const response =
    await apiClient.get<GetManagersResponse>("/employees/managers");

  return response.data.data;
}

export interface CreateProjectInput {
  name: string;
  description?: string | null;
  clientName?: string | null;
  startDate?: string | null;
  deadline?: string | null;
  status?: "planning" | "active" | "on_hold" | "completed" | "cancelled";
  priority?: "low" | "medium" | "high" | "critical";
  budget?: number | null;
  managerId?: number;
}

interface CreateProjectResponse {
  message: string;
  project: Project;
}

export async function createProject(
  input: CreateProjectInput
): Promise<Project> {
  const response = await apiClient.post<CreateProjectResponse>(
    "/projects",
    input
  );

  return response.data.project;
}

