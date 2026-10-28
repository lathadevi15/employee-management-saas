
import { z } from "zod";

export const createProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Project name must be at least 2 characters")
      .max(150, "Project name cannot exceed 150 characters"),

    description: z
      .string()
      .trim()
      .max(5000, "Description cannot exceed 5000 characters")
      .nullable()
      .optional(),

    clientName: z
      .string()
      .trim()
      .max(150, "Client name cannot exceed 150 characters")
      .nullable()
      .optional(),

    startDate: z
      .iso
      .date()
      .nullable()
      .optional(),

    deadline: z
      .iso
      .date()
      .nullable()
      .optional(),

    status: z
      .enum(["planning", "active", "on_hold", "completed", "cancelled"])
      .default("planning"),

    priority: z
      .enum(["low", "medium", "high", "critical"])
      .default("medium"),

    budget: z
      .number()
      .finite()
      .min(0, "Budget cannot be negative")
      .nullable()
      .optional(),

    managerId: z
      .number()
      .int()
      .positive()
      .optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.startDate && data.deadline && data.deadline < data.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["deadline"],
        message: "Deadline cannot be earlier than the start date",
      });
    }
  });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
