
import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import {
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
  type Department,
} from "./department-api";
import { Link } from "react-router-dom";

export default function DepartmentManagementPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
const [editName, setEditName] = useState("");
const [savingEdit, setSavingEdit] = useState(false);

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
  
async function handleUpdateDepartment(id: number) {
  setError("");
  setSuccess("");

  const trimmedName = editName.trim();

  if (trimmedName.length < 2 || trimmedName.length > 100) {
    setError("Department name must contain 2–100 characters.");
    return;
  }

  setSavingEdit(true);

  try {
    const updatedDepartment = await updateDepartment(id, trimmedName);

    setDepartments((previous) =>
      previous
        .map((department) =>
          department.id === id ? updatedDepartment : department
        )
        .sort((a, b) => a.name.localeCompare(b.name))
    );

    setEditingId(null);
    setEditName("");
    setSuccess("Department updated successfully.");
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;

      if (status === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (status === 403) {
        setError("You don't have permission to edit departments.");
      } else if (status === 404) {
        setError("Department not found.");
      } else if (status === 409) {
        setError("A department with this name already exists.");
      } else if (status === 400) {
        setError("Please enter a valid department name.");
      } else if (!err.response) {
        setError("Unable to connect to the server. Please try again.");
      } else {
        setError("Unable to update department. Please try again.");
      }
    } else {
      setError("An unexpected error occurred.");
    }
  } finally {
    setSavingEdit(false);
  }
}


async function handleDeleteDepartment(
  id: number,
  departmentName: string
) {
  const confirmed = window.confirm(
    `Are you sure you want to delete "${departmentName}"?`
  );

  if (!confirmed) return;

  setError("");
  setSuccess("");

  try {
    await deleteDepartment(id);

    setDepartments((currentDepartments) =>
      currentDepartments.filter(
        (department) => department.id !== id
      )
    );

    setSuccess(
      `Department "${departmentName}" deleted successfully.`
    );
  } catch (error: any) {
    if (error.response?.status === 401) {
      setError("Your session has expired. Please log in again.");
    } else if (error.response?.status === 403) {
      setError("You do not have permission to delete departments.");
    } else if (error.response?.status === 404) {
      setError("Department not found. Please refresh the list.");
    } else if (error.response?.status === 409) {
      setError(
        "This department has assigned employees. Reassign them before deleting it."
      );
    } else {
      setError("Failed to delete department. Please try again.");
    }
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
      className="flex flex-wrap items-center justify-between gap-3 p-3"
    >
      {editingId === department.id ? (
        <>
          <input
            aria-label="Department name"
            value={editName}
            onChange={(event) => setEditName(event.target.value)}
            maxLength={100}
            className="min-w-0 flex-1 rounded-md border p-2"
          />

          <div className="flex gap-2">
            <button
              type="button"
              disabled={savingEdit}
              onClick={() => void handleUpdateDepartment(department.id)}
              className="rounded-md bg-blue-600 px-3 py-2 text-white disabled:opacity-60"
            >
              {savingEdit ? "Saving..." : "Save"}
            </button>

            <button
              type="button"
              disabled={savingEdit}
              onClick={() => {
                setEditingId(null);
                setEditName("");
                setError("");
              }}
              className="rounded-md border px-3 py-2 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <span className="font-medium">{department.name}</span>
            <p className="text-sm text-gray-500">
              ID: {department.id}
            </p>
          </div>
<Link
  to={`/departments/${department.id}/employees`}
  className="text-blue-600 hover:underline"
>
  View Employees
</Link>
          <button
            type="button"
            onClick={() => {
              setEditingId(department.id);
              setEditName(department.name);
              setError("");
              setSuccess("");
            }}
            className="rounded-md border px-3 py-2 hover:bg-gray-50"
          >
            Edit
          </button>
          
<button
  type="button"
  onClick={() =>
    handleDeleteDepartment(department.id, department.name)
  }
  disabled={savingEdit}
  className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
>
  Delete
</button>

        </>
      )}
    </li>
  ))}
</ul>

      )}
    </div>
  );
}
