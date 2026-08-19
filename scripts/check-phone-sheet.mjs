#!/usr/bin/env node
/**
 * The phone sheet, checked the way a visitor uses it.
 *
 * Not part of `pnpm check`: it drives a real browser through `agent-browser`,
 * and CI has none. Run it by hand against the dev server or the deployed URL.
 *
 *   node scripts/check-phone-sheet.mjs
 *   node scripts/check-phone-sheet.mjs --url https://…/comp4020-ass1-DongyangLi6816/
 *   node scripts/check-phone-sheet.mjs --viewport 375x667
 *
 * The contract it holds, which no test in spec/ can:
 *
 *   1. No stop's entry is ever silently cut off. Either the whole entry ---
 *      including the line of days, which is the page's whole argument --- is
 *      readable with the sheet shut, or the page says so at the edge and the
 *      sheet is how you read the rest. Stated this way it holds at any screen
 *      height: on a tall phone the entries fit, on a short one they do not and
 *      the sheet is the answer. What it rules out is the fault it was written
 *      for, where the rail sat on top of the panel, every entry stopped
 *      mid-sentence, and nothing on the page admitted it.
 *   2. An entry that is cut off really is readable once the sheet is open.
 *   3. The sheet answers a real drag, a real press and the keyboard.
 *   4. Nothing underneath an open sheet is left on the tab order.
 *
 * Every gesture below is a pointer or a key at a coordinate. `element.click()`
 * would run the listener without performing the gesture, which is how a green
 * check ends up being about a code path nobody takes.
 */

import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const at = args.indexOf(`--${name}`);
  return at === -1 ? fallback : args[at + 1];
};

const URL_ = flag("url", "http://localhost:4321/comp4020-ass1-DongyangLi6816/");
const [WIDTH, HEIGHT] = flag("viewport", "390x844").split("x").map(Number);
const STOPS = 14;

const ab = (...argv) => {
  try {
    return execFileSync("agent-browser", argv, { encoding: "utf8" });
  } catch (error) {
    console.error(`agent-browser ${argv.join(" ")} failed`);
    throw error;
  }
};

/** Run an expression in the page and parse what it returns. */
const evaluate = (expression) => {
  const out = ab("eval", `(()=>JSON.stringify(${expression}))()`);
  const quoted = out.match(/"(?:[^"\\]|\\.)*"/s);
  if (!quoted) throw new Error(`no value back from the page: ${out}`);
  return JSON.parse(JSON.parse(quoted[0]));
};

const failures = [];
const check = (ok, what) => {
  console.log(`${ok ? "  ok  " : "  FAIL"}  ${what}`);
  if (!ok) failures.push(what);
};

console.log(`${URL_}\nviewport ${WIDTH}x${HEIGHT}\n`);

ab("set", "viewport", String(WIDTH), String(HEIGHT));
ab("open", URL_);
ab("wait", "1200");
// Past the prologue the way a visitor in a hurry goes past it.
ab("click", "#skip");
ab("wait", "1800");

// Below 40rem of height there is no sheet at all: the shell would squeeze it
// to nothing, so the page goes back to scrolling and the panel is simply the
// next thing down it. Different layout, same promise --- nothing covered ---
// and the mechanics below do not apply.
const sheetLayout = evaluate(`(() => getComputedStyle(
  document.querySelector("#scene"),
).position === "absolute")()`);

if (!sheetLayout) {
  console.log("\nno sheet at this height --- the page scrolls instead:");
  check(
    evaluate(`(() => document.documentElement.scrollHeight > innerHeight)()`),
    "the page scrolls, so what is below the fold is reachable",
  );
  check(
    evaluate(`(() => !document.querySelector("#sheet-handle")
      .checkVisibility({ visibilityProperty: true }))()`),
    "no handle is offered, because there is no sheet to open",
  );
  check(
    evaluate(`(() => {
      const panel = document.querySelector("#scene").getBoundingClientRect();
      const rail = document.querySelector(".rail").getBoundingClientRect();
      return rail.top >= panel.bottom - 1;
    })()`),
    "the rail sits below the panel rather than on top of it",
  );
  console.log(
    failures.length ? `\n${failures.length} failed.` : "\nall good at this viewport.",
  );
  process.exit(failures.length ? 1 : 0);
}

