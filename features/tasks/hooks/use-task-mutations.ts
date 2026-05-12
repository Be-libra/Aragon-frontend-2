"use client";

import { useState } from "react";
import { ClientApiError, requestJson } from "@/lib/client/api";
import type { KanbanTask, SubtaskFormValue, TaskFormValues } from "@/lib/types/kanban";

type UpdateTaskValues = Partial<TaskFormValues>;

type ToggleSubtaskInput = {
  subtaskId: string;
  title?: string;
  isCompleted: boolean;
};

export function useTaskMutations() {
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runMutation<T>(operation: () => Promise<T>) {
    setIsMutating(true);
    setError(null);

    try {
      return await operation();
    } catch (caughtError) {
      const message =
        caughtError instanceof ClientApiError
          ? caughtError.message
          : "Unable to complete the task action right now.";

      setError(message);
      throw caughtError;
    } finally {
      setIsMutating(false);
    }
  }

  function serializeSubtasks(subtasks: SubtaskFormValue[]) {
    return subtasks.map((subtask) => ({
      id: subtask.id,
      title: subtask.title.trim(),
      isCompleted: subtask.isCompleted ?? false
    }));
  }

  async function createTask(columnId: string, values: Omit<TaskFormValues, "columnId">) {
    return runMutation(async () =>
      requestJson<KanbanTask>(`/api/columns/${columnId}/tasks`, {
        method: "POST",
        body: JSON.stringify({
          ...values,
          description: values.description.trim(),
          subtasks: serializeSubtasks(values.subtasks)
        })
      })
    );
  }

  async function updateTask(taskId: string, values: UpdateTaskValues) {
    return runMutation(async () =>
      requestJson<KanbanTask>(`/api/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...values,
          description: values.description?.trim(),
          subtasks: values.subtasks ? serializeSubtasks(values.subtasks) : undefined
        })
      })
    );
  }

  async function deleteTask(taskId: string) {
    return runMutation(async () =>
      requestJson<null>(`/api/tasks/${taskId}`, {
        method: "DELETE"
      })
    );
  }

  async function createSubtask(taskId: string, title: string) {
    return runMutation(async () =>
      requestJson<{ id: string; title: string; isCompleted: boolean }>(`/api/tasks/${taskId}/subtasks`, {
        method: "POST",
        body: JSON.stringify({ title: title.trim() })
      })
    );
  }

  async function updateSubtask(subtaskId: string, values: ToggleSubtaskInput) {
    return runMutation(async () =>
      requestJson<{ id: string; title: string; isCompleted: boolean }>(`/api/subtasks/${subtaskId}`, {
        method: "PATCH",
        body: JSON.stringify(values)
      })
    );
  }

  async function deleteSubtask(subtaskId: string) {
    return runMutation(async () =>
      requestJson<null>(`/api/subtasks/${subtaskId}`, {
        method: "DELETE"
      })
    );
  }

  return {
    isMutating,
    error,
    setError,
    createTask,
    updateTask,
    deleteTask,
    createSubtask,
    updateSubtask,
    deleteSubtask
  };
}
