
import { useEffect, useState } from "react";
import {
  getEmployees,
  type Employee,deleteEmployee
} from "../services/employee-api";
import { Link } from "react-router-dom";


export default function EmployeeListPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);
const [deleteError, setDeleteError] = useState("");

        function clearFilters() {
  setSearchTerm("");
  setRoleFilter("all");
  setStatusFilter("all");
}

  useEffect(() => {
    async function loadEmployees() {
      try {
        const data = await getEmployees();
        setEmployees(data);
      } catch {
        setError("Unable to load employees. Please try again.");
      } finally {
        setLoading(false);
      }

    }

    void loadEmployees();
  }, []);

const filteredEmployees = employees.filter((employee) => {
  const search = searchTerm.trim().toLowerCase();

  const matchesSearch =
    employee.name.toLowerCase().includes(search) ||
    employee.email.toLowerCase().includes(search) ||
    employee.employeeCode.toLowerCase().includes(search);

  const matchesRole =
    roleFilter === "all" ||
    employee.role.toLowerCase() === roleFilter;

  const matchesStatus =
    statusFilter === "all" ||
    employee.status.toLowerCase() === statusFilter;

  return matchesSearch && matchesRole && matchesStatus;
});

  if (loading) {
    return <p className="p-6">Loading employees...</p>;
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 rounded bg-purple-600 px-4 py-2 text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
     
<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h1 className="text-2xl font-bold text-gray-900">
      Employees
    </h1>
    <p className="mt-1 text-sm text-gray-500">
      Manage employees in your organization.
    </p>
  </div>

  <Link
    to="/employees/create"
    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
  >
    <span className="text-lg leading-none">+</span>
    Add Employee
  </Link>
</div>


<div className="mb-4">
  <label
    htmlFor="employee-search"
    className="mb-2 block text-sm font-medium text-gray-700"
  >
    Search employees
  </label>

  <input
    id="employee-search"
    type="search"
    placeholder="Search by name, email, or employee code..."
    value={searchTerm}
    onChange={(event) => setSearchTerm(event.target.value)}
    className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
  />
  
</div>

<div className="mb-4">
  <label
    htmlFor="role-filter"
    className="mb-2 block text-sm font-medium text-gray-700"
  >
    Filter by role
  </label>

  <select
    id="role-filter"
    value={roleFilter}
    onChange={(event) => setRoleFilter(event.target.value)}
    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none sm:max-w-xs"
  >
    <option value="all">All roles</option>
    <option value="manager">Managers</option>
    <option value="employee">Employees</option>
  </select>
</div>

<div className="mb-4">
  <label
    htmlFor="status-filter"
    className="mb-2 block text-sm font-medium text-gray-700"
  >
    Filter by status
  </label>

  <select
    id="status-filter"
    value={statusFilter}
    onChange={(event) => setStatusFilter(event.target.value)}
    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none sm:max-w-xs"
  >
    <option value="all">All statuses</option>
    <option value="active">Active</option>
    <option value="inactive">Inactive</option>
  </select>
</div>

<button
  type="button"
  onClick={clearFilters}
  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
>
  Clear Filters
</button>



      <div className="mb-4 rounded-lg border bg-white p-4">
        <p className="text-sm text-gray-500">Total employees</p>
        <p className="text-2xl font-semibold">{filteredEmployees.length}</p>
      </div>

      {filteredEmployees.length === 0? (
        <div className="rounded-lg border p-8 text-center">
          <h2 className="font-semibold">No employees found</h2>
          <p className="mt-2 text-sm text-gray-500">
            Create an employee to see them listed here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          {deleteError && (
  <p role="alert" className="mb-4 text-sm text-red-600">
    {deleteError}
  </p>
)}
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3">Employee</th>
                <th className="p-3">Employee Code</th>
                <th className="p-3">Role</th>
                <th className="p-3">Department</th>
                <th className="p-3">Job Title</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id}>
                  <td className="p-3">
                    <p className="font-medium">{employee.name}</p>
                    <p className="text-gray-500">{employee.email}</p>
                  </td>
                  <td className="p-3">{employee.employeeCode}</td>
                  <td className="p-3 capitalize">{employee.role}</td>
                  <td className="p-3">
                    {employee.department || "—"}
                  </td>
                  <td className="p-3">
                    {employee.jobTitle || "—"}
                  </td>
               
<td className="p-3">
  <span
    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
      employee.status.toLowerCase() === "active"
        ? "bg-green-100 text-green-700"
        : "bg-gray-100 text-gray-700"
    }`}
  >
    {employee.status}
  </span>
</td>

<td className="p-3">
  <Link
    to={`/employees/${employee.id}/edit`}
    className="inline-flex rounded-lg border border-purple-200 px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-50"
  >
    Edit
  </Link>
  
<button
  type="button"
  onClick={() =>
    handleDeleteEmployee(employee.id, employee.name)
  }
  disabled={deletingId === employee.id}
  className="ml-2 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
>
  {deletingId === employee.id ? "Deleting..." : "Delete"}
</button>

</td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
  
async function handleDeleteEmployee(
  employeeId: number,
  employeeName: string
) {
  const confirmed = window.confirm(
    `Are you sure you want to delete ${employeeName}? This action cannot be undone.`
  );

  if (!confirmed) return;

  setDeletingId(employeeId);
  setDeleteError("");

  try {
    await deleteEmployee(employeeId);

    setEmployees((previous) =>
      previous.filter((employee) => employee.id !== employeeId)
    );
  } catch (error) {
    console.error("Employee deletion failed:", error);
    setDeleteError("Unable to delete employee. Please try again.");
  } finally {
    setDeletingId(null);
  }
}

}


