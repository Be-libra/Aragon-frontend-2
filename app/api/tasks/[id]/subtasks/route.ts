import { prisma } from "@/lib/prisma";
import {
  created,
  internalServerError,
  logRouteError,
  notFound,
  parseJsonBody
} from "@/lib/api/responses";
import { subtaskCreateSchema } from "@/lib/validation/subtask";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const parsed = await parseJsonBody(
    request,
    subtaskCreateSchema,
    "Invalid subtask payload."
  );

  if (!parsed.success) {
    return parsed.response;
  }

  try {
    const subtask = await prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({
        where: { id },
        select: { id: true }
      });

      if (!task) {
        return null;
      }

      const position = await tx.subtask.count({
        where: { taskId: id }
      });

      return tx.subtask.create({
        data: {
          taskId: id,
          title: parsed.data.title,
          isCompleted: parsed.data.isCompleted ?? false,
          position
        }
      });
    });

    if (!subtask) {
      return notFound("Task not found.");
    }

    return created(subtask);
  } catch (error) {
    logRouteError(error, { route: "POST /api/tasks/[id]/subtasks", taskId: id });
    return internalServerError();
  }
}
