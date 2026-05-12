"use client";

import { useState } from "react";
import { boardCreateSchema, boardUpdateSchema } from "@/lib/validation/board";
import type { BoardFormValues } from "@/lib/types/kanban";
import styles from "./board-form.module.css";

type BoardFormMode = "create" | "edit";

type BoardFormErrors = {
  name?: string;
  columns?: Array<string | undefined>;
  root?: string;
};

type BoardFormProps = {
  mode?: BoardFormMode;
  initialValues?: BoardFormValues;
  submitLabel?: string;
  onSubmit: (values: BoardFormValues) => Promise<void> | void;
  onCancel?: () => void;
};

const defaultValues: BoardFormValues = {
  name: "",
  columns: [{ name: "Todo" }, { name: "Doing" }]
};

function normalizeValues(values: BoardFormValues): BoardFormValues {
  return {
    name: values.name,
    columns: values.columns.map((column) => ({
      id: column.id,
      name: column.name
    }))
  };
}

function mapErrors(values: BoardFormValues, mode: BoardFormMode) {
  const schema = mode === "edit" ? boardUpdateSchema : boardCreateSchema;
  const parsed = schema.safeParse(values);

  if (parsed.success) {
    return null;
  }

  const flattened = parsed.error.flatten();
  const columnErrors = values.columns.map((_, index) => {
    const issue = parsed.error.issues.find(
      (entry) => entry.path[0] === "columns" && entry.path[1] === index && entry.path[2] === "name"
    );

    return issue?.message;
  });

  return {
    name: flattened.fieldErrors.name?.[0],
    columns: columnErrors,
    root: flattened.formErrors[0] ?? flattened.fieldErrors.columns?.[0]
  } satisfies BoardFormErrors;
}

export function BoardForm({
  mode = "create",
  initialValues = defaultValues,
  submitLabel,
  onSubmit,
  onCancel
}: BoardFormProps) {
  const [values, setValues] = useState<BoardFormValues>(normalizeValues(initialValues));
  const [errors, setErrors] = useState<BoardFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateName(name: string) {
    setValues((current) => ({ ...current, name }));
  }

  function updateColumn(index: number, name: string) {
    setValues((current) => ({
      ...current,
      columns: current.columns.map((column, columnIndex) =>
        columnIndex === index ? { ...column, name } : column
      )
    }));
  }

  function addColumn() {
    setValues((current) => ({
      ...current,
      columns: [...current.columns, { name: "" }]
    }));
  }

  function removeColumn(index: number) {
    setValues((current) => ({
      ...current,
      columns: current.columns.filter((_, columnIndex) => columnIndex !== index)
    }));
  }

  function moveColumn(index: number, direction: "up" | "down") {
    setValues((current) => {
      const columns = [...current.columns];
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      [columns[index], columns[swapIndex]] = [columns[swapIndex], columns[index]];
      return { ...current, columns };
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = mapErrors(values, mode);
    if (nextErrors) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await onSubmit({
        name: values.name.trim(),
        columns: values.columns.map((column) => ({
          id: column.id,
          name: column.name.trim()
        }))
      });
    } catch (error) {
      setErrors({
        root: error instanceof Error ? error.message : "Unable to save the board right now."
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.section}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="board-name">
            Board Name
          </label>
          <input
            id="board-name"
            className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
            name="name"
            value={values.name}
            onChange={(event) => updateName(event.target.value)}
            placeholder="e.g. Web Design"
          />
          {errors.name ? <p className={styles.errorText}>{errors.name}</p> : null}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <p className={styles.sectionTitle}>Board Columns</p>
          <button type="button" className={styles.iconButton} onClick={addColumn} aria-label="Add column">
            +
          </button>
        </div>

        <div className={styles.rows}>
          {values.columns.map((column, index) => (
            <div className={styles.row} key={column.id ?? `column-${index}`}>
              <div className={styles.moveButtons}>
                <button
                  type="button"
                  className={styles.moveButton}
                  onClick={() => moveColumn(index, "up")}
                  disabled={index === 0}
                  aria-label={`Move column ${index + 1} up`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={styles.moveButton}
                  onClick={() => moveColumn(index, "down")}
                  disabled={index === values.columns.length - 1}
                  aria-label={`Move column ${index + 1} down`}
                >
                  ↓
                </button>
              </div>
              <div className={styles.field}>
                <input
                  className={`${styles.rowInput} ${errors.columns?.[index] ? styles.inputError : ""}`}
                  value={column.name}
                  onChange={(event) => updateColumn(index, event.target.value)}
                  placeholder={`Column ${index + 1}`}
                  aria-label={`Column ${index + 1} name`}
                />
                {errors.columns?.[index] ? (
                  <p className={styles.errorText}>{errors.columns[index]}</p>
                ) : null}
              </div>
              <button
                type="button"
                className={styles.ghostButton}
                onClick={() => removeColumn(index)}
                disabled={values.columns.length <= 1}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <button type="button" className={styles.secondaryButton} onClick={addColumn}>
          + Add New Column
        </button>
      </div>

      {errors.root ? <div className={styles.rootError}>{errors.root}</div> : null}

      <div className={styles.actions}>
        <button type="submit" className={styles.button} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel ?? (mode === "edit" ? "Save Changes" : "Create New Board")}
        </button>
        {onCancel ? (
          <button type="button" className={styles.secondaryButton} onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
