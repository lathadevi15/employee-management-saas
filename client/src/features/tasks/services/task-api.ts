
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
