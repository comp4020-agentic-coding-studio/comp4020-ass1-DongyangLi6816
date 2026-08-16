/**
 * The coastline is roughened at build time rather than filtered in the browser,
 * because WebKit silently drops a filter whose region is too large and took
 * every big landmass with it. These hold the replacement to the shape of what
 * it replaced.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { ROUGHNESS, roughen } from "../src/data/coastline.ts";

const RAW = readFileSync(
  resolve("src/components/coastline.svg"),
  "utf8",
);

const points = (svg: string) =>
  [...svg.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map((m) => ({
    x: Number(m[1]),
    y: Number(m[2]),
  }));

describe("the roughened coastline", () => {
  const before = points(RAW);
  const after = points(roughen(RAW));

  it("keeps every point", () => {
    expect(before.length).toBeGreaterThan(1000);
    expect(after).toHaveLength(before.length);
  });

  it("moves no point further than the stated roughness", () => {
    // Half a pixel of rounding on top of the amplitude, since the output is
    // written to one decimal place.
    const limit = ROUGHNESS * Math.SQRT2 + 0.1;
    const worst = Math.max(
      ...before.map((p, i) => Math.hypot(after[i]!.x - p.x, after[i]!.y - p.y)),
    );

    expect(worst).toBeLessThanOrEqual(limit);
  });

  it("actually moves the coast", () => {
    const moved = before.filter(
      (p, i) => Math.hypot(after[i]!.x - p.x, after[i]!.y - p.y) > 0.2,
    );

    expect(moved.length / before.length).toBeGreaterThan(0.8);
  });

  it("wanders rather than serrates", () => {
    // The whole point of noise smooth in space: neighbouring vertices have to
    // move together. Per-point randomness would give a coast that looks
    // sawn rather than cut, so the displacement of adjacent points is required
    // to agree far more often than chance.
    const deltas = before.map((p, i) => ({
      dx: after[i]!.x - p.x,
      dy: after[i]!.y - p.y,
    }));
    let agree = 0;
    for (let i = 1; i < deltas.length; i++) {
      const a = deltas[i - 1]!;
      const b = deltas[i]!;
      if (Math.hypot(a.dx - b.dx, a.dy - b.dy) < ROUGHNESS * 0.5) agree++;
    }

    expect(agree / (deltas.length - 1)).toBeGreaterThan(0.9);
  });

  it("is deterministic, so a build is reproducible", () => {
    expect(roughen(RAW)).toBe(roughen(RAW));
  });

  it("ships no filter for the browser to drop", () => {
    const built = readFileSync(resolve("dist/index.html"), "utf8");
    expect(built).toContain("coastline");
    expect(
      built,
      "the coastline is filtered again --- WebKit drops large filter regions",
    ).not.toMatch(/class="coastline"[\s\S]{0,400}filter/);
  });
});
