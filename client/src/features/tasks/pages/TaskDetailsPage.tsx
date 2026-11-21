import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getTaskById,
  getAvailableTaskAssignees,
  updateTaskAssignee,
  updateTaskStatus,
  deleteTask,
  type TaskAssignee,
  type Task,
} from "../services/task-api";
import TaskStatusBadge from "../components/TaskStatusBadge";
import TaskPriorityBadge from "../components/TaskPriorityBadge";
import { useAuth } from "@/features/auth/AuthContext";

const TaskDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.roleId === 2;
  const isManager = user?.roleId === 3;

  // Task details state
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState("");

  // Assignment state
  const [assignees, setAssignees] = useState<TaskAssignee[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const [assignmentError, setAssignmentError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const isProjectTask = task?.project_id !== null && task?.project_id !== undefined;
  const isManagedProject = isProjectTask && task?.project_manager_id === user?.userId;
  const isCreatedIndependent = !isProjectTask && task?.created_by === user?.userId;

  const canManageTask =
    isAdmin || (isManager && (isManagedProject || isCreatedIndependent));

  const canUpdateStatus = Boolean(
    user && task?.assigned_to !== null && task?.assigned_to === user?.userId
  );

  // Fetch task details
  useEffect(() => {
    const fetchTask = async () => {
      try {
        const data = await getTaskById(Number(id));
        setTask(data);
      } catch (err) {
        console.error("Failed to fetch task:", err);
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

  // Fetch eligible assignees after task details load (only if authorized)
  useEffect(() => {
    if (!task || !id || !canManageTask) return;

    const fetchAssignees = async () => {
      try {
        setAssignmentLoading(true);
        setAssignmentError("");

        const data = await getAvailableTaskAssignees(Number(id));

        setAssignees(data);
        setSelectedAssignee(
          task.assigned_to ? String(task.assigned_to) : ""
        );
      } catch (err) {
        console.error("Failed to fetch assignees:", err);
        setAssignmentError("Unable to load eligible assignees.");
      } finally {
        setAssignmentLoading(false);
      }
    };

    fetchAssignees();
  }, [task?.id, task?.assigned_to, id, canManageTask]);

  useEffect(() => {
    if (task) {
      setSelectedStatus(task.status);
    }
  }, [task?.id, task?.status]);

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
    } catch (err: any) {
      console.error("Failed to update assignment:", err);

      setAssignmentError(
        err.response?.data?.message ||
          "Failed to update task assignment."
      );
    } finally {
      setAssignmentSaving(false);
    }
  };

  const handleSaveStatus = async () => {
    try {
      setStatusSaving(true);
      setStatusError("");

      await updateTaskStatus(Number(id), {
        status: selectedStatus as
          | "to_do"
          | "in_progress"
          | "in_review"
          | "blocked"
          | "completed",
      });

      const updatedTask = await getTaskById(Number(id));
      setTask(updatedTask);
    } catch (err: any) {
      console.error("Failed to update task status:", err);

      setStatusError(
        err.response?.data?.message ||
          "Failed to update task status."
      );
    } finally {
      setStatusSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setDeleteError("");

      await deleteTask(Number(id));

      navigate("/tasks");
    } catch (err: any) {
      console.error("Failed to delete task:", err);

      setDeleteError(
        err.response?.data?.message ||
          "Failed to delete task. Please try again."
      );
    } finally {
      setDeleting(false);
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-5">
        <button
          onClick={() => navigate("/tasks")}
          className="text-blue-600"
        >
          ← Back to Tasks
        </button>

        {canManageTask && (
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/tasks/${id}/edit`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Edit Task
            </button>

            <button
              onClick={handleDeleteTask}
              disabled={deleting}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete Task"}
            </button>
          </div>
        )}
      </div>

      {deleteError && (
        <p className="text-sm text-red-600 mb-4">
          {deleteError}
        </p>
      )}

      <div className="border rounded-xl p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">
            {task.title}
          </h1>

          <p className="text-sm text-gray-500 mt-2">
            {task.project_name ?? "Independent Task"}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex gap-3">
            <TaskStatusBadge status={task.status} />
            <TaskPriorityBadge priority={task.priority} />
          </div>

          {canUpdateStatus && (
            <div className="max-w-sm space-y-2">
              <label className="block text-sm font-medium">
                Update Task Status
              </label>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="to_do">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="blocked">Blocked</option>
                <option value="completed">Completed</option>
              </select>

              <button
                onClick={handleSaveStatus}
                disabled={statusSaving || selectedStatus === task.status}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {statusSaving ? "Updating..." : "Update Status"}
              </button>

              {statusError && (
                <p className="text-sm text-red-600">
                  {statusError}
                </p>
              )}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-medium mb-2">Description</h2>

          <p className="text-gray-600">
            {task.description || "No description provided."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Assignment Section - visible to all with task access */}
          <div>
            <p className="text-sm text-gray-500 mb-2">
              Assigned To
            </p>

            <p className="font-medium mb-3">
              {task.assignee_name ?? "Unassigned"}
            </p>

            {/* Assignment controls - visible only to authorized Admin and Manager */}
            {canManageTask && (
              <div className="mt-2">
                {assignmentLoading ? (
                  <p className="text-sm text-gray-500">
                    Loading eligible assignees...
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

                      {assignees.map((person) => (
                        <option
                          key={person.id}
                          value={person.id}
                        >
                          {person.name} ({person.employee_code || (person.role ? person.role.charAt(0).toUpperCase() + person.role.slice(1) : "Member")})
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
