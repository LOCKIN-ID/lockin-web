"use client";

/**
 * The shell, as far as a browser can honestly have one.
 *
 * `wasi-sh` runs the real busybox as WebAssembly against a filesystem we hand it, so
 * `ls`, `cat`, `mkdir`, `grep` and the rest behave: but nothing here touches the
 * reader's disk, and the store is in memory. Two consequences shape this file:
 *
 * 1. `run({ inline: true })` executes on the calling thread. A shell is therefore run
 *    one line at a time, which is also the model the panel wants: submit a line, see its
 *    output, submit the next.
 * 2. `cwd` is emulated here. `wasi-sh` has no such option, so a leading `cd <dir>` is
 *    stripped from the submitted line, folded into this module's `cwd`, and prefixed back
 *    onto the command we actually run.
 *
 * `python <file>` and `node <file>` never reach busybox: the file's text is read out of
 * the store and handed to the Python worker or the JavaScript worker. The host builtins
 * busybox calls are synchronous, so an async Pyodide boot could not live inside one.
 */

import type { FileSystem, Files } from "wasi-sh/fs";

import { getPython, runJs } from "./engines";
import {
  describeError,
  truncateOutput,
  type OnLine,
  type RunResult,
} from "./runtime-protocol";

/** Where a reader lands, and the files the books refer to. */
export const SHELL_HOME = "/home/student";

export const SHELL_SEED: Record<string, string> = {
  [`${SHELL_HOME}/notes.txt`]: "Bab 1: a page is a file.\nBab 2: tags describe, CSS decides.",
  [`${SHELL_HOME}/hello.sh`]: "echo hello from LOCK.IN",
  [`${SHELL_HOME}/harga.csv`]: "produk,harga\nkopi,18000\nte,harga,12000\nroti,9000\n",
};

export const SHELL_WASM = "/busybox.wasm";

/**
 * The store `wasi-sh` runs on, typed by the package itself.
 *
 * It is deliberately not narrowed to the handful of calls this module makes: the guest
 * reaches the store through the shim, `mv` calls `renameSync`, and a hand-written
 * interface that forgot one method would compile and then fail inside WebAssembly.
 */
export type ShellStore = FileSystem;

/** What one submitted line needs: the store, and where the reader is standing. */
interface RunOptions {
  fs: ShellStore;
  cwd: string;
}

const DIR = 0o040000;
const DEC = new TextDecoder();

/** A store with the seeds mounted. */
export async function createShellStore(
  files: Files = SHELL_SEED,
): Promise<ShellStore> {
  const { memoryFs } = await import("wasi-sh/fs");
  return memoryFs(files);
}

export function isDir(entry: { mode: number }): boolean {
  return (entry.mode & 0o170000) === DIR;
}

function readFile(store: ShellStore, path: string): string | null {
  try {
    const stat = store.statSync(path);
    if (isDir(stat)) return null;
    const buffer = new Uint8Array(stat.size);
    store.readSync(path, buffer, 0, stat.size);
    return DEC.decode(buffer);
  } catch {
    return null;
  }
}

export function readStoreFile(store: ShellStore, path: string): string | null {
  return readFile(store, path);
}

/** Walks the store and returns its text files. Binary files are skipped, not corrupted. */
export function serializeStore(store: ShellStore, root = "/"): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (dir: string) => {
    let names: string[];
    try {
      names = store.readdirSync(dir);
    } catch {
      return;
    }
    for (const name of names) {
      const path = dir === "/" ? `/${name}` : `${dir}/${name}`;
      let stat: { mode: number; size: number };
      try {
        stat = store.statSync(path);
      } catch {
        continue;
      }
      if (isDir(stat)) {
        if (path !== "/proc" && path !== "/dev") walk(path);
        continue;
      }
      if (stat.size > 64 * 1024) continue;
      const text = readFile(store, path);
      if (text !== null && !text.includes("\u0000")) out[path] = text;
    }
  };
  walk(root);
  return out;
}

/** Rebuilds a store from a saved workspace, ignoring anything that is not a text file. */
export async function restoreStore(saved: Record<string, string>): Promise<ShellStore> {
  const clean: Record<string, string> = {};
  for (const [path, content] of Object.entries(saved)) {
    if (typeof path !== "string" || !path.startsWith("/")) continue;
    if (typeof content !== "string") continue;
    clean[path] = content;
  }
  return createShellStore({ ...SHELL_SEED, ...clean });
}

/* ------------------------------------------------------------------ *
 * Paths
 * ------------------------------------------------------------------ */

