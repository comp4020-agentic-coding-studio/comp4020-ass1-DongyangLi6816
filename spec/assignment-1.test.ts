import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

// Turns the assignment-1 spec (assessments/assignment-1) into tests.
//
// Left to the marker, because no test can hold them: that the idea is one
// people should understand and is carried all the way, that the register has a
// point of view, that the page holds up at both marking viewports under a
// resize mid-interaction and a tab through it, and that the process evidence
// reads as skilled direction rather than retries. `pnpm check:evidence` covers
// the presence of that evidence; only a person can judge its quality.

// The core interaction, named plainly enough to test — the spec asks for
// exactly this. Set SELECTORS once the mechanic is decided:
//
//   CONTROL  what the visitor operates (button, slider, the scroll container)
//   DISPLAY  what changes as a result
//
// Both start empty, so this file is red until the mechanic exists. That is the
// point: red-to-green across the week is the work.
const CONTROL: string = "#timeline";
const DISPLAY: string = "#scene";

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
