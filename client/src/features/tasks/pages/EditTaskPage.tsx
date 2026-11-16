
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getTaskById,
  updateTask,
  type UpdateTaskInput,
} from "../services/task-api";
import {
  getProjects,
  type Project,
} from "@/features/projects/services/project-api";

interface Task {
  id: number;
  title: string;
  description: string | null;
  project_id: number | null;
  priority: string;
  start_date: string | null;
  due_date: string | null;
}

const formatDate = (date: string | null) => {
  return date ? date.slice(0, 10) : "";
};

const EditTaskPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    projectId: "",
    priority: "medium",
    startDate: "",
    dueDate: "",
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
          setError("Invalid task ID.");
          return;
        }

        const [task, projectData] = await Promise.all([
          getTaskById(Number(id)),
          getProjects(),
        ]);

        setProjects(projectData);

        const taskData = task as Task;

        setFormData({
          title: taskData.title,
          description: taskData.description ?? "",
          projectId: taskData.project_id?.toString() ?? "",
          priority: taskData.priority,
          startDate: formatDate(taskData.start_date),
          dueDate: formatDate(taskData.due_date),
        });
      } catch (err) {
        console.error("Failed to load task:", err);
        setError("Unable to load task details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async () => {
    setSubmitError("");

    if (!formData.title.trim()) {
      setSubmitError("Please enter a task title.");
      return;
    }

    if (
      formData.startDate &&
      formData.dueDate &&
      formData.dueDate < formData.startDate
    ) {
      setSubmitError("Due date cannot be earlier than start date.");
      return;
    }

    const input: UpdateTaskInput = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      projectId: formData.projectId
        ? Number(formData.projectId)
        : null,
      priority: formData.priority as UpdateTaskInput["priority"],
      startDate: formData.startDate || null,
      dueDate: formData.dueDate || null,
    };

    try {
      setIsSubmitting(true);

      await updateTask(Number(id), input);

      navigate(`/tasks/${id}`);
    } catch (err: any) {
      console.error("Failed to update task:", err);

      setSubmitError(
        err.response?.data?.message ||
          "Failed to update task. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <p className="p-6">Loading task...</p>;
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error}</p>
        <button onClick={() => navigate("/tasks")}>
          Back to Tasks
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button
        onClick={() => navigate(`/tasks/${id}`)}
        className="text-blue-600 mb-5"
      >
        ← Back to Task Details
      </button>

      <h1 className="text-2xl font-semibold mb-6">
        Edit Task
      </h1>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2">
            Task Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({
                ...formData,
                description: e.target.value,
              })
            }
            rows={4}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Project
          </label>
          <select
            value={formData.projectId}
            onChange={(e) =>
              setFormData({
                ...formData,
                projectId: e.target.value,
              })
            }
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="">Independent Task</option>

            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Priority
          </label>
          <select
            value={formData.priority}
            onChange={(e) =>
              setFormData({
                ...formData,
                priority: e.target.value,
              })
            }
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  startDate: e.target.value,
                })
              }
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              min={formData.startDate || undefined}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  dueDate: e.target.value,
                })
              }
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {submitError && (
          <p className="text-sm text-red-600">{submitError}</p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Saving Changes..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default EditTaskPage;
