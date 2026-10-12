
import { z } from "zod";

export const createEmployeeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters"),

  email: z
    .string()
    .trim()
    .email("Please enter a valid email address"),

  phone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Phone number must be exactly 10 digits")
    .optional()
    .or(z.literal("")),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),

  role: z.enum(["manager", "employee"], {
    message: "Please select a valid role",
  }),

  employeeCode: z
    .string()
    .trim()
    .min(1, "Employee code is required"),

  jobTitle: z.string().trim().optional().or(z.literal("")),

  department: z.string().trim().optional().or(z.literal("")),

  joiningDate: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) =>
        !value ||
        /^\d{4}-\d{2}-\d{2}$/.test(value),
      "Joining date must use YYYY-MM-DD format"
    ),
});

export type CreateEmployeeFormValues = z.infer<
  typeof createEmployeeSchema
>;
