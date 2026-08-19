import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

// Turns the assignment-1 spec (assessments/assignment-1) into tests.
//
// The spec's mark for the artefact goes to one that "holds up under use it
// wasn't designed for: the keyboard, a resize mid-interaction". This file used
// to record both as things no test could hold and leave them to the marker.
// That was wrong about half of it: the keyboard is checkable from the built
// HTML, and so is the property a resize depends on --- that nothing on the map
// is placed in pixels. Both are checked below.
//
// Still left to the marker, because no test can hold them: that the idea is
// one people should understand and is carried all the way, that the register
// has a point of view, that the movement reads as movement, and that the
// process evidence shows deliberate direction rather than retries.
// `pnpm check:evidence` covers the presence of that evidence; only a person
// can judge its quality.

// The core interaction, named plainly enough to test --- the spec asks for
// exactly this.
//
//   CONTROL  what the visitor operates
//   DISPLAY  what changes as a result
//
// The visitor picks a stop on the voyage, from the rail or from a marker on
// the map; the ship sails there, the day counter climbs the length of the
// stay, and the panel becomes that stop.
const CONTROL: string = "#timeline";
const DISPLAY: string = "#scene";

// Everything else the visitor operates. The map grew from one control to
// several while this file said nothing about it; naming them here means a
// deleted one turns the suite red.
const CONTROLS = [
  "#timeline",
  "#zoom-in",
  "#zoom-out",
  "#zoom-fit",
  "#scale-toggle",
  // The phone's sheet handle. It carries the whole entry on a phone --- the
  // stop's days are behind it --- so losing it loses the text, not a flourish.
  "#sheet-handle",
  ".marker",
];

// The deployed site lives under the repo path, not the domain root. Any
// root-absolute URL that doesn't start with this 404s live while looking
// perfectly fine on localhost --- the swap trap CLAUDE.md warns about.
const BASE = "/comp4020-ass1-DongyangLi6816/";

const DIST = resolve("dist");

function walk(dir: string = DIST): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const built = existsSync(DIST);
const files = built ? walk() : [];
const pages = files
  .filter((path) => path.endsWith(".html"))
  .map((path) => ({
    name: relative(DIST, path),
    doc: new JSDOM(readFileSync(path, "utf8")).window.document,
  }));

describe("assignment 1: the site is built", () => {
  it("emits a static site into dist/", () => {
    expect(built, "no dist/ --- run `pnpm build` first").toBe(true);
    expect(
      pages.map((p) => p.name),
      "dist/ has no HTML pages",
    ).toContain("index.html");
  });
});

describe("assignment 1: static and client-side throughout", () => {
  it("ships only static assets", () => {
    const dynamic = files
      .map((path) => relative(DIST, path))
      .filter((name) => /\.(php|cgi|py|rb|jsp|aspx?)$/i.test(name));

    expect(dynamic, `not a static build: ${dynamic.join(", ")}`).toHaveLength(
      0,
    );
  });

  it("carries its interaction in shipped client-side script", () => {
    const scripted = pages.some(
      ({ doc }) =>
        doc.querySelector("script[src]") ??
        [...doc.querySelectorAll("script")].some(
          (s) => (s.textContent?.trim().length ?? 0) > 0,
        ),
    );

    expect(
      scripted,
      "no client-side script ships --- the visitor can't change what they see without one.",
    ).toBe(true);
  });
});

