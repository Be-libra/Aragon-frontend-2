export type ApiErrorDetails = {
  formErrors?: string[];
  fieldErrors?: Record<string, string[] | undefined>;
};

export type ApiError = {
  code: string;
  message: string;
  details?: ApiErrorDetails;
};

export type ApiEnvelope<T> = {
  data: T;
};

export type ColumnFormValue = {
  id?: string;
  name: string;
};

export type SubtaskFormValue = {
  id?: string;
  title: string;
  isCompleted?: boolean;
};

export type BoardFormValues = {
  name: string;
  columns: ColumnFormValue[];
};

export type TaskFormValues = {
  title: string;
  description: string;
  columnId: string;
  subtasks: SubtaskFormValue[];
};

export type KanbanSubtask = {
  id: string;
  title: string;
  isCompleted: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type KanbanTask = {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  subtasks: KanbanSubtask[];
};

export type KanbanColumn = {
  id: string;
  boardId: string;
  name: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  tasks: KanbanTask[];
};

export type KanbanBoard = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  columns: KanbanColumn[];
};
