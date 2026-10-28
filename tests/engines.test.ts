import { describe, expect, it } from "vitest";

import { buildPreviewDocument, runHtml } from "../src/lib/playground/engines";
import {
  classifyFailure,
  formatValue,
  MAX_OUTPUT_BYTES,
  parseRunnerMessage,
  truncateOutput,
} from "../src/lib/playground/runtime-protocol";

const BRIDGE_MARK = "__lockin: true";

describe("buildPreviewDocument", () => {
  it("wraps bare markup in a document and puts the console bridge in the head", () => {
    const document = buildPreviewDocument("<h1>hi</h1>");
    expect(document.startsWith("<!doctype html>")).toBe(true);
    expect(document).toContain(BRIDGE_MARK);
    expect(document.indexOf(BRIDGE_MARK)).toBeLessThan(document.indexOf("<h1>hi</h1>"));
    expect(document).toContain("<h1>hi</h1>");
  });

  it("injects the bridge ahead of the student's own head content, once", () => {
    const source = "<html><head><title>Six</title></head><body><p>2 * 3</p></body></html>";
    const document = buildPreviewDocument(source);
    expect(document.split(BRIDGE_MARK)).toHaveLength(2);
    expect(document.indexOf(BRIDGE_MARK)).toBeLessThan(document.indexOf("<title>Six</title>"));
    expect(document).toContain("<p>2 * 3</p>");
  });

  it("keeps the student's markup verbatim, scripts and all", () => {
    const source = `<div id="app"></div><script>console.log("</scr" + "ipt>")</script>`;
    const document = buildPreviewDocument(source);
    expect(document).toContain(source);
    expect(document.split(BRIDGE_MARK)).toHaveLength(2);
    expect(document.indexOf(BRIDGE_MARK)).toBeLessThan(document.indexOf('<div id="app">'));
  });

  it("adds a head to a document that has none", () => {
    const document = buildPreviewDocument("<html><body><b>ok</b></body></html>");
    expect(document).toContain("<head>");
    expect(document.indexOf(BRIDGE_MARK)).toBeLessThan(document.indexOf("<body>"));
  });

  it("hands back a fresh key per run so the frame remounts", () => {
    const first = runHtml("<p>a</p>");
    const second = runHtml("<p>a</p>");
    expect(first.key).not.toBe(second.key);
    expect(first.document).toBe(second.document);
  });
});

describe("parseRunnerMessage", () => {
  it("reads the three shapes a worker sends", () => {
    expect(parseRunnerMessage({ kind: "out", text: "6" })).toEqual({ kind: "out", text: "6" });
    expect(parseRunnerMessage({ kind: "err", text: "boom" })).toEqual({ kind: "err", text: "boom" });
    expect(parseRunnerMessage({ kind: "done", ms: 12, exitCode: 0 })).toEqual({ kind: "done", ms: 12, exitCode: 0 });
  });

  it("refuses anything that is not one of them", () => {
    expect(parseRunnerMessage(null)).toBeNull();
    expect(parseRunnerMessage("done")).toBeNull();
    expect(parseRunnerMessage({ kind: "out" })).toBeNull();
    expect(parseRunnerMessage({ kind: "nope" })).toBeNull();
    expect(parseRunnerMessage({ kind: "done", ms: Number.NaN })).toEqual({ kind: "done", ms: 0, exitCode: 1 });
  });
});

describe("formatValue", () => {
  it("reads the way a console does", () => {
    expect(formatValue("6")).toBe("6");
    expect(formatValue(6)).toBe("6");
    expect(formatValue(undefined)).toBe("undefined");
    expect(formatValue(null)).toBe("null");
    expect(formatValue(new Error("NameError: name 'nama' is not defined"))).toBe(
      "Error: NameError: name 'nama' is not defined",
    );
    expect(formatValue([1, 2])).toBe("[1,2]");
    expect(formatValue({ id: 3 })).toBe('{"id":3}');
    expect(formatValue(new Map([["a", 1]]))).toBe('Map(1) [["a",1]]');
    expect(formatValue(function named() {})).toBe("[Function: named]");
  });

  it("survives a circular object", () => {
    const circular: Record<string, unknown> = { name: "loop" };
    circular.self = circular;
    expect(formatValue(circular)).toBe('{"name":"loop","self":"[Circular]"}');
  });
});

describe("truncateOutput", () => {
  it("passes short output through", () => {
    expect(truncateOutput("hello")).toEqual({ text: "hello", truncated: false });
  });

  it("clips at the cap and says so", () => {
    const result = truncateOutput("x".repeat(MAX_OUTPUT_BYTES + 50));
    expect(result.truncated).toBe(true);
    expect(result.text).toBe(`${"x".repeat(MAX_OUTPUT_BYTES)}\n...output truncated`);
  });
});

describe("classifyFailure", () => {
  it("calls a quiet exit 0 a success", () => {
    expect(classifyFailure({ stderr: "", exitCode: 0 })).toEqual({ ok: true, errorKind: null });
  });

  it("names a timeout, a syntax error and everything else", () => {
    expect(classifyFailure({ stderr: "TimeoutError: your code ran longer than 5s", exitCode: 124 }).errorKind).toBe(
      "timeout",
    );
    expect(classifyFailure({ stderr: "SyntaxError: Unexpected token ')'", exitCode: 1 }).errorKind).toBe("syntax");
    expect(classifyFailure({ stderr: "NameError: name 'nama' is not defined", exitCode: 1 }).errorKind).toBe("runtime");
    expect(classifyFailure({ stderr: "", exitCode: 1 }).ok).toBe(false);
  });
});
