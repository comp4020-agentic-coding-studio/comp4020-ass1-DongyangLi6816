/**
 * The nostos --- the voyage that should have happened.
 *
 * It is the page's whole benchmark, so the things that make it an honest one
 * are asserted rather than trusted: that its day count is derived and not
 * typed in, that it starts and ends exactly where the real voyage does, and
 * that it runs with the real course as far as Cape Malea and only parts from
 * it there. Break any of those and the comparison stops meaning anything while
 * still looking perfectly fine on screen.
 */

import { describe, expect, it } from "vitest";

import {
  FRAME,
  NOSTOS_DAYS,
  NOSTOS_VIA,
  STOPS,
  SAILING_NM_PER_DAY,
  TOTAL_STATED_DAYS,
  nostosCourse,
  nostosDistance,
  nostosRoutePoints,
  projectMarker,
} from "../src/data/voyage.ts";

const troy = STOPS[0]!;
const ithaca = STOPS[STOPS.length - 1]!;

describe("nostos: the same two ends as the voyage", () => {
  it("leaves from Troy and finishes at Ithaca", () => {
    // Same harbour, same island. The comparison only reads because nothing
    // about the endpoints differs --- only the water in between.
    expect(troy.id).toBe("troy");
    expect(ithaca.id).toBe("ithaca");

    const course = nostosCourse();
    expect(course[0]).toMatchObject({ lon: troy.lon, lat: troy.lat });
    expect(course[course.length - 1]).toMatchObject({
      lon: ithaca.lon,
      lat: ithaca.lat,
    });
  });

  it("draws a curve that passes exactly through both ends", () => {
    // Catmull-Rom interpolates its control points, which is what puts the
    // ghost ship on the marker rather than near it. Asserted because a change
    // of curve could quietly lose the property.
    const points = nostosRoutePoints();
    const start = projectMarker(troy);
    const end = projectMarker(ithaca);

    expect(points[0]!.x).toBeCloseTo(start.x, 6);
    expect(points[0]!.y).toBeCloseTo(start.y, 6);
    expect(points[points.length - 1]!.x).toBeCloseTo(end.x, 6);
    expect(points[points.length - 1]!.y).toBeCloseTo(end.y, 6);
  });
});

describe("nostos: it parts from the voyage at Cape Malea", () => {
  it("shares the run down the Aegean with the real course", () => {
    // Both courses take MALEA_APPROACH. It is one constant, so this test is
    // really asking that nobody has copied it into two places that can drift.
    const lotus = STOPS.find((s) => s.id === "lotus")!;
    const shared = lotus.via!.slice(0, 2);

    expect(NOSTOS_VIA.slice(0, 2)).toEqual(shared);
  });

  it("turns north-west where the real course is blown south-west", () => {
    const lotus = STOPS.find((s) => s.id === "lotus")!;
    const malea = NOSTOS_VIA[1]!;
    const nostosNext = NOSTOS_VIA[2]!;
    const voyageNext = lotus.via![2]!;

    // The split is the point of the page: from the same mark, one course
    // makes northing and the other loses it.
    expect(nostosNext[1]).toBeGreaterThan(malea[1]);
    expect(voyageNext[1]).toBeLessThan(malea[1]);
  });

  it("keeps every sea mark inside the map frame", () => {
    for (const [lon, lat] of NOSTOS_VIA) {
      expect(lon).toBeGreaterThanOrEqual(FRAME.lonMin);
      expect(lon).toBeLessThanOrEqual(FRAME.lonMax);
      expect(lat).toBeGreaterThanOrEqual(FRAME.latMin);
      expect(lat).toBeLessThanOrEqual(FRAME.latMax);
    }
  });
});

describe("nostos: the day count is derived, not asserted", () => {
  it("is the drawn course over the rate the page already uses", () => {
    // Recomputed here from the two published numbers. Hard-code NOSTOS_DAYS
    // and this goes red.
    expect(NOSTOS_DAYS).toBe(
      Math.ceil(nostosDistance() / SAILING_NM_PER_DAY),
    );
  });

  it("arrives on the day the crossing runs into, not the one it started", () => {
    // Rounded up: 6.2 days at sea is an arrival on day 7. Rounding to nearest
    // would shave a day off the benchmark and flatter it.
    const raw = nostosDistance() / SAILING_NM_PER_DAY;
    expect(NOSTOS_DAYS).toBeGreaterThanOrEqual(raw);
    expect(NOSTOS_DAYS - raw).toBeLessThan(1);
  });

  it("is a week's sailing, not a season's", () => {
    // The claim the page makes out loud. If the course ever grows long enough
    // to break this, the copy is wrong before the number is.
    expect(NOSTOS_DAYS).toBeGreaterThan(0);
    expect(NOSTOS_DAYS).toBeLessThanOrEqual(14);
  });

  it("is dwarfed by the days the poem actually counts", () => {
    expect(NOSTOS_DAYS * 100).toBeLessThan(TOTAL_STATED_DAYS);
  });
});
