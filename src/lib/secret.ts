/**
 * The one secret the app signs with.
 *
 * `BETTER_AUTH_SECRET` is the value a deployment sets; the fallback is the offline demo's,
 * so a fresh clone runs without a `.env` edit. Sessions and the analytics visitor key both
 * read it here, which is what keeps them from drifting apart: a second copy of this
 * expression is a second answer to "what secret is this app using".
 */
export const authSecret =
  process.env.BETTER_AUTH_SECRET || "lockin-production-auth-secret-key-2026";
