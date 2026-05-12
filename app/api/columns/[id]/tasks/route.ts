import { prisma } from "@/lib/prisma";
import {
  created,
  internalServerError,
  logRouteError,
  notFound,
  parseJsonBody
} from "@/lib/api/responses";
import { taskCreateInColumnSchema } from "@/lib/validation/task";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const parsed = await parseJsonBody(
    request,
    taskCreateInColumnSchema,
    "Invalid task payload."
  );

  if (!parsed.success) {
    return parsed.response;
  }

  try {
    const task = await prisma.$transaction(async (tx) => {
      const column = await tx.column.findUnique({
        where: { id },
        select: { id: true }
      });

      if (!column) {
        return null;
      }

      const position = await tx.task.count({
        where: { columnId: id }
      });

      return tx.task.create({
        data: {
          columnId: id,
          title: parsed.data.title,
          description:
            parsed.data.description === undefined ? null : parsed.data.description,
          position,
          subtasks: parsed.data.subtasks?.length
            ? {
                create: parsed.data.subtasks.map((subtask, index) => ({
                  title: subtask.title,
                  isCompleted: subtask.isCompleted ?? false,
                  position: index
                }))
              }
            : undefined
        },
        include: {
          subtasks: {
            orderBy: { position: "asc" }
          }
        }
      });
    });

    if (!task) {
      return notFound("Column not found.");
    }

    return created(task);
  } catch (error) {
    logRouteError(error, { route: "POST /api/columns/[id]/tasks", columnId: id });
    return internalServerError();
  }
}
