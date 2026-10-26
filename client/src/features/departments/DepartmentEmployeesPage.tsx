
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getDepartmentEmployees,
  type DepartmentEmployee,
  type Department,
} from "./department-api";

export default function DepartmentEmployeesPage() {
  const { id } = useParams<{ id: string }>();

  const [department, setDepartment] = useState<Department | null>(null);
  const [employees, setEmployees] = useState<DepartmentEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDepartmentEmployees() {
      if (!id || !Number.isSafeInteger(Number(id)) || Number(id) <= 0) {
        setError("Invalid department ID.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await getDepartmentEmployees(Number(id));

        setDepartment(data.department);
        setEmployees(data.employees);
      } catch (err: unknown) {
        console.error("Failed to load department employees:", err);
        setError("Unable to load department employees. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    void loadDepartmentEmployees();
  }, [id]);

  return (
    <div className="p-6">
      <Link
        to="/departments"
        className="mb-4 inline-block text-sm text-blue-600 hover:underline"
      >
        &larr; Back to Departments
      </Link>

      <h1 className="mb-2 text-2xl font-semibold">
        {department ? `${department.name} — Employees` : "Department Employees"}
      </h1>

      <p className="mb-6 text-sm text-gray-500">
        View the employees assigned to this department.
      </p>

      {loading ? (
        <p>Loading employees...</p>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      ) : employees.length === 0 ? (
        <div className="rounded-md border p-6 text-center">
          <h2 className="font-medium">No employees assigned yet</h2>
          <p className="mt-2 text-sm text-gray-500">
            Employees assigned to this department will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Employee Code</th>
                <th className="px-4 py-3 font-medium">Job Title</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{employee.name}</div>
                    <div className="text-gray-500">{employee.email}</div>
                  </td>
                  <td className="px-4 py-3">{employee.employeeCode}</td>
                  <td className="px-4 py-3">{employee.jobTitle || "—"}</td>
                  <td className="px-4 py-3">{employee.role}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                      {employee.status}
                    </span>
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
