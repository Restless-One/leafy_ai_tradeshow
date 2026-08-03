export function actorFromRequest(request: Request): string | null {
  const hostname = new URL(request.url).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1"
    ? "demo.operator@leafy-ai.test"
    : null;
}

export function cleanComment(value: unknown, limit = 500): string | undefined {
  return typeof value === "string" ? value.trim().slice(0, limit) || undefined : undefined;
}
