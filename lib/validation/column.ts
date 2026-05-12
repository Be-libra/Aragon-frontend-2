import { z } from "zod";

export const columnNameSchema = z
  .string()
  .trim()
  .min(1, "Column name is required.")
  .max(60, "Column name must be 60 characters or fewer.");

export const columnCreateSchema = z.object({
  name: columnNameSchema
});

export const columnUpdateSchema = columnCreateSchema.partial().refine(
  (value) => value.name !== undefined,
  {
    message: "At least one column field must be provided."
  }
);
