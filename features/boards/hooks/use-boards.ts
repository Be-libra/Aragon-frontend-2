"use client";

import { useEffect, useState } from "react";
import { ClientApiError, requestJson } from "@/lib/client/api";
import type { BoardFormValues, KanbanBoard } from "@/lib/types/kanban";

type UseBoardsOptions = {
  initialBoards?: KanbanBoard[];
  autoLoad?: boolean;
};

export function useBoards(options: UseBoardsOptions = {}) {
  const { initialBoards = [], autoLoad = true } = options;
  const [boards, setBoards] = useState<KanbanBoard[]>(initialBoards);
  const [isLoading, setIsLoading] = useState(autoLoad && initialBoards.length === 0);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setIsLoading(true);
    setError(null);

    try {
      const data = await requestJson<KanbanBoard[]>("/api/boards");
      setBoards(data);
      return data;
    } catch (caughtError) {
      const message =
        caughtError instanceof ClientApiError
          ? caughtError.message
          : "Unable to load boards right now.";

      setError(message);
      throw caughtError;
    } finally {
      setIsLoading(false);
    }
  }

  async function createBoard(values: BoardFormValues) {
    setError(null);

    const createdBoard = await requestJson<KanbanBoard>("/api/boards", {
      method: "POST",
      body: JSON.stringify(values)
    });

    setBoards((current) => [...current, createdBoard]);
    return createdBoard;
  }

  async function updateBoard(boardId: string, values: Partial<BoardFormValues>) {
    setError(null);

    const updatedBoard = await requestJson<KanbanBoard>(`/api/boards/${boardId}`, {
      method: "PATCH",
      body: JSON.stringify(values)
    });

    setBoards((current) =>
      current.map((board) => (board.id === boardId ? { ...board, ...updatedBoard } : board))
    );

    return updatedBoard;
  }

  async function deleteBoard(boardId: string) {
    setError(null);

    await requestJson<null>(`/api/boards/${boardId}`, {
      method: "DELETE"
    });

    setBoards((current) => current.filter((board) => board.id !== boardId));
  }

  useEffect(() => {
    if (!autoLoad || initialBoards.length > 0) {
      return;
    }

    let isCancelled = false;

    async function loadBoards() {
      try {
        const data = await requestJson<KanbanBoard[]>("/api/boards");

        if (isCancelled) {
          return;
        }

        setBoards(data);
      } catch {
        return undefined;
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    setIsLoading(true);
    setError(null);
    loadBoards();

    return () => {
      isCancelled = true;
    };
  }, [autoLoad, initialBoards.length]);

  return {
    boards,
    isLoading,
    error,
    setBoards,
    refresh,
    createBoard,
    updateBoard,
    deleteBoard
  };
}
