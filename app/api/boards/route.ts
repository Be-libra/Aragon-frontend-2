import { prisma } from "@/lib/prisma";
import {
  created,
  internalServerError,
  json,
  logRouteError,
  parseJsonBody
} from "@/lib/api/responses";
import { boardCreateSchema } from "@/lib/validation/board";

export async function GET() {
  try {
    const boards = await prisma.board.findMany({
      orderBy: { createdAt: "asc" },
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

    return json(boards);
  } catch (error) {
    logRouteError(error, { route: "GET /api/boards" });
    return internalServerError();
  }
}

export async function POST(request: Request) {
  const parsed = await parseJsonBody(
    request,
    boardCreateSchema,
    "Invalid board payload."
  );

  if (!parsed.success) {
    return parsed.response;
  }

  try {
    const board = await prisma.board.create({
      data: {
        name: parsed.data.name,
        columns: {
          create: parsed.data.columns.map((column, index) => ({
            name: column.name,
            position: index
          }))
        }
      },
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

    return created(board);
  } catch (error) {
    logRouteError(error, { route: "POST /api/boards" });
    return internalServerError();
  }
}
