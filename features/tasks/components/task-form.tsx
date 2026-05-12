"use client";

import { useState } from "react";
import type { KanbanColumn, TaskFormValues } from "@/lib/types/kanban";
import { taskCreateSchema, taskUpdateSchema } from "@/lib/validation/task";
import styles from "./task-form.module.css";

type TaskFormMode = "create" | "edit";

type TaskFormErrors = {
  title?: string;
  description?: string;
  columnId?: string;
  subtasks?: Array<string | undefined>;
  root?: string;
};

type TaskFormProps = {
  mode?: TaskFormMode;
  columns: Array<Pick<KanbanColumn, "id" | "name">>;
  initialValues?: TaskFormValues;
  submitLabel?: string;
  onSubmit: (values: TaskFormValues) => Promise<void> | void;
  onCancel?: () => void;
};

const defaultValues: TaskFormValues = {
  title: "",
  description: "",
  columnId: "",
  subtasks: [{ title: "" }]
};

function normalizeValues(values: TaskFormValues, columns: Array<Pick<KanbanColumn, "id" | "name">>) {
  return {
    title: values.title,
    description: values.description ?? "",
    columnId: values.columnId || columns[0]?.id || "",
    subtasks: values.subtasks.length > 0 ? values.subtasks : [{ title: "" }]
  };
}

function mapErrors(values: TaskFormValues, mode: TaskFormMode) {
  const schema = mode === "edit" ? taskUpdateSchema : taskCreateSchema;
  const parsed = schema.safeParse(values);

  if (parsed.success) {
    return null;
  }

  const flattened = parsed.error.flatten();
  const subtaskErrors = values.subtasks.map((_, index) => {
    const issue = parsed.error.issues.find(
      (entry) => entry.path[0] === "subtasks" && entry.path[1] === index && entry.path[2] === "title"
    );

    return issue?.message;
  });

  return {
    title: flattened.fieldErrors.title?.[0],
    description: flattened.fieldErrors.description?.[0],
    columnId: flattened.fieldErrors.columnId?.[0],
    subtasks: subtaskErrors,
    root: flattened.formErrors[0] ?? flattened.fieldErrors.subtasks?.[0]
  } satisfies TaskFormErrors;
}

export function TaskForm({
  mode = "create",
  columns,
  initialValues = defaultValues,
  submitLabel,
  onSubmit,
  onCancel
}: TaskFormProps) {
  const [values, setValues] = useState<TaskFormValues>(normalizeValues(initialValues, columns));
  const [errors, setErrors] = useState<TaskFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateValue<Key extends keyof TaskFormValues>(key: Key, value: TaskFormValues[Key]) {
    setValues((current) => ({
      ...current,
      [key]: value
    }));
  }

  function updateSubtask(index: number, title: string) {
    setValues((current) => ({
      ...current,
      subtasks: current.subtasks.map((subtask, subtaskIndex) =>
        subtaskIndex === index ? { ...subtask, title } : subtask
      )
    }));
  }

  function addSubtask() {
    setValues((current) => ({
      ...current,
      subtasks: [...current.subtasks, { title: "" }]
    }));
  }

  function removeSubtask(index: number) {
    setValues((current) => ({
      ...current,
      subtasks: current.subtasks.filter((_, subtaskIndex) => subtaskIndex !== index)
    }));
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
        title: values.title.trim(),
        description: values.description.trim(),
        columnId: values.columnId,
        subtasks: values.subtasks.map((subtask) => ({
          id: subtask.id,
          title: subtask.title.trim(),
          isCompleted: subtask.isCompleted
        }))
      });
    } catch (error) {
      setErrors({
        root: error instanceof Error ? error.message : "Unable to save the task right now."
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="task-title">
          Title
        </label>
        <input
          id="task-title"
          className={`${styles.input} ${errors.title ? styles.inputError : ""}`}
          value={values.title}
          onChange={(event) => updateValue("title", event.target.value)}
          placeholder="e.g. Take coffee break"
        />
        {errors.title ? <p className={styles.errorText}>{errors.title}</p> : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="task-description">
          Description
        </label>
        <textarea
          id="task-description"
          className={`${styles.textarea} ${errors.description ? styles.inputError : ""}`}
          value={values.description}
          onChange={(event) => updateValue("description", event.target.value)}
          placeholder="e.g. It’s always good to take a break. This 15 minute break will recharge the batteries a little."
        />
        {errors.description ? (
          <p className={styles.errorText}>{errors.description}</p>
        ) : (
          <p className={styles.helpText}>Give enough context for future board updates.</p>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <p className={styles.sectionTitle}>Subtasks</p>
          <button type="button" className={styles.iconButton} onClick={addSubtask} aria-label="Add subtask">
            +
          </button>
        </div>

        <div className={styles.rows}>
          {values.subtasks.map((subtask, index) => (
            <div className={styles.row} key={subtask.id ?? `subtask-${index}`}>
              <div className={styles.field}>
                <input
                  className={`${styles.rowInput} ${errors.subtasks?.[index] ? styles.inputError : ""}`}
                  value={subtask.title}
                  onChange={(event) => updateSubtask(index, event.target.value)}
                  placeholder={`Subtask ${index + 1}`}
                  aria-label={`Subtask ${index + 1} title`}
                />
                {errors.subtasks?.[index] ? (
                  <p className={styles.errorText}>{errors.subtasks[index]}</p>
                ) : null}
              </div>
              <button
                type="button"
                className={styles.ghostButton}
                onClick={() => removeSubtask(index)}
                disabled={values.subtasks.length <= 1}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <button type="button" className={styles.secondaryButton} onClick={addSubtask}>
          + Add New Subtask
        </button>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="task-status">
          Status
        </label>
        <select
          id="task-status"
          className={`${styles.select} ${errors.columnId ? styles.inputError : ""}`}
          value={values.columnId}
          onChange={(event) => updateValue("columnId", event.target.value)}
        >
          {columns.map((column) => (
            <option key={column.id} value={column.id}>
              {column.name}
            </option>
          ))}
        </select>
        {errors.columnId ? <p className={styles.errorText}>{errors.columnId}</p> : null}
      </div>

      {errors.root ? <div className={styles.rootError}>{errors.root}</div> : null}

      <div className={styles.actions}>
        <button type="submit" className={styles.button} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel ?? (mode === "edit" ? "Save Changes" : "Create Task")}
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
