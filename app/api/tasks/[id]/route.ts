import { prisma } from "@/lib/prisma";
import {
  internalServerError,
  json,
  logRouteError,
  noContent,
  notFound,
  parseJsonBody
} from "@/lib/api/responses";
import { taskUpdateSchema } from "@/lib/validation/task";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const parsed = await parseJsonBody(
    request,
    taskUpdateSchema,
    "Invalid task payload."
  );

  if (!parsed.success) {
    return parsed.response;
  }

  try {
    const task = await prisma.$transaction(async (tx) => {
      const existingTask = await tx.task.findUnique({
        where: { id },
        select: {
          id: true,
          columnId: true
        }
      });

      if (!existingTask) {
        return null;
      }

      const data: {
        title?: string;
        description?: string | null;
        columnId?: string;
        position?: number;
      } = {};

      if (parsed.data.title !== undefined) {
        data.title = parsed.data.title;
      }

      if (parsed.data.description !== undefined) {
        data.description = parsed.data.description;
      }

      if (
        parsed.data.columnId !== undefined &&
        parsed.data.columnId !== existingTask.columnId
      ) {
        const targetColumn = await tx.column.findUnique({
          where: { id: parsed.data.columnId },
          select: { id: true }
        });

        if (!targetColumn) {
          throw new Error("TARGET_COLUMN_NOT_FOUND");
        }

        data.columnId = parsed.data.columnId;
        data.position = await tx.task.count({
          where: { columnId: parsed.data.columnId }
        });
      }

      await tx.task.update({
        where: { id },
        data
      });

      if (parsed.data.subtasks !== undefined) {
        await tx.subtask.deleteMany({
          where: { taskId: id }
        });

        if (parsed.data.subtasks.length > 0) {
          await tx.subtask.createMany({
            data: parsed.data.subtasks.map((subtask, index) => ({
              taskId: id,
              title: subtask.title,
              isCompleted: subtask.isCompleted ?? false,
              position: index
            }))
          });
        }
      }

      return tx.task.findUnique({
        where: { id },
        include: {
          subtasks: {
            orderBy: { position: "asc" }
          }
        }
      });
    });

    if (!task) {
      return notFound("Task not found.");
    }

    return json(task);
  } catch (error) {
    if (error instanceof Error && error.message === "TARGET_COLUMN_NOT_FOUND") {
      return notFound("Target column not found.");
    }

    logRouteError(error, { route: "PATCH /api/tasks/[id]", taskId: id });
    return internalServerError();
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const deleted = await prisma.task.deleteMany({
      where: { id }
    });

    if (deleted.count === 0) {
      return notFound("Task not found.");
    }

    return noContent();
  } catch (error) {
    logRouteError(error, { route: "DELETE /api/tasks/[id]", taskId: id });
    return internalServerError();
  }
}
