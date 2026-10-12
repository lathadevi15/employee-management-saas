
import { useState, type FormEvent } from "react";
import axios from "axios";
import {
  createEmployee,
  type CreateEmployeeInput,
} from "../services/employee-api";
import { createEmployeeSchema } from "../employee-schema";

const initialForm: CreateEmployeeInput = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "employee",
  employeeCode: "",
  jobTitle: "",
  department: "",
  joiningDate: "",
};

export default function CreateEmployeePage() {
  const [form, setForm] = useState<CreateEmployeeInput>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
  Record<string, string>
>({});

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
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const validationResult = createEmployeeSchema.safeParse(form);

if (!validationResult.success) {
  const errors: Record<string, string> = {};

  validationResult.error.issues.forEach((issue) => {
    const fieldName = String(issue.path[0]);

    if (!errors[fieldName]) {
      errors[fieldName] = issue.message;
    }
  });

  setFieldErrors(errors);
  return;
}

setFieldErrors({});
setLoading(true);
    setLoading(true);

    try {
    const validatedData = validationResult.data;

const payload: CreateEmployeeInput = {
  ...validatedData,
  phone: validatedData.phone || undefined,
  jobTitle: validatedData.jobTitle || undefined,
  department: validatedData.department || undefined,
  joiningDate: validatedData.joiningDate || undefined,
};

await createEmployee(payload);
setSuccess("Employee created successfully.");
setForm(initialForm);
setFieldErrors({});
    } 
catch (err: unknown) {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const message = err.response?.data?.message;

    if (status === 401) {
      setError("Your session has expired. Please log in again.");
    } else if (status === 403) {
      setError("You don't have permission to create employees.");
    } else if (status === 409) {
      setError(message ?? "Email or employee code already exists.");
    } else if (status === 400) {
      setError(message ?? "Please check the information you entered.");
    } else if (!err.response) {
      setError("Unable to connect to the server. Please try again.");
    } else {
      setError("Something went wrong. Please try again.");
    }
  } else {
    setError("An unexpected error occurred. Please try again.");
  }
} finally {
  setLoading(false);
}
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-2 text-2xl font-semibold">
        Create Employee
      </h1>

      <p className="mb-6 text-sm text-gray-500">
        Add a new employee to your organization.
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

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">
              Full name *
            </label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              minLength={2}
              className="w-full rounded-md border p-2"
            />
            {fieldErrors.name && (
  <p className="mt-1 text-sm text-red-600">
    {fieldErrors.name}
  </p>
)}
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full rounded-md border p-2"
            />
            {fieldErrors.email && (
  <p className="mt-1 text-sm text-red-600">
    {fieldErrors.email}
  </p>
)}
          </div>

          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium">
              Phone number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              pattern="[0-9]{10}"
              title="Enter exactly 10 digits"
              value={form.phone}
              onChange={handleChange}
              className="w-full rounded-md border p-2"
            />
            {fieldErrors.phone && (
  <p className="mt-1 text-sm text-red-600">
    {fieldErrors.phone}
  </p>
)}
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">
              Temporary password *
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              minLength={8}
              required
              autoComplete="new-password"
              className="w-full rounded-md border p-2"
            />
            {fieldErrors.password && (
  <p className="mt-1 text-sm text-red-600">
    {fieldErrors.password}
  </p>
)}
          </div>

          <div>
            <label htmlFor="role" className="mb-1 block text-sm font-medium">
              Role *
            </label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full rounded-md border p-2"
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
            <label htmlFor="employeeCode" className="mb-1 block text-sm font-medium">
              Employee code *
            </label>
            <input
              id="employeeCode"
              name="employeeCode"
              value={form.employeeCode}
              onChange={handleChange}
              required
              className="w-full rounded-md border p-2"
            />
            {fieldErrors.employeeCode && (
  <p className="mt-1 text-sm text-red-600">
    {fieldErrors.employeeCode}
  </p>
)}
          </div>

          <div>
            <label htmlFor="jobTitle" className="mb-1 block text-sm font-medium">
              Job title
            </label>
            <input
              id="jobTitle"
              name="jobTitle"
              value={form.jobTitle}
              onChange={handleChange}
              className="w-full rounded-md border p-2"
            />
            {fieldErrors.jobTitle && (
  <p className="mt-1 text-sm text-red-600">
    {fieldErrors.jobTitle}
  </p>
)}
          </div>

          <div>
            <label htmlFor="department" className="mb-1 block text-sm font-medium">
              Department
            </label>
            <input
              id="department"
              name="department"
              value={form.department}
              onChange={handleChange}
              className="w-full rounded-md border p-2"
            />
            {fieldErrors.department && (
  <p className="mt-1 text-sm text-red-600">
    {fieldErrors.department}
  </p>
)}
          </div>

          <div>
            <label htmlFor="joiningDate" className="mb-1 block text-sm font-medium">
              Joining date
            </label>
            <input
              id="joiningDate"
              name="joiningDate"
              type="date"
              value={form.joiningDate}
              onChange={handleChange}
              className="w-full rounded-md border p-2"
            />
            {fieldErrors.joiningDate && (
  <p className="mt-1 text-sm text-red-600">
    {fieldErrors.joiningDate}
  </p>
)}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-5 py-2 text-white disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create Employee"}
        </button>
      </form>
    </div>
  );
}
