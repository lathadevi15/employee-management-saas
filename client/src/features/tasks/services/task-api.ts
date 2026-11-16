
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