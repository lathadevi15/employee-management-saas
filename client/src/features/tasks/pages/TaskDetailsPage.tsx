
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTaskById } from "../services/task-api";
import TaskStatusBadge from "../components/TaskStatusBadge";
import TaskPriorityBadge from "../components/TaskPriorityBadge";

interface Task {
  id: number;
  title: string;
  description: string | null;
  project_id: number | null;
  project_name: string | null;
  status: string;
  priority: string;
  start_date: string | null;
  due_date: string | null;
  assigned_to: number | null;
  assignee_name: string | null;
  created_by: number;
  creator_name: string;
}

const TaskDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const data = await getTaskById(Number(id));
        setTask(data);
      } catch (error) {
        console.error("Failed to fetch task:", error);
        setError("Unable to load task details.");
      } finally {
        setLoading(false);
      }
    };

    if (id && Number.isInteger(Number(id)) && Number(id) > 0) {
      fetchTask();
    } else {
      setError("Invalid task ID.");
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return <p className="p-6">Loading task details...</p>;
  }

  if (error || !task) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error || "Task not found."}</p>
        <button
          onClick={() => navigate("/tasks")}
          className="mt-4 text-blue-600"
        >
          Back to Tasks
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">

      <button
        onClick={() => navigate("/tasks")}
        className="text-blue-600 mb-5"
      >
        ← Back to Tasks
      </button>

      <div className="border rounded-xl p-6 space-y-6">

        <div>
          <h1 className="text-2xl font-semibold">
            {task.title}
          </h1>

          <p className="text-sm text-gray-500 mt-2">
            {task.project_name ?? "Independent Task"}
          </p>
        </div>

        <div className="flex gap-3">
          <TaskStatusBadge status={task.status} />
          <TaskPriorityBadge priority={task.priority} />
        </div>

        <div>
          <h2 className="font-medium mb-2">Description</h2>
          <p className="text-gray-600">
            {task.description || "No description provided."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <div>
            <p className="text-sm text-gray-500">Assigned To</p>
            <p className="font-medium">
              {task.assignee_name ?? "Unassigned"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Created By</p>
            <p className="font-medium">{task.creator_name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Start Date</p>
            <p className="font-medium">
              {task.start_date
                ? new Date(task.start_date).toLocaleDateString()
                : "Not specified"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Due Date</p>
            <p className="font-medium">
              {task.due_date
                ? new Date(task.due_date).toLocaleDateString()
                : "Not specified"}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default TaskDetailsPage;
