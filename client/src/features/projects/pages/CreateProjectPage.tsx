
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import {
  createProject,
  getActiveManagers,
  type ProjectManager,
} from "../services/project-api";

const ORGANIZATION_ADMIN_ROLE_ID = 2;
const MANAGER_ROLE_ID = 3;

export default function CreateProjectPage() {
  const { user, loadingUser } = useAuth();
  const navigate = useNavigate();

  const [managers, setManagers] = useState<ProjectManager[]>([]);
  const [managerId, setManagerId] = useState("");
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [clientName, setClientName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState<
    "planning" | "active" | "on_hold" | "completed" | "cancelled"
  >("planning");
  const [priority, setPriority] = useState<
    "low" | "medium" | "high" | "critical"
  >("medium");
  const [budget, setBudget] = useState("");

  const isAdmin = user?.roleId === ORGANIZATION_ADMIN_ROLE_ID;
  const isManager = user?.roleId === MANAGER_ROLE_ID;

  useEffect(() => {
    if (!user || !isAdmin) return;

    let cancelled = false;

    async function loadManagers() {
      setLoadingManagers(true);
      setError("");

      try {
        const data = await getActiveManagers();

        if (!cancelled) {
          setManagers(data);
        }
      } catch (err) {
        console.error("Unable to load managers:", err);

        if (!cancelled) {
          setError("Unable to load active managers. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoadingManagers(false);
        }
      }
    }

    void loadManagers();

    return () => {
      cancelled = true;
    };
  }, [user, isAdmin]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setValidationError("");

    if (!user || (!isAdmin && !isManager)) {
      setError("You are not allowed to create projects.");
      return;
    }

    if (startDate && deadline && deadline < startDate) {
      setValidationError("Deadline cannot be earlier than the start date.");
      return;
    }

    if (isAdmin && !managerId) {
      setValidationError("Please select a project manager.");
      return;
    }

    if (budget.trim() && (!Number.isFinite(Number(budget)) || Number(budget) < 0)) {
      setValidationError("Enter a valid, non-negative budget.");
      return;
    }

    setSubmitting(true);

    try {
      await createProject({
        name: name.trim(),
        description: description.trim() || null,
        clientName: clientName.trim() || null,
        startDate: startDate || null,
        deadline: deadline || null,
        status,
        priority,
        budget: budget.trim() ? Number(budget) : null,
        ...(isAdmin ? { managerId: Number(managerId) } : {}),
      });

      navigate("/projects");
    } catch (err) {
      console.error("Project creation failed:", err);
      setError("Unable to create project. Check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingUser) {
    return <p className="p-6">Loading your account...</p>;
  }

  if (!user || (!isAdmin && !isManager)) {
    return (
      <div className="p-6">
        <p className="text-red-600">You are not allowed to create projects.</p>
        <Link to="/projects" className="mt-4 inline-block text-purple-700 underline">
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <Link to="/projects" className="text-sm text-purple-700 hover:underline">
          ← Back to Projects
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">
          Create Project
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter the project details below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border bg-white p-6">
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {validationError && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {validationError}
          </p>
        )}

        <div>
          <label htmlFor="project-name" className="mb-2 block text-sm font-medium text-gray-700">
            Project name *
          </label>
          <input
            id="project-name"
            required
            minLength={2}
            maxLength={150}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="project-description" className="mb-2 block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="project-description"
            rows={4}
            maxLength={5000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="client-name" className="mb-2 block text-sm font-medium text-gray-700">
            Client name
          </label>
          <input
            id="client-name"
            maxLength={150}
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none"
          />
        </div>

        {isAdmin && (
          <div>
            <label htmlFor="project-manager" className="mb-2 block text-sm font-medium text-gray-700">
              Project manager *
            </label>
            <select
              id="project-manager"
              required
              value={managerId}
              disabled={loadingManagers || managers.length === 0}
              onChange={(event) => setManagerId(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none disabled:bg-gray-100"
            >
              <option value="">
                {loadingManagers ? "Loading managers..." : "Select a manager"}
              </option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name} ({manager.email})
                </option>
              ))}
            </select>
            {!loadingManagers && managers.length === 0 && (
              <p className="mt-1 text-sm text-amber-700">
                No active managers found in your organization.
              </p>
            )}
          </div>
        )}

        {isManager && (
          <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
            You will automatically be assigned as this project's manager.
          </p>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="start-date" className="mb-2 block text-sm font-medium text-gray-700">
              Start date
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="deadline" className="mb-2 block text-sm font-medium text-gray-700">
              Deadline
            </label>
            <input
              id="deadline"
              type="date"
              min={startDate || undefined}
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="project-status" className="mb-2 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="project-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as typeof status)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none"
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on_hold">On hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label htmlFor="project-priority" className="mb-2 block text-sm font-medium text-gray-700">
              Priority
            </label>
            <select
              id="project-priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value as typeof priority)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="project-budget" className="mb-2 block text-sm font-medium text-gray-700">
            Budget (₹)
          </label>
          <input
            id="project-budget"
            type="number"
            min="0"
            step="0.01"
            value={budget}
            onChange={(event) => setBudget(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
          <Link
            to="/projects"
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || (isAdmin && (loadingManagers || managers.length === 0))}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create Project"}
          </button>
        </div>
      </form>
    </div>
  );
}
