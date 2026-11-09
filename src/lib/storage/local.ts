import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";

import { assertSafeKey, type Storage } from "./index";

/**
 * The laptop and single-VPS driver: a directory on disk.
 *
 * `storage/` is gitignored, and the root is resolved once per call so a relative
 * `STORAGE_DIR` works from the process's own cwd (Next may run the server from anywhere).
 */
export class LocalDiskStorage implements Storage {
  readonly name = "local" as const;

  private root(): string {
    return resolve(process.env.STORAGE_DIR ?? "storage");
  }

  /** Absolute path inside the root, or a thrown error. The only place the guard lives. */
  private path(key: string): string {
    const safe = assertSafeKey(key);
    const root = this.root();
    const full = resolve(join(root, safe));
    if (full !== root && !full.startsWith(root + sep)) {
      throw new Error(`storage: "${key}" resolves outside ${root}`);
    }
    return full;
  }

  async put(key: string, body: Uint8Array | string): Promise<void> {
    const full = this.path(key);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, body);
  }

  async read(key: string): Promise<Uint8Array | null> {
    try {
      const buffer = await readFile(this.path(key));
      return new Uint8Array(buffer);
    } catch {
      return null;
    }
  }

  async stat(key: string): Promise<{ size: number } | null> {
    try {
      const info = await stat(this.path(key));
      return info.isFile() ? { size: info.size } : null;
    } catch {
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await unlink(this.path(key));
    } catch {
      // Removing what is already gone is the state the caller wanted.
    }
  }
}
