import { z } from "zod";
import { columnCreateSchema, columnNameSchema } from "@/lib/validation/column";

export const boardCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Board name is required.")
    .max(80, "Board name must be 80 characters or fewer."),
  columns: z
    .array(columnCreateSchema)
    .min(1, "At least one column is required.")
    .max(10, "Boards may not have more than 10 columns.")
});

const columnUpdateItemSchema = z.object({
  id: z.string().optional(),
  name: columnNameSchema
});

export const boardUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Board name is required.")
    .max(80, "Board name must be 80 characters or fewer.")
    .optional(),
  columns: z
    .array(columnUpdateItemSchema)
    .min(1, "At least one column is required.")
    .max(10, "Boards may not have more than 10 columns.")
    .optional()
});
