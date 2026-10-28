import { defineBook } from "../define";
import type { BookContent, BookDraft } from "../types";

/**
 * Beginner: "Start here". HTML and CSS, from a text file to a page online.
 * Six chapters, three sections each, 20 print pages. Page numbers are derived:
 * 3 front-matter pages + 1 cheatsheet page + the chapters at ten minutes a page.
 */
export const beginner: BookContent = defineBook({
  slug: "beginner",
  title: "LOCK.IN Beginner: your first page on the web",
  tier: "beginner",
  levelLabel: "Start here",
  promise: "You finish with a page your phone renders.",
  chapters: [
    {
      id: "b1",
      title: "A page is a text file",
      minutes: 26,
      goal: "Read, edit and reload a document the browser turns into a page.",
      sections: [
        {
          id: "b1s1",
          title: "What the browser actually reads",
          minutes: 9,
          body: [
            {
              kind: "text",
              md: "A web page is one text file. The browser reads it from top to bottom and turns every **tag** it finds into a box on screen. There is no compiler and no build step between you and the result: the bytes you write are the bytes the browser reads.",
            },
            {
              kind: "text",
              md: "The panel on this page runs what you type, on your own machine, in a sandboxed frame. Run the two tags below, then change `h1` to `h2` and run it again. The heading gets smaller because you changed the tag, not because anything was hidden from you.",
            },
            {
              kind: "code",
              lang: "html",
              runnable: true,
              caption: "Two tags, two boxes.",
              code: `<h1>LOCK.IN</h1>
<p>Two tags, two boxes.</p>`,
            },
            {
              kind: "callout",
              tone: "tip",
              title: "Run it before you believe it",
              md: "Every claim in this book is one Run away from proof. When something surprises you, the answer is almost always in the output, not in the prose.",
            },
            { kind: "keyword", term: "markup" },
          ],
        },
        {
          id: "b1s2",
          title: "Your first whole document",
          minutes: 9,
          body: [
            {
              kind: "text",
              md: "Two tags are enough to see something, but a document has a shape:",
            },
            {
              kind: "text",
              md: "- `<!doctype html>` tells the browser to use today's rules, not a museum copy of the 1990s.\n- `<html lang=\"en\">` wraps everything and names the language, which is what a screen reader reads first.\n- `<head>` holds facts **about** the page: the title in the tab, the character set.\n- `<body>` holds what a reader sees.",
            },
            {
              kind: "code",
              lang: "html",
              runnable: true,
              caption: "A complete document, nothing missing.",
              code: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>My first page</title>
  </head>
  <body>
    <h1>My first page</h1>
    <p>Written by hand, in a browser tab.</p>
  </body>
</html>`,
            },
            {
              kind: "callout",
              tone: "fact",
              title: "The title is not on the page",
              md: "`<title>` never shows up in the body. It shows in the browser tab, in a bookmark, and as the blue line in a search result. A page with no title is a page nobody can find again.",
            },
            {
              kind: "text",
              md: "The `viewport` line is the one that matters on a phone: it tells the browser to lay the page out at the device's real width instead of at a desktop width scaled down, which is why a page without it looks like a poster held at arm's length.",
            },
            { kind: "keyword", term: "element" },
            { kind: "keyword", term: "viewport" },
          ],
        },
        {
          id: "b1s3",
          title: "Save, reload, repeat",
          minutes: 8,
          body: [
            {
              kind: "text",
              md: "On your own machine a project is a folder. The page you are proud of must be called `index.html`, because that is the file a server hands over when someone asks for the folder itself. Everything else is a name you chose.",
            },
            {
              kind: "code",
              lang: "shell",
              runnable: false,
              caption: "Read only: the folder you are aiming at by chapter six.",
              code: `my-site/
  index.html      the page
  style.css       the look, one file
  img/
    photo.jpg     a picture, not a link to one`,
            },
            {
              kind: "text",
              md: "Keep the loop short: edit the file, reload the tab, look. Ten small edits teach more than one big one, because you always know which change caused what you see. When a change does nothing at all, check that you saved the file and that the tab is not showing a cached copy.",
            },
            {
              kind: "callout",
              tone: "trap",
              title: "`.html` is not decoration",
              md: "A file called `index.html.txt` is a text file the browser shows as plain text. The extension is how the browser, the host and your editor agree on what the file is.",
            },
          ],
        },
      ],
      checkpoint: {
        id: "b1-check",
        title: "Check yourself before chapter two",
        passRatio: 0.7,
        xp: 25,
        items: [
          {
            id: "b1q1",
            prompt: "What does the browser do with the tag `<h1>LOCK.IN</h1>`?",
            options: [
              "Turns it into the page's main heading box",
              "Prints the word h1 above the text",
              "Downloads a font called h1",
              "Ignores it until CSS names it",
            ],
            answerIndex: 0,
            explanation: "A tag is an instruction to make a box of a certain kind; `h1` means the page's most important heading, and the browser styles it larger by default.",
            hint: "Think about what you saw when you ran it: did the word `h1` appear anywhere on the page?",
            errorSignatures: ["Prints the word h1", "Downloads a font"],
          },
          {
            id: "b1q2",
            prompt: "Which part of a document holds what the reader sees?",
            options: ["The `<body>`", "The `<head>`", "The `<!doctype>`", "The `<title>`"],
            answerIndex: 0,
            explanation: "`<head>` holds facts about the page (title, charset); `<body>` holds the visible content.",
            hint: "One of these four never paints anything on screen.",
            errorSignatures: ["The `<head>`"],
          },
          {
            id: "b1q3",
            prompt: "Why does the file have to be named `index.html`?",
            options: [
              "It is the file a server returns for the folder itself",
              "HTML files must always start with the word index",
              "Browsers refuse other names",
              "It is the only name that can hold a `<title>`",
            ],
            answerIndex: 0,
            explanation: "When a request names a folder rather than a file, the server looks for its index document. Other names work fine when you link to them directly.",
            hint: "What does someone type to reach the folder at all?",
            errorSignatures: ["Browsers refuse other names", "must always start with"],
          },
          {
            id: "b1q4",
            prompt: "You changed the file and the page looks identical. What is the most likely cause?",
            options: [
              "The file was not saved, or the tab showed a cached copy",
              "The browser silently reversed your edit",
              "The tag you used was deprecated",
              "HTML requires a restart of the browser",
            ],
            answerIndex: 0,
            explanation: "The edit-reload loop is a file loop: unsaved buffers and cached responses are the two everyday reasons a change appears to do nothing.",
            hint: "Which step between your keyboard and your eyes could have dropped the change?",
            errorSignatures: ["reversed your edit", "restart of the browser"],
          },
        ],
      },
    },
    {
      id: "b2",
      title: "Structure that means something",
      minutes: 26,
      goal: "Mark up text so a reader and a screen reader get the same outline.",
      sections: [
        {
          id: "b2s1",
          title: "Headings are an outline, not a size",
          minutes: 9,
          body: [
            {
              kind: "text",
              md: "`<h1>` to `<h6>` are six levels of one outline. A page has one `<h1>`, and every lower level sits under the level above it. Choose the level by meaning; size is a style question and CSS answers it later.",
            },
            {
              kind: "code",
              lang: "html",
              runnable: true,
              caption: "One heading, then the two under it.",
              code: `<h1>LOCK.IN Beginner</h1>
<h2>Chapter 2</h2>
<p>Structure that means something.</p>
<h2>Chapter 3</h2>
<p>Styling without guessing.</p>`,
            },
            {
              kind: "callout",
              tone: "trap",
              title: "Skipping levels to look smaller",
              md: "If `<h2>` is too big, that is CSS's problem. Writing `<h4>` to get a smaller heading breaks the outline screen readers navigate by, and you will not notice in your own browser.",
            },
            { kind: "keyword", term: "heading outline" },
            {
              kind: "figure",
              figure: "blob",
              caption: "The outline of this chapter: one heading, two levels under it.",
            },
          ],
        },
        {
          id: "b2s2",
          title: "Lists, links and the difference between them",
          minutes: 9,
          body: [
            {
              kind: "text",
              md: "`<ul>` and `<ol>` hold `<li>` items: unordered for a set, ordered for a sequence where the order carries meaning. `<a href=\"…\">` goes somewhere. If it does not go anywhere, it is not a link, and it should not be one.",
            },
            {
              kind: "code",
              lang: "html",
              runnable: true,
              caption: "A list you can actually reach with the keyboard.",
              code: `<h2>This week</h2>
<ol>
  <li>Write the page</li>
  <li>Style the page</li>
  <li>Publish the page</li>
</ol>
<p>Read the <a href="https://developer.mozilla.org/">reference</a> when a tag surprises you.</p>`,
            },
            {
              kind: "callout",
              tone: "tip",
              title: "Tab through your own page",
              md: "Press `Tab` repeatedly. Every link should be reachable, in the order you would read them, with a visible ring around the one you are on. If the ring is invisible, chapter five fixes that.",
            },
            { kind: "keyword", term: "anchor" },
          ],
        },
        {
          id: "b2s3",
          title: "Images that load, and text that explains them",
          minutes: 8,
          body: [
            {
              kind: "text",
              md: "`<img>` has two required attributes: `src`, the path to the file, and `alt`, the text that stands in for the picture when it cannot be seen: a broken load, a slow connection, a screen reader. A decorative image is not silent: it is `alt=\"\"`, which says \"nothing to report\".",
            },
            {
              kind: "code",
              lang: "html",
              runnable: false,
              caption: "Read only: the paths point at files on your machine, not at this page.",
              code: `<img src="img/photo.jpg" alt="A desk with the printed book on it" width="640" height="427">
<img src="img/rule.png" alt="">`,
            },
            {
              kind: "text",
              md: "Give `width` and `height` in the file's own pixels. The browser then reserves that box before the bytes arrive, and the text below does not jump when the image appears.",
            },
            { kind: "keyword", term: "alt text" },
            { kind: "questGate", questSlug: "begs2j9tz6nbk3wy8le4fa" },
          ],
        },
      ],
      checkpoint: {
        id: "b2-check",
        title: "Structure, checked",
        passRatio: 0.7,
        xp: 25,
        items: [
          {
            id: "b2q1",
            prompt: "A page's second-level heading looks too large. What is the right fix?",
            options: [
              "Change its size in CSS and keep the level",
              "Use `<h4>` instead so it renders smaller",
              "Use a `<p>` with bold text",
              "Add a second `<h1>` above it",
            ],
            answerIndex: 0,
            explanation: "Levels carry meaning and CSS carries size. Swapping the tag to change the look breaks the outline that screen readers and search engines rely on.",
            hint: "Which of the four options still tells the truth about the heading's importance?",
            errorSignatures: ["Use `<h4>` instead", "with bold text"],
          },
          {
            id: "b2q2",
            prompt: "When is `<ul>` the right element?",
            options: [
              "When the items are a set whose order does not matter",
              "When the items are steps that must be followed in order",
              "When you want bullet marks but not numbers",
              "When there are fewer than four items",
            ],
            answerIndex: 0,
            explanation: "`<ul>` means an unordered set, `<ol>` means a sequence. The bullet is a consequence of the meaning, not the reason to choose it.",
            hint: "Would swapping two items change the meaning of the list?",
            errorSignatures: ["fewer than four items", "want bullet marks"],
          },
          {
            id: "b2q3",
            prompt: "What does `alt=\"\"` on an image mean?",
            options: [
              "The image is decorative, so there is nothing to report",
              "The image failed to load",
              "The alt text is missing and should be added later",
              "The image should be hidden from sighted readers",
            ],
            answerIndex: 0,
            explanation: "An empty alt is a deliberate statement: this picture adds no information, so a screen reader skips it.",
            hint: "It is a value you write on purpose: what would you be saying?",
            errorSignatures: ["failed to load", "added later"],
          },
          {
            id: "b2q4",
            prompt: "Why give an `<img>` its `width` and `height`?",
            options: [
              "So the browser reserves the space before the image loads",
              "So the image file is compressed",
              "So the image becomes responsive",
              "So the alt text is read aloud",
            ],
            answerIndex: 0,
            explanation: "Reserved space stops the layout shifting under the reader's finger as images arrive; the file size is untouched.",
            hint: "Think about what happens to the paragraphs below while the image is still downloading.",
            errorSignatures: ["file is compressed", "becomes responsive"],
          },
        ],
      },
    },
    {
      id: "b3",
      title: "Styling without guessing",
      minutes: 22,
      goal: "Change colour, type and spacing from a rule you can read back.",
      sections: [
        {
          id: "b3s1",
          title: "A rule is a selector and its declarations",
          minutes: 8,
          body: [
            {
              kind: "text",
              md: "A CSS rule picks elements with a **selector**, then sets properties in a block of declarations. `p { color: green; }` reads as: every paragraph, set the colour to green.",
            },
            {
              kind: "code",
              lang: "html",
              runnable: true,
              caption: "The same markup, one rule, three declarations.",
              code: `<style>
  p {
    color: #294A31;
    font-size: 18px;
    margin-bottom: 12px;
  }
</style>
<p>Styled by a rule.</p>
<p>And so is this one.</p>`,
            },
            {
              kind: "callout",
              tone: "fact",
              title: "The cascade is a tie-break, not a mystery",
              md: "When two rules both match, the more specific selector wins; if they are equally specific, the later one wins. Keep selectors shallow and you will rarely need to think about it.",
            },
            { kind: "keyword", term: "selector" },
          ],
        },
        {
          id: "b3s2",
          title: "Colour, type and the box model",
          minutes: 7,
          body: [
            {
              kind: "text",
              md: "Every element is a box with four layers, from the inside out: **content**, **padding**, **border**, **margin**. Padding is inside the border and takes the element's background; margin is outside and never does.",
            },
            {
              kind: "code",
              lang: "html",
              runnable: true,
              caption: "A card built from one box's own layers.",
              code: `<style>
  .card {
    padding: 16px;
    border: 2px solid #294A31;
    margin: 24px 0;
    background: #F1F1EB;
  }
</style>
<div class="card">
  <h2>Padding is inside</h2>
  <p>Border on the edge, margin outside it.</p>
</div>`,
            },
            {
              kind: "callout",
              tone: "trap",
              title: "Padding and margin are not interchangeable",
              md: "If a click target feels small, it needs padding. If a box sits too close to its neighbour, it needs margin. Swapping them makes the background grow when you meant to move the box.",
            },
            { kind: "keyword", term: "box model" },
          ],
        },
        {
          id: "b3s3",
          title: "Spacing that comes from a scale",
          minutes: 7,
          body: [
            {
              kind: "text",
              md: "Pick six spacing values and use only those: 4, 8, 12, 16, 24, 40 pixels. A page with six gaps looks composed; a page with thirty-three looks almost right everywhere and deliberate nowhere.",
            },
            {
              kind: "code",
              lang: "html",
              runnable: true,
              caption: "A gap variable used twice, so the rhythm cannot drift.",
              code: `<style>
  :root { --gap: 16px; }
  .stack > * + * { margin-top: var(--gap); }
  .box { padding: var(--gap); background: #F1F1EB; }
</style>
<div class="stack">
  <p class="box">One</p>
  <p class="box">Two</p>
  <p class="box">Three</p>
</div>`,
            },
            {
              kind: "text",
              md: "A variable lets you change the rhythm in one line, and it names the intent instead of repeating a number. Change `--gap` to `40px` and run it: the whole stack breathes at once.",
            },
            { kind: "questGate", questSlug: "begq7f2x9m4kdt3nzr8pw" },
          ],
        },
      ],
      checkpoint: {
        id: "b3-check",
        title: "Styling, checked",
        passRatio: 0.7,
        xp: 25,
        items: [
          {
            id: "b3q1",
            prompt: "In `p { color: green; }`, which part is the selector?",
            options: ["`p`", "`color`", "`green`", "The braces"],
            answerIndex: 0,
            explanation: "The selector chooses which elements the declarations apply to; `color: green` is the declaration inside the block.",
            hint: "Which piece would you change to make the rule apply to headings instead of paragraphs?",
            errorSignatures: ["`color`", "The braces"],
          },
          {
            id: "b3q2",
            prompt: "A button's background should extend further around its label. Which property?",
            options: ["`padding`", "`margin`", "`border`", "`line-height`"],
            answerIndex: 0,
            explanation: "Padding is inside the border and shares the element's background, so the coloured area grows with it. Margin pushes other boxes away instead.",
            hint: "Which layer is inside the border?",
            errorSignatures: ["`margin`", "`border`"],
          },
          {
            id: "b3q3",
            prompt: "Two rules match the same paragraph and set `color`. Which wins?",
            options: [
              "The more specific one; if tied, the later one",
              "The first one in the file",
              "The one with more declarations",
              "Whichever the browser loads faster",
            ],
            answerIndex: 0,
            explanation: "Specificity settles it; a tie is settled by source order. Neither the size of a rule nor load order decides it.",
            hint: "The rule is called the cascade: it needs a tie-break, in a fixed order.",
            errorSignatures: ["first one in the file", "more declarations"],
          },
          {
            id: "b3q4",
            prompt: "Why keep spacing to a short scale of values?",
            options: [
              "Consistent gaps read as composed, and one edit changes the rhythm",
              "Browsers render fewer values faster",
              "CSS only accepts six spacing values",
              "It reduces the file size of the page",
            ],
            answerIndex: 0,
            explanation: "Constraint is what makes rhythm visible, and shared values mean a change is one edit rather than a hunt through the file.",
            hint: "Think about what a reader notices, not what the browser does.",
            errorSignatures: ["render fewer values faster", "only accepts six"],
          },
        ],
      },
    },
    {
      id: "b4",
      title: "Layout that holds",
      minutes: 26,
      goal: "Place boxes side by side and stack them again on a narrow screen.",
      sections: [
        {
          id: "b4s1",
          title: "Flex is one row of boxes",
          minutes: 9,
          body: [
            {
              kind: "text",
              md: "`display: flex` lays a container's children out in a row. `gap` spaces them, `align-items` positions them across the row, and `flex: 1` lets a child take the leftover width.",
            },
            {
              kind: "code",
              lang: "html",
              runnable: true,
              caption: "Three boxes, equal, with one gap value.",
              code: `<style>
  .row { display: flex; gap: 12px; }
  .row > * { flex: 1; padding: 16px; background: #F1F1EB; }
</style>
<div class="row">
  <p>Beginner</p>
  <p>Intermediate</p>
  <p>Expert</p>
</div>`,
            },
            {
              kind: "callout",
              tone: "tip",
              title: "Say the axis out loud",
              md: "`justify-content` works along the row; `align-items` works across it. When a flex layout confuses you, name the direction first and the property usually picks itself.",
            },
            { kind: "keyword", term: "flex layout" },
          ],
        },
        {
          id: "b4s2",
          title: "Columns, and letting a row wrap",
          minutes: 9,
          body: [
            {
              kind: "text",
              md: "`flex-direction: column` makes a stack. `flex-wrap: wrap` lets a row break onto a second line when the boxes no longer fit: that one line is most of what makes a layout survive a phone.",
            },
            {
              kind: "code",
              lang: "html",
              runnable: true,
              caption: "The same boxes, wrapping when the page is narrow.",
              code: `<style>
  .wrap { display: flex; flex-wrap: wrap; gap: 12px; }
  .wrap > * { flex: 1 1 180px; padding: 16px; background: #F1F1EB; }
</style>
<div class="wrap">
  <p>One</p><p>Two</p><p>Three</p><p>Four</p>
</div>`,
            },
            {
              kind: "text",
              md: "`flex: 1 1 180px` reads as: grow, shrink, but treat 180 pixels as the natural width. Four boxes fit on a wide window; on a narrow one they become two rows of two without a single media query.",
            },
            { kind: "keyword", term: "wrap" },
          ],
        },
        {
          id: "b4s3",
          title: "A card that survives a phone",
          minutes: 8,
          body: [
            {
              kind: "text",
              md: "A media query changes rules at a width you choose. `min-width: 48rem` means \"a wide window and up\". Write the narrow layout first, then add the wide one: the small screen is where a page most often breaks.",
            },
            {
              kind: "code",
              lang: "html",
              runnable: true,
              caption: "One column on a phone, two columns past 48rem.",
              code: `<style>
  .grid { display: grid; gap: 12px; }
  .grid > * { padding: 16px; background: #F1F1EB; }
  @media (min-width: 48rem) {
    .grid { grid-template-columns: 1fr 1fr; }
  }
</style>
<div class="grid">
  <p>Wide body</p>
  <p>Narrow margin</p>
</div>`,
            },
            {
              kind: "callout",
              tone: "fact",
              title: "Rem is not pixels",
              md: "`48rem` is forty-eight times the reader's base font size. A reader who has set their browser type to 20px gets a wider breakpoint than one at 16px: which is what they asked for.",
            },
            { kind: "keyword", term: "media query" },
          ],
        },
      ],
      checkpoint: {
        id: "b4-check",
        title: "Layout, checked",
        passRatio: 0.7,
        xp: 25,
        items: [
          {
            id: "b4q1",
            prompt: "In a flex row, which property positions children across the row?",
            options: ["`align-items`", "`justify-content`", "`gap`", "`flex-wrap`"],
            answerIndex: 0,
            explanation: "`justify-content` distributes along the main axis (the row); `align-items` positions across it. `gap` only sizes the space between children.",
            hint: "One of them moves things along the row, the other across it.",
            errorSignatures: ["`justify-content`", "`gap`"],
          },
          {
            id: "b4q2",
            prompt: "What does `flex: 1 1 180px` say about a box?",
            options: [
              "Grow and shrink, with 180px as the natural width",
              "Always exactly 180px wide",
              "Take at least 180px and never shrink",
              "Grow to 180px and stop",
            ],
            answerIndex: 0,
            explanation: "The three values are grow, shrink and basis. A basis sets where the box starts, not where it ends.",
            hint: "There are three numbers in there, in a fixed order.",
            errorSignatures: ["exactly 180px", "never shrink"],
          },
          {
            id: "b4q3",
            prompt: "What does `flex-wrap: wrap` do?",
            options: [
              "Lets a row break onto another line instead of overflowing",
              "Reverses the order of the children",
              "Centres the children in the row",
              "Wraps each child in a border",
            ],
            answerIndex: 0,
            explanation: "Without wrapping, a row that runs out of space shrinks its children or overflows the page.",
            hint: "What happens to four boxes in a row on a phone width?",
            errorSignatures: ["Reverses the order", "Centres the children"],
          },
          {
            id: "b4q4",
            prompt: "Why write the narrow layout first?",
            options: [
              "The phone is where a layout most often breaks, so you see it while building",
              "Browsers load narrow styles first",
              "Media queries only apply above 48rem",
              "It halves the CSS",
            ],
            answerIndex: 0,
            explanation: "Starting narrow means the hardest case is under your eyes the whole time; the wide layout is then an addition rather than a repair.",
            hint: "Which screen will you actually open most often?",
            errorSignatures: ["load narrow styles first", "halves the CSS"],
          },
        ],
      },
    },
    {
      id: "b5",
      title: "Forms people can use",
      minutes: 26,
      goal: "Build a labelled input that a keyboard, a phone and a screen reader can all drive.",
      sections: [
        {
          id: "b5s1",
          title: "Every input gets a label",
          minutes: 9,
          body: [
            {
              kind: "text",
              md: "A `<label for=\"email\">` and `<input id=\"email\">` are one unit: tapping the words focuses the field, and a screen reader announces the words. Placeholder text is not a label: it disappears the moment someone types.",
            },
            {
              kind: "code",
              lang: "html",
              runnable: true,
              caption: "A labelled field and its hint, connected by id.",
              code: `<label for="email">Email</label>
<input id="email" type="email" name="email" autocomplete="email" aria-describedby="email-hint">
<p id="email-hint">We send one receipt. No newsletter.</p>`,
            },
            {
              kind: "callout",
              tone: "trap",
              title: "A placeholder standing in for a label",
              md: "The hint vanishes on the first keystroke, so a reader who looks away and back has to remember what the field was for. Label above, hint below, always.",
            },
            { kind: "keyword", term: "label" },
          ],
        },
        {
          id: "b5s2",
          title: "Buttons, and the ring you can see",
          minutes: 9,
          body: [
            {
              kind: "text",
              md: "A `<button>` submits or acts; a link navigates. `type=\"submit\"` inside a form sends it. Keep the focus ring: remove it and a keyboard reader loses the one thing telling them where they are.",
            },
            {
              kind: "code",
              lang: "html",
              runnable: true,
              caption: "A visible focus ring, and a button that is really a button.",
              code: `<style>
  button {
    padding: 10px 16px;
    border: 2px solid #294A31;
    background: #1FEC97;
    color: #294A31;
    border-radius: 999px;
  }
  :focus-visible { outline: 3px solid #294A31; outline-offset: 2px; }
</style>
<button type="button">Save my progress</button>`,
            },
            {
              kind: "text",
              md: "Press `Tab` in the frame above. The ring is the browser's own, thickened; `:focus-visible` shows it for keyboard readers and stays out of the way for a mouse click.",
            },
            { kind: "keyword", term: "focus ring" },
          ],
        },
        {
          id: "b5s3",
          title: "Checking input without shouting",
          minutes: 8,
          body: [
            {
              kind: "text",
              md: "Say what you want before someone fails at it (`type=\"email\"`, `required`, a hint), and say what went wrong next to the field, not in a banner at the top of the page. An error is a sentence about the fix, not a verdict about the person.",
            },
            {
              kind: "code",
              lang: "html",
              runnable: true,
              caption: "The browser's own checks, with a sentence for the reader.",
              code: `<form>
  <label for="qty">How many copies?</label>
  <input id="qty" name="qty" type="number" min="1" max="10" value="1" required>
  <p id="qty-hint">Between 1 and 10 per order.</p>
  <button type="submit">Add to cart</button>
</form>`,
            },
            {
              kind: "callout",
              tone: "tip",
              title: "Constraints are a courtesy",
              md: "`min`, `max` and `required` stop mistakes before a request leaves the device. Server-side checks still exist, but the reader does not have to discover them the hard way.",
            },
            { kind: "keyword", term: "validation" },
          ],
        },
      ],
      checkpoint: {
        id: "b5-check",
        title: "Forms, checked",
        passRatio: 0.7,
        xp: 25,
        items: [
          {
            id: "b5q1",
            prompt: "How are a label and its input connected?",
            options: [
              "The label's `for` matches the input's `id`",
              "They sit next to each other in the same `<p>`",
              "The placeholder repeats the label text",
              "The input is wrapped in `<label>` only when it is required",
            ],
            answerIndex: 0,
            explanation: "`for` to `id` is the connection that lets a tap focus the field and a screen reader announce the words.",
            hint: "Two attributes have to agree on one string.",
            errorSignatures: ["sit next to each other", "placeholder repeats"],
          },
          {
            id: "b5q2",
            prompt: "Why is placeholder text a poor label?",
            options: [
              "It disappears as soon as the reader starts typing",
              "It is not read by screen readers at all",
              "It cannot be styled",
              "It is ignored on phones",
            ],
            answerIndex: 0,
            explanation: "A hint that vanishes mid-task forces the reader to remember; the label above the field stays.",
            hint: "Think about the moment right after the first keystroke.",
            errorSignatures: ["cannot be styled", "ignored on phones"],
          },
          {
            id: "b5q3",
            prompt: "What is `:focus-visible` for?",
            options: [
              "Showing the focus ring for keyboard readers without decorating every mouse click",
              "Removing the focus ring for mouse users",
              "Animating the focused element",
              "Making an element focusable",
            ],
            answerIndex: 0,
            explanation: "It lets you style focus when the browser judges it was caused by the keyboard, so the ring survives where it is needed.",
            hint: "It is a variant of `:focus` with a judgement built in.",
            errorSignatures: ["Removing the focus ring", "Making an element focusable"],
          },
          {
            id: "b5q4",
            prompt: "Where does an error message belong?",
            options: [
              "Next to the field, describing the fix",
              "In a banner at the top of the page",
              "In an alert that covers the form",
              "In the page title so it is always visible",
            ],
            answerIndex: 0,
            explanation: "Proximity is what makes an error actionable, and it is what `aria-describedby` points at for a screen reader.",
            hint: "Where are the reader's eyes when the submission fails?",
            errorSignatures: ["banner at the top", "covers the form"],
          },
          {
            id: "b5q5",
            prompt: "Why are `min` and `max` on a number input a courtesy rather than a guarantee?",
            options: [
              "They are checked in the browser, so the server must check again",
              "They only apply to touch keyboards",
              "They stop working after the form is submitted once",
              "They are ignored when the field has a label",
            ],
            answerIndex: 0,
            explanation: "Anything a browser enforces can be skipped by a request built by hand; the constraint spares the honest reader, it does not secure the endpoint.",
            hint: "Who else could send this form besides this page?",
            errorSignatures: ["only apply to touch", "ignored when the field has a label"],
          },
        ],
      },
    },
    {
      id: "b6",
      title: "Put it online",
      minutes: 22,
      goal: "Publish the folder and hand the link to someone else.",
      sections: [
        {
          id: "b6s1",
          title: "One folder, three files",
          minutes: 8,
          body: [
            {
              kind: "text",
              md: "A static site is a folder with an `index.html` at its top, a stylesheet beside it, and the images under `img/`. No database, no server code: the host copies the folder to a machine that answers requests.",
            },
            {
              kind: "code",
              lang: "shell",
              runnable: true,
              caption: "The whole release, listed in the memory filesystem of this page.",
              code: `mkdir -p site/img
echo "<h1>LOCked in</h1>" > site/index.html
echo "<!-- fill me in -->" > site/style.css
ls -R site`,
            },
            {
              kind: "callout",
              tone: "fact",
              title: "Relative paths are the whole trick",
              md: "`img/photo.jpg` means \"next to the file I am in\". A leading `/` means \"from the site root\". Choose one and be consistent, or the pictures work on your machine and break on the host.",
            },
            { kind: "keyword", term: "static site" },
          ],
        },
        {
          id: "b6s2",
          title: "What a host does with your folder",
          minutes: 7,
          body: [
            {
              kind: "text",
              md: "When a reader asks for your address, the host finds `index.html` and sends it. Then the browser reads the file, finds `style.css` in it, and asks for that too. Two requests for one page, and the second one is why the page can look unfinished for a moment.",
            },
            {
              kind: "code",
              lang: "shell",
              runnable: false,
              caption: "Read only: the two requests behind one page load.",
              code: `GET /            -> 200 index.html
GET /style.css   -> 200 style.css
GET /img/missing -> 404 Not Found`,
            },
            {
              kind: "callout",
              tone: "trap",
              title: "It works locally is not a promise",
              md: "Your laptop ignores letter case differences that a Linux host does not: `Photo.JPG` and `photo.jpg` are one file to Windows and two to the host. Match the case you typed in `src` exactly.",
            },
            { kind: "keyword", term: "404" },
          ],
        },
        {
          id: "b6s3",
          title: "The five-minute checklist before you share",
          minutes: 7,
          body: [
            {
              kind: "text",
              md: "Open the published address on a real phone, not a resized window. Tab through it. Zoom to 200% and read a paragraph. Check the title in the tab. Send the link to one person and watch where they hesitate.",
            },
            {
              kind: "text",
              md: "- Does every page have its own `<title>`?\n- Do the pictures load on the host, with matching letter case?\n- Can you reach every link with `Tab`, and see where you are?\n- Does the layout hold at 320px wide?\n- Is there a line of text saying what the page is for, in one sentence?",
            },
            {
              kind: "callout",
              tone: "tip",
              title: "Send the link, then be quiet",
              md: "Where someone hesitates is data. Fix that spot before you add anything new.",
            },
            { kind: "questGate", questSlug: "begr4m8xp2vq6hs5ct1jd" },
          ],
        },
      ],
      checkpoint: {
        id: "b6-check",
        title: "Publishing, checked",
        passRatio: 0.7,
        xp: 25,
        items: [
          {
            id: "b6q1",
            prompt: "What makes a folder publishable as a static site?",
            options: [
              "An `index.html` at its top, with whatever it references beside it",
              "A `package.json`",
              "A database connection",
              "A server that runs JavaScript",
            ],
            answerIndex: 0,
            explanation: "A static host serves files: it needs the entry document and everything that document asks for.",
            hint: "What does the host look for when the request names only the folder?",
            errorSignatures: ["database connection", "server that runs JavaScript"],
          },
          {
            id: "b6q2",
            prompt: "A page links `img/Photo.JPG` but the file on the host is `img/photo.jpg`. What happens?",
            options: [
              "The image 404s on a case-sensitive host",
              "The browser corrects the case",
              "The host renames the file",
              "The image loads but slowly",
            ],
            answerIndex: 0,
            explanation: "Linux filesystems are case-sensitive, and most hosts are Linux. Windows hid the mismatch from you locally.",
            hint: "Which of these two names would a Linux machine consider the same file?",
            errorSignatures: ["corrects the case", "loads but slowly"],
          },
          {
            id: "b6q3",
            prompt: "Why open the published page on a real phone?",
            options: [
              "Touch, zoom and the real viewport are where a layout breaks",
              "Phones use a different HTML",
              "The host serves different files to phones",
              "A resized window cannot run CSS",
            ],
            answerIndex: 0,
            explanation: "A resized desktop window is still a desktop browser: no touch targets, no pinch zoom, no address bar eating the height.",
            hint: "What does a phone have that a narrow desktop window does not?",
            errorSignatures: ["different HTML", "serves different files"],
          },
          {
            id: "b6q4",
            prompt: "Which of these belongs on the pre-share checklist?",
            options: [
              "Every page has its own title and every link is reachable by Tab",
              "Every image is a PNG",
              "Every colour is declared inline",
              "Every paragraph is under twenty words",
            ],
            answerIndex: 0,
            explanation: "Titles and keyboard reachability are the two failures a reader notices immediately and you cannot see in a screenshot.",
            hint: "Two of these are style preferences; one is a reader getting stuck.",
            errorSignatures: ["image is a PNG", "colour is declared inline"],
          },
        ],
      },
    },
  ],
  cheatsheets: [
    {
      term: "markup",
      meaning: "Text with tags in it: the browser turns the tags into boxes and shows the rest.",
      snippet: { lang: "html", code: "<h1>LOCK.IN</h1>" },
    },
    {
      term: "viewport",
      meaning: "The visible area of the page. `<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">` tells a phone to use its real width instead of a scaled desktop one.",
      snippet: { lang: "html", code: '<meta name="viewport" content="width=device-width, initial-scale=1">' },
    },
    {
      term: "element",
      meaning: "One tag pair and everything between: `<p>text</p>` is one element, and elements nest inside each other.",
      snippet: { lang: "html", code: "<body>\n  <h1>My first page</h1>\n</body>" },
    },
    {
      term: "heading outline",
      meaning: "The six heading levels read as a table of contents. One `h1`, and no level skipped on the way down.",
      snippet: { lang: "html", code: "<h1>Book</h1>\n<h2>Chapter</h2>" },
    },
    {
      term: "anchor",
      meaning: "The `<a href>` element, which navigates. If it does not go anywhere, it is a button, not an anchor.",
      snippet: { lang: "html", code: '<a href="/books">Books</a>' },
    },
    {
      term: "alt text",
      meaning: "The text that stands in for an image: what the picture says, or `alt=\"\"` when it says nothing.",
      snippet: { lang: "html", code: '<img src="desk.jpg" alt="A desk with the printed book on it">' },
    },
    {
      term: "selector",
      meaning: "The part of a CSS rule that chooses elements: `p`, `.card`, `#title`.",
      snippet: { lang: "html", code: "<style>p { color: #294A31; }</style>" },
    },
    {
      term: "box model",
      meaning: "Content, then padding (inside the border, takes the background), then border, then margin (outside, never takes it).",
    },
    {
      term: "flex layout",
      meaning: "`display: flex` lays children out in a row or column; `gap` spaces them and `flex: 1` shares the leftover width.",
      snippet: { lang: "html", code: "<style>.row { display: flex; gap: 12px; }</style>\n<div class=\"row\"><p>a</p><p>b</p></div>" },
    },
    {
      term: "wrap",
      meaning: "`flex-wrap: wrap` lets a row break onto the next line instead of overflowing the page.",
    },
    {
      term: "media query",
      meaning: "A rule that only applies at a width you choose, written in `rem` so it follows the reader's own font size.",
      snippet: { lang: "html", code: "<style>@media (min-width: 48rem) { .grid { grid-template-columns: 1fr 1fr; } }</style>" },
    },
    {
      term: "label",
      meaning: "`<label for>` pointing at an `<input id>`: one unit for tapping, focusing and announcing.",
      snippet: { lang: "html", code: '<label for="email">Email</label>\n<input id="email" type="email">' },
    },
    {
      term: "focus ring",
      meaning: "The outline showing which element the keyboard is on. `:focus-visible` styles it for keyboard readers only.",
      snippet: { lang: "html", code: "<style>:focus-visible { outline: 3px solid #294A31; }</style>" },
    },
    {
      term: "validation",
      meaning: "The browser's own checks (`required`, `min`, `max`, `type`) that stop a mistake before it leaves the device: never a substitute for checking again on the server.",
    },
    {
      term: "static site",
      meaning: "A folder of files a host serves as they are: no database and no server code.",
    },
    {
      term: "404",
      meaning: "The status a host returns when the requested file is not there: usually a path whose case or folder is wrong.",
    },
  ],
  roadmap: [
    {
      id: "beginner-page-as-file",
      title: "A page is a text file",
      tier: "beginner",
      requires: [],
      teaches: ["markup", "element", "the edit-reload loop"],
      bookSlug: "beginner",
      chapterId: "b1",
    },
    {
      id: "beginner-structure",
      title: "Structure that means something",
      tier: "beginner",
      requires: ["beginner-page-as-file"],
      teaches: ["heading outline", "anchor", "alt text"],
      bookSlug: "beginner",
      chapterId: "b2",
    },
    {
      id: "beginner-style",
      title: "Styling without guessing",
      tier: "beginner",
      requires: ["beginner-structure"],
      teaches: ["selector", "box model", "a spacing scale"],
      bookSlug: "beginner",
      chapterId: "b3",
    },
    {
      id: "beginner-layout",
      title: "Layout that holds",
      tier: "beginner",
      requires: ["beginner-style"],
      teaches: ["flex layout", "wrap", "media query"],
      bookSlug: "beginner",
      chapterId: "b4",
    },
    {
      id: "beginner-forms",
      title: "Forms people can use",
      tier: "beginner",
      requires: ["beginner-layout"],
      teaches: ["label", "focus ring", "validation"],
      bookSlug: "beginner",
      chapterId: "b5",
    },
    {
      id: "beginner-publish",
      title: "Put it online",
      tier: "beginner",
      requires: ["beginner-style", "beginner-forms"],
      teaches: ["static site", "404", "the pre-share checklist"],
      bookSlug: "beginner",
      chapterId: "b6",
    },
  ],
  quests: [
    {
      slug: "begq7f2x9m4kdt3nzr8pw",
      code: "B7QK2N",
      title: "The box model, from memory",
      kind: "quiz",
      xp: 15,
      chapterId: "b3",
      payload: { source: "chapter-3", note: "Scan the code printed beside the card in chapter three." },
    },
    {
      slug: "begr4m8xp2vq6hs5ct1jd",
      code: "BR4M8X",
      title: "Publish your first page",
      kind: "repo",
      targetUrl: "https://github.com/lockin-id/beginners-first-page",
      xp: 10,
      chapterId: "b6",
      payload: { source: "chapter-6", branch: "first-page" },
    },
    {
      slug: "begs2j9tz6nbk3wy8le4fa",
      code: "BS2J9T",
      title: "Twenty markup questions",
      kind: "bank_soal",
      xp: 10,
      chapterId: "b2",
      payload: { source: "chapter-2", itemCount: 20 },
    },
  ],
});
