"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BoardForm, useBoards } from "@/features/boards";
import { useModal } from "@/features/shared";
import { TaskForm, useTaskMutations } from "@/features/tasks";
import type { BoardFormValues, KanbanBoard, KanbanTask, TaskFormValues } from "@/lib/types/kanban";
import { EmptyBoardState } from "@/components/kanban/EmptyBoardState";
import { Sidebar } from "@/components/kanban/Sidebar";
import { TaskCard } from "@/components/kanban/TaskCard";
import { Topbar } from "@/components/kanban/Topbar";

type KanbanClientProps = {
  initialBoards: KanbanBoard[];
  initialBoardId: string | null;
};

type ModalMode = "create" | "edit";

const COLUMN_COLORS = ["#49C4E5", "#8471F2", "#67E2AE", "#F9A8D4", "#F6C177"];

function getColumnColor(position: number) {
  return COLUMN_COLORS[position % COLUMN_COLORS.length];
}

function boardToFormValues(board: KanbanBoard): BoardFormValues {
  return {
    name: board.name,
    columns: board.columns.map((column) => ({
      id: column.id,
      name: column.name
    }))
  };
}

function taskToFormValues(task: KanbanTask): TaskFormValues {
  return {
    title: task.title,
    description: task.description ?? "",
    columnId: task.columnId,
    subtasks: task.subtasks.map((subtask) => ({
      id: subtask.id,
      title: subtask.title,
      isCompleted: subtask.isCompleted
    }))
  };
}

