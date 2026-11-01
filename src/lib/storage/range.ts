/**
 * Byte ranges, as the e-book PDF route needs them.
 *
 * A PDF reader asks for one contiguous chunk at a time, so a multipart `Range` header is
 * refused rather than half-served: `null` makes the route answer with the whole file,
 * which every reader accepts.
 */

export interface ByteRange {
  start: number;
  end: number;
}

/** One byte range from a `Range` header, or why it cannot be honoured. */
export function parseByteRange(
  header: string | null,
  fileSize: number,
): ByteRange | "unsatisfiable" | null {
  if (!header || !header.startsWith("bytes=")) return null;
  const spec = header.slice("bytes=".length).trim();
  if (spec === "" || spec.includes(",")) return null;

  const match = /^(\d*)-(\d*)$/.exec(spec);
  if (!match) return null;
  const [, rawStart, rawEnd] = match;
  if (rawStart === "" && rawEnd === "") return null;
  if (fileSize <= 0) return "unsatisfiable";

  if (rawStart === "") {
    // `bytes=-50`: the last 50 bytes.
    const suffix = Number(rawEnd);
    if (suffix <= 0) return null;
    return { start: Math.max(0, fileSize - suffix), end: fileSize - 1 };
  }

  const start = Number(rawStart);
  if (start >= fileSize) return "unsatisfiable";
  const end = rawEnd === "" ? fileSize - 1 : Math.min(Number(rawEnd), fileSize - 1);
  if (end < start) return null;
  return { start, end };
}