console.log("every stop, sheet shut:");
ab("focus", "#timeline");
let worst = { cut: 0, index: 0, name: "" };
for (let i = 0; i < STOPS; i++) {
  const seen = evaluate(`(() => {
    const scroll = document.querySelector("#sheet-scroll");
    const days = document.querySelector("#scene-days");
    const d = days.getBoundingClientRect();
    const s = scroll.getBoundingClientRect();
    return {
      name: document.querySelector("#scene-title").textContent,
      shut: document.documentElement.dataset.sheet === "shut",
      cut: scroll.scrollHeight - scroll.clientHeight,
      saysMore: scroll.classList.contains("has-more"),
      handle: document
        .querySelector("#sheet-handle")
        .checkVisibility({ visibilityProperty: true }),
      days: days.textContent.trim() === ""
        ? "none"
        : (d.bottom <= s.bottom + 1 && d.top >= s.top - 1),
    };
  })()`);

  if (seen.cut > worst.cut) worst = { cut: seen.cut, index: i, name: seen.name };

  // Two stops state no duration at all, so their days line is empty and its
  // box says nothing. For those the question is whether anything at all is
  // below the fold --- otherwise an entry whose prose is cut in half reports
  // itself whole on the strength of a line it does not have.
  const whole = seen.days === "none" ? seen.cut <= 4 : seen.days;
  check(
    seen.shut && (whole || seen.saysMore),
    whole
      ? `${seen.name}: the whole entry reads without opening the sheet`
      : `${seen.name}: ${seen.cut}px below the fold, and the page says so`,
  );

  // The handle is offered exactly where it has work. Absent over an entry
  // that is cut off strands the rest of it; present over one that already
  // fits is a control that answers a press by doing nothing.
  check(
    seen.handle === !whole,
    `${seen.name}: the handle is ${seen.handle ? "offered" : "absent"}, and ` +
      `the entry ${whole ? "fits" : "does not"}`,
  );

  if (i < STOPS - 1) {
    // The keyboard is one of the ways into the rail, and the one a script can
    // perform honestly.
    ab("press", "ArrowRight");
    ab("wait", "700");
  }
}

if (worst.cut > 4) {
  console.log(`\nthe worst-cut entry (${worst.name}), opened:`);
  ab("focus", "#timeline");
  ab("press", "Home");
  ab("wait", "700");
  for (let i = 0; i < worst.index; i++) {
    ab("press", "ArrowRight");
    ab("wait", "500");
  }
  ab("focus", "#sheet-handle");
  ab("press", "Enter");
  ab("wait", "700");
  const opened = evaluate(`(() => {
    const scroll = document.querySelector("#sheet-scroll");
    const days = document.querySelector("#scene-days");
    const d = days.getBoundingClientRect();
    const s = scroll.getBoundingClientRect();
    return {
      name: document.querySelector("#scene-title").textContent,
      reachable: d.bottom <= s.bottom + 1 || scroll.scrollHeight > scroll.clientHeight,
      whole: d.bottom <= s.bottom + 1,
    };
  })()`);
  check(
    opened.reachable,
    `${opened.name}: the days line is ${
      opened.whole ? "on screen" : "reachable by scrolling"
    } once the sheet is open`,
  );
  ab("press", "Escape");
  ab("wait", "500");
}

// The mechanics need a sheet that has somewhere to go. At a tall viewport
// every entry fits and no handle is offered on any stop --- which is the point
// --- so the prologue stands in: its opening is the longest text on the site
// and overflows at every phone size.
const handleInVoyage = evaluate(`(() => document
  .querySelector("#sheet-handle")
  .checkVisibility({ visibilityProperty: true }))()`);

if (!handleInVoyage) {
  console.log("\n(no entry overflows here, so the handle is only in the prologue)");
  ab("open", URL_);
  ab("wait", "1400");
  check(
    evaluate(`(() => document
      .querySelector("#sheet-handle")
      .checkVisibility({ visibilityProperty: true }))()`),
    "the prologue's opening is long enough to offer the handle",
  );
}

