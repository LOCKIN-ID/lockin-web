import { defineBook } from "../define";
import type { BookContent, BookDraft } from "../types";

/**
 * Expert: "Spesialis Riko". Python and the shell on real files: read a log,
 * turn it into a report, and make the whole job safe to run twice. Shell blocks
 * are one command per line, because the playground runs them a line at a time
 * against a memory filesystem that starts with /home/student already there.
 */
export const expert: BookContent = defineBook({
  slug: "expert",
  title: "LOCK.IN Expert: scripts that keep the books",
  tier: "expert",
  levelLabel: "Spesialis Riko",
  promise: "You finish with a script that turns raw text into a report.",
  chapters: [
    {
      id: "e1",
      title: "The shell as a tool",
      minutes: 26,
      goal: "Say where you are, what is there, and what a path means.",
      sections: [
        {
          id: "e1s1",
          title: "Where you are, and what is beside you",
          minutes: 9,
          body: [
            {
              kind: "text",
              md: "The shell always has a **working directory**. `pwd` prints it, `ls` lists what is in it, and `cd` moves. A path that starts with `/` is absolute: it means the same thing from anywhere. A path that starts with a name is relative to where you are standing.",
            },
            {
              kind: "code",
              lang: "shell",
              runnable: true,
              caption: "Run it and read the order of the lines.",
              code: `pwd
ls -a /home/student
cd /home/student
pwd`,
            },
            {
              kind: "callout",
              tone: "tip",
              title: "Run `pwd` when a command surprises you",
              md: "Most \"file not found\" errors are a path problem, not a missing file. Printing where you are costs one second and answers the question immediately.",
            },
            { kind: "keyword", term: "working directory" },
            { kind: "keyword", term: "path" },
          ],
        },
        {
          id: "e1s2",
          title: "Reading and writing a file",
          minutes: 9,
          body: [
            {
              kind: "text",
              md: "`cat` prints a file. `echo` prints its arguments. `>` sends that output into a file instead of the screen, and `>>` appends to what is already there. That single character is the difference between adding a line and destroying the file.",
            },
            {
              kind: "code",
              lang: "shell",
              runnable: true,
              caption: "Write, append, then read it back.",
              code: `cd /home/student
echo "2026-10-24,buy,beginner" > sales.csv
echo "2026-10-24,buy,expert" >> sales.csv
cat sales.csv
wc -l sales.csv`,
            },
            {
              kind: "callout",
              tone: "trap",
              title: "`>` does not ask",
              md: "`echo hi > sales.csv` replaces the whole file with one line, with no backup and no undo. `>>` is the one you usually want; reach for `>` when you mean \"start this file over\".",
            },
            { kind: "keyword", term: "redirection" },
          ],
        },
        {
          id: "e1s3",
          title: "Exit codes: how a command tells you it failed",
          minutes: 8,
          body: [
            {
              kind: "text",
              md: "Every command ends with an **exit code**: `0` means success and anything else is a failure with a meaning. `echo $?` prints the last one. `&&` runs the next command only on success; `||` runs it only on failure.",
            },
            {
              kind: "code",
              lang: "shell",
              runnable: true,
              caption: "Success, failure, and the operator that reacts to each.",
              code: `cat /home/student/sales.csv && echo "read ok"
cat /home/student/missing.csv || echo "no such file"
echo $?`,
            },
            {
              kind: "text",
              md: "The last line prints the code from the whole chain, which is why a script's final command decides whether the script looks successful. Put the real work last, or check codes as you go.",
            },
            { kind: "keyword", term: "exit code" },
          ],
        },
      ],
      checkpoint: {
        id: "e1-check",
        title: "The shell, checked",
        passRatio: 0.7,
        xp: 25,
        items: [
          {
            id: "e1q1",
            prompt: "What does `pwd` print?",
            options: ["The working directory you are in", "The list of files beside you", "Your shell's version", "The last command's exit code"],
            answerIndex: 0,
            explanation: "`pwd` is \"print working directory\"; `ls` lists, `echo $?` reads the exit code.",
            hint: "One of the four options is about where, not what or how.",
            errorSignatures: ["The list of files", "exit code"],
          },
          {
            id: "e1q2",
            prompt: "You want to add a line to `sales.csv` without losing what is in it. Which operator?",
            options: ["`>>`", "`>`", "`|`", "`&&`"],
            answerIndex: 0,
            explanation: "`>` truncates the file first; `>>` appends to the end.",
            hint: "Which one of these two arrows opens the file and keeps its contents?",
            errorSignatures: ["`>`", "`|`"],
          },
          {
            id: "e1q3",
            prompt: "What does an exit code of `0` mean?",
            options: ["The command succeeded", "Nothing was printed", "The command was not run", "The command printed an empty line"],
            answerIndex: 0,
            explanation: "Zero is success and everything else is a specific failure: the opposite of what \"no news is good news\" suggests.",
            hint: "It is not an error code: it is the good outcome.",
            errorSignatures: ["Nothing was printed", "was not run"],
          },
          {
            id: "e1q4",
            prompt: "In `cat a.csv && echo ok`, when does `echo ok` run?",
            options: ["Only when `cat` succeeded", "Always", "Only when `cat` failed", "Never"],
            answerIndex: 0,
            explanation: "`&&` is the success operator; `||` is the failure one.",
            hint: "Which of the two is \"and then, if that worked\"?",
            errorSignatures: ["Always", "Only when `cat` failed"],
          },
        ],
      },
    },
    {
      id: "e2",
      title: "Pipes and filters",
      minutes: 26,
      goal: "Turn a file into an answer with three small commands instead of one big one.",
      sections: [
        {
          id: "e2s1",
          title: "A pipe hands output to the next command",
          minutes: 9,
          body: [
            {
              kind: "text",
              md: "The `|` character takes what the command on the left printed and makes it the input of the command on the right. Nothing is written to disk in between, so a pipeline is a conversation, not a file.",
            },
            {
              kind: "code",
              lang: "shell",
              runnable: true,
              caption: "One file, one pipe, one count.",
              code: `cd /home/student
printf 'beginner\\nexpert\\nbeginner\\n' > levels.txt
cat levels.txt | wc -l
cat levels.txt | sort | uniq -c`,
            },
            {
              kind: "callout",
              tone: "fact",
              title: "`uniq` only sees neighbours",
              md: "`uniq -c` counts runs of identical lines, so it needs `sort` in front of it. That is why `sort | uniq -c | sort -rn` is the same three commands wherever you go.",
            },
            { kind: "keyword", term: "pipe" },
          ],
        },
        {
          id: "e2s2",
          title: "grep is a filter, not a search engine",
          minutes: 9,
          body: [
            {
              kind: "text",
              md: "`grep pattern` prints the lines that match. `-c` counts them, `-v` inverts the match, `-i` ignores case. Combined with a pipe it answers questions like \"how many of these lines are about the expert book?\".",
            },
            {
              kind: "code",
              lang: "shell",
              runnable: true,
              caption: "Four counts from one file, no editor opened.",
              code: `cd /home/student
grep beginner levels.txt
grep -c beginner levels.txt
grep -cv beginner levels.txt
grep -i EXPERT levels.txt`,
            },
            { kind: "keyword", term: "filter" },
          ],
        },
        {
          id: "e2s3",
          title: "The shape of a pipeline you can trust",
          minutes: 8,
          body: [
            {
              kind: "text",
              md: "Build a pipeline one piece at a time and look at the output after each piece. A four-command pipeline written in one go is four assumptions; the same pipeline built up is a sequence of facts you have already seen.",
            },
            {
              kind: "code",
              lang: "shell",
              runnable: true,
              caption: "Built in three steps, each one readable.",
              code: `cd /home/student
grep ",buy," sales.csv
grep ",buy," sales.csv | cut -d, -f3
grep ",buy," sales.csv | cut -d, -f3 | sort | uniq -c | sort -rn`,
            },
            {
              kind: "callout",
              tone: "tip",
              title: "Say what each stage does out loud",
              md: "\"Lines that are purchases, third field, counted, biggest first.\" If you cannot say it, the pipeline is doing two things you have not separated yet.",
            },
            { kind: "questGate", questSlug: "exps5m3bq7xv2knw4dt9hr" },
          ],
        },
      ],
      checkpoint: {
        id: "e2-check",
        title: "Pipelines, checked",
        passRatio: 0.7,
        xp: 25,
        items: [
          {
            id: "e2q1",
            prompt: "What does `cat a.txt | wc -l` print?",
            options: ["The number of lines in `a.txt`", "The number of words", "The contents of `a.txt` twice", "The file size in bytes"],
            answerIndex: 0,
            explanation: "`wc -l` counts lines of whatever it reads on its input, which the pipe has connected to the file's contents.",
            hint: "`-l` is lines; `-w` would be words.",
            errorSignatures: ["number of words", "file size in bytes"],
          },
          {
            id: "e2q2",
            prompt: "Why does `uniq -c` need `sort` before it?",
            options: [
              "It only compares each line with the one before it",
              "It refuses unsorted input",
              "It sorts internally only for numbers",
              "It reads the file backwards",
            ],
            answerIndex: 0,
            explanation: "`uniq` collapses adjacent duplicates. Sorting first makes duplicates adjacent: and therefore countable.",
            hint: "What does `uniq` do with two identical lines that are far apart?",
            errorSignatures: ["refuses unsorted input", "reads the file backwards"],
          },
          {
            id: "e2q3",
            prompt: "Which command counts the lines that do **not** match?",
            options: ["`grep -cv pattern file`", "`grep -c pattern file`", "`grep -n pattern file`", "`grep -o pattern file`"],
            answerIndex: 0,
            explanation: "`-c` counts and `-v` inverts the match, so together they count the lines that fail it.",
            hint: "Two letters, two separate jobs: count, and invert.",
            errorSignatures: ["`grep -c pattern file`", "`grep -n pattern file`"],
          },
          {
            id: "e2q4",
            prompt: "In `grep \",buy,\" sales.csv | cut -d, -f3`, what does `cut -d, -f3` return?",
            options: ["The third comma-separated field of each matching line", "Every field after the third", "The third line of the file", "The third character of each line"],
            answerIndex: 0,
            explanation: "`-d` sets the delimiter and `-f` picks fields, so the two flags together read \"the third field, splitting on commas\".",
            hint: "A delimiter and a field number.",
            errorSignatures: ["Every field after the third", "third character of each line"],
          },
        ],
      },
    },
    {
      id: "e3",
      title: "Python values and functions",
      minutes: 22,
      goal: "Compute something once, in a way the next person can read.",
      sections: [
        {
          id: "e3s1",
          title: "Names, values and arithmetic",
          minutes: 8,
          body: [
            {
              kind: "text",
              md: "A Python **variable** is a name pointing at a value. `=` binds the name; it is not a comparison. Comparisons are `==`, and `//` is integer division, which the shell's arithmetic does not give you for free.",
            },
            {
              kind: "code",
              lang: "python",
              runnable: true,
              caption: "Run it: six lines, six answers.",
              code: `copies = 3
price = 49000
total = copies * price
print(total)
print(total // 1000, "thousand")
print(total / copies)`,
            },
            { kind: "keyword", term: "variable" },
          ],
        },
        {
          id: "e3s2",
          title: "A function with a default",
          minutes: 7,
          body: [
            {
              kind: "text",
              md: "`def` names a function. A parameter written `rate=0.11` is optional: the caller can leave it out and the default applies. Return a value instead of printing when other code will use the result.",
            },
            {
              kind: "code",
              lang: "python",
              runnable: true,
              caption: "One function, three calls, one default.",
              code: `def with_tax(price, rate=0.11):
    return round(price * (1 + rate))

print(with_tax(120000))
print(with_tax(120000, 0))
print(sum(with_tax(p) for p in (49000, 89000)))`,
            },
            { kind: "keyword", term: "default argument" },
          ],
        },
        {
          id: "e3s3",
          title: "f-strings: a sentence you can read",
          minutes: 7,
          body: [
            {
              kind: "text",
              md: "An **f-string** puts a value inside a sentence. `{total:,.0f}` adds thousands separators and no decimals, which is what a price report wants; `{name:<10}` pads a name to ten characters so a column lines up.",
            },
            {
              kind: "code",
              lang: "python",
              runnable: true,
              caption: "Alignment, thousands and a percentage.",
              code: `rows = [("beginner", 12), ("intermediate", 9), ("expert", 4)]
for tier, copies in rows:
    print(f"{tier:<14}{copies:>4}")

total = sum(copies for _, copies in rows)
print(f"total {total:>3} copies, average {total / len(rows):.1f}")`,
            },
            { kind: "keyword", term: "f-string" },
          ],
        },
      ],
      checkpoint: {
        id: "e3-check",
        title: "Python basics, checked",
        passRatio: 0.7,
        xp: 25,
        items: [
          {
            id: "e3q1",
            prompt: "What does `17 // 5` evaluate to in Python?",
            options: ["`3`", "`3.4`", "`2`", "An error"],
            answerIndex: 0,
            explanation: "`//` is floor division: it keeps the integer part. `17 / 5` would give `3.4`.",
            hint: "One of these is integer division and one is not.",
            errorSignatures: ["`3.4`", "`2`"],
          },
          {
            id: "e3q2",
            prompt: "In `def with_tax(price, rate=0.11)`, what is `rate`?",
            options: [
              "An optional parameter with a default",
              "A required parameter",
              "A local variable that is always 0.11",
              "The function's return value",
            ],
            answerIndex: 0,
            explanation: "A default makes the argument optional; a caller can still pass a different rate.",
            hint: "What happens if the caller passes only one argument?",
            errorSignatures: ["A required parameter", "always 0.11"],
          },
          {
            id: "e3q3",
            prompt: "What does `f\"{total:>4}\"` do?",
            options: [
              "Right-aligns the value in a field four characters wide",
              "Prints at least four decimals",
              "Rounds to four digits",
              "Prints the value four times",
            ],
            answerIndex: 0,
            explanation: "The `>` is right-alignment and `4` is the field width: the pair that makes a column straight.",
            hint: "There is an alignment character and a width in there.",
            errorSignatures: ["four decimals", "four times"],
          },
          {
            id: "e3q4",
            prompt: "Why return a value instead of printing inside the function?",
            options: [
              "A returned value can be summed, tested and reused",
              "Printing is slower in Python",
              "Printing cannot include numbers",
              "A function can only do one of the two",
            ],
            answerIndex: 0,
            explanation: "`sum(with_tax(p) for p in prices)` only works because the function hands a value back.",
            hint: "Which one can another line of code use?",
            errorSignatures: ["Printing is slower", "only do one of the two"],
          },
        ],
      },
    },
    {
      id: "e4",
      title: "Lists and dictionaries",
      minutes: 26,
      goal: "Group raw lines into records and print a report from them.",
      sections: [
        {
          id: "e4s1",
          title: "A list keeps order",
          minutes: 9,
          body: [
            {
              kind: "text",
              md: "A list holds values in order: `rows = []` starts empty, `.append(value)` adds to the end, and `len(rows)` is the count. A **list comprehension** builds a new list from an old one in one readable line.",
            },
            {
              kind: "code",
              lang: "python",
              runnable: true,
              caption: "Build, extend, transform.",
              code: `copies = [12, 9, 4]
copies.append(7)
print(copies, len(copies))
print([c * 49000 for c in copies])
print([c for c in copies if c > 8])
print(max(copies), min(copies))`,
            },
            { kind: "keyword", term: "list" },
          ],
        },
        {
          id: "e4s2",
          title: "A dictionary counts things",
          minutes: 9,
          body: [
            {
              kind: "text",
              md: "A **dictionary** maps a key to a value. Counting is the classic use: `counts[key] = counts.get(key, 0) + 1` reads as \"one more than whatever it was, or one\". Grouping is the same idea with a list as the value.",
            },
            {
              kind: "code",
              lang: "python",
              runnable: true,
              caption: "Count a column, then group by it.",
              code: `purchases = ["beginner", "expert", "beginner", "beginner", "expert"]

counts = {}
for tier in purchases:
    counts[tier] = counts.get(tier, 0) + 1
print(counts)

by_tier = {}
for tier in purchases:
    by_tier.setdefault(tier, []).append(tier)
print({k: len(v) for k, v in by_tier.items()})`,
            },
            { kind: "keyword", term: "dictionary" },
          ],
        },
        {
          id: "e4s3",
          title: "A report with a stable order",
          minutes: 8,
          body: [
            {
              kind: "text",
              md: "A dictionary has no order to rely on, so sort before you print: `sorted(counts.items(), key=lambda pair: pair[1], reverse=True)`. Sorting by the count descending, then by the name, makes two runs of the same data print the same report.",
            },
            {
              kind: "code",
              lang: "python",
              runnable: true,
              caption: "The report, with a tie-break that keeps it stable.",
              code: `counts = {"beginner": 3, "expert": 2, "intermediate": 2}
ranked = sorted(counts.items(), key=lambda pair: (-pair[1], pair[0]))

for tier, copies in ranked:
    print(f"{tier:<14}{copies:>4}")

print(f"{'total':<14}{sum(counts.values()):>4}")`,
            },
            { kind: "callout", tone: "tip", title: "A tie-break is a feature", md: "Without the name in the sort key, Python may keep ties in the order they were inserted: and the \"same\" report changes shape between machines." },
            { kind: "keyword", term: "sorted key" },
            { kind: "questGate", questSlug: "expq8c4mj2vt7xkn6dw3pf" },
          ],
        },
      ],
      checkpoint: {
        id: "e4-check",
        title: "Collections, checked",
        passRatio: 0.7,
        xp: 25,
        items: [
          {
            id: "e4q1",
            prompt: "Which adds one item to the end of the list `copies`?",
            options: ["`copies.append(7)`", "`copies.add(7)`", "`copies.push(7)`", "`copies + 7`"],
            answerIndex: 0,
            explanation: "Lists append; sets add; `+` would try to concatenate a list with a number and raise.",
            hint: "One of these methods belongs to sets, and one belongs to JavaScript.",
            errorSignatures: ["`copies.add(7)`", "`copies.push(7)`"],
          },
          {
            id: "e4q2",
            prompt: "What does `counts.get(tier, 0)` give when `tier` is not in `counts`?",
            options: ["`0`", "`None`", "A `KeyError`", "An empty string"],
            answerIndex: 0,
            explanation: "`.get` with a default returns that default instead of raising, which is what makes the counting line safe on the first sighting of a key.",
            hint: "That second argument exists exactly for this case.",
            errorSignatures: ["A `KeyError`", "`None`"],
          },
          {
            id: "e4q3",
            prompt: "Why sort by `(-pair[1], pair[0])` rather than by the count alone?",
            options: [
              "It breaks ties by name, so the report is stable run to run",
              "It sorts numbers as text",
              "It is faster than sorting on one key",
              "It reverses the dictionary in place",
            ],
            answerIndex: 0,
            explanation: "A single-key sort leaves equal counts in dictionary order, which can differ between runs and machines.",
            hint: "What does a single-key sort do with two equal counts?",
            errorSignatures: ["sorts numbers as text", "reverses the dictionary"],
          },
          {
            id: "e4q4",
            prompt: "Which builds a new list of the copies above eight?",
            options: [
              "`[c for c in copies if c > 8]`",
              "`copies.filter(c > 8)`",
              "`[c > 8 for c in copies]`",
              "`copies.remove(c <= 8)`",
            ],
            answerIndex: 0,
            explanation: "A comprehension with an `if` keeps the items that pass. The second option is JavaScript, the third gives booleans, the fourth is not how `remove` works.",
            hint: "One of these produces `True` and `False` values instead of copies.",
            errorSignatures: ["`copies.filter", "`[c > 8 for c in copies]`"],
          },
        ],
      },
    },
    {
      id: "e5",
      title: "Reading input, line by line",
      minutes: 26,
      goal: "Turn a messy text file into records, and say which lines were bad.",
      sections: [
        {
          id: "e5s1",
          title: "Text is lines, and lines have edges",
          minutes: 9,
          body: [
            {
              kind: "text",
              md: "`text.splitlines()` gives you the lines without their line endings, and `.strip()` removes the whitespace at each end. `.split(\",\")` then gives fields. Empty lines and a blank last line are the two that break naive parsers.",
            },
            {
              kind: "code",
              lang: "python",
              runnable: true,
              caption: "Four lines in, four useful facts out.",
              code: `raw = "beginner,12\\n\\nexpert,4\\n"

lines = raw.splitlines()
print(lines)
print([line for line in lines if line.strip()])
print(lines[0].split(","))`,
            },
            { kind: "keyword", term: "splitlines" },
          ],
        },
        {
          id: "e5s2",
          title: "Lines into records",
          minutes: 9,
          body: [
            {
              kind: "text",
              md: "A **record** is one line turned into named fields, usually a dictionary. Do the conversion in one place, so every later line of the program sees the same shape and no code has to re-split anything.",
            },
            {
              kind: "code",
              lang: "python",
              runnable: true,
              caption: "A parser you can point at a real file.",
              code: `def parse(line):
    parts = [p.strip() for p in line.split(",")]
    if len(parts) != 3:
        return None
    day, action, tier = parts
    return {"day": day, "action": action, "tier": tier}

rows = [parse(line) for line in ["2026-10-24,buy,beginner", "bad-line", "2026-10-25,buy,expert"]]
print(rows)
print([row for row in rows if row is not None])`,
            },
            { kind: "keyword", term: "record" },
          ],
        },
        {
          id: "e5s3",
          title: "Failing well: count what you could not read",
          minutes: 8,
          body: [
            {
              kind: "text",
              md: "A parser that silently drops bad lines produces a confident wrong number. Keep the rejects: count them, print the first few with their line numbers, and let the exit code say whether the run was clean.",
            },
            {
              kind: "code",
              lang: "python",
              runnable: true,
              caption: "Good rows, rejected rows, and a summary.",
              code: `def parse(line):
    parts = [p.strip() for p in line.split(",")]
    if len(parts) != 3:
        return None
    return {"day": parts[0], "action": parts[1], "tier": parts[2]}

raw = ["2026-10-24,buy,beginner", "oops", "2026-10-25,buy,expert", "2026-10-25,buy"]
rows, rejected = [], []
for number, line in enumerate(raw, start=1):
    row = parse(line)
    (rows if row else rejected).append(row or (number, line))

print(f"read {len(rows)}, rejected {len(rejected)}")
print(rejected)`,
            },
            { kind: "callout", tone: "trap", title: "Silent drops", md: "`except: pass` turns a data problem into a number that looks fine. Report the count of rejects even when it is zero: the zero is the evidence." },
            { kind: "keyword", term: "exception" },
          ],
        },
      ],
      checkpoint: {
        id: "e5-check",
        title: "Parsing, checked",
        passRatio: 0.7,
        xp: 25,
        items: [
          {
            id: "e5q1",
            prompt: "What does `\"a,b\\n\\n\".splitlines()` return?",
            options: ['`["a,b", ""]`', '`["a,b"]`', '`["a,b\\n\\n"]`', '`["a", "b"]`'],
            answerIndex: 0,
            explanation: "`splitlines` splits on line endings and keeps empty lines as empty strings; it does not strip them for you.",
            hint: "The string has two line endings in it.",
            errorSignatures: ['`["a,b"]`', '`["a", "b"]`'],
          },
          {
            id: "e5q2",
            prompt: "Why does `parse` return `None` instead of raising?",
            options: [
              "The caller decides whether a bad line is fatal, and can count rejects",
              "Python cannot raise inside a function",
              "`None` is faster than an exception",
              "It keeps the line count correct",
            ],
            answerIndex: 0,
            explanation: "Returning a marker keeps the decision at the level that knows what a bad row means for the report.",
            hint: "Who knows whether a bad line should stop the job?",
            errorSignatures: ["cannot raise inside", "faster than an exception"],
          },
          {
            id: "e5q3",
            prompt: "What is the danger of `except: pass` around a parser?",
            options: [
              "Bad data disappears and the totals look trustworthy",
              "It makes the script slower",
              "It prints the traceback twice",
              "It stops the loop early",
            ],
            answerIndex: 0,
            explanation: "A silent drop converts a data problem into a wrong number with no trace of the cause.",
            hint: "What does the report look like afterwards?",
            errorSignatures: ["slower", "stops the loop early"],
          },
          {
            id: "e5q4",
            prompt: "Why keep the line numbers of rejected rows?",
            options: [
              "They are how you find the bad line in the file",
              "They make the script run faster",
              "They are required by `enumerate`",
              "They replace the row's contents",
            ],
            answerIndex: 0,
            explanation: "A reject without a location is a complaint; with a line number it is a fix.",
            hint: "What would you need to open the file and repair it?",
            errorSignatures: ["run faster", "required by `enumerate`"],
          },
        ],
      },
    },
    {
      id: "e6",
      title: "Automate the whole job",
      minutes: 22,
      goal: "Wrap the analysis in a script that is safe to run twice.",
      sections: [
        {
          id: "e6s1",
          title: "A shell script with arguments",
          minutes: 8,
          body: [
            {
              kind: "text",
              md: "A script is a file with a **shebang** on its first line, made executable with `chmod +x`. `$1` is the first argument, `$#` is how many there were, and `set -e` makes the script stop at the first failing command instead of running on into damage.",
            },
            {
              kind: "code",
              lang: "shell",
              runnable: true,
              caption: "Write it, make it executable, run it with an argument.",
              code: `cd /home/student
printf '#!/bin/sh\\nset -e\\necho "report for $1"\\n' > report.sh
chmod +x report.sh
./report.sh beginner
sh report.sh expert`,
            },
            { kind: "keyword", term: "shebang" },
            { kind: "keyword", term: "argument" },
          ],
        },
        {
          id: "e6s2",
          title: "Running Python from the shell, twice",
          minutes: 7,
          body: [
            {
              kind: "text",
              md: "An **idempotent** job can run twice with the same result. In practice that means writing to a temporary file and moving it into place, or rebuilding an output file from its input each run rather than appending to it.",
            },
            {
              kind: "code",
              lang: "shell",
              runnable: true,
              caption: "The same command twice, and the result is still one line.",
              code: `cd /home/student
echo "beginner,12" > counts.tmp
mv counts.tmp counts.csv
echo "beginner,12" > counts.tmp
mv counts.tmp counts.csv
cat counts.csv
wc -l counts.csv`,
            },
            {
              kind: "callout",
              tone: "fact",
              title: "Why a temporary file",
              md: "`mv` inside one filesystem is atomic: a reader sees either the old report or the new one, never half of it. Writing straight to the destination leaves a window where the file is short.",
            },
            { kind: "keyword", term: "idempotent" },
          ],
        },
        {
          id: "e6s3",
          title: "The handover",
          minutes: 7,
          body: [
            {
              kind: "text",
              md: "A script nobody else can run is a script that will be deleted. Say what it needs, what it writes, and how to run it: in a comment at the top, where the next person will actually look.",
            },
            {
              kind: "code",
              lang: "shell",
              runnable: false,
              caption: "Read only: the handover header you would write at the top of your own script.",
              code: `#!/bin/sh
# report.sh: print the top tiers by copies sold
# usage: ./report.sh /home/student/sales.csv
# writes: /home/student/counts.csv (rebuilt each run, never appended)
# needs: awk, sort
set -e

test -f "$1" || { echo "no such file: $1" >&2; exit 1; }`,
            },
            {
              kind: "callout",
              tone: "tip",
              title: "Fail with a sentence",
              md: "Errors belong on stderr (`>&2`) with the path that failed. A script that exits with a code and no sentence makes the next person read the source.",
            },
            { kind: "questGate", questSlug: "expr2k7vq9wt4mnb6dz8xh" },
          ],
        },
      ],
      checkpoint: {
        id: "e6-check",
        title: "Automation, checked",
        passRatio: 0.7,
        xp: 25,
        items: [
          {
            id: "e6q1",
            prompt: "What is the shebang for?",
            options: [
              "It names the interpreter that should run the file",
              "It marks the file as executable",
              "It prints the script's usage",
              "It sets the exit code",
            ],
            answerIndex: 0,
            explanation: "The kernel reads the first line to choose the program that runs the script; `chmod +x` is the separate step that makes it runnable at all.",
            hint: "One of these is a permission, and one is a name.",
            errorSignatures: ["marks the file as executable", "sets the exit code"],
          },
          {
            id: "e6q2",
            prompt: "What does `set -e` do?",
            options: [
              "Stops the script at the first command that fails",
              "Prints every command before running it",
              "Exits with code 1 always",
              "Ignores errors quietly",
            ],
            answerIndex: 0,
            explanation: "Without it, a failing middle step is easy to miss and the script carries on with a half-built state.",
            hint: "It changes what happens **after** a failure.",
            errorSignatures: ["Prints every command", "Ignores errors quietly"],
          },
          {
            id: "e6q3",
            prompt: "Why write to `counts.tmp` and then `mv` it into place?",
            options: [
              "The move is atomic, so a reader never sees a half-written file",
              "It compresses the output",
              "It avoids needing write permission",
              "It sorts the file on the way",
            ],
            answerIndex: 0,
            explanation: "A direct write leaves a window where the report is short or empty; a rename in one filesystem swaps the whole file at once.",
            hint: "What could another process read while your script is still writing?",
            errorSignatures: ["compresses the output", "sorts the file on the way"],
          },
          {
            id: "e6q4",
            prompt: "Which script is idempotent?",
            options: [
              "One that rebuilds the output file from the input each run",
              "One that appends a line on every run",
              "One that renames the output file each run",
              "One that emails the report on every run",
            ],
            answerIndex: 0,
            explanation: "Rebuilding from the input gives the same output twice. Appending grows without limit, and repeated e-mails are a second problem all of their own.",
            hint: "Which one gives the same result on the second run?",
            errorSignatures: ["appends a line on every run", "emails the report on every run"],
          },
        ],
      },
    },
  ],
  cheatsheets: [
    {
      term: "working directory",
      meaning: "The folder the shell is standing in. Relative paths are resolved from it; `pwd` prints it and `cd` changes it.",
      snippet: { lang: "shell", code: "pwd\ncd /home/student" },
    },
    {
      term: "path",
      meaning: "A file's address: `/home/student/sales.csv` is absolute, `sales.csv` is relative to where you are.",
    },
    {
      term: "redirection",
      meaning: "`>` writes a command's output into a file, replacing it; `>>` appends instead.",
      snippet: { lang: "shell", code: 'echo "beginner,12" >> sales.csv' },
    },
    {
      term: "exit code",
      meaning: "The number a command ends with: `0` is success, anything else is a specific failure. `echo $?` reads the last one.",
      snippet: { lang: "shell", code: 'cat missing.csv || echo "no such file"' },
    },
    {
      term: "pipe",
      meaning: "`|` connects one command's output to the next command's input, with nothing written to disk.",
      snippet: { lang: "shell", code: "grep \",buy,\" sales.csv | wc -l" },
    },
    {
      term: "filter",
      meaning: "A command that takes lines in and prints fewer lines out: `grep`, `sort`, `uniq`, `cut`.",
      snippet: { lang: "shell", code: "sort levels.txt | uniq -c | sort -rn" },
    },
    {
      term: "variable",
      meaning: "A name bound to a value with `=`. `==` compares, `=` binds, and both are one keystroke apart.",
      snippet: { lang: "python", code: "total = copies * price" },
    },
    {
      term: "default argument",
      meaning: "A parameter with a fallback: `def with_tax(price, rate=0.11)` may be called with one argument or two.",
      snippet: { lang: "python", code: "def with_tax(price, rate=0.11):\n    return round(price * (1 + rate))" },
    },
    {
      term: "f-string",
      meaning: "A string with values inside it: `f\"{tier:<14}{copies:>4}\"` pads and aligns them.",
      snippet: { lang: "python", code: 'print(f"{tier:<14}{copies:>4}")' },
    },
    {
      term: "list",
      meaning: "An ordered collection: `[]` to start, `.append` to grow, `len` to count, a comprehension to transform.",
      snippet: { lang: "python", code: "copies = [12, 9, 4]\nprint([c for c in copies if c > 8])" },
    },
    {
      term: "dictionary",
      meaning: "Keys mapped to values, which is how you count or group: `counts.get(key, 0) + 1`.",
      snippet: { lang: "python", code: "counts[tier] = counts.get(tier, 0) + 1" },
    },
    {
      term: "sorted key",
      meaning: "`sorted(rows, key=...)` orders by whatever the key function returns; a tuple of `(-count, name)` sorts by count descending and then by name.",
      snippet: { lang: "python", code: "sorted(counts.items(), key=lambda pair: (-pair[1], pair[0]))" },
    },
    {
      term: "splitlines",
      meaning: "`text.splitlines()` gives the lines without their endings; `.strip()` then removes the whitespace at each end.",
      snippet: { lang: "python", code: 'print("a,b\\n\\n".splitlines())' },
    },
    {
      term: "record",
      meaning: "One line turned into named fields, usually a dictionary, parsed in one place so the rest of the program sees one shape.",
      snippet: { lang: "python", code: 'return {"day": day, "action": action, "tier": tier}' },
    },
    {
      term: "exception",
      meaning: "Python's way of saying a call could not do its job: `try`/`except` handles it, and `except: pass` hides it.",
      snippet: { lang: "python", code: "try:\n    value = int(text)\nexcept ValueError:\n    value = None" },
    },
    {
      term: "shebang",
      meaning: "The `#!/bin/sh` first line that names the interpreter for a script file. `chmod +x` is the separate step that makes it executable.",
      snippet: { lang: "shell", code: "#!/bin/sh\nset -e" },
    },
    {
      term: "argument",
      meaning: "A value passed to a command or script: `$1` is the first, `$#` is how many.",
      snippet: { lang: "shell", code: './report.sh /home/student/sales.csv' },
    },
    {
      term: "idempotent",
      meaning: "Safe to run twice: the second run produces the same result as the first, usually by rebuilding an output rather than appending to it.",
      snippet: { lang: "shell", code: "mv counts.tmp counts.csv" },
    },
  ],
  roadmap: [
    {
      id: "expert-shell",
      title: "The shell as a tool",
      tier: "expert",
      requires: ["beginner-publish"],
      teaches: ["working directory", "path", "exit code"],
      bookSlug: "expert",
      chapterId: "e1",
    },
    {
      id: "expert-pipelines",
      title: "Pipes and filters",
      tier: "expert",
      requires: ["expert-shell"],
      teaches: ["pipe", "filter", "redirection"],
      bookSlug: "expert",
      chapterId: "e2",
    },
    {
      id: "expert-python",
      title: "Python values and functions",
      tier: "expert",
      requires: ["intermediate-functions"],
      teaches: ["variable", "default argument", "f-string"],
      bookSlug: "expert",
      chapterId: "e3",
    },
    {
      id: "expert-collections",
      title: "Lists and dictionaries",
      tier: "expert",
      requires: ["expert-python", "intermediate-collections"],
      teaches: ["list", "dictionary", "sorted key"],
      bookSlug: "expert",
      chapterId: "e4",
    },
    {
      id: "expert-parsing",
      title: "Reading input, line by line",
      tier: "expert",
      requires: ["expert-collections"],
      teaches: ["splitlines", "record", "exception"],
      bookSlug: "expert",
      chapterId: "e5",
    },
    {
      id: "expert-automation",
      title: "Automate the whole job",
      tier: "expert",
      requires: ["expert-parsing", "expert-pipelines"],
      teaches: ["shebang", "argument", "idempotent"],
      bookSlug: "expert",
      chapterId: "e6",
    },
  ],
  quests: [
    {
      slug: "exps5m3bq7xv2knw4dt9hr",
      code: "ES5M3B",
      title: "Build a pipeline, stage by stage",
      kind: "bank_soal",
      xp: 10,
      chapterId: "e2",
      payload: { source: "chapter-2", itemCount: 20 },
    },
    {
      slug: "expq8c4mj2vt7xkn6dw3pf",
      code: "E9TXP4",
      title: "Count and rank, without peeking",
      kind: "quiz",
      xp: 15,
      chapterId: "e4",
      payload: { source: "chapter-4", note: "Scan the code printed beside the report example." },
    },
    {
      slug: "expr2k7vq9wt4mnb6dz8xh",
      code: "ER2K7V",
      title: "Ship a script someone else can run",
      kind: "repo",
      targetUrl: "https://github.com/lockin-id/expert-sales-report",
      xp: 10,
      chapterId: "e6",
      payload: { source: "chapter-6", branch: "report" },
    },
  ],
});
