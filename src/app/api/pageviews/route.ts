import { clientIp, readJson, refuse } from "@/lib/api";
import { countryOf, recordPageView } from "@/lib/analytics";
import { pageViewSchema } from "@/lib/validation";

/**
 * One page open, reported by the beacon the root layout mounts.
 *
 * The body carries the path and nothing else: the edge knows the address, the country and
 * the browser string, and `recordPageView` is the only thing allowed to decide whether any
 * of it becomes a row. The caller needs no answer, so there is none to give.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = pageViewSchema.safeParse(await readJson(request));
  if (!parsed.success) return refuse("That is not a page open.");

  await recordPageView({
    path: parsed.data.path,
    referrer: request.headers.get("referer"),
    userAgent: request.headers.get("user-agent"),
    siteHost: request.headers.get("host"),
    ip: clientIp(request),
    country: countryOf(request.headers),
  });

  return new Response(null, { status: 204 });
}
