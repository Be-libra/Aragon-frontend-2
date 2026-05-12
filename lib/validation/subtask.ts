import { z } from "zod";

const subtaskTitleSchema = z
  .string()
  .trim()
  .min(1, "Subtask title is required.")
  .max(120, "Subtask title must be 120 characters or fewer.");

export const subtaskInputSchema = z.object({
  title: subtaskTitleSchema,
  isCompleted: z.boolean().optional()
});

export const subtaskCreateSchema = subtaskInputSchema;

export const subtaskUpdateSchema = z
  .object({
    title: subtaskTitleSchema.optional(),
    isCompleted: z.boolean().optional()
  })
  .refine(
    (value) => value.title !== undefined || value.isCompleted !== undefined,
    {
      message: "At least one subtask field must be provided."
    }
  );
