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
  SAILING_NM_PER_DAY,
  TOTAL_STATED_DAYS,
  calendarSpan,
  dayAt,
  distanceAt,
  legDistance,
  markerGap,
  project,
  projectMarker,
  sailingDaysAt,
  storyPosition,
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

describe("the calendar rail", () => {
  it("runs forwards and never doubles back", () => {
    for (let i = 1; i < STOPS.length; i++) {
      expect(calendarSpan(i).start).toBeGreaterThanOrEqual(
        calendarSpan(i - 1).end - 1e-9,
      );
      expect(calendarSpan(i).end).toBeGreaterThanOrEqual(calendarSpan(i).start);
    }
  });

  it("gives a stop with no stated duration no width", () => {
    const widthless = STOPS.map((stop, i) => ({ stop, i }))
      .filter(({ stop }) => stop.days === null || stop.days === 0)
      .map(({ i }) => calendarSpan(i));

    expect(widthless.length).toBeGreaterThan(0);
    for (const span of widthless) {
      expect(span.end - span.start).toBeCloseTo(0, 10);
    }
  });

  it("hands Ogygia most of the bar", () => {
    const ogygia = STOPS.findIndex((stop) => stop.id === "ogygia");
    const span = calendarSpan(ogygia);
    expect(span.end - span.start).toBeGreaterThan(0.8);
  });

  it("spans exactly one whole bar", () => {
    expect(calendarSpan(0).start).toBe(0);
    expect(calendarSpan(STOPS.length - 1).end).toBeCloseTo(1, 10);
  });

  it("tells the story evenly, which is the comparison the rail makes", () => {
    expect(storyPosition(0)).toBe(0);
    expect(storyPosition(STOPS.length - 1)).toBe(1);
    for (let i = 1; i < STOPS.length; i++) {
      expect(storyPosition(i) - storyPosition(i - 1)).toBeCloseTo(
        1 / (STOPS.length - 1),
        10,
      );
    }
  });
});

describe("days at sea, inferred", () => {
  it("moves on every leg, including the ones the poem does not time", () => {
    // Distance is what the page leads with precisely because this holds for it
    // and cannot hold for whole days: three crossings are under fifty miles.
    for (let i = 1; i < STOPS.length; i++) {
      expect(
        distanceAt(i),
        `no crossing has no length, and stop ${i + 1} is one the poem is silent about`,
      ).toBeGreaterThan(distanceAt(i - 1));
    }
  });

  it("agrees with the poem on the one crossing the poem times", () => {
    // Ogygia to Scheria is the only leg the Odyssey gives a sailing duration
    // for: seventeen days on the raft. The rate here was taken from Casson's
    // recorded fleet, not from this leg, so the two are independent --- and
    // this is the only check available that the rate is anywhere near right.
    const scheria = STOPS.findIndex((stop) => stop.id === "phaeacians");
    const inferred = legDistance(scheria) / SAILING_NM_PER_DAY;

    expect(Math.round(inferred)).toBe(17);
  });

  it("never touches what the poem counts", () => {
    // The two numbers live side by side on the page and must not merge: one is
    // what the poem says and the other is what a ship does.
    const stated = STOPS.reduce((sum, stop) => sum + (stop.days ?? 0), 0);
    expect(stated).toBe(TOTAL_STATED_DAYS);
    expect(TOTAL_STATED_DAYS).toBe(3034);
    expect(sailingDaysAt(STOPS.length - 1)).toBeLessThan(TOTAL_STATED_DAYS);
  });

  it("measures the leg along the course the map draws", () => {
    // Through the sea marks, not straight across the Peloponnese: the leg to
    // the Lotus-Eaters rounds Cape Malea, and a straight line would be shorter
    // than what is drawn.
    const lotus = STOPS.findIndex((stop) => stop.id === "lotus");
    expect(STOPS[lotus]!.via?.length).toBeGreaterThan(0);
    expect(legDistance(lotus)).toBeGreaterThan(700);
  });
});
