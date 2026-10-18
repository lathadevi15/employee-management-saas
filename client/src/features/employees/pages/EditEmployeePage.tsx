
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getEmployees,
  updateEmployee,
  type UpdateEmployeeInput,
} from "../services/employee-api";
import { updateEmployeeSchema } from "../employee-schema";

export default function EditEmployeePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState<UpdateEmployeeInput>({
    name: "",
    email: "",
    phone: "",
    role: "employee",
    employeeCode: "",
    jobTitle: "",
    department: "",
    joiningDate: "",
    status: "active",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    async function loadEmployee() {
      try {
        const employees = await getEmployees();
        const employee = employees.find(
          (item) => item.id === Number(id)
        );

        if (!employee) {
          setError("Employee not found.");
          return;
        }

        setForm({
          name: employee.name,
          email: employee.email,
          phone: employee.phone ?? "",
          role: employee.role as "manager" | "employee",
          employeeCode: employee.employeeCode,
          jobTitle: employee.jobTitle ?? "",
          department: employee.department ?? "",
          joiningDate: employee.joiningDate
            ? employee.joiningDate.slice(0, 10)
            : "",
          status:
            employee.status === "inactive"
              ? "inactive"
              : "active",
        });
      } catch {
        setError("Unable to load employee details.");
      } finally {
        setLoading(false);
      }
    }

    void loadEmployee();
  }, [id]);

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFieldErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    const validation = updateEmployeeSchema.safeParse(form);

    if (!validation.success) {
      const errors: Record<string, string> = {};

      validation.error.issues.forEach((issue) => {
        const key = String(issue.path[0]);

        if (!errors[key]) {
          errors[key] = issue.message;
        }
      });

      setFieldErrors(errors);
      return;
    }

    if (
      !id ||
      !Number.isSafeInteger(Number(id)) ||
      Number(id) <= 0
    ) {
      setError("Invalid employee ID.");
      return;
    }

    setSaving(true);

    try {
      const data = validation.data;

      const payload: UpdateEmployeeInput = {
        ...data,
        phone: data.phone || undefined,
        jobTitle: data.jobTitle || undefined,
        department: data.department || undefined,
        joiningDate: data.joiningDate || undefined,
        status: data.status,
      };

      await updateEmployee(Number(id), payload);
      navigate("/employees");
    } catch {
      setError("Unable to update employee. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="p-6">Loading employee details...</p>;
  }

  if (error && !form.name && !form.email) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => navigate("/employees")}
          className="mt-3 rounded-lg border px-4 py-2"
        >
          Back to employees
        </button>
      </div>
    );
  }

  const fields = [
    { name: "name", label: "Full name", required: true },
    { name: "email", label: "Email", required: true },
    { name: "phone", label: "Phone", required: false },
    {
      name: "employeeCode",
      label: "Employee code",
      required: true,
    },
    { name: "jobTitle", label: "Job title", required: false },
    { name: "department", label: "Department", required: false },
    {
      name: "joiningDate",
      label: "Joining date",
      required: false,
    },
  ] as const;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-2 text-2xl font-bold">
        Edit Employee
      </h1>

      <p className="mb-6 text-sm text-gray-500">
        Update the employee's information below.
      </p>

      {error && (
        <p role="alert" className="mb-4 text-sm text-red-600">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.name}>
              <label
                htmlFor={field.name}
                className="mb-1 block text-sm font-medium"
              >
                {field.label}
                {field.required && " *"}
              </label>

              <input
                id={field.name}
                name={field.name}
                type={
                  field.name === "joiningDate"
                    ? "date"
                    : "text"
                }
                value={form[field.name] ?? ""}
                onChange={handleChange}
                required={field.required}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none"
              />

              {fieldErrors[field.name] && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors[field.name]}
                </p>
              )}
            </div>
          ))}

          <div>
            <label
              htmlFor="role"
              className="mb-1 block text-sm font-medium"
            >
              Role *
            </label>

            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>

            {fieldErrors.role && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.role}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="status"
              className="mb-1 block text-sm font-medium"
            >
              Employee status *
            </label>

            <select
              id="status"
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none"
            >
              <option value="active">
                Active
              </option>
              <option value="inactive">
                Inactive
              </option>
            </select>

            {fieldErrors.status && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.status}
              </p>
            )}

            <p className="mt-1 text-xs text-gray-500">
              Inactive employees should not be allowed to access
              the application.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-purple-600 px-5 py-2 text-white hover:bg-purple-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/employees")}
            className="rounded-lg border border-gray-300 px-5 py-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