/** `cd`, `..` and `.` collapsed, with a trailing slash trimmed. Always absolute. */
export function resolvePath(cwd: string, target: string): string {
  const base = target.startsWith("/") ? [] : cwd.split("/").filter(Boolean);
  const stack = [...base];
  for (const part of target.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return `/${stack.join("/")}`;
}

export interface ParsedLine {
  /** The command to actually run, without the `cd` prefix we folded into `cwd`. */
  command: string;
  /** The directory the next line starts in. */
  cwd: string;
}

/**
 * Folds a leading `cd <dir> &&` into the working directory. `cd` on its own line is kept
 * as a command, because busybox reports the target in its own way and the reader may be
 * testing exactly that.
 */
export function parseLine(line: string, cwd: string): ParsedLine {
  const match = /^\s*cd\s+(\S+)\s*&&\s*(.+)$/s.exec(line);
  if (!match) return { command: line, cwd };
  return { command: match[2], cwd: resolvePath(cwd, match[1]) };
}

/* ------------------------------------------------------------------ *
 * Running one line
 * ------------------------------------------------------------------ */

interface RunOptions {
  fs: ShellStore;
  cwd: string;
}

type ShellOutcome = Pick<RunResult, "stdout" | "stderr" | "exitCode">;

/** `python <file>` / `node <file>`, routed to the real engines before busybox sees them. */
async function runFromFile(
  command: string,
  cwd: string,
  store: ShellStore,
): Promise<ShellOutcome | null> {
  const match = /^\s*(python3?|node)\s+(\S+)\s*$/.exec(command);
  if (!match) return null;
  const [, program, target] = match;
  const path = resolvePath(cwd, target);
  const source = readFile(store, path);
  if (source === null) {
    return {
      stdout: "",
      stderr: `${program}: ${target}: No such file in this shell's filesystem`,
      exitCode: 1,
    };
  }
  if (program === "node") {
    const result = await runJs(source);
    return { stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode };
  }
  const python = getPython();
  const result = await python.run(source);
  return { stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode };
}

/**
 * Runs one submitted line. Never throws: a busybox error is its stderr and exit code, a
 * missing runtime is a rendered line, and a timeout says so.
 */
export async function runShellLine(
  line: string,
  { fs, cwd }: RunOptions,
): Promise<RunResult & { cwdAfter: string }> {
  const trimmed = line.replace(/\r/g, "");
  const started = performance.now();

  if (!trimmed.trim()) {
    return { stdout: "", stderr: "", exitCode: 0, ms: 0, cwdAfter: cwd };
  }

  const routed = await runFromFile(trimmed, cwd, fs).catch((cause) => ({
    stdout: "",
    stderr: describeError(cause),
    exitCode: 1,
  }));
  if (routed) {
    return { ...routed, ms: performance.now() - started, cwdAfter: cwd };
  }

  const { command, cwd: nextCwd } = parseLine(trimmed, cwd);
  try {
    const { run } = await import("wasi-sh/run");
    const result = await run({
      command: `cd ${nextCwd} && ${command}`,
      fs,
      inline: true,
      wasm: SHELL_WASM,
      env: { COLUMNS: "100", LINES: "30", HOME: SHELL_HOME, PWD: nextCwd },
    });
    const stdout = truncateOutput(result.stdout ?? "");
    const stderr = truncateOutput(result.stderr ?? "");
    return {
      stdout: stdout.text + (stdout.truncated ? "\n[output truncated at 200 KB]" : ""),
      stderr: stderr.text + (stderr.truncated ? "\n[output truncated at 200 KB]" : ""),
      exitCode: result.exitCode ?? 0,
      ms: performance.now() - started,
      cwdAfter: nextCwd,
    };
  } catch (cause) {
    return {
      stdout: "",
      stderr: describeError(cause),
      exitCode: 1,
      ms: performance.now() - started,
      cwdAfter: nextCwd,
    };
  }
}

/** A whole script, line by line, so multi-line snippets behave like a session. */
export async function runShell(
  script: string,
  options: { store: ShellStore; cwd?: string; onLine?: OnLine },
): Promise<RunResult & { cwdAfter: string }> {
  const started = performance.now();
  let cwd = options.cwd ?? SHELL_HOME;
  let stdout = "";
  let stderr = "";
  let exitCode = 0;

  for (const line of script.split("\n")) {
    const result = await runShellLine(line, {
      fs: options.store,
      cwd,
    });
    cwd = result.cwdAfter;
    if (result.stdout) {
      stdout += result.stdout.endsWith("\n") ? result.stdout : `${result.stdout}\n`;
      options.onLine?.({ level: "out", text: result.stdout.replace(/\n$/, "") });
    }
    if (result.stderr) {
      stderr += result.stderr.endsWith("\n") ? result.stderr : `${result.stderr}\n`;
      options.onLine?.({ level: "err", text: result.stderr.replace(/\n$/, "") });
    }
    exitCode = result.exitCode;
  }

  return { stdout, stderr, exitCode, ms: performance.now() - started, cwdAfter: cwd };
}
