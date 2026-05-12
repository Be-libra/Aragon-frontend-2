"use client";

import { useEffect, useState } from "react";
import { ClientApiError, requestJson } from "@/lib/client/api";
import type { BoardFormValues, KanbanBoard } from "@/lib/types/kanban";

type UseBoardOptions = {
  initialBoard?: KanbanBoard | null;
  autoLoad?: boolean;
};

export function useBoard(boardId?: string, options: UseBoardOptions = {}) {
  const { initialBoard = null, autoLoad = true } = options;
  const [board, setBoard] = useState<KanbanBoard | null>(initialBoard);
  const [isLoading, setIsLoading] = useState(Boolean(boardId && autoLoad && !initialBoard));
  const [error, setError] = useState<string | null>(null);

  async function refresh(nextBoardId = boardId) {
    if (!nextBoardId) {
      setBoard(null);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await requestJson<KanbanBoard>(`/api/boards/${nextBoardId}`);
      setBoard(data);
      return data;
    } catch (caughtError) {
      const message =
        caughtError instanceof ClientApiError
          ? caughtError.message
          : "Unable to load the selected board.";

      setError(message);
      throw caughtError;
    } finally {
      setIsLoading(false);
    }
  }

  async function updateBoard(values: Partial<BoardFormValues>) {
    if (!boardId) {
      throw new Error("A boardId is required before updating a board.");
    }

    setError(null);

    const updatedBoard = await requestJson<KanbanBoard>(`/api/boards/${boardId}`, {
      method: "PATCH",
      body: JSON.stringify(values)
    });

    setBoard((current) => (current ? { ...current, ...updatedBoard } : updatedBoard));
    return updatedBoard;
  }

  async function deleteBoard() {
    if (!boardId) {
      throw new Error("A boardId is required before deleting a board.");
    }

    setError(null);

    await requestJson<null>(`/api/boards/${boardId}`, {
      method: "DELETE"
    });

    setBoard(null);
  }

  useEffect(() => {
    if (!boardId) {
      setBoard(null);
      setIsLoading(false);
      return;
    }

    if (!autoLoad || board?.id === boardId) {
      return;
    }

    let isCancelled = false;

    async function loadBoard() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await requestJson<KanbanBoard>(`/api/boards/${boardId}`);

        if (!isCancelled) {
          setBoard(data);
        }
      } catch (caughtError) {
        const message =
          caughtError instanceof ClientApiError
            ? caughtError.message
            : "Unable to load the selected board.";

        if (!isCancelled) {
          setError(message);
        }

        return undefined;
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadBoard();

    return () => {
      isCancelled = true;
    };
  }, [autoLoad, board?.id, boardId]);

  return {
    board,
    isLoading,
    error,
    setBoard,
    refresh,
    updateBoard,
    deleteBoard
  };
}
