
import apiClient from "@/services/api-client";

export const getTasks = async () => {
  const response = await apiClient.get("/tasks");
  return response.data.tasks;
};

export interface CreateTaskInput {
  title: string;
  description?: string;
  projectId?: number | null;
  priority: "low" | "medium" | "high" | "critical";
  assignedTo?: number | null;
  startDate?: string | null;
  dueDate?: string | null;
}

interface CreateTaskResponse {
  message: string;
  task: {
    id: number;
    title: string;
  };
}

export const createTask = async (
  input: CreateTaskInput
): Promise<CreateTaskResponse> => {
  const response = await apiClient.post<CreateTaskResponse>(
    "/tasks",
    input
  );

  return response.data;
};

export const getTaskById = async (taskId: number) => {
  const response = await apiClient.get(`/tasks/${taskId}`);
  return response.data.task;
};
export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  projectId?: number | null;
  priority?: "low" | "medium" | "high" | "critical";
  startDate?: string | null;
  dueDate?: string | null;
}

interface UpdateTaskResponse {
  message: string;
  task: {
    id: number;
    title: string;
  };
}

export const updateTask = async (
  taskId: number,
  input: UpdateTaskInput
): Promise<UpdateTaskResponse> => {
  const response = await apiClient.put<UpdateTaskResponse>(
    `/tasks/${taskId}`,
    input
  );

  return response.data;
};

export const updateTaskAssignee = async (
  taskId: number,
  assignedTo: number | null
) => {
  const response = await apiClient.patch(
    `/tasks/${taskId}/assignee`,
    { assignedTo }
  );

  return response.data;
};
export interface Task {
  id: number;
  title: string;
  description: string | null;
  project_id: number | null;
  project_name: string | null;
  project_manager_id?: number | null;
  status: string;
  priority: string;
  start_date: string | null;
  due_date: string | null;
  assigned_to: number | null;
  assignee_name: string | null;
  created_by: number;
  creator_name: string;
}

export interface TaskAssignee {
  id: number;
  name: string;
  email: string;
  employee_code: string | null;
  job_title: string | null;
  role?: string;
}
export const getAvailableTaskAssignees = async (
  taskId: number
): Promise<TaskAssignee[]> => {
  const response = await apiClient.get(
    `/tasks/${taskId}/available-assignees`
  );

  return response.data.assignees;
};

export interface UpdateTaskStatusInput {
  status: "to_do" | "in_progress" | "in_review" | "blocked" | "completed";
}

export const updateTaskStatus = async (
  taskId: number,
  input: UpdateTaskStatusInput
) => {
  const response = await apiClient.patch(
    `/tasks/${taskId}/status`,
    input
  );

  return response.data;
};

export const deleteTask = async (taskId: number) => {
  const response = await apiClient.delete(`/tasks/${taskId}`);
  return response.data;
};