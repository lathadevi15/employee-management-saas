
import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import {
  createDepartment,
  getDepartments,
  type Department,
} from "./department-api";

export default function DepartmentManagementPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadDepartments() {
    try {
      setError("");
      const data = await getDepartments();
      setDepartments(data);
    } catch {
      setError("Unable to load departments. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDepartments();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const trimmedName = name.trim();

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setError("Department name must contain 2–100 characters.");
      return;
    }

    setCreating(true);

    try {
      const department = await createDepartment(trimmedName);

      setDepartments((previous) =>
        [...previous, department].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );

      setName("");
      setSuccess("Department created successfully.");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;

        if (status === 401) {
          setError("Your session has expired. Please log in again.");
        } else if (status === 403) {
          setError("You don't have permission to create departments.");
        } else if (status === 409) {
          setError("A department with this name already exists.");
        } else if (status === 400) {
          setError(
            err.response?.data?.message ??
              "Please enter a valid department name."
          );
        } else if (!err.response) {
          setError("Unable to connect to the server. Please try again.");
        } else {
          setError("Something went wrong. Please try again.");
        }
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-2 text-2xl font-semibold">
        Department Management
      </h1>

      <p className="mb-6 text-sm text-gray-500">
        Create and view departments in your organization.
      </p>

      {error && (
        <div role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div role="status" className="mb-4 rounded-md bg-green-50 p-3 text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-8 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label
            htmlFor="departmentName"
            className="mb-1 block text-sm font-medium"
          >
            Department name
          </label>

          <input
            id="departmentName"
            name="departmentName"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            required
            placeholder="e.g. Finance"
            className="w-full rounded-md border p-2"
          />
        </div>

        <button
          type="submit"
          disabled={creating}
          className="self-end rounded-md bg-blue-600 px-5 py-2 text-white disabled:opacity-60"
        >
          {creating ? "Creating..." : "Create Department"}
        </button>
      </form>

      <h2 className="mb-3 text-lg font-semibold">Existing Departments</h2>

      {loading ? (
        <p className="text-sm text-gray-500">Loading departments...</p>
      ) : departments.length === 0 ? (
        <p className="text-sm text-gray-500">
          No departments found. Create your first department above.
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {departments.map((department) => (
            <li
              key={department.id}
              className="flex items-center justify-between p-3"
            >
              <span>{department.name}</span>
              <span className="text-sm text-gray-500">
                ID: {department.id}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
