
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getTaskById,
  getAvailableTaskAssignees,
  updateTaskAssignee,
  type TaskAssignee,
} from "../services/task-api";
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

  // Task details state
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Assignment state
  const [assignees, setAssignees] = useState<TaskAssignee[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const [assignmentError, setAssignmentError] = useState("");

  // Fetch task details
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

  // Fetch eligible employees after task details load
  useEffect(() => {
    if (!task || !id) return;

    const fetchAssignees = async () => {
      try {
        setAssignmentLoading(true);
        setAssignmentError("");

        const data = await getAvailableTaskAssignees(Number(id));

        setAssignees(data);
        setSelectedAssignee(
          task.assigned_to ? String(task.assigned_to) : ""
        );
      } catch (error) {
        console.error("Failed to fetch assignees:", error);
        setAssignmentError("Unable to load eligible employees.");
      } finally {
        setAssignmentLoading(false);
      }
    };

    fetchAssignees();
  }, [task?.id, id]);

  // Save assignment
  const handleSaveAssignment = async () => {
    try {
      setAssignmentSaving(true);
      setAssignmentError("");

      const assignedTo = selectedAssignee
        ? Number(selectedAssignee)
        : null;

      await updateTaskAssignee(Number(id), assignedTo);

      const updatedTask = await getTaskById(Number(id));
      setTask(updatedTask);
    } catch (error: any) {
      console.error("Failed to update assignment:", error);

      setAssignmentError(
        error.response?.data?.message ||
          "Failed to update task assignment."
      );
    } finally {
      setAssignmentSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return <p className="p-6">Loading task details...</p>;
  }

  // Error state
  if (error || !task) {
    return (
      <div className="p-6">
        <p className="text-red-600">
          {error || "Task not found."}
        </p>

        <button
          onClick={() => navigate("/tasks")}
          className="mt-4 text-blue-600"
        >
          Back to Tasks
        </button>
      </div>
    );
  }

  // Main UI
  return (
    <div className="max-w-4xl mx-auto p-6">

      <div className="flex justify-between items-center mb-5">
        <button
          onClick={() => navigate("/tasks")}
          className="text-blue-600"
        >
          ← Back to Tasks
        </button>

        <button
          onClick={() => navigate(`/tasks/${id}/edit`)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Edit Task
        </button>
      </div>

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

          {/* Assignment Section */}
          <div>
            <p className="text-sm text-gray-500 mb-2">
              Assigned To
            </p>

            <p className="font-medium mb-3">
              {task.assignee_name ?? "Unassigned"}
            </p>

            {assignmentLoading ? (
              <p className="text-sm text-gray-500">
                Loading eligible employees...
              </p>
            ) : (
              <div className="space-y-2">
                <select
                  value={selectedAssignee}
                  onChange={(e) =>
                    setSelectedAssignee(e.target.value)
                  }
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Unassigned</option>

                  {assignees.map((employee) => (
                    <option
                      key={employee.id}
                      value={employee.id}
                    >
                      {employee.name} ({employee.employee_code})
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleSaveAssignment}
                  disabled={assignmentSaving}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {assignmentSaving
                    ? "Saving..."
                    : "Save Assignment"}
                </button>
              </div>
            )}

            {assignmentError && (
              <p className="text-sm text-red-600 mt-2">
                {assignmentError}
              </p>
            )}
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