console.log("\nthe sheet itself:");
const handle = evaluate(`(() => {
  const r = document.querySelector("#sheet-handle").getBoundingClientRect();
  return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
})()`);

// A real drag: press on the handle, move up in steps, release.
ab("mouse", "move", String(handle.x), String(handle.y));
ab("mouse", "down");
for (let y = handle.y - 30; y > handle.y - 200; y -= 35) {
  ab("mouse", "move", String(handle.x), String(y));
}
ab("mouse", "up");
ab("wait", "700");

const dragged = evaluate(`(() => {
  const panel = document.querySelector("#scene");
  const scroll = document.querySelector("#sheet-scroll");
  const handle = document.querySelector("#sheet-handle");
  const border = panel.offsetHeight - panel.clientHeight;
  const shell = document.querySelector("main").getBoundingClientRect().height;
  const rail = document.querySelector(".rail").getBoundingClientRect().height;
  return {
    open: document.documentElement.dataset.sheet === "open",
    expanded: handle.getAttribute("aria-expanded"),
    inline: panel.style.height,
    height: panel.getBoundingClientRect().height,
    settled: Math.min(
      handle.offsetHeight + scroll.scrollHeight + border,
      shell - rail,
    ),
  };
})()`);
check(dragged.open, "a drag up on the handle opens the sheet");
check(dragged.expanded === "true", "the handle reports itself expanded");
// Open is as tall as the entry, which is a measured number, so an inline
// height is expected here --- and it has to be the settled one, not whatever
// pixel the finger let go on.
check(
  dragged.inline !== "" && Math.abs(dragged.height - dragged.settled) < 2,
  "the drag settles on the height the entry actually needs",
);

const covered = evaluate(`(() => {
  const selector = "a[href], button, input, select, textarea, summary, [tabindex]";
  const under = [".marker", "#zoom-in", "#zoom-out", "#zoom-fit", "#skip"];
  const reachable = [...document.querySelectorAll(selector)].filter((el) =>
    el.checkVisibility({ visibilityProperty: true }),
  );
  return under.filter((s) =>
    reachable.some((el) => el.matches(s)),
  );
})()`);
check(
  covered.length === 0,
  `nothing under the open sheet is still on the tab order${
    covered.length ? `: ${covered.join(", ")}` : ""
  }`,
);

ab("focus", "#sheet-handle");
ab("press", "Escape");
ab("wait", "600");
check(
  evaluate(`(() => document.documentElement.dataset.sheet === "shut")()`),
  "Escape shuts it again",
);

ab("press", "Enter");
ab("wait", "600");
check(
  evaluate(`(() => document.documentElement.dataset.sheet === "open")()`),
  "Enter on the handle opens it",
);

// The map is what the rail answers, so a sheet standing open has to get out of
// the way the moment the voyage is scrubbed. Only askable where there is a
// voyage: the prologue hides the rail until one arrives.
if (handleInVoyage) {
  ab("focus", "#timeline");
  ab("press", "ArrowLeft");
  ab("wait", "800");
  check(
    evaluate(`(() => document.documentElement.dataset.sheet === "shut")()`),
    "scrubbing the rail shuts the sheet",
  );
} else {
  // No rail to scrub in the prologue, and nothing on the map is reachable
  // while the sheet stands over it --- which is the point of hiding them. So
  // shut it first, the way a visitor would, and check the way out still works.
  ab("focus", "#sheet-handle");
  ab("press", "Escape");
  ab("wait", "600");
  ab("click", "#skip");
  ab("wait", "1800");
  check(
    evaluate(`(() => document.documentElement.dataset.sheet === "shut" &&
      !document.querySelector("#sheet-handle")
        .checkVisibility({ visibilityProperty: true }))()`),
    "the voyage arrives shut, and offers no handle because the entries fit",
  );
  console.log(
    "  --    scrubbing-shuts-the-sheet is not askable here: the handle only\n" +
      "        appears in the prologue at this height, and the prologue has no rail",
  );
}

console.log(
  failures.length
    ? `\n${failures.length} failed.`
    : "\nall good at this viewport.",
);
process.exit(failures.length ? 1 : 0);