describe("assignment 1: the core interaction", () => {
  it("names the interaction plainly enough to test", () => {
    expect(
      CONTROL,
      "Set CONTROL to a selector for what the visitor operates.",
    ).not.toBe("");
    expect(
      DISPLAY,
      "Set DISPLAY to a selector for what changes as a result.",
    ).not.toBe("");
  });

  it("ships the control the visitor operates", () => {
    if (!CONTROL) return;
    const found = pages.some(({ doc }) => doc.querySelector(CONTROL));
    expect(found, `no page contains ${CONTROL}`).toBe(true);
  });

  it("ships the region that changes in response", () => {
    if (!DISPLAY) return;
    const found = pages.some(({ doc }) => doc.querySelector(DISPLAY));
    expect(found, `no page contains ${DISPLAY}`).toBe(true);
  });

  it("lets the keyboard reach the control", () => {
    if (!CONTROL) return;

    // The marker tabs through the page, so a mouse-only control is a gap in
    // the artefact band. Natively focusable elements qualify; anything else
    // has to opt in with tabindex.
    const focusable = /^(a\[href|button|input|select|textarea|details|summary)/i;
    const reachable = pages.some(({ doc }) =>
      [...doc.querySelectorAll(CONTROL)].some(
        (el) =>
          focusable.test(el.tagName) ||
          el.matches("a[href], button, input, select, textarea, summary") ||
          el.hasAttribute("tabindex"),
      ),
    );

    expect(
      reachable,
      `${CONTROL} isn't keyboard-reachable --- use a native control or give it tabindex.`,
    ).toBe(true);
  });
});

describe("assignment 1: holds up on the keyboard", () => {
  // "Holds up under use it wasn't designed for: the keyboard" --- the spec's
  // words for the artefact band. A marker tabs through the page, so a control
  // the tab order never reaches is a control that does not exist for them.
  const focusable = "a[href], button, input, select, textarea, summary, [tabindex]";

  for (const selector of CONTROLS) {
    it(`${selector} is on the tab order`, () => {
      const found = pages.flatMap(({ doc }) => [
        ...doc.querySelectorAll(selector),
      ]);

      expect(found.length, `no page contains ${selector}`).toBeGreaterThan(0);
      for (const el of found) {
        expect(
          el.matches(focusable),
          `${selector} is not reachable by tab --- use a native control or give it tabindex`,
        ).toBe(true);
      }
    });
  }

  it("gives every control an accessible name", () => {
    // A button whose only content is a glyph --- "+", "-" --- is announced as
    // its glyph unless it says otherwise.
    const unnamed: string[] = [];
    for (const { doc } of pages) {
      for (const el of doc.querySelectorAll("button, input[type=range]")) {
        const label =
          el.getAttribute("aria-label") ??
          el.getAttribute("aria-labelledby") ??
          (el.id ? doc.querySelector(`label[for="${el.id}"]`)?.textContent : "") ??
          el.textContent ??
          "";
        if (label.trim().length < 2) unnamed.push(el.outerHTML.slice(0, 60));
      }
    }

    expect(unnamed, `controls with no accessible name: ${unnamed.join(", ")}`)
      .toHaveLength(0);
  });

  // The tests above ask whether a control can be reached by tab. They cannot
  // ask whether it can be *seen*, because they read static HTML and know
  // nothing about the stylesheet --- and that gap is not hypothetical. The
  // prologue hides most of the page, and when it hid the zoom controls and the
  // rail with `opacity: 0` alone, every test here stayed green while three
  // invisible buttons sat in the tab order with the focus ring on them.
  //
  // So the rule is asserted where it can be: anything the prologue hides that
  // can hold a control has to be hidden with `visibility` or `display`, never
  // with opacity on its own.
  const HIDDEN_BEFORE_VOYAGE = [".map-controls", ".rail > *", ".marker"];

  // These run against the built stylesheet, which is minified: quotes are
  // dropped from attribute values and the space around a combinator goes. Both
  // sides are put through the same squeeze so the test is written the way the
  // source is and still matches what ships.
  const squeeze = (text: string) =>
    text
      .replace(/\s+/g, " ")
      .replace(/\s*([>{}])\s*/g, "$1")
      .replace(/"/g, "");

  it("hides controls in a way that takes them off the tab order", () => {
    const css = squeeze(
      files
        .filter((path) => path.endsWith(".css"))
        .map((path) => readFileSync(path, "utf8"))
        .join(""),
    );

    for (const selector of HIDDEN_BEFORE_VOYAGE) {
      const escaped = squeeze(
        `html:not([data-stage="voyage"]) ${selector}`,
      ).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rule = new RegExp(`${escaped}\\{([^}]*)\\}`).exec(css);

      expect(
        rule,
        `nothing hides ${selector} before the voyage --- if that is deliberate, take it off this list`,
      ).not.toBeNull();

      const body = rule![1]!;
      expect(
        /visibility: ?hidden|display: ?none/.test(body),
        `${selector} is hidden with "${body.trim()}" --- opacity alone leaves its controls focusable but invisible`,
      ).toBe(true);
    }
  });

  it("keeps the region that changes announced", () => {
    const live = pages.some(({ doc }) =>
      doc.querySelector(`${DISPLAY}[aria-live]`),
    );

    expect(
      live,
      `${DISPLAY} changes without saying so --- it needs aria-live for a screen reader to hear it`,
    ).toBe(true);
  });
});

describe("assignment 1: holds up across a resize", () => {
  // The other half of the same sentence. A resize mid-interaction cannot be
  // run here, but the property it depends on can: every position on the map is
  // a percentage of its frame. One pixel value among them and that stop leaves
  // its coastline the moment the window changes.
  it("places every marker in percentages, never pixels", () => {
    const pixels: string[] = [];
    for (const { doc } of pages) {
      for (const marker of doc.querySelectorAll(".marker")) {
        const style = marker.getAttribute("style") ?? "";
        if (/-?[\d.]+(px|em|rem|vw|vh|cm|in|pt)\b/.test(style)) {
          pixels.push(style);
        }
        expect(style, "a marker with no position at all").toMatch(/%/);
      }
    }

    expect(
      pixels,
      `markers positioned in absolute units drift on resize: ${pixels.join(", ")}`,
    ).toHaveLength(0);
  });

  it("holds the map's aspect ratio rather than letterboxing it", () => {
    // Markers are placed as a percentage of the frame, so the frame has to
    // keep the coastline's own ratio. Let it letterbox inside a differently
    // shaped parent and every marker drifts off its coast at some window size.
    const css = files
      .filter((path) => path.endsWith(".css"))
      .map((path) => readFileSync(path, "utf8"))
      .join("");

    expect(css, "no stylesheet shipped").not.toHaveLength(0);
    expect(
      css.replace(/\s+/g, ""),
      "the map frame does not pin an aspect-ratio, so markers will drift",
    ).toMatch(/aspect-ratio:\d+\/\d+/);
  });

  it("offers a reduced-motion path", () => {
    const css = files
      .filter((path) => path.endsWith(".css"))
      .map((path) => readFileSync(path, "utf8"))
      .join("");

    expect(
      css,
      "nothing answers prefers-reduced-motion, and this page moves a great deal",
    ).toContain("prefers-reduced-motion");
  });
});

describe("assignment 1: one idea and nothing else", () => {
  // Not a judgement of the idea --- only that the build didn't sprawl into a
  // multi-page site while the brief asked for one thing carried all the way.
  it("stays scoped to a small number of pages", () => {
    expect(
      pages.map((p) => p.name),
      "more pages than one idea needs --- the brief asks for one idea and nothing else.",
    ).not.toHaveLength(0);
    expect(pages.length).toBeLessThanOrEqual(3);
  });

  for (const { name, doc } of pages) {
    it(`${name} carries real prose, not a stub`, () => {
      const text = doc.body?.textContent?.trim() ?? "";
      expect(text.length).toBeGreaterThan(140);
    });
  }
});

describe("assignment 1: survives the Pages sub-path", () => {
  for (const { name, doc } of pages) {
    it(`${name} references no assets from the domain root`, () => {
      const attrs = ["href", "src"];
      const bad: string[] = [];

      for (const el of doc.querySelectorAll("[href], [src]")) {
        for (const attr of attrs) {
          const value = el.getAttribute(attr);
          if (!value) continue;
          // Only root-absolute paths are at risk. Relative, protocol-relative,
          // fragment, and scheme URLs (https:, mailto:, tel:) are all fine.
          if (!value.startsWith("/") || value.startsWith("//")) continue;
          if (value.startsWith(BASE)) continue;
          bad.push(`${attr}="${value}"`);
        }
      }

      expect(
        bad,
        `these resolve locally but 404 under ${BASE} --- set your generator's base path: ${bad.join(", ")}`,
      ).toHaveLength(0);
    });
  }
});