function BoardModal({
  title,
  children,
  onClose
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close dialog">
            x
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function KanbanClient({ initialBoards, initialBoardId }: KanbanClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    boards,
    isLoading,
    error,
    createBoard,
    updateBoard,
    deleteBoard,
    refresh
  } = useBoards({
    initialBoards,
    autoLoad: initialBoards.length === 0
  });
  const {
    isMutating,
    error: mutationError,
    setError: setMutationError,
    createTask,
    updateTask,
    deleteTask,
    updateSubtask
  } = useTaskMutations();
  const boardModal = useModal<ModalMode>();
  const taskModal = useModal<{ mode: ModalMode; taskId?: string; columnId?: string }>();
  const taskDetailsModal = useModal<{ taskId: string }>();
  const [activeBoardId, setActiveBoardId] = useState<string | null>(initialBoardId);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isBoardMenuOpen, setIsBoardMenuOpen] = useState(false);
  const [confirmDeleteBoard, setConfirmDeleteBoard] = useState(false);
  const [confirmDeleteTask, setConfirmDeleteTask] = useState(false);

  const activeBoard = useMemo(
    () => boards.find((board) => board.id === activeBoardId) ?? boards[0] ?? null,
    [activeBoardId, boards]
  );

  const activeTask = useMemo(() => {
    const taskId = taskDetailsModal.data?.taskId;

    if (!activeBoard || !taskId) {
      return null;
    }

    for (const column of activeBoard.columns) {
      const task = column.tasks.find((entry) => entry.id === taskId);
      if (task) {
        return task;
      }
    }

    return null;
  }, [activeBoard, taskDetailsModal.data]);

  useEffect(() => {
    const boardIdFromUrl = searchParams.get("board");
    if (boardIdFromUrl) {
      setActiveBoardId(boardIdFromUrl);
      return;
    }

    if (boards.length > 0 && !activeBoardId) {
      setActiveBoardId(boards[0].id);
    }
  }, [activeBoardId, boards, searchParams]);

  useEffect(() => {
    if (!activeBoard && boards.length > 0) {
      setActiveBoardId(boards[0].id);
    }
  }, [activeBoard, boards]);

  function updateBoardQuery(boardId: string | null) {
    if (boardId) {
      router.replace(`/?board=${boardId}`, { scroll: false });
    } else {
      router.replace("/", { scroll: false });
    }
  }

  function handleSelectBoard(boardId: string) {
    setActiveBoardId(boardId);
    setIsBoardMenuOpen(false);
    updateBoardQuery(boardId);
  }

  async function handleCreateBoard(values: BoardFormValues) {
    const createdBoard = await createBoard(values);
    boardModal.close();
    setActiveBoardId(createdBoard.id);
    updateBoardQuery(createdBoard.id);
    await refresh();
  }

  async function handleUpdateBoard(values: BoardFormValues) {
    if (!activeBoard) {
      return;
    }

    await updateBoard(activeBoard.id, values);
    boardModal.close();
    setIsBoardMenuOpen(false);
    await refresh();
  }

  async function handleDeleteBoard() {
    if (!activeBoard) {
      return;
    }

    const currentBoardId = activeBoard.id;
    const fallbackBoard = boards.find((board) => board.id !== currentBoardId) ?? null;

    await deleteBoard(currentBoardId);
    setConfirmDeleteBoard(false);
    setIsBoardMenuOpen(false);

    const nextBoardId = fallbackBoard?.id ?? null;
    setActiveBoardId(nextBoardId);
    updateBoardQuery(nextBoardId);
  }

  async function handleCreateTask(values: TaskFormValues) {
    await createTask(values.columnId, {
      title: values.title,
      description: values.description,
      subtasks: values.subtasks
    });

    taskModal.close();
    await refresh();
  }

  async function handleUpdateTask(values: TaskFormValues) {
    const taskId = taskModal.data?.taskId;
    if (!taskId) {
      return;
    }

    await updateTask(taskId, values);
    taskModal.close();
    taskDetailsModal.close();
    await refresh();
  }

  async function handleDeleteTask() {
    const taskId = activeTask?.id;
    if (!taskId) {
      return;
    }

    await deleteTask(taskId);
    setConfirmDeleteTask(false);
    taskDetailsModal.close();
    await refresh();
  }

  async function handleToggleSubtask(subtaskId: string, title: string, isCompleted: boolean) {
    await updateSubtask(subtaskId, {
      subtaskId,
      title,
      isCompleted
    });

    await refresh();
  }

  function openCreateTaskModal() {
    if (!activeBoard || activeBoard.columns.length === 0) {
      return;
    }

    setMutationError(null);
    taskModal.open({
      mode: "create",
      columnId: activeBoard.columns[0].id
    });
  }

  const currentTaskFormValues =
    taskModal.data?.mode === "edit" && taskModal.data.taskId && activeBoard
      ? (() => {
          for (const column of activeBoard.columns) {
            const task = column.tasks.find((entry) => entry.id === taskModal.data?.taskId);
            if (task) {
              return taskToFormValues(task);
            }
          }

          return undefined;
        })()
      : undefined;

  return (
    <>
      <main className="app-shell">
        <Sidebar
          boards={boards}
          activeBoardId={activeBoard?.id ?? null}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onSelectBoard={handleSelectBoard}
          onCreateBoard={() => boardModal.open("create")}
        />

        <section className="content-shell">
          <Topbar
            boardName={activeBoard?.name ?? "Boards"}
            canCreateTask={Boolean(activeBoard?.columns.length)}
            isBoardMenuOpen={isBoardMenuOpen}
            onAddTask={openCreateTaskModal}
            onToggleSidebar={() => setIsSidebarOpen((current) => !current)}
            onToggleBoardMenu={() => setIsBoardMenuOpen((current) => !current)}
            onEditBoard={() => {
              setIsBoardMenuOpen(false);
              boardModal.open("edit");
            }}
            onDeleteBoard={() => {
              setIsBoardMenuOpen(false);
              setConfirmDeleteBoard(true);
            }}
          />

          {isLoading ? <section className="status-panel">Loading boards...</section> : null}
          {!isLoading && error ? <section className="status-panel is-error">{error}</section> : null}

          {!isLoading && !error ? (
            activeBoard ? (
              <div className="board-canvas" aria-label={`${activeBoard.name} board columns`}>
                {activeBoard.columns.map((column) => (
                  <section key={column.id} className="board-column" aria-labelledby={`column-${column.id}`}>
                    <header className="column-header">
                      <span className="column-dot" style={{ backgroundColor: getColumnColor(column.position) }} />
                      <span id={`column-${column.id}`}>
                        {column.name} ({column.tasks.length})
                      </span>
                    </header>

                    {column.tasks.length > 0 ? (
                      <div className="column-tasks">
                        {column.tasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={{
                              id: task.id,
                              title: task.title,
                              subtaskSummary: `${
                                task.subtasks.filter((subtask) => subtask.isCompleted).length
                              } of ${task.subtasks.length} subtasks`
                            }}
                            onClick={() => {
                              setMutationError(null);
                              setConfirmDeleteTask(false);
                              taskDetailsModal.open({ taskId: task.id });
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="column-empty">
                        <p>No tasks here yet.</p>
                      </div>
                    )}
                  </section>
                ))}

                <section className="new-column-tile">
                  <button
                    type="button"
                    onClick={() => boardModal.open("edit")}
                    aria-label="Open board editor to add columns"
                  >
                    + New Column
                  </button>
                </section>
              </div>
            ) : (
              <EmptyBoardState onCreateBoard={() => boardModal.open("create")} />
            )
          ) : null}
        </section>
      </main>

      {activeBoard?.columns.length ? (
        <button
          type="button"
          className="fab"
          onClick={openCreateTaskModal}
          aria-label="Add new task"
        >
          +
        </button>
      ) : null}

      {boardModal.isOpen ? (
        <BoardModal
          title={boardModal.data === "edit" ? "Edit Board" : "Add New Board"}
          onClose={() => boardModal.close()}
        >
          <BoardForm
            mode={boardModal.data === "edit" ? "edit" : "create"}
            initialValues={boardModal.data === "edit" && activeBoard ? boardToFormValues(activeBoard) : undefined}
            onSubmit={boardModal.data === "edit" ? handleUpdateBoard : handleCreateBoard}
            onCancel={() => boardModal.close()}
          />
        </BoardModal>
      ) : null}

      {taskModal.isOpen && activeBoard ? (
        <BoardModal
          title={taskModal.data?.mode === "edit" ? "Edit Task" : "Add New Task"}
          onClose={() => taskModal.close()}
        >
          <TaskForm
            mode={taskModal.data?.mode === "edit" ? "edit" : "create"}
            columns={activeBoard.columns.map((column) => ({
              id: column.id,
              name: column.name
            }))}
            initialValues={
              currentTaskFormValues ?? {
                title: "",
                description: "",
                columnId: taskModal.data?.columnId ?? activeBoard.columns[0]?.id ?? "",
                subtasks: [{ title: "" }]
              }
            }
            onSubmit={taskModal.data?.mode === "edit" ? handleUpdateTask : handleCreateTask}
            onCancel={() => taskModal.close()}
          />
          {mutationError ? <p className="modal-message is-error">{mutationError}</p> : null}
        </BoardModal>
      ) : null}

      {taskDetailsModal.isOpen && activeTask ? (
        <BoardModal title={activeTask.title} onClose={() => taskDetailsModal.close()}>
          <div className="task-details">
            <div className="task-details-actions">
              <button
                type="button"
                className="secondary-action"
                onClick={() => {
                  setMutationError(null);
                  taskDetailsModal.close();
                  taskModal.open({ mode: "edit", taskId: activeTask.id });
                }}
              >
                Edit Task
              </button>
              <button
                type="button"
                className="danger-action"
                onClick={() => setConfirmDeleteTask(true)}
              >
                Delete Task
              </button>
            </div>

            <p className="task-details-description">
              {activeTask.description?.trim() || "No description added for this task yet."}
            </p>

            <div className="task-details-subtasks">
              <p className="task-details-label">
                Subtasks (
                {activeTask.subtasks.filter((subtask) => subtask.isCompleted).length} of{" "}
                {activeTask.subtasks.length})
              </p>

              <div className="subtask-list">
                {activeTask.subtasks.map((subtask) => (
                  <label key={subtask.id} className="subtask-item">
                    <input
                      type="checkbox"
                      checked={subtask.isCompleted}
                      onChange={(event) =>
                        void handleToggleSubtask(subtask.id, subtask.title, event.target.checked)
                      }
                    />
                    <span className={subtask.isCompleted ? "is-completed" : ""}>{subtask.title}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="task-details-status">
              <p className="task-details-label">Current Status</p>
              <select
                className="status-select"
                value={activeTask.columnId}
                disabled={isMutating}
                onChange={async (e) => {
                  await updateTask(activeTask.id, { columnId: e.target.value });
                  await refresh();
                }}
              >
                {activeBoard.columns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.name}
                  </option>
                ))}
              </select>
            </div>

            {mutationError ? <p className="modal-message is-error">{mutationError}</p> : null}

            {confirmDeleteTask ? (
              <div className="confirm-panel">
                <p>Delete this task permanently?</p>
                <div className="confirm-actions">
                  <button type="button" className="danger-action" onClick={() => void handleDeleteTask()}>
                    {isMutating ? "Deleting..." : "Confirm Delete"}
                  </button>
                  <button
                    type="button"
                    className="secondary-action"
                    onClick={() => setConfirmDeleteTask(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </BoardModal>
      ) : null}

      {confirmDeleteBoard && activeBoard ? (
        <BoardModal title="Delete Board" onClose={() => setConfirmDeleteBoard(false)}>
          <div className="confirm-panel">
            <p>
              Delete <strong>{activeBoard.name}</strong> and all of its columns and tasks?
            </p>
            <div className="confirm-actions">
              <button type="button" className="danger-action" onClick={() => void handleDeleteBoard()}>
                Delete Board
              </button>
              <button
                type="button"
                className="secondary-action"
                onClick={() => setConfirmDeleteBoard(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </BoardModal>
      ) : null}
    </>
  );
}
