import { describe, expect, it } from "vitest";
import { parseByteRange } from "@/lib/storage/range";

describe("parseByteRange", () => {
  const size = 1000;

  it("parses start and end: bytes=0-99", () => {
    expect(parseByteRange("bytes=0-99", size)).toEqual({ start: 0, end: 99 });
  });

  it("parses start to EOF: bytes=100-", () => {
    expect(parseByteRange("bytes=100-", size)).toEqual({ start: 100, end: 999 });
  });

  it("parses suffix: bytes=-50 (last 50 bytes)", () => {
    expect(parseByteRange("bytes=-50", size)).toEqual({ start: 950, end: 999 });
  });

  it("caps end at fileSize - 1 when end exceeds file", () => {
    expect(parseByteRange("bytes=900-1500", size)).toEqual({ start: 900, end: 999 });
  });

  it("returns unsatisfiable when start >= fileSize", () => {
    expect(parseByteRange("bytes=1000-", size)).toBe("unsatisfiable");
    expect(parseByteRange("bytes=1500-2000", size)).toBe("unsatisfiable");
  });

  it("returns null for invalid or missing range headers", () => {
    expect(parseByteRange(null, size)).toBeNull();
    expect(parseByteRange("", size)).toBeNull();
    expect(parseByteRange("invalid", size)).toBeNull();
    expect(parseByteRange("bytes=abc-def", size)).toBeNull();
    expect(parseByteRange("bytes=50-20", size)).toBeNull(); // start > end
    expect(parseByteRange("bytes=0-50,100-150", size)).toBeNull(); // multipart not supported
  });
});
