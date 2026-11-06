import { z } from "zod";

export const createTaskSchema = z
  .object({
    title: z.string().trim().min(2).max(150),

    description: z.string().max(5000).nullable().optional(),

    projectId: z.number().int().positive().nullable().optional(),

    assignedTo: z.number().int().positive().nullable().optional(),

    status: z
      .enum([
        "to_do",
        "in_progress",
        "in_review",
        "blocked",
        "completed",
      ])
      .default("to_do"),

    priority: z
      .enum(["low", "medium", "high", "critical"])
      .default("medium"),

    startDate: z.iso.date().nullable().optional(),

    dueDate: z.iso.date().nullable().optional(),
  })
  .strict()
  .refine(
    (data) =>
      !data.startDate ||
      !data.dueDate ||
      data.dueDate >= data.startDate,
    {
      message: "Due date cannot be earlier than start date",
      path: ["dueDate"],
    }
  );

export type CreateTaskInput = z.infer<typeof createTaskSchema>;