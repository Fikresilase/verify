export function apiError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  const lower = message.toLowerCase();

  if (lower.includes("not configured") || lower.includes("environment variables")) {
    return { message, status: 503 };
  }

  if (lower.includes("timed out") || lower.includes("timeout")) {
    return { message, status: 504 };
  }

  return { message, status: 502 };
}
