
import { z } from "zod";
const optionalDepartmentId = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }

    return value;
  },
  z.coerce.number().int().positive().optional()
);
export const createEmployeeSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),

  email: z.string().trim().email("Enter a valid email address"),

  phone: z
  .string()
  .regex(/^[0-9]{10}$/, "Phone number must contain exactly 10 digits")
  .optional(),

  password: z.string().min(8, "Password must be at least 8 characters"),

  role: z.enum(["manager", "employee"]),

  employeeCode: z.string().trim().min(1, "Employee code is required"),

  jobTitle: z.string().trim().optional(),

departmentId: optionalDepartmentId,

  joiningDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Joining date must use YYYY-MM-DD format")
    .optional(),
});


export const updateEmployeeSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Please enter a valid email address"),
  phone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Phone number must be exactly 10 digits")
    .optional()
    .or(z.literal("")),
  role: z.enum(["manager", "employee"]),
  employeeCode: z
    .string()
    .trim()
    .min(1, "Employee code is required"),
  jobTitle: z.string().trim().optional().or(z.literal("")),
 departmentId: optionalDepartmentId,
  joiningDate: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value),
      "Joining date must use YYYY-MM-DD format"
    ),
    status: z.enum(["active", "inactive"]),
});
export type CreateEmployeeRequest = z.infer<
  typeof createEmployeeSchema
>;


