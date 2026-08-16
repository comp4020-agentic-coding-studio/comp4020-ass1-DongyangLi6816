/**
 * The voyage data has to keep matching the research it came from.
 *
 * This is the executable half of a rule that used to live in CLAUDE.md as
 * prose: a duration the poem does not state must stay unstated. Prose could
 * not enforce it. These can --- change a `days` value and the total goes red,
 * so the timeline cannot quietly drift away from research/.
 */

import { describe, expect, it } from "vitest";

import {
  BENCHMARKS,
  MAX_NUDGE,
  STOPS,
  STOPS_WITHOUT_DURATION,
  TOTAL_STATED_DAYS,
  dayAt,
  markerGap,
  project,
  projectMarker,
} from "../src/data/voyage.ts";

describe("voyage data: durations match the research", () => {
  // research/odyssey-journey-facts.md: 9 + 39 + 365 + 45 + 2576.
  it("totals the days the poem states", () => {
    expect(TOTAL_STATED_DAYS).toBe(3034);
  });

  // The whole argument rests on this proportion, so it is asserted, not trusted.
  it("puts most of the accounted-for voyage on one island", () => {
    const ogygia = STOPS.find((s) => s.id === "ogygia");
    const share = (ogygia?.days ?? 0) / TOTAL_STATED_DAYS;
    expect(share).toBeGreaterThan(0.84);
  });

  it("leaves unstated durations null rather than guessing", () => {
    // 8 of the 18 episodes in the fact sheet carry no duration; folded into
    // 14 map stops, 8 of those 14 still carry none.
    expect(STOPS_WITHOUT_DURATION).toBe(8);
  });

  it("never carries a duration that is neither a number nor explicitly null", () => {
    for (const stop of STOPS) {
      expect(
        stop.days === null || typeof stop.days === "number",
        `${stop.id} has a days value that is neither a number nor null`,
      ).toBe(true);
    }
  });

  it("explains every stated duration", () => {
    for (const stop of STOPS) {
      if (stop.days !== null && stop.days > 0) {
        expect(stop.daysNote, `${stop.id} states days but not what they cover`).
          toBeTruthy();
      }
    }
  });
});

describe("voyage data: shape", () => {
  it("carries the fourteen stops the map draws", () => {
    expect(STOPS).toHaveLength(14);
  });

  it("gives every stop a book reference", () => {
    for (const stop of STOPS) {
      expect(stop.book, `${stop.id} has no book reference`).toMatch(/^Books? /);
    }
  });

  it("has no duplicate ids", () => {
    expect(new Set(STOPS.map((s) => s.id)).size).toBe(STOPS.length);
  });

  it("accumulates to the total at the last stop", () => {
    expect(dayAt(STOPS.length - 1)).toBe(TOTAL_STATED_DAYS);
  });
});

describe("voyage data: map positions", () => {
  it("places every stop inside the map frame", () => {
    for (const stop of STOPS) {
      const { x, y } = project(stop);
      expect(x, `${stop.id} is off the map horizontally`).toBeGreaterThan(0);
      expect(x, `${stop.id} is off the map horizontally`).toBeLessThan(100);
      expect(y, `${stop.id} is off the map vertically`).toBeGreaterThan(0);
      expect(y, `${stop.id} is off the map vertically`).toBeLessThan(100);
    }
  });

  // An earlier version of this test used a plain 2.5-unit euclidean gap and
  // passed while four markers round Sicily were in fact stacked on top of one
  // another in the browser. The marker is wider than that and not round, so the
  // measure has to match the shape actually drawn.
  it("keeps markers far enough apart to click", () => {
    for (let i = 0; i < STOPS.length; i++) {
      for (let j = i + 1; j < STOPS.length; j++) {
        const gap = markerGap(
          projectMarker(STOPS[i]!),
          projectMarker(STOPS[j]!),
        );
        expect(
          gap,
          `${STOPS[i]!.id} and ${STOPS[j]!.id} overlap on the map`,
        ).toBeGreaterThan(4.6);
      }
    }
  });

  // Nudges buy legibility. Left unbounded they would quietly turn the map into
  // a diagram of wherever the markers happened to fit.
  it("keeps every marker nudge small", () => {
    for (const stop of STOPS) {
      if (!stop.nudge) continue;
      const [dx, dy] = stop.nudge;
      expect(
        Math.hypot(dx, dy),
        `${stop.id} is nudged further than ${MAX_NUDGE} points from its real position`,
      ).toBeLessThanOrEqual(MAX_NUDGE);
    }
  });

  it("still places every nudged marker inside the frame", () => {
    for (const stop of STOPS) {
      const { x, y } = projectMarker(stop);
      expect(x, `${stop.id} nudged off the map`).toBeGreaterThan(0);
      expect(x, `${stop.id} nudged off the map`).toBeLessThan(100);
      expect(y, `${stop.id} nudged off the map`).toBeGreaterThan(0);
      expect(y, `${stop.id} nudged off the map`).toBeLessThan(100);
    }
  });
});

describe("voyage data: benchmarks", () => {
  it("marks every computed benchmark as inferred", () => {
    // Diomedes is the only one the poem states outright. The rest are scaled
    // or converted, and the page has to say so.
    const stated = BENCHMARKS.filter((b) => !b.inferred);
    expect(stated.map((b) => b.id)).toEqual(["diomedes"]);
  });

  it("cites a source for every benchmark", () => {
    for (const b of BENCHMARKS) {
      expect(b.source, `${b.id} has no source`).toBeTruthy();
    }
  });
});
