import { prisma } from "@/lib/prisma";
import {
  created,
  internalServerError,
  logRouteError,
  notFound,
  parseJsonBody
} from "@/lib/api/responses";
import { columnCreateSchema } from "@/lib/validation/column";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const parsed = await parseJsonBody(
    request,
    columnCreateSchema,
    "Invalid column payload."
  );

  if (!parsed.success) {
    return parsed.response;
  }

  try {
    const column = await prisma.$transaction(async (tx) => {
      const board = await tx.board.findUnique({
        where: { id },
        select: { id: true }
      });

      if (!board) {
        return null;
      }

      const position = await tx.column.count({
        where: { boardId: id }
      });

      return tx.column.create({
        data: {
          boardId: id,
          name: parsed.data.name,
          position
        },
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
      });
    });

    if (!column) {
      return notFound("Board not found.");
    }

    return created(column);
  } catch (error) {
    logRouteError(error, { route: "POST /api/boards/[id]/columns", boardId: id });
    return internalServerError();
  }
}
