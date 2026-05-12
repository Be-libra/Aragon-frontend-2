import { prisma } from "@/lib/prisma";
import {
  internalServerError,
  isPrismaNotFoundError,
  json,
  logRouteError,
  noContent,
  notFound,
  parseJsonBody
} from "@/lib/api/responses";
import { boardUpdateSchema } from "@/lib/validation/board";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        columns: {
          orderBy: { position: "asc" },
          include: {
            tasks: {
              orderBy: { position: "asc" },
              include: {
                subtasks: {
                  orderBy: { position: "asc" }
                }
              }
            }
          }
        }
      }
    });

    if (!board) {
      return notFound("Board not found.");
    }

    return json(board);
  } catch (error) {
    logRouteError(error, { route: "GET /api/boards/[id]", boardId: id });
    return internalServerError();
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const parsed = await parseJsonBody(
    request,
    boardUpdateSchema,
    "Invalid board payload."
  );

  if (!parsed.success) {
    return parsed.response;
  }

  try {
    const board = await prisma.$transaction(async (tx) => {
      await tx.board.update({
        where: { id },
        data: {
          name: parsed.data.name
        }
      });

      if (parsed.data.columns) {
        const incomingColumns = parsed.data.columns;

        // IDs that already exist in the payload
        const incomingIds = incomingColumns
          .map((col) => col.id)
          .filter((colId): colId is string => Boolean(colId));

        // Fetch current column IDs for this board
        const existingColumns = await tx.column.findMany({
          where: { boardId: id },
          select: { id: true }
        });
        const existingIds = new Set(existingColumns.map((col) => col.id));

        // Delete columns whose IDs are not present in the incoming payload
        // (tasks cascade-delete via the schema's onDelete: Cascade)
        await tx.column.deleteMany({
          where: {
            boardId: id,
            id: { notIn: incomingIds }
          }
        });

        // Update existing columns and create new ones
        for (let index = 0; index < incomingColumns.length; index++) {
          const col = incomingColumns[index];
          if (col.id && existingIds.has(col.id)) {
            // UPDATE: column already exists — update name and position
            await tx.column.update({
              where: { id: col.id },
              data: { name: col.name, position: index }
            });
          } else {
            // INSERT: new column (no id, or id not found in DB)
            await tx.column.create({
              data: { boardId: id, name: col.name, position: index }
            });
          }
        }
      }

      return tx.board.findUnique({
        where: { id },
        include: {
          columns: {
            orderBy: { position: "asc" },
            include: {
              tasks: {
                orderBy: { position: "asc" },
                include: {
                  subtasks: {
                    orderBy: { position: "asc" }
                  }
                }
              }
            }
          }
        }
      });
    });

    return json(board);
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return notFound("Board not found.");
    }

    logRouteError(error, { route: "PATCH /api/boards/[id]", boardId: id });
    return internalServerError();
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    await prisma.board.delete({
      where: { id }
    });

    return noContent();
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return notFound("Board not found.");
    }

    logRouteError(error, { route: "DELETE /api/boards/[id]", boardId: id });
    return internalServerError();
  }
}
