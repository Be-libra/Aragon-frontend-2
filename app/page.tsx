import { KanbanClient } from "@/components/kanban/KanbanClient";
import { prisma } from "@/lib/prisma";
import type { KanbanBoard } from "@/lib/types/kanban";

type HomePageProps = {
  searchParams?: Promise<{
    board?: string;
  }>;
};

async function getBoardView(selectedBoardId?: string) {
  const boards = await prisma.board.findMany({
    orderBy: {
      createdAt: "asc"
    },
    include: {
      columns: {
        orderBy: {
          position: "asc"
        },
        include: {
          tasks: {
            orderBy: {
              position: "asc"
            },
            include: {
              subtasks: {
                orderBy: {
                  position: "asc"
                }
              }
            }
          }
        }
      }
    }
  });

  const activeBoardId = boards.some((board) => board.id === selectedBoardId)
    ? selectedBoardId
    : boards[0]?.id;

  return {
    boards: boards.map(
      (board): KanbanBoard => ({
        id: board.id,
        name: board.name,
        createdAt: board.createdAt.toISOString(),
        updatedAt: board.updatedAt.toISOString(),
        columns: board.columns.map((column) => ({
          id: column.id,
          boardId: column.boardId,
          name: column.name,
          position: column.position,
          createdAt: column.createdAt.toISOString(),
          updatedAt: column.updatedAt.toISOString(),
          tasks: column.tasks.map((task) => ({
            id: task.id,
            columnId: task.columnId,
            title: task.title,
            description: task.description,
            position: task.position,
            createdAt: task.createdAt.toISOString(),
            updatedAt: task.updatedAt.toISOString(),
            subtasks: task.subtasks.map((subtask) => ({
              id: subtask.id,
              title: subtask.title,
              isCompleted: subtask.isCompleted,
              position: subtask.position,
              taskId: subtask.taskId,
              createdAt: subtask.createdAt.toISOString(),
              updatedAt: subtask.updatedAt.toISOString()
            }))
          }))
        }))
      })
    ),
    activeBoardId: activeBoardId ?? null
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const { boards, activeBoardId } = await getBoardView(resolvedSearchParams?.board);

  return <KanbanClient initialBoards={boards} initialBoardId={activeBoardId} />;
}
