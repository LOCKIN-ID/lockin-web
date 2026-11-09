/**
 * Files the app writes that are too big for the database: the generated e-book PDFs and
 * any replacement an admin uploads.
 *
 * Two drivers, one interface. `local` writes under `./storage` and is what a laptop and a
 * single VPS use; `s3` signs requests with SigV4 through `aws4fetch`, which speaks to
 * Cloudflare R2, Supabase Storage's S3 endpoint, MinIO and B2 alike: the free hosting
 * legs the plan targets have no persistent disk, so the object store is the only place a
 * PDF can live there.
 *
 * Keys are relative paths (`ebooks/beginner.pdf`). A key that tries to climb out of the
 * root is refused here, once, rather than trusted by every caller.
 */

import { LocalDiskStorage } from "./local";
import { S3Storage } from "./s3";

export interface Storage {
  readonly name: "local" | "s3";
  put(key: string, body: Uint8Array | string, contentType?: string): Promise<void>;
  read(key: string): Promise<Uint8Array | null>;
  stat(key: string): Promise<{ size: number } | null>;
  remove(key: string): Promise<void>;
}

/** The one place a PDF key is spelled, so the writer and the byte-range route agree. */
export function ebookPdfKey(slug: string): string {
  return `ebooks/${slug}.pdf`;
}

/** What was uploaded, or an empty string. Both drivers store PDFs with this type. */
export const PDF_CONTENT_TYPE = "application/pdf";

export function assertSafeKey(key: string): string {
  const trimmed = key.replace(/^\/+/, "");
  if (trimmed === "" || trimmed.includes("..") || trimmed.includes("\\")) {
    throw new Error(`storage: refusing key "${key}"`);
  }
  return trimmed;
}

let cached: Storage | null = null;

/**
 * Picks the driver from `STORAGE_DRIVER` and keeps it for the process. `S3Storage` only
 * builds its client after it has read every `S3_*` variable, so constructing it is the
 * validation step: a misconfigured deployment fails on the first upload, with the name of
 * the missing variable, rather than writing to the wrong place.
 */
export function storage(): Storage {
  if (cached) return cached;
  const driver = (process.env.STORAGE_DRIVER ?? "local").trim().toLowerCase();
  cached = driver === "s3" ? new S3Storage() : new LocalDiskStorage();
  return cached;
}

export type { Storage as StorageDriver };
