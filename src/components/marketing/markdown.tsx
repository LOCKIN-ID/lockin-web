import type { ReactNode } from "react";

/**
 * Markdown, the small subset LOCK.IN writes and nothing else: headings, paragraphs,
 * unordered and ordered lists, tables, fenced code and the three inline marks (`**bold**`,
 * `` `code` ``, `[label](href)`).
 *
 * Two rules make it safe by construction. Raw HTML is never rendered: a `<script>` in the
 * source arrives as the literal text the reader typed: and every link goes through the
 * same href sanitiser, which drops anything that is not `http(s)`, `mailto` or a
 * site-relative path. That is why the help articles can be authored in the database and
 * edited from `/admin/help` without an injection surface opening with them.
 */

export interface MarkdownProps {
  md: string;
  className?: string;
}

type Block =
  | { kind: "heading"; level: 2 | 3 | 4; text: string; id: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "code"; lang: string; code: string }
  | { kind: "table"; head: string[]; rows: string[][] }
  | { kind: "rule" };

const FENCE = /^```(\w*)\s*$/;
const HEADING = /^(#{1,4})\s+(.*)$/;
const UL = /^[-*]\s+(.*)$/;
const OL = /^\d+\.\s+(.*)$/;
const TABLE_ROW = /^\|(.+)\|\s*$/;
const TABLE_RULE = /^\|[\s:|-]+\|\s*$/;

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Splits a table row into cells, tolerating the outer pipes and padding spaces. */
function cells(line: string): string[] {
  const match = TABLE_ROW.exec(line);
  const body = match ? match[1] : line;
  return body.split("|").map((cell) => cell.trim());
}

export function parseMarkdown(md: string): Block[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (line.trim() === "") {
      index += 1;
      continue;
    }

    if (line.trim() === "---") {
      blocks.push({ kind: "rule" });
      index += 1;
      continue;
    }

    const fence = FENCE.exec(line.trim());
    if (fence) {
      const lang = fence[1] || "txt";
      const body: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        body.push(lines[index]);
        index += 1;
      }
      index += 1; // the closing fence
      blocks.push({ kind: "code", lang, code: body.join("\n") });
      continue;
    }

    const heading = HEADING.exec(line.trim());
    if (heading) {
      const text = heading[2].trim();
      const level = Math.min(4, Math.max(2, heading[1].length)) as 2 | 3 | 4;
      blocks.push({ kind: "heading", level, text, id: slugifyHeading(text) });
      index += 1;
      continue;
    }

    if (TABLE_ROW.test(line.trim())) {
      const head = cells(line.trim());
      const rows: string[][] = [];
      index += 1;
      // The delimiter row (`| --- | --- |`) carries alignment, which this renderer does
      // not offer; skipping it is the whole of its meaning here.
      if (index < lines.length && TABLE_RULE.test(lines[index].trim())) index += 1;
      while (index < lines.length && TABLE_ROW.test(lines[index].trim())) {
        rows.push(cells(lines[index].trim()));
        index += 1;
      }
      blocks.push({ kind: "table", head, rows });
      continue;
    }

    const bullet = UL.exec(line.trim());
    const numbered = OL.exec(line.trim());
    if (bullet || numbered) {
      const ordered = Boolean(numbered);
      const items: string[] = [];
      while (index < lines.length) {
        const next = lines[index].trim();
        const match = ordered ? OL.exec(next) : UL.exec(next);
        if (!match) break;
        items.push(match[1].trim());
        index += 1;
      }
      blocks.push({ kind: "list", ordered, items });
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length) {
      const next = lines[index];
      const trimmed = next.trim();
      const startsBlock =
        trimmed === "" ||
        trimmed === "---" ||
        FENCE.test(trimmed) ||
        HEADING.test(trimmed) ||
        TABLE_ROW.test(trimmed) ||
        UL.test(trimmed) ||
        OL.test(trimmed);
      if (startsBlock) break;
      paragraph.push(trimmed);
      index += 1;
    }
    blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
  }

  return blocks;
}

/** `http(s)`, `mailto` and site-relative hrefs only. Anything else loses its link. */
export function safeHref(href: string): string | null {
  const value = href.trim();
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (value.startsWith("#")) return value;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(value)) return value;
  return null;
}

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*]+\*)/g;

/** Inline marks. Order matters: `**bold**` is matched before `*italic*`. */
export function inline(text: string, keyPrefix = ""): ReactNode[] {
  const parts = text.split(INLINE).filter((part) => part !== "");
  return parts.map((part, index) => {
    const key = `${keyPrefix}${index}`;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return <code key={key}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("[") && part.includes("](")) {
      const label = part.slice(1, part.indexOf("]("));
      const href = part.slice(part.indexOf("](") + 2, -1);
      const safe = safeHref(href);
      return safe ? (
        <a key={key} href={safe}>
          {label}
        </a>
      ) : (
        <span key={key}>{label}</span>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    return <span key={key}>{part}</span>;
  });
}

function BlockView({ block, index }: { block: Block; index: number }) {
  const key = `block-${index}`;
  switch (block.kind) {
    case "heading": {
      const Tag = block.level === 2 ? "h2" : block.level === 3 ? "h3" : "h4";
      return (
        <Tag key={key} id={block.id}>
          {inline(block.text, key)}
        </Tag>
      );
    }
    case "paragraph":
      return <p key={key}>{inline(block.text, key)}</p>;
    case "list":
      return block.ordered ? (
        <ol key={key} className="md-list md-list--ordered">
          {block.items.map((item, itemIndex) => (
            <li key={`${key}-${itemIndex}`}>{inline(item, `${key}-${itemIndex}`)}</li>
          ))}
        </ol>
      ) : (
        <ul key={key} className="md-list">
          {block.items.map((item, itemIndex) => (
            <li key={`${key}-${itemIndex}`}>{inline(item, `${key}-${itemIndex}`)}</li>
          ))}
        </ul>
      );
    case "code":
      return (
        <pre key={key} className="code" tabIndex={0} aria-label={`${block.lang} code`}>
          <code>{block.code}</code>
        </pre>
      );
    case "table":
      return (
        <div key={key} className="tbl__scroll">
          <table className="tbl">
            <thead>
              <tr>
                {block.head.map((cell, cellIndex) => (
                  <th key={cellIndex} scope="col">
                    {inline(cell, `${key}-h-${cellIndex}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{inline(cell, `${key}-${rowIndex}-${cellIndex}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "rule":
      return <hr key={key} className="hair" />;
  }
}

export function Markdown({ md, className }: MarkdownProps) {
  const blocks = parseMarkdown(md);
  return (
    <div className={["prose", className].filter(Boolean).join(" ")}>
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} index={index} />
      ))}
    </div>
  );
}
