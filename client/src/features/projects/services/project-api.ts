
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

export async function getProjectById(projectId: number) {
  const response = await apiClient.get<{ project: Project }>(
    `/projects/${projectId}`
  );

  return response.data.project;
}


export interface ProjectMember {
  user_id: number;
  name: string;
  email: string;
  role: string;
  employee_code: string | null;
  job_title: string | null;
  joined_at: string;
}

interface GetProjectMembersResponse {
  members: ProjectMember[];
}

export async function getProjectMembers(projectId: number) {
  const response = await apiClient.get<GetProjectMembersResponse>(
    `/projects/${projectId}/members`
  );

  return response.data.members;
}


interface GetAvailableMembersResponse {
  members: {
    id: number;
    name: string;
    email: string;
    employee_code: string | null;
    job_title: string | null;
  }[];
}

export async function getAvailableProjectMembers(projectId: number) {
  const response = await apiClient.get<GetAvailableMembersResponse>(
    `/projects/${projectId}/available-members`
  );

  return response.data.members;
}

export async function addProjectMembers(
  projectId: number,
  userIds: number[]
) {
  const response = await apiClient.post<{ message: string; addedCount: number }>(
    `/projects/${projectId}/members`,
    { userIds }
  );

  return response.data;
}


export async function removeProjectMember(
  projectId: number,
  userId: number
) {
  const response = await apiClient.delete(
    `/projects/${projectId}/members/${userId}`
  );

  return response.data;
}