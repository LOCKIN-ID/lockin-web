/**
 * The offline coach: a deterministic Socratic engine, pure by design and the
 * default provider for every AI surface. It is not a fallback that apologises;
 * it is the product's declared behaviour when no model key exists, and its
 * rules are literal.
 *
 * Ladder (each ask moves one rung, and only the fourth reaches a patch):
 *   L1  restate the question, point at the exact section and keyword chip
 *   L2  the concept in 60 words or fewer plus the single API or command involved
 *   L3  a two to four line micro-example that uses different data from the exercise
 *   L4  the smallest patch, with a per-line why, still not a full solution
 *
 * Rules:
 *   R1  an answer-request never returns code; it returns L1 plus a refusal
 *   R2  a known error signature pre-empts classification and starts at L2
 *   R3  every answer names the chapter or section it came from
 */

export type Intent = "debug" | "definition" | "why" | "how" | "answer-request" | "support";

export interface TutorContext {
  bookSlug?: string;
  bookTitle?: string;
  chapterId?: string;
  chapterTitle?: string;
  sectionId?: string;
  sectionTitle?: string;
  keywords?: string[];
  /** The chapter's checkpoint hints, reused verbatim when they fit. */
  hints?: string[];
}

export interface HintInput {
  question: string;
  code?: string;
  context?: TutorContext;
}

export interface Hint {
  level: 1 | 2 | 3 | 4;
  text: string;
  /** Rungs three and four carry code: the surface renders it, never the prose. */
  example?: string;
  intent: Intent;
  citedSectionId: string | null;
  citedChapterId: string | null;
  citeKind: "section" | "keyword" | "hint" | "none";
}

