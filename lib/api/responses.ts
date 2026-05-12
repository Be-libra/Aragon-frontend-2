import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { logger } from "@/lib/logger";

type ErrorDetails = Record<string, unknown> | undefined;

type ParsedBodyResult<T> =
  | { success: true; data: T }
  | { success: false; response: NextResponse };

export function json<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function created<T>(data: T) {
  return json(data, 201);
}

export function noContent() {
  return new Response(null, { status: 204 });
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: ErrorDetails
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details ? { details } : {})
      }
    },
    { status }
  );
}

export function validationError(error: ZodError, message: string) {
  return errorResponse(400, "VALIDATION_ERROR", message, error.flatten());
}

export function invalidJsonError() {
  return errorResponse(400, "INVALID_JSON", "Request body must be valid JSON.");
}

export function badRequest(message: string, details?: ErrorDetails) {
  return errorResponse(400, "BAD_REQUEST", message, details);
}

export function notFound(message: string) {
  return errorResponse(404, "NOT_FOUND", message);
}

export function internalServerError(message = "An unexpected error occurred.") {
  return errorResponse(500, "INTERNAL_SERVER_ERROR", message);
}

export async function parseJsonBody<T>(
  request: Request,
  schema: ZodType<T>,
  validationMessage: string
): Promise<ParsedBodyResult<T>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      response: invalidJsonError()
    };
  }

  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return {
      success: false,
      response: validationError(parsed.error, validationMessage)
    };
  }

  return {
    success: true,
    data: parsed.data
  };
}

export function isPrismaNotFoundError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

export function logRouteError(error: unknown, context: Record<string, unknown>) {
  logger.error({ err: error, ...context }, "API route handler failed");
}
