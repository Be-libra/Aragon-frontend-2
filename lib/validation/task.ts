import { z } from "zod";

const subtaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Subtask title is required.")
    .max(120, "Subtask title must be 120 characters or fewer."),
  isCompleted: z.boolean().optional()
});

export const taskCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Task title is required.")
    .max(120, "Task title must be 120 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or fewer.")
    .optional()
    .or(z.literal("")),
  columnId: z.string().trim().min(1, "Status is required."),
  subtasks: z
    .array(subtaskSchema)
    .max(20, "Tasks may not have more than 20 subtasks.")
});

export const taskCreateInColumnSchema = taskCreateSchema.omit({
  columnId: true
});

export const taskUpdateSchema = taskCreateSchema.partial().extend({
  title: z
    .string()
    .trim()
    .min(1, "Task title is required.")
    .max(120, "Task title must be 120 characters or fewer.")
    .optional(),
  columnId: z.string().trim().min(1, "Status is required.").optional()
});
