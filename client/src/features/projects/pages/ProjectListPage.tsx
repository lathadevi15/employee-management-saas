
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProjects, type Project } from "../services/project-api";

export default function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (error) {
        console.error("Unable to load projects:", error);
        setError("Unable to load projects. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    void loadProjects();
  }, []);

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("all");
    setPriorityFilter("all");
  }

  const filteredProjects = projects.filter((project) => {
    const search = searchTerm.trim().toLowerCase();

    const matchesSearch =
      project.name.toLowerCase().includes(search) ||
      (project.client_name ?? "").toLowerCase().includes(search) ||
      project.manager_name.toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;

    const matchesPriority =
      priorityFilter === "all" || project.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (loading) {
    return <p className="p-6">Loading projects...</p>;
  }

  if (error) {
    return (
      <div className="p-6">
        <p role="alert" className="text-red-600">
          {error}
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-3 rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Projects
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage projects in your organization.
          </p>
        </div>

        <Link
          to="/projects/create"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <span className="text-lg leading-none">+</span>
          Create Project
        </Link>
      </div>

      <div className="mb-4">
        <label
          htmlFor="project-search"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Search projects
        </label>

        <input
          id="project-search"
          type="search"
          placeholder="Search by project, client, or manager..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
        />
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="project-status"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Filter by status
          </label>

          <select
            id="project-status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on_hold">On hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="project-priority"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Filter by priority
          </label>

          <select
            id="project-priority"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none"
          >
            <option value="all">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={clearFilters}
        className="mb-4 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Clear Filters
      </button>

      <div className="mb-4 rounded-lg border bg-white p-4">
        <p className="text-sm text-gray-500">Total projects</p>
        <p className="text-2xl font-semibold">
          {filteredProjects.length}
        </p>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <h2 className="font-semibold">No projects found</h2>
          <p className="mt-2 text-sm text-gray-500">
            Try changing your filters or create a project to see it here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3">Project</th>
                <th className="p-3">Manager</th>
                <th className="p-3">Deadline</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Status</th>
                <th className="p-3">Budget</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {filteredProjects.map((project) => (
                <tr key={project.id}>
                  <td className="p-3">
                    <p className="font-medium">{project.name}</p>
                    <p className="text-gray-500">
                      {project.client_name || "No client specified"}
                    </p>
                  </td>

                  <td className="p-3">{project.manager_name}</td>

                  <td className="p-3">
                    {project.deadline
                      ? project.deadline.slice(0, 10)
                      : "—"}
                  </td>

                  <td className="p-3 capitalize">
                    {project.priority}
                  </td>

                  <td className="p-3">
                    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-700">
                      {project.status.replace("_", " ")}
                    </span>
                  </td>

                  <td className="p-3">
                    {project.budget == null
                      ? "—"
                      : Number(project.budget).toLocaleString("en-IN", {
                          style: "currency",
                          currency: "INR",
                          maximumFractionDigits: 2,
                        })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