const INTENT_PATTERNS: ReadonlyArray<readonly [Intent, RegExp]> = [
  [
    "answer-request",
    /\b(just give|give me the (code|answer)|the answer|write it for me|do it for me|fix it for me|solve it|done? code|buatkan|langsung jawab|jawabannya|kerjakan)\b/i,
  ],
  [
    "debug",
    /\b(error|err|traceback|exception|undefined|null|not defined|syntax|indent\w*|cannot|can't|unexpected|fails?|failing|broken|rusak|gagal)\b/i,
  ],
  [
    "support",
    /\b(refund|payment|pay|paid|invoice|receipt|order|price|pricing|account|password|sign in|login|ticket|subscription|pembayaran)\b/i,
  ],
  ["definition", /\b(what is|what are|meaning of|difference between|apa itu|beda(nya)?|maksud)\b/i],
  ["why", /\b(why|kenapa|mengapa)\b/i],
  ["how", /\b(how|gimana|bagaimana|cara)\b/i],
];

/** The signatures that pre-empt classification (rule R2). */
export interface ErrorSignature {
  name: string;
  pattern: RegExp;
  diagnosis: string;
  fix: string;
}

export const ERROR_SIGNATURES: readonly ErrorSignature[] = [
  {
    name: "NameError",
    pattern: /NameError|is not defined/,
    diagnosis:
      "A name is being read before anything gave it a value. Python looks in the current function, then the module, then its builtins, and finds nothing.",
    fix: "check the spelling first, then check the assignment sits above the line that reads it",
  },
  {
    name: "KeyError",
    pattern: /KeyError/,
    diagnosis:
      "A dictionary was asked for a key it does not hold. A dictionary is not a list: indexes do not fall back, they refuse.",
    fix: "print the whole dictionary, then decide between `in`, `.get()` and creating the key",
  },
  {
    name: "IndentationError",
    pattern: /IndentationError|TabError|unexpected indent/,
    diagnosis:
      "Python reads structure from whitespace. The line after a `:` needs one more level of indent, and every line in the same block needs exactly the same level.",
    fix: "make the block's indent one consistent step, and never mix tabs with spaces",
  },
  {
    name: "TypeError",
    pattern: /TypeError.*(is not a function|not callable)|is not a function/,
    diagnosis:
      "Something is being called that holds a value rather than a function. Usually a method lost its parentheses somewhere earlier, so the variable holds the result instead of the function.",
    fix: "read the value the call is made on, one line above",
  },
  {
    name: "ModuleNotFoundError",
    pattern: /ModuleNotFoundError|No module named/,
    diagnosis:
      "The import names a package the runtime does not have. In this browser runtime the standard library ships with the interpreter; anything else is fetched on the first import.",
    fix: "spell the module exactly as its documentation does, or write the few lines yourself",
  },
  {
    name: "SyntaxError",
    pattern: /SyntaxError|Unexpected token|Unexpected end of input/,
    diagnosis:
      "The parser stopped before running anything, which means the shape of a line is wrong rather than its meaning.",
    fix: "count the brackets and quotes on the line the message points at, then the line above it",
  },
  {
    name: "AttributeError",
    pattern: /AttributeError/,
    diagnosis:
      "The value exists but does not have that attribute. The object is a different type than the one the attribute belongs to.",
    fix: "print the value's type, then use the method that type actually has",
  },
  {
    name: "ZeroDivisionError",
    pattern: /ZeroDivisionError/,
    diagnosis: "The divisor evaluated to zero at run time, even if it looked non-zero when you wrote it.",
    fix: "print the divisor on the line above, then guard the division",
  },
];

export function classify(question: string, code?: string): Intent {
  const text = question.replace(/```[\s\S]*?```/g, " ").trim();
  for (const [intent, pattern] of INTENT_PATTERNS) {
    if (pattern.test(text)) return intent;
  }
  if (text === "" && (code ?? "").trim() !== "") return "debug";
  return "how";
}

export function matchSignature(text: string): ErrorSignature | null {
  for (const signature of ERROR_SIGNATURES) {
    if (signature.pattern.test(text)) return signature;
  }
  return null;
}

export type Language = "python" | "js" | "shell" | "html";

export function languageOf(code: string): Language {
  const sample = code.slice(0, 400);
  if (/^\s*(#!|\$ )/m.test(sample) || /^\s*(ls|cd|mkdir|echo|cat|grep|chmod)\b/m.test(sample)) return "shell";
  if (/^\s*</.test(sample)) return "html";
  if (/\b(console\.log|=>|const |let |function\s|document\.|JSON\.)/.test(sample)) return "js";
  return "python";
}

/**
 * One entry per API the books actually teach. This is what makes L2 and L3
 * concrete instead of generic: the concept, the single API, a micro-example
 * with different data, and the edit to make in their own code.
 */
interface Concept {
  meaning: string;
  api: string;
  example: string;
  change: string;
}

const CONCEPTS: Record<string, Concept> = {
  print: {
    meaning: "`print` writes one value to standard output and moves to the next line. It is the only thing in this panel that shows you anything.",
    api: "`print(value)`",
    example: 'print("tagihan", 12000 * 2)',
    change: "make the argument an expression instead of a literal",
  },
  len: {
    meaning: "`len` counts the items in a sequence or the keys in a mapping. It never counts characters of a number.",
    api: "`len(sequence)`",
    example: 'print(len(["senin", "selasa"]))',
    change: "call it on the collection, not on the loop variable",
  },
  def: {
    meaning:
      "`def` binds a name to a function object. The body does not run until something calls the name, and the body sees only what is passed in or defined inside.",
    api: "`def name(parameters):`",
    example: "def keliling(sisi):\n    return sisi * 4",
    change: "return the value instead of printing it inside the body",
  },
  return: {
    meaning: "`return` hands a value back to the caller and ends the function there. Without it a function hands back `None`.",
    api: "`return value`",
    example: "def sisa(bayar, harga):\n    return bayar - harga",
    change: "swap the `print` inside your function for a `return`",
  },
  for: {
    meaning: "A `for` loop walks a sequence once, from the first item to the last, binding each item to the loop variable in turn.",
    api: "`for item in sequence:`",
    example: 'for kota in ["bandung", "surabaya"]:\n    print(kota.upper())',
    change: "print the loop variable itself before the line you think is wrong",
  },
  if: {
    meaning: "`if` runs a block only when its condition is truthy. Comparing with `==` compares values; `=` assigns, and using it inside a condition is a syntax error.",
    api: "`if condition:`",
    example: 'if 90 >= 85:\n    print("lulus")',
    change: "print the two sides of your comparison on the line above it",
  },
  input: {
    meaning: "`input` reads a line from the terminal and always hands it back as text, even when it looks like a number.",
    api: "`input(prompt)`",
    example: 'umur = int(input("umur: "))',
    change: "wrap the call in `int()` or `float()` where you need a number",
  },
  dict: {
    meaning: "A dictionary maps keys to values and answers one key at a time. A missing key is a `KeyError`, not `None`.",
    api: "`mapping[key]`, `mapping.get(key)`",
    example: 'harga = {"teh": 5000}\nprint(harga.get("kopi", 0))',
    change: "use `.get()` where the key may not exist yet",
  },
  list: {
    meaning: "A list keeps order and allows repeats. Positions start at zero, and the last item is at `-1`.",
    api: "`items[0]`, `items[-1]`, `items.append(x)`",
    example: "nilai = [70, 85, 90]\nprint(nilai[-1])",
    change: "print `len(nilai)` next to the index you used",
  },
  console: {
    meaning: "`console.log` prints values to the console panel. The panel here is the console, so that is where your output appears.",
    api: "`console.log(value)`",
    example: 'console.log("total", 12000 * 2)',
    change: "log the object itself, not a description of it",
  },
  function: {
    meaning:
      "A function declaration is hoisted and callable before its line; a `const` arrow function is not, because the binding is only set where it appears.",
    api: "`function name() {}` or `const name = () => {}`",
    example: "const kali = (a, b) => a * b;\nconsole.log(kali(3, 7));",
    change: "move the call below the `const` that defines it",
  },
  document: {
    meaning: "`document.querySelector` returns the first matching element or `null`. `null` has no `.textContent`, so the next line throws.",
    api: "`document.querySelector(selector)`",
    example: 'const el = document.querySelector("#judul");\nconsole.log(el?.textContent);',
    change: "log the element before you touch its properties",
  },
  fetch: {
    meaning: "`fetch` resolves as soon as the response headers arrive, not when the body is read. Reading the body is a second promise.",
    api: "`await (await fetch(url)).json()`",
    example: 'const data = await (await fetch("/api/health")).json();\nconsole.log(data);',
    change: "add the second `await` before `.json()`",
  },
  ls: {
    meaning: "`ls` lists a directory's entries. Without an argument it lists the current directory, which is the one your working directory points at.",
    api: "`ls [path]`",
    example: "ls /home/student",
    change: "run `pwd` first to see which directory you are standing in",
  },
  mkdir: {
    meaning: "`mkdir` creates one directory; `mkdir -p` also creates the parents it needs and stays quiet when the directory already exists.",
    api: "`mkdir [-p] name`",
    example: "mkdir -p latihan/hari-1",
    change: "add `-p` so a second run does not fail",
  },
  cd: {
    meaning: "`cd` changes the working directory for what runs next. A relative path is read from where you are now, not from the root.",
    api: "`cd path`",
    example: "cd /home/student && ls",
    change: "use an absolute path, then `pwd` to confirm",
  },
};

function tokensOf(code: string): string[] {
  const found = new Set<string>();
  for (const match of code.matchAll(/[A-Za-z_][A-Za-z0-9_]*\s*\(/g)) {
    found.add(match[0].replace("(", "").trim());
  }
  return [...found].slice(0, 6);
}

function conceptFor(code: string, keywords?: string[]): { key: string; concept: Concept } | null {
  const candidates = [...tokensOf(code), ...(keywords ?? [])];
  for (const candidate of candidates) {
    const key = candidate.toLowerCase();
    const concept = CONCEPTS[key];
    if (concept) return { key, concept };
  }
  return null;
}

function where(context?: TutorContext): { text: string; citeKind: Hint["citeKind"] } {
  if (!context) return { text: "", citeKind: "none" };
  const section = context.sectionTitle ?? context.sectionId;
  const chapter = context.chapterTitle ?? context.chapterId;
  const book = context.bookTitle ?? context.bookSlug;
  if (section && chapter && book) {
    return { text: ` That is chapter "${chapter}", section "${section}" of ${book}.`, citeKind: "section" };
  }
  if (section) return { text: ` It sits in the section "${section}".`, citeKind: "section" };
  if (chapter) return { text: ` It sits in chapter "${chapter}".`, citeKind: "section" };
  return { text: "", citeKind: "none" };
}

const REFUSAL =
  "I will not hand you the finished code, because the run is the part that teaches. Ask again and I will widen the hint one rung at a time.";

export function nextHint(input: HintInput, thread: Hint[] = []): Hint {
  const question = input.question.trim();
  const code = input.code ?? "";
  const context = input.context;
  const asked = thread.length;
  const intent = classify(question, code);

  const signature = matchSignature(`${question}\n${code}`);
  /** R2: a known signature skips the restatement rung and starts at the concept. */
  const level = Math.min(4, Math.max(1, asked + (signature ? 2 : 1)));

  const site = where(context);
  const picked = conceptFor(code, context?.keywords);
  const chapterHint = context?.hints?.[0];

  const lines: string[] = [];

  if (level === 1) {
    lines.push(
      question
        ? `You asked: "${question}".`
        : "You have not asked anything yet, so start where the panel is: what does each line change?",
    );
    if (signature) {
      lines.push(`Read the message first: ${signature.name}. ${signature.diagnosis}`);
    } else if (picked) {
      lines.push(
        `The line that matters is the one using \`${picked.key}\`, and nothing about it is hidden: its output lands in the panel below the code.`,
      );
    } else {
      lines.push(
        "Run it once exactly as it stands, note what the panel says, then change one value and run again. The difference is the answer.",
      );
    }
    if (chapterHint) lines.push(`The book's own nudge for this chapter: ${chapterHint}`);
    if (site.text) lines.push(site.text.trim());
    lines.push(REFUSAL);
  }

  if (level === 2) {
    if (signature) {
      lines.push(
        `${signature.name}: ${signature.diagnosis} To find it, ${signature.fix}. That is the whole move; the value is not the point.`,
      );
    } else if (picked) {
      lines.push(`${picked.concept.meaning} The single call in play is ${picked.concept.api}.`);
    } else {
      lines.push(
        "Nothing in this line is doing two jobs at once, so read it as a sequence: left to right, inner brackets first, and every name resolved before it is used.",
      );
    }
    if (site.text) lines.push(site.text.trim());
  }

  if (level === 3) {
    const example = picked?.concept.example ?? 'total = 3 * 4000\nprint("total:", total)';
    lines.push("Here is the same shape on different data, so you can copy the pattern and not the answer.");
    lines.push(
      picked
        ? `The code block below uses ${picked.key} the same way your line does. Now ${picked.concept.change} in your own code, and run it before you read anything else.`
        : "The code block below has the shape of your line. Now make the equivalent change in your own code, and run it before you read anything else.",
    );
    if (site.text) lines.push(site.text.trim());
    return {
      level: 3,
      text: lines.filter(Boolean).join("\n\n"),
      example,
      intent,
      citedSectionId: context?.sectionId ?? null,
      citedChapterId: context?.chapterId ?? null,
      citeKind: site.citeKind,
    };
  }

  if (level === 4) {
    const patch = smallestPatch(code, intent);
    lines.push("The smallest change that would move this forward, and nothing beyond it:");
    for (const reason of patch.why) lines.push(`- ${reason}`);
    lines.push("The rest of the exercise is still yours to write.");
    if (site.text) lines.push(site.text.trim());
    return {
      level: 4,
      text: lines.filter(Boolean).join("\n\n"),
      example: patch.lines.join("\n"),
      intent,
      citedSectionId: context?.sectionId ?? null,
      citedChapterId: context?.chapterId ?? null,
      citeKind: site.citeKind,
    };
  }

  return {
    level: level as Hint["level"],
    text: lines.filter(Boolean).join("\n\n"),
    intent,
    citedSectionId: context?.sectionId ?? null,
    citedChapterId: context?.chapterId ?? null,
    citeKind: site.citeKind,
  };
}

/**
 * The fourth rung is still not a solution: it quotes the one line that is wrong
 * and says why, and it never writes the exercise's own body for it.
 */
function smallestPatch(code: string, intent: Intent): { lines: string[]; why: string[] } {
  if (intent === "answer-request") {
    return {
      lines: ["# no patch: the run is the lesson"],
      why: ["Ask for a hint instead and I will widen it one rung at a time."],
    };
  }
  const line = code.split("\n").find((candidate) => candidate.trim() !== "");
  if (!line) {
    return {
      lines: ["print(2 * 3)"],
      why: ["An empty editor teaches nothing; start with one expression you can predict."],
    };
  }
  return {
    lines: [line],
    why: [
      "Start from the line you already wrote, so the change is visible against something.",
      "Change one value on it, run, and compare the panel with what you expected.",
    ],
  };
}
