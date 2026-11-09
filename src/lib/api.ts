/**
 * What every route handler in `src/app/api` shares.
 *
 * Three lines each, but the alternative is that a body which is not JSON throws a 500
 * where the caller deserves a 400, and each route invents its own way of saying so.
 */

/** The body as JSON, or `{}` when it is absent or malformed. Never throws. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return (await request.json()) as unknown;
  } catch {
    return {};
  }
}

/** A refusal with one sentence a person can read. */
export function refuse(reason: string, status = 400): Response {
  return Response.json({ error: reason }, { status });
}

/** The caller's IP as seen through a proxy chain, for rate limits and audit rows. */
export function clientIp(request: Request): string {
  // The edge's own answer first: a caller can write `x-forwarded-for`, and on Cloudflare
  // `cf-connecting-ip` is the one header it cannot.
  const edge = request.headers.get("cf-connecting-ip");
  if (edge) return edge.trim();
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
