"use client";

/**
 * A share link carries the code in the URL hash, compressed, with no dependency:
 * `CompressionStream("deflate-raw")` in the browser and `DecompressionStream` back.
 *
 * The hash (not the query) on purpose: the code never reaches the server, so nothing is
 * logged, no route has to parse it, and a shared link cannot be replayed against the API.
 *
 * `compressToBase64Url` / `expandFromBase64Url` are exported for the tests, which run them
 * in Node where both streams exist.
 */

const CODE_PREFIX = "#s=";

export async function compressToBase64Url(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  const packed = new Uint8Array(await new Response(stream).arrayBuffer());
  return bytesToBase64Url(packed);
}

export async function expandFromBase64Url(packed: string): Promise<string> {
  const bytes = base64UrlToBytes(packed);
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  const text = await new Response(stream).text();
  return text;
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export interface SharedSnippet {
  lang: string;
  code: string;
}

/** Builds the hash a share button copies. */
export async function buildShareHash(snippet: SharedSnippet): Promise<string> {
  const packed = await compressToBase64Url(JSON.stringify(snippet));
  return `${CODE_PREFIX}${packed}`;
}

/**
 * Reads a hash back. Returns null for anything malformed: a hand-edited link must not
 * throw in a page that has no error boundary.
 */
export async function readShareHash(hash: string): Promise<SharedSnippet | null> {
  if (!hash.startsWith(CODE_PREFIX)) return null;
  const packed = hash.slice(CODE_PREFIX.length);
  if (!packed || packed.length > 20_000) return null;
  try {
    const parsed: unknown = JSON.parse(await expandFromBase64Url(packed));
    if (typeof parsed !== "object" || parsed === null) return null;
    const { lang, code } = parsed as { lang?: unknown; code?: unknown };
    if (typeof lang !== "string" || typeof code !== "string") return null;
    if (!["html", "js", "python", "shell"].includes(lang)) return null;
    if (code.length > 20_000) return null;
    return { lang, code };
  } catch {
    return null;
  }
}
