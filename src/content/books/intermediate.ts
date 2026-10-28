import { defineBook } from "../define";
import type { BookContent, BookDraft } from "../types";

/**
 * Intermediate: "Build things". JavaScript in the browser, from a value to a
 * page that fetches and fails well. Runnable blocks are pure scripts: the
 * playground runs them in a worker, where `console.log` is the output and there
 * is no DOM, so anything touching the page is captioned `Read only`.
 */
export const intermediate: BookContent = defineBook({
  slug: "intermediate",
  title: "LOCK.IN Intermediate: make the page do something",
  tier: "intermediate",
  levelLabel: "Build things",
  promise: "You finish with an interactive page wired to real data.",
  chapters: [
    {
      id: "i1",
      title: "Values and types",
      minutes: 26,
      goal: "Tell what kind of thing a value is before the code runs.",
      sections: [
        {
          id: "i1s1",
          title: "Twelve and \"twelve\" are different things",
          minutes: 9,
          body: [
            {
              kind: "text",
              md: "A **value** is a piece of data and a **type** is what kind it is. `12` is a number you can add to. `\"12\"` is a string of two characters that happen to be digits: and `+` will join it to another string instead of adding it.",
            },
            {
              kind: "code",
              lang: "js",
              runnable: true,
              caption: "Run it and read the output line by line.",
              code: `console.log(12 + 5);
console.log("12" + "5");
console.log("12" + 5);
console.log(typeof 12, typeof "12");`,
            },
            {
              kind: "text",
              md: "The fourth line prints `number string`. `typeof` answers the question the whole chapter is about, and it costs less than a guess.",
            },
            { kind: "keyword", term: "value" },
            { kind: "keyword", term: "typeof" },
          ],
        },
        {
          id: "i1s2",
          title: "What `+` does to a mix",
          minutes: 9,
          body: [
            {
              kind: "text",
              md: "When one side of `+` is a string, JavaScript turns the other side into a string and joins them. Other arithmetic operators go the other way: they try to make a number.",
            },
            {
              kind: "code",
              lang: "js",
              runnable: true,
              caption: "Four lines, four different results.",
              code: `console.log("3" * 4);
console.log("3" + 4);
console.log(3 + 4 + "!");
console.log("Items: " + 3 + 4);
console.log(Number("3") + 4);`,
            },
            {
              kind: "callout",
              tone: "trap",
              title: "The classic string-concatenation bug",
              md: "`\"Items: \" + 3 + 4` prints `Items: 34`, not `Items: 7`, because the join happens left to right. Group the sum in brackets or convert with `Number()` before you join.",
            },
            { kind: "keyword", term: "type coercion" },
          ],
        },
        {
          id: "i1s3",
          title: "Reading an error instead of fearing it",
          minutes: 8,
          body: [
            {
              kind: "text",
              md: "An error message is a sentence with a location. The first line says what went wrong; the lines under it are the **call stack**, the path your program took to get there. Read it top down and stop at the first line that names a file you wrote.",
            },
            {
              kind: "code",
              lang: "js",
              runnable: true,
              caption: "A real error, in the panel, on purpose.",
              code: `function half(value) {
  return value / 2;
}
console.log(half("six"));`,
            },
            {
              kind: "text",
              md: "That one does not throw: dividing a string gives `NaN`, short for not-a-number. `NaN` never equals anything, not even itself, so check it with `Number.isNaN(value)`.",
            },
            { kind: "keyword", term: "stack trace" },
            { kind: "keyword", term: "NaN" },
          ],
        },
      ],
      checkpoint: {
        id: "i1-check",
        title: "Types, checked",
        passRatio: 0.7,
        xp: 25,
        items: [
          {
            id: "i1q1",
            prompt: "What does `typeof \"12\"` print?",
            options: ['`"string"`', '`"number"`', '`"digit"`', "`12`"],
            answerIndex: 0,
            explanation: "The quotes are the giveaway: a sequence of characters is a string, whatever characters it contains.",
            hint: "Look at the quotes in the value, not at the digits.",
            errorSignatures: ['`"number"`', '`"digit"`'],
          },
          {
            id: "i1q2",
            prompt: "What does `\"Items: \" + 3 + 4` evaluate to?",
            options: ["`\"Items: 34\"`", "`\"Items: 7\"`", "`\"Items: \"`", "An error"],
            answerIndex: 0,
            explanation: "The leftmost `+` runs first: the string turns `3` into a character and joins it. Then `4` joins the result.",
            hint: "Which operator runs first, and what does it do when one side is a string?",
            errorSignatures: ["`\"Items: 7\"`", "An error"],
          },
          {
            id: "i1q3",
            prompt: "How do you test whether a value is `NaN`?",
            options: ["`Number.isNaN(value)`", "`value === NaN`", "`typeof value === \"nan\"`", "`value == null`"],
            answerIndex: 0,
            explanation: "`NaN` is the only value not equal to itself, so `===` can never find it; `Number.isNaN` is the check that works.",
            hint: "Which test does not rely on equality at all?",
            errorSignatures: ["`value === NaN`", '`typeof value === "nan"`'],
          },
          {
            id: "i1q4",
            prompt: "The output is `NaN`. What does that tell you?",
            options: [
              "A number was expected and something that is not a number arrived",
              "The program stopped",
              "A variable was never declared",
              "The browser ran out of memory",
            ],
            answerIndex: 0,
            explanation: "`NaN` is arithmetic's way of saying it could not make a number out of its input. The program kept running.",
            hint: "Which of those four would stop the script entirely?",
            errorSignatures: ["The program stopped", "ran out of memory"],
          },
        ],
      },
    },
    {
      id: "i2",
      title: "Control flow and functions",
      minutes: 26,
      goal: "Give a piece of logic one name, one input and one job.",
      sections: [
        {
          id: "i2s1",
          title: "Deciding, in the order you wrote it",
          minutes: 9,
          body: [
            {
              kind: "text",
              md: "`if` runs a block when a condition is **truthy**. Conditions are read top to bottom and the first match wins, so put the narrow case first: `if (score === 100)` before `if (score >= 90)`.",
            },
            {
              kind: "code",
              lang: "js",
              runnable: true,
              caption: "Two scores through the same ladder.",
              code: `function label(score) {
  if (score === 100) return "Perfect";
  if (score >= 90) return "Pass";
  if (score >= 70) return "Nearly";
  return "Try again";
}
console.log(label(100));
console.log(label(90));
console.log(label(70));
console.log(label(10));`,
            },
            {
              kind: "callout",
              tone: "tip",
              title: "`return` ends the function here",
              md: "Once a branch returns, nothing below it runs. That is why the ladder above needs no `else`: each check is only reached if the ones above it were false.",
            },
            { kind: "keyword", term: "branch" },
          ],
        },
        {
          id: "i2s2",
          title: "A function has input, output and one job",
          minutes: 9,
          body: [
            {
              kind: "text",
              md: "A **parameter** is the name inside the parentheses; an **argument** is the value you pass in. A function that returns a value can be tested and reused; a function that only prints can only be watched.",
            },
            {
              kind: "code",
              lang: "js",
              runnable: true,
              caption: "One job, one return value, three calls.",
              code: `function priceWithTax(price, rate = 0.11) {
  return Math.round(price * (1 + rate));
}
console.log(priceWithTax(120000));
console.log(priceWithTax(120000, 0));
console.log([49000, 89000].map(priceWithTax).join(", "));`,
            },
            {
              kind: "callout",
              tone: "fact",
              title: "A default is a parameter that is optional",
              md: "`rate = 0.11` means the caller may leave it out. It keeps the common case short without making the uncommon case impossible.",
            },
            { kind: "keyword", term: "function" },
          ],
        },
        {
          id: "i2s3",
          title: "Scope: what a function can see",
          minutes: 8,
          body: [
            {
              kind: "text",
              md: "`let` and `const` are visible from where they are declared to the end of the block they are declared in. A function sees the names outside it, and those names are read at call time, not at write time.",
            },
            {
              kind: "code",
              lang: "js",
              runnable: true,
              caption: "The same function, two different results.",
              code: `const rate = 0.11;
function withTax(price) {
  return Math.round(price * (1 + rate));
}
console.log(withTax(100000));

const other = 0.05;
function withOtherRate(price, rate) {
  return Math.round(price * (1 + rate));
}
console.log(withOtherRate(100000, other));`,
            },
            {
              kind: "callout",
              tone: "trap",
              title: "Shadowing hides the outer name",
              md: "A parameter called `rate` hides the outer `rate` for the whole function body. It is legal and confusing; name the parameter after what it is.",
            },
            { kind: "keyword", term: "scope" },
          ],
        },
      ],
      checkpoint: {
        id: "i2-check",
        title: "Logic, checked",
        passRatio: 0.7,
        xp: 25,
        items: [
          {
            id: "i2q1",
            prompt: "In `label(90)` above, which branch runs?",
            options: [
              "`score >= 90`, returning \"Pass\"",
              "`score === 100`, returning \"Perfect\"",
              "`score >= 70`, returning \"Nearly\"",
              "None of them",
            ],
            answerIndex: 0,
            explanation: "The first condition is false for 90, so the second is tried and matches.",
            hint: "Work down the ladder for the value 90.",
            errorSignatures: ["returning \"Perfect\"", "returning \"Nearly\""],
          },
          {
            id: "i2q2",
            prompt: "What is the difference between a parameter and an argument?",
            options: [
              "A parameter is the name in the definition; an argument is the value passed in",
              "A parameter is required; an argument is optional",
              "They are two words for the same thing",
              "A parameter is a number; an argument is a string",
            ],
            answerIndex: 0,
            explanation: "The definition names parameters; each call supplies arguments for them.",
            hint: "One belongs to the function's definition, the other to the call.",
            errorSignatures: ["two words for the same thing", "A parameter is a number"],
          },
          {
            id: "i2q3",
            prompt: "Why is a function that returns a value easier to trust than one that prints?",
            options: [
              "Its result can be checked anywhere, including in a test",
              "It runs faster",
              "It cannot throw an error",
              "It uses less memory",
            ],
            answerIndex: 0,
            explanation: "A returned value is data you can assert on; printed output is a side effect you can only read.",
            hint: "Which one can another piece of code use?",
            errorSignatures: ["runs faster", "cannot throw an error"],
          },
          {
            id: "i2q4",
            prompt: "A function takes a parameter named `rate` while a `const rate` exists outside it. What does that mean?",
            options: [
              "The parameter hides the outer name inside the function",
              "An error is thrown for the duplicate name",
              "The outer `rate` is overwritten for the whole program",
              "They are the same variable",
            ],
            answerIndex: 0,
            explanation: "That is shadowing: legal, local, and a common source of \"why is the rate wrong here?\".",
            hint: "Where is each name visible?",
            errorSignatures: ["An error is thrown", "same variable"],
          },
        ],
      },
    },
    {
      id: "i3",
      title: "Arrays and objects",
      minutes: 22,
      goal: "Keep many values in order, and a record in named fields.",
      sections: [
        {
          id: "i3s1",
          title: "An array is a numbered list",
          minutes: 8,
          body: [
            {
              kind: "text",
              md: "An array's items are numbered from `0`. `length` is how many there are, and `array[array.length - 1]` is the last one. Reading past the end gives `undefined`, which is not an error: it is an absence.",
            },
            {
              kind: "code",
              lang: "js",
              runnable: true,
              caption: "Counting and reaching the last item, safely.",
              code: `const levels = ["Beginner", "Intermediate", "Expert"];
console.log(levels.length);
console.log(levels[0]);
console.log(levels.at(-1));
console.log(levels[9]);`,
            },
            { kind: "keyword", term: "array" },
          ],
        },
        {
          id: "i3s2",
          title: "Methods that hand you a new array",
          minutes: 8,
          body: [
            {
              kind: "text",
              md: "`map` changes every item, `filter` keeps some, `reduce` folds them into one value. They return new arrays instead of editing the one you passed, so the original is still there when the next line needs it.",
            },
            {
              kind: "code",
              lang: "js",
              runnable: true,
              caption: "Filter, map, then add up what is left.",
              code: `const prices = [49000, 89000, 129000];
const over50k = prices.filter((price) => price > 50000);
const withTax = over50k.map((price) => Math.round(price * 1.11));
console.log(over50k);
console.log(withTax);
console.log(withTax.reduce((total, price) => total + price, 0));`,
            },
            {
              kind: "callout",
              tone: "tip",
              title: "The callback gets three arguments",
              md: "`(item, index, array)`: leave out what you do not use and name what you do. `(price, index)` reads better than `(a, i)` when the next reader is you in six months.",
            },
            { kind: "keyword", term: "array method" },
          ],
        },
        {
          id: "i3s3",
          title: "An object is a record with names",
          minutes: 6,
          body: [
            {
              kind: "text",
              md: "Where an array is numbered, an object is named: `{ title: \"Beginner\", pages: 20 }`. Read a field with `book.title` or `book[\"title\"]`, and default a missing one with `??`.",
            },
            {
              kind: "code",
              lang: "js",
              runnable: true,
              caption: "A record, a missing field, and a safe default.",
              code: `const book = { title: "Beginner", pages: 20, tier: "beginner" };
console.log(Object.keys(book));
console.log(book.pages);
console.log(book.discount ?? "no discount yet");
console.log({ ...book, pages: 22 });`,
            },
            { kind: "keyword", term: "object" },
            { kind: "questGate", questSlug: "intq3v8n5rx2wkd7mt4bz" },
          ],
        },
      ],
      checkpoint: {
        id: "i3-check",
        title: "Collections, checked",
        passRatio: 0.7,
        xp: 25,
        items: [
          {
            id: "i3q1",
            prompt: "In `[\"a\", \"b\", \"c\"]`, what is `items[2]`?",
            options: ['`"c"`', '`"b"`', "`undefined`", "`3`"],
            answerIndex: 0,
            explanation: "Numbering starts at zero, so index 2 is the third item.",
            hint: "Count from zero, not from one.",
            errorSignatures: ['`"b"`', "`3`"],
          },
          {
            id: "i3q2",
            prompt: "Which method keeps only the items that pass a test?",
            options: ["`filter`", "`map`", "`reduce`", "`find`"],
            answerIndex: 0,
            explanation: "`filter` returns a shorter array of the items whose callback returned true. `find` returns one item, not a list.",
            hint: "Two of these return arrays; only one of them can return fewer items than it was given.",
            errorSignatures: ["`map`", "`find`"],
          },
          {
            id: "i3q3",
            prompt: "What does `book.discount ?? 0` do when `discount` is missing?",
            options: [
              "Gives `0`, because `??` falls back on `null` or `undefined`",
              "Throws, because the field is missing",
              "Gives `NaN`",
              "Gives an empty string",
            ],
            answerIndex: 0,
            explanation: "The nullish operator falls back only when the left side is `null` or `undefined`, so a real `0` survives it.",
            hint: "It is not `||`: which values trigger the fallback here?",
            errorSignatures: ["Throws", "Gives `NaN`"],
          },
          {
            id: "i3q4",
            prompt: "Why is `prices.filter(...)` preferred over deleting items from `prices` in a loop?",
            options: [
              "It leaves the original array intact and returns a new one",
              "It is the only way to loop",
              "It sorts the array as a side effect",
              "It runs in constant time",
            ],
            answerIndex: 0,
            explanation: "Editing a shared array in place makes every later reader of it wrong in a way that is hard to trace.",
            hint: "Who else might still hold a reference to that array?",
            errorSignatures: ["only way to loop", "runs in constant time"],
          },
        ],
      },
    },
    {
      id: "i4",
      title: "The DOM",
      minutes: 26,
      goal: "Find a node in the page and change it from code.",
      sections: [
        {
          id: "i4s1",
          title: "The page is a tree you can query",
          minutes: 9,
          body: [
            {
              kind: "text",
              md: "The browser parses your HTML into a tree of nodes: the **DOM**. `document.querySelector(\".card\")` returns the first match, `querySelectorAll` returns all of them as a list. Both take the same CSS selectors you already write in a stylesheet.",
            },
            {
              kind: "code",
              lang: "js",
              runnable: false,
              caption: "Read only: this page's playground runs scripts in a worker, where there is no document to query.",
              code: `const heading = document.querySelector("h1");
const cards = document.querySelectorAll(".card");

console.log(heading.textContent);
console.log(cards.length);`,
            },
            {
              kind: "callout",
              tone: "fact",
              title: "That is why this block is read only",
              md: "A worker has no page, so `document` is undefined there and the script would throw. Every playground in this product runs your code in a worker on purpose: it means a crash in your snippet can never take the lesson down with it.",
            },
            { kind: "keyword", term: "DOM" },
          ],
        },
        {
          id: "i4s2",
          title: "Changing a node, and keeping the old one",
          minutes: 9,
          body: [
            {
              kind: "text",
              md: "`textContent` replaces the text inside a node and escapes it: a `<` in your data stays a character. `innerHTML` parses what you give it and will happily run a tag: use it only with markup you wrote yourself.",
            },
            {
              kind: "code",
              lang: "js",
              runnable: false,
              caption: "Read only: needs a document, and the second half shows why `innerHTML` is a decision.",
              code: `const price = document.querySelector("[data-price]");
price.textContent = "Rp129.000";

const note = document.querySelector(".note");
note.innerHTML = "<strong>Save 25%</strong> this week";`,
            },
            {
              kind: "callout",
              tone: "trap",
              title: "`innerHTML` with anything a reader typed",
              md: "If the string came from a form or a server, `innerHTML` turns it into markup. `textContent` cannot, which is why it is the default and `innerHTML` is the exception you can explain.",
            },
            { kind: "keyword", term: "textContent" },
          ],
        },
        {
          id: "i4s3",
          title: "Classes, data attributes and one honest update",
          minutes: 8,
          body: [
            {
              kind: "text",
              md: "`classList.add`, `.remove` and `.toggle` change state without you rewriting the attribute string. `data-*` attributes carry the values code needs to find an element by, and `dataset` reads them back as camelCase.",
            },
            {
              kind: "code",
              lang: "js",
              runnable: false,
              caption: "Read only: the classes it toggles live in a stylesheet this panel does not load.",
              code: `const button = document.querySelector("[data-action='unlock']");
const card = document.querySelector("[data-book='beginner']");

card.dataset.state = "unlocked";
card.classList.add("is-unlocked");
button.toggleAttribute("disabled", true);`,
            },
            {
              kind: "text",
              md: "One attribute change and one class change describe the same event. Prefer the class for what it looks like and the data attribute for what it means, so a later style change does not have to read your JavaScript.",
            },
            { kind: "keyword", term: "class list" },
          ],
        },
      ],
      checkpoint: {
        id: "i4-check",
        title: "The DOM, checked",
        passRatio: 0.7,
        xp: 25,
        items: [
          {
            id: "i4q1",
            prompt: "What does `document.querySelector(\".card\")` return?",
            options: [
              "The first element matching `.card`, or `null`",
              "Every element matching `.card`",
              "The CSS rule for `.card`",
              "A new element called `card`",
            ],
            answerIndex: 0,
            explanation: "The singular `querySelector` stops at the first match and gives `null` when nothing matches.",
            hint: "Singular or plural: which one of the two query functions is this?",
            errorSignatures: ["Every element matching", "The CSS rule"],
          },
          {
            id: "i4q2",
            prompt: "Why is `textContent` the safer default?",
            options: [
              "It writes characters, so markup in the data stays text",
              "It runs faster than the alternatives",
              "It is the only one that works on every element",
              "It escapes the page's own stylesheets",
            ],
            answerIndex: 0,
            explanation: "The security and correctness question is whether the string is treated as markup; `textContent` says no.",
            hint: "What happens to a `<` in the data when the node's content is set this way?",
            errorSignatures: ["runs faster", "only one that works"],
          },
          {
            id: "i4q3",
            prompt: "What does `element.dataset.state` read?",
            options: [
              "The `data-state` attribute",
              "The `state` class",
              "The element's id",
              "A JavaScript variable called state",
            ],
            answerIndex: 0,
            explanation: "`dataset` maps `data-*` attributes, converting `data-my-value` to `myValue`.",
            hint: "One HTML attribute namespace becomes one JavaScript object.",
            errorSignatures: ["The `state` class", "A JavaScript variable"],
          },
          {
            id: "i4q4",
            prompt: "Why does this book's playground refuse to run DOM code?",
            options: [
              "It runs scripts in a worker, which has no page to touch",
              "DOM code is too slow for a worker",
              "The DOM is disabled in modern browsers",
              "Workers cannot print output",
            ],
            answerIndex: 0,
            explanation: "The isolation is the feature: your snippet cannot change the lesson page, and a crash in it stays in its own thread.",
            hint: "What does a worker not have?",
            errorSignatures: ["too slow for a worker", "DOM is disabled"],
          },
        ],
      },
    },
    {
      id: "i5",
      title: "Events and state",
      minutes: 26,
      goal: "Keep one value as the truth and redraw from it.",
      sections: [
        {
          id: "i5s1",
          title: "One listener, one job",
          minutes: 9,
          body: [
            {
              kind: "text",
              md: "`addEventListener(type, handler)` says: when this happens, run this function. The handler receives an **event**, and `event.currentTarget` is the element the listener is attached to: more reliable than `event.target`, which may be a child.",
            },
            {
              kind: "code",
              lang: "js",
              runnable: false,
              caption: "Read only: a real click needs a document. The callback logic is what to read.",
              code: `function bump(count) {
  return count + 1;
}

let clicks = 0;
document.querySelector("[data-action='save']").addEventListener("click", () => {
  clicks = bump(clicks);
  document.querySelector("[data-count]").textContent = String(clicks);
});`,
            },
            {
              kind: "callout",
              tone: "tip",
              title: "Keep the maths out of the listener",
              md: "`bump(count)` is pure and testable; the listener is three lines of plumbing. That split is the difference between a page you can debug and one you can only prod.",
            },
            { kind: "keyword", term: "event listener" },
          ],
        },
        {
          id: "i5s2",
          title: "State is the value you redraw from",
          minutes: 9,
          body: [
            {
              kind: "text",
              md: "**State** is the smallest set of values that explains what is on screen. When something happens, change the state, then redraw everything that depends on it. Never change the screen and the state separately: they will drift.",
            },
            {
              kind: "code",
              lang: "js",
              runnable: true,
              caption: "State, a change, and the render that follows it: with no DOM in sight.",
              code: `const state = { count: 0, saved: false };

function render(state) {
  return \`count=\${state.count} saved=\${state.saved}\`;
}

state.count += 1;
console.log(render(state));

state.saved = true;
console.log(render(state));`,
            },
            {
              kind: "callout",
              tone: "fact",
              title: "A render function is a function of state",
              md: "Given the same state it must print the same thing. That is what makes a page explainable: if the screen is wrong, the state is wrong, and you can look at it.",
            },
            { kind: "keyword", term: "state" },
          ],
        },
        {
          id: "i5s3",
          title: "A small to-do, honestly explained",
          minutes: 8,
          body: [
            {
              kind: "text",
              md: "The smallest useful to-do is an array of strings plus two actions: add and remove. Everything else: counts, empty states, disabled buttons: is derived from that array, not stored next to it.",
            },
            {
              kind: "code",
              lang: "js",
              runnable: true,
              caption: "The whole model of the app, running here, with no page involved.",
              code: `let todos = [];

function add(todos, title) {
  return [...todos, { title, done: false }];
}

function remove(todos, index) {
  return todos.filter((_, i) => i !== index);
}

todos = add(todos, "Publish the page");
todos = add(todos, "Print the QR codes");
console.log(todos);
console.log(remove(todos, 0));`,
            },
            { kind: "keyword", term: "derived value" },
            { kind: "questGate", questSlug: "intr6t2wq4nyc8vk3hd5ms" },
          ],
        },
      ],
      checkpoint: {
        id: "i5-check",
        title: "State, checked",
        passRatio: 0.7,
        xp: 25,
        items: [
          {
            id: "i5q1",
            prompt: "Why prefer `event.currentTarget` over `event.target` in a click handler?",
            options: [
              "`currentTarget` is the element the listener is on; `target` may be a child",
              "`target` is only set for keyboard events",
              "`currentTarget` is faster",
              "They are identical in every browser",
            ],
            answerIndex: 0,
            explanation: "With nested markup, the click lands on the deepest element. The listener's own element is what you usually mean.",
            hint: "Which one is guaranteed to be the element you attached the listener to?",
            errorSignatures: ["only set for keyboard", "They are identical"],
          },
          {
            id: "i5q2",
            prompt: "What is the risk of updating the screen and the state separately?",
            options: [
              "They drift, and the screen stops telling the truth",
              "The page reloads",
              "The listener is removed",
              "Memory use doubles",
            ],
            answerIndex: 0,
            explanation: "Two sources of truth is one too many; keeping the state authoritative means there is always something to check against.",
            hint: "If the screen says 3 and the variable says 2, which is wrong?",
            errorSignatures: ["The page reloads", "Memory use doubles"],
          },
          {
            id: "i5q3",
            prompt: "Which value should be derived rather than stored?",
            options: [
              "The number of unfinished items",
              "The list of items",
              "The reader's name",
              "The current filter",
            ],
            answerIndex: 0,
            explanation: "A count is arithmetic on the list; storing it adds a value that can disagree with the list.",
            hint: "Which of these can be worked out from the others with no extra information?",
            errorSignatures: ["The list of items", "The current filter"],
          },
          {
            id: "i5q4",
            prompt: "Why does `add(todos, title)` return a new array?",
            options: [
              "So the caller decides what the new list is, and nothing else changes underneath",
              "Because arrays cannot be modified in JavaScript",
              "Because a returned array sorts itself",
              "Because the old array is freed immediately",
            ],
            answerIndex: 0,
            explanation: "Returning a new array keeps the previous value readable and makes the change explicit at the call site.",
            hint: "Who else might still be reading the old array?",
            errorSignatures: ["cannot be modified", "freed immediately"],
          },
        ],
      },
    },
    {
      id: "i6",
      title: "Fetching and shipping",
      minutes: 22,
      goal: "Read data from somewhere that can fail, and say so on screen.",
      sections: [
        {
          id: "i6s1",
          title: "JSON is text with rules",
          minutes: 8,
          body: [
            {
              kind: "text",
              md: "**JSON** is a text format for data: double-quoted keys, no comments, no trailing commas. `JSON.parse` turns text into values and throws on a syntax error, so it belongs inside `try`.",
            },
            {
              kind: "code",
              lang: "js",
              runnable: true,
              caption: "Parse, read, and fail on purpose.",
              code: `const text = '{"slug":"beginner","pages":20}';
const book = JSON.parse(text);
console.log(book.slug, book.pages);

try {
  JSON.parse("{slug: 'beginner'}");
} catch (error) {
  console.log("Bad JSON:", error.message.slice(0, 40));
}`,
            },
            { kind: "keyword", term: "JSON" },
          ],
        },
        {
          id: "i6s2",
          title: "async, await, and the three states",
          minutes: 8,
          body: [
            {
              kind: "text",
              md: "A request takes time, so it returns a **promise**: a value that will arrive later. `await` pauses your function until it does. Every request therefore has three states on screen: loading, loaded, failed: and a page that only draws two of them lies for as long as the third lasts.",
            },
            {
              kind: "code",
              lang: "js",
              runnable: true,
              caption: "The three states as data, without a network call.",
              code: `function loadBook() {
  return Promise.resolve({ slug: "beginner", pages: 20 });
}

async function show() {
  console.log("loading");
  try {
    const book = await loadBook();
    console.log("loaded", book.slug);
  } catch (error) {
    console.log("failed", error.message);
  }
}

show();`,
            },
            {
              kind: "callout",
              tone: "tip",
              title: "Write the failure branch first",
              md: "It is the branch nobody tests by hand, so write it while you are still thinking about the request. The loading state is a sentence or a skeleton, never a spinner alone.",
            },
            { kind: "keyword", term: "promise" },
          ],
        },
        {
          id: "i6s3",
          title: "Errors, retries and what to log",
          minutes: 6,
          body: [
            {
              kind: "text",
              md: "`fetch` only rejects when the request never completed. A `404` or a `500` arrives as a normal response with `response.ok === false`, so check it before you parse the body: and never parse an error page as if it were your data.",
            },
            {
              kind: "code",
              lang: "js",
              runnable: false,
              caption: "Read only: this page's runner has no network, so the shape is the lesson.",
              code: `async function getJson(url) {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) {
    throw new Error(\`\${response.status} from \${url}\`);
  }
  return response.json();
}`,
            },
            {
              kind: "text",
              md: "Log the status and the URL, not the whole response: you want the line that lets you reproduce it. Retry an idempotent `GET` twice with a pause; never retry a payment or a form post without an idempotency key on the server.",
            },
            { kind: "keyword", term: "HTTP status" },
            { kind: "questGate", questSlug: "ints9d4vz7pk2wq6nt8jc" },
          ],
        },
      ],
      checkpoint: {
        id: "i6-check",
        title: "Data, checked",
        passRatio: 0.7,
        xp: 25,
        items: [
          {
            id: "i6q1",
            prompt: "Which of these is valid JSON?",
            options: [
              '`{"slug": "beginner"}`',
              "`{slug: 'beginner'}`",
              "`{'slug': \"beginner\"}`",
              "`{slug = \"beginner\"}`",
            ],
            answerIndex: 0,
            explanation: "JSON keys and strings use double quotes, and every key is quoted. The others are JavaScript object literals, not JSON.",
            hint: "Which one would survive being copied into a plain text file and nothing else?",
            errorSignatures: ["`{slug: 'beginner'}`", "`{slug = \"beginner\"}`"],
          },
          {
            id: "i6q2",
            prompt: "When does `fetch` reject its promise?",
            options: [
              "When the request never completed at all",
              "Whenever the status is 404 or 500",
              "When the body is not JSON",
              "When the request takes over a second",
            ],
            answerIndex: 0,
            explanation: "An HTTP error is still a completed exchange, so it resolves normally: that is why `response.ok` exists.",
            hint: "Which of these still means the server answered you?",
            errorSignatures: ["Whenever the status is 404", "When the body is not JSON"],
          },
          {
            id: "i6q3",
            prompt: "Which three states does a page need for a request?",
            options: [
              "Loading, loaded, failed",
              "Loading and loaded",
              "Loaded and empty",
              "Idle and busy",
            ],
            answerIndex: 0,
            explanation: "The failed state is the one that gets skipped and the one readers meet on a bad connection.",
            hint: "What does a reader see when the request never arrives?",
            errorSignatures: ["Loading and loaded", "Idle and busy"],
          },
          {
            id: "i6q4",
            prompt: "What is worth logging when a request fails?",
            options: [
              "The status and the URL",
              "The reader's whole session",
              "The response body, always",
              "Nothing; the screen already says it failed",
            ],
            answerIndex: 0,
            explanation: "Status plus URL is the minimum that lets you reproduce it without storing anything you should not.",
            hint: "What would you need to make the same request yourself?",
            errorSignatures: ["The reader's whole session", "Nothing; the screen"],
          },
        ],
      },
    },
  ],
  cheatsheets: [
    {
      term: "value",
      meaning: "A piece of data: a number, a string, a boolean, `null`, `undefined`, an object or a function.",
      snippet: { lang: "js", code: "const pages = 20;\nconst title = \"Beginner\";" },
    },
    {
      term: "typeof",
      meaning: "The operator that answers what kind of value you are holding: `typeof 12` is `\"number\"`.",
      snippet: { lang: "js", code: 'console.log(typeof "12");' },
    },
    {
      term: "type coercion",
      meaning: "JavaScript converting one type to another inside an operator. `+` prefers strings; the arithmetic operators prefer numbers.",
      snippet: { lang: "js", code: 'console.log("3" + 4);\nconsole.log("3" * 4);' },
    },
    {
      term: "NaN",
      meaning: "Not-a-number: the result of arithmetic that could not produce a number. Test it with `Number.isNaN`, never with `===`.",
      snippet: { lang: "js", code: 'console.log(Number.isNaN("six" / 2));' },
    },
    {
      term: "stack trace",
      meaning: "The list of calls that led to an error, newest first. Read the first line that names code you wrote.",
    },
    {
      term: "branch",
      meaning: "One path through an `if` ladder. The first truthy condition wins, so put the narrow case first.",
    },
    {
      term: "function",
      meaning: "A named piece of logic with parameters in and a value out. One job each, so it can be reused and tested.",
      snippet: { lang: "js", code: "function half(value) {\n  return value / 2;\n}" },
    },
    {
      term: "scope",
      meaning: "Where a name is visible: from its declaration to the end of its block. Inner names shadow outer ones.",
    },
    {
      term: "array",
      meaning: "A numbered list of values from index `0`. `at(-1)` reaches the last item.",
      snippet: { lang: "js", code: 'const levels = ["Beginner", "Intermediate"];\nconsole.log(levels.at(-1));' },
    },
    {
      term: "array method",
      meaning: "`map`, `filter` and `reduce` build a new value from an array instead of editing it.",
      snippet: { lang: "js", code: "const big = [1, 9, 4].filter((n) => n > 3);" },
    },
    {
      term: "object",
      meaning: "A record whose fields have names: read with `book.pages`, default with `??`, copy with `{ ...book }`.",
      snippet: { lang: "js", code: 'const book = { title: "Beginner", pages: 20 };' },
    },
    {
      term: "DOM",
      meaning: "The tree of nodes the browser built from your HTML; `querySelector` walks it with CSS selectors.",
      snippet: { lang: "js", code: 'const heading = document.querySelector("h1");' },
    },
    {
      term: "textContent",
      meaning: "The text inside a node, written and read as characters. `innerHTML` parses markup instead, so it is the exception.",
      snippet: { lang: "js", code: 'price.textContent = "Rp129.000";' },
    },
    {
      term: "class list",
      meaning: "`classList.add`, `.remove`, `.toggle`: change one class without rewriting the whole attribute string.",
      snippet: { lang: "js", code: 'card.classList.add("is-unlocked");' },
    },
    {
      term: "event listener",
      meaning: "`addEventListener(type, handler)`: run this function when this happens. `currentTarget` is the element you attached it to.",
      snippet: { lang: "js", code: 'button.addEventListener("click", () => console.log("clicked"));' },
    },
    {
      term: "state",
      meaning: "The values that explain what is on screen. Change the state, then redraw from it.",
      snippet: { lang: "js", code: "const state = { count: 0 };\nstate.count += 1;" },
    },
    {
      term: "derived value",
      meaning: "A value you work out from the state instead of storing: a count, a total, an empty-state flag.",
    },
    {
      term: "JSON",
      meaning: "A text format for data: quoted keys, no comments, no trailing commas. `JSON.parse` throws on anything else.",
      snippet: { lang: "js", code: 'JSON.parse(\'{"pages":20}\');' },
    },
    {
      term: "promise",
      meaning: "A value that will arrive later. `await` waits for it; `try`/`catch` handles the case where it never arrives.",
      snippet: { lang: "js", code: "const book = await getJson(\"/api/books/beginner\");" },
    },
    {
      term: "HTTP status",
      meaning: "The number the server answers with: `2xx` worked, `4xx` your request was wrong, `5xx` the server was. `response.ok` is the quick check.",
    },
  ],
  roadmap: [
    {
      id: "intermediate-values",
      title: "Values and types",
      tier: "intermediate",
      requires: ["beginner-page-as-file"],
      teaches: ["value", "type coercion", "stack trace"],
      bookSlug: "intermediate",
      chapterId: "i1",
    },
    {
      id: "intermediate-functions",
      title: "Control flow and functions",
      tier: "intermediate",
      requires: ["intermediate-values"],
      teaches: ["branch", "function", "scope"],
      bookSlug: "intermediate",
      chapterId: "i2",
    },
    {
      id: "intermediate-collections",
      title: "Arrays and objects",
      tier: "intermediate",
      requires: ["intermediate-functions"],
      teaches: ["array", "array method", "object"],
      bookSlug: "intermediate",
      chapterId: "i3",
    },
    {
      id: "intermediate-dom",
      title: "The DOM",
      tier: "intermediate",
      requires: ["beginner-structure", "intermediate-collections"],
      teaches: ["DOM", "textContent", "class list"],
      bookSlug: "intermediate",
      chapterId: "i4",
    },
    {
      id: "intermediate-state",
      title: "Events and state",
      tier: "intermediate",
      requires: ["intermediate-dom"],
      teaches: ["event listener", "state", "derived value"],
      bookSlug: "intermediate",
      chapterId: "i5",
    },
    {
      id: "intermediate-data",
      title: "Fetching and shipping",
      tier: "intermediate",
      requires: ["intermediate-state", "beginner-publish"],
      teaches: ["JSON", "promise", "HTTP status"],
      bookSlug: "intermediate",
      chapterId: "i6",
    },
  ],
  quests: [
    {
      slug: "intq3v8n5rx2wkd7mt4bz",
      code: "I4MZ8P",
      title: "Read a record without guessing",
      kind: "quiz",
      xp: 15,
      chapterId: "i3",
      payload: { source: "chapter-3", note: "Scan the code printed beside the record example." },
    },
    {
      slug: "intr6t2wq4nyc8vk3hd5ms",
      code: "IR6T2W",
      title: "Ship a small stateful page",
      kind: "repo",
      targetUrl: "https://github.com/lockin-id/intermediate-todo",
      xp: 10,
      chapterId: "i5",
      payload: { source: "chapter-5", branch: "todo" },
    },
    {
      slug: "ints9d4vz7pk2wq6nt8jc",
      code: "IS9D4V",
      title: "Requests and their failures",
      kind: "bank_soal",
      xp: 10,
      chapterId: "i6",
      payload: { source: "chapter-6", itemCount: 20 },
    },
  ],
});
