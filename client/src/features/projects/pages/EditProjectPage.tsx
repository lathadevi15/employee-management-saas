
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import {
  getProjectById,
  getActiveManagers,
  updateProject,
  type Project,
  type ProjectManager,
  type CreateProjectInput,
} from "../services/project-api";

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.roleId === 2;

  const [project, setProject] = useState<Project | null>(null);
  const [managers, setManagers] = useState<ProjectManager[]>([]);

  const [form, setForm] = useState<CreateProjectInput>({
    name: "",
    description: "",
    clientName: "",
    startDate: "",
    deadline: "",
    status: "planning",
    priority: "medium",
    budget: null,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (!id || !/^\d+$/.test(id) || Number(id) <= 0) {
        setError("Invalid project ID.");
        setLoading(false);
        return;
      }

      try {
        const projectData = await getProjectById(Number(id));

        let managerData: ProjectManager[] = [];

        if (isAdmin) {
          managerData = await getActiveManagers();
        }

        if (cancelled) return;

        setProject(projectData);
        setManagers(managerData);

        setForm({
          name: projectData.name,
          description: projectData.description ?? "",
          clientName: projectData.client_name ?? "",
          startDate: projectData.start_date?.slice(0, 10) ?? "",
          deadline: projectData.deadline?.slice(0, 10) ?? "",
          status: projectData.status as CreateProjectInput["status"],
          priority: projectData.priority as CreateProjectInput["priority"],
          budget:
            projectData.budget == null
              ? null
              : Number(projectData.budget),
          ...(isAdmin ? { managerId: projectData.manager_id } : {}),
        });
      } catch {
        if (!cancelled) {
          setError("Unable to load project details.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [id, isAdmin]);

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        name === "budget"
          ? value === "" ? null : Number(value)
          : value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!id || !project) return;

    try {
      setSaving(true);
      setError("");

      const payload: CreateProjectInput = {
        ...form,
        name: form.name.trim(),
        description: form.description || null,
        clientName: form.clientName || null,
        startDate: form.startDate || null,
        deadline: form.deadline || null,
        budget: form.budget,
      };

      if (!isAdmin) {
        delete payload.managerId;
      }

      await updateProject(Number(id), payload);

      navigate(`/projects/${id}`);
    } catch {
      setError("Unable to update project. Please check your details.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading project...</div>;
  }

  if (error && !project) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error}</p>
        <Link to="/projects" className="text-blue-600">
          Back to Projects
        </Link>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <Link
        to={`/projects/${id}`}
        className="text-sm text-blue-600 hover:underline"
      >
        ← Back to Project
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Edit Project
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Update project information and settings.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-gray-200 bg-white p-6"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">
            Project Name *
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            minLength={2}
            maxLength={150}
            className="w-full rounded-lg border border-gray-300 p-3"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Description
          </label>
          <textarea
            name="description"
            value={form.description ?? ""}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-lg border border-gray-300 p-3"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Client Name
          </label>
          <input
            name="clientName"
            value={form.clientName ?? ""}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 p-3"
          />
        </div>

        {isAdmin && (
          <div>
            <label className="mb-1 block text-sm font-medium">
              Project Manager *
            </label>
            <select
              name="managerId"
              value={form.managerId ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  managerId: Number(event.target.value),
                }))
              }
              required
              className="w-full rounded-lg border border-gray-300 p-3"
            >
              <option value="">Select manager</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name} ({manager.email})
                </option>
              ))}
            </select>
          </div>
        )}

        {!isAdmin && (
          <div>
            <label className="mb-1 block text-sm font-medium">
              Project Manager
            </label>
            <input
              value={project.manager_name}
              disabled
              className="w-full rounded-lg border border-gray-200 bg-gray-100 p-3"
            />
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={form.startDate ?? ""}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 p-3"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Deadline
            </label>
            <input
              type="date"
              name="deadline"
              value={form.deadline ?? ""}
              min={form.startDate || undefined}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 p-3"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Status
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 p-3"
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Priority
            </label>
            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 p-3"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Budget (₹)
          </label>
          <input
            type="number"
            name="budget"
            value={form.budget ?? ""}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="w-full rounded-lg border border-gray-300 p-3"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 border-t pt-5">
          <Link
            to={`/projects/${id}`}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
