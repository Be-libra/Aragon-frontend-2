import type { ApiEnvelope, ApiError } from "@/lib/types/kanban";

class ClientApiError extends Error {
  status: number;
  code: string;
  details?: ApiError["details"];

  constructor(status: number, error: ApiError) {
    super(error.message);
    this.name = "ClientApiError";
    this.status = status;
    this.code = error.code;
    this.details = error.details;
  }
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  return response.json();
}

export async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (response.status === 204) {
    return null as T;
  }

  const payload = (await parseResponse(response)) as ApiEnvelope<T> | { error: ApiError } | null;

  if (!response.ok) {
    const error = payload && "error" in payload
      ? payload.error
      : { code: "UNKNOWN_ERROR", message: "Something went wrong." };

    throw new ClientApiError(response.status, error);
  }

  if (!payload || !("data" in payload)) {
    throw new ClientApiError(500, {
      code: "INVALID_RESPONSE",
      message: "The server returned an unexpected response."
    });
  }

  return payload.data;
}

export { ClientApiError };
