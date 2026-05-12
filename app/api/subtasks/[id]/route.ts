import { prisma } from "@/lib/prisma";
import {
  internalServerError,
  json,
  logRouteError,
  noContent,
  notFound,
  parseJsonBody
} from "@/lib/api/responses";
import { subtaskUpdateSchema } from "@/lib/validation/subtask";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const parsed = await parseJsonBody(
    request,
    subtaskUpdateSchema,
    "Invalid subtask payload."
  );

  if (!parsed.success) {
    return parsed.response;
  }

  try {
    const updated = await prisma.subtask.updateMany({
      where: { id },
      data: {
        ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
        ...(parsed.data.isCompleted !== undefined
          ? { isCompleted: parsed.data.isCompleted }
          : {})
      }
    });

    if (updated.count === 0) {
      return notFound("Subtask not found.");
    }

    const subtask = await prisma.subtask.findUnique({
      where: { id }
    });

    return json(subtask);
  } catch (error) {
    logRouteError(error, { route: "PATCH /api/subtasks/[id]", subtaskId: id });
    return internalServerError();
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const deleted = await prisma.subtask.deleteMany({
      where: { id }
    });

    if (deleted.count === 0) {
      return notFound("Subtask not found.");
    }

    return noContent();
  } catch (error) {
    logRouteError(error, { route: "DELETE /api/subtasks/[id]", subtaskId: id });
    return internalServerError();
  }
}
