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
import { columnUpdateSchema } from "@/lib/validation/column";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const parsed = await parseJsonBody(
    request,
    columnUpdateSchema,
    "Invalid column payload."
  );

  if (!parsed.success) {
    return parsed.response;
  }

  try {
    const column = await prisma.column.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {})
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

    return json(column);
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return notFound("Column not found.");
    }

    logRouteError(error, { route: "PATCH /api/columns/[id]", columnId: id });
    return internalServerError();
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    await prisma.column.delete({
      where: { id }
    });

    return noContent();
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return notFound("Column not found.");
    }

    logRouteError(error, { route: "DELETE /api/columns/[id]", columnId: id });
    return internalServerError();
  }
}
