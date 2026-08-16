/**
 * The voyage data. Single source of truth for the map, the rail and the panel.
 *
 * Every duration here is one the poem states. Where it states none, `days` is
 * `null` and stays `null` --- see research/odyssey-journey-facts.md, which
 * records that 8 of the 18 episodes carry no stated duration at all. A plausible
 * number in one of those slots would make the timeline look complete and be a
 * fabrication, so the type forbids leaving it out and the tests check the sum.
 *
 * Coordinates are the traditional identifications, not anything Homer gives.
 * The poem names no latitudes. Treated as scenery, not as claims.
 */

export interface Stop {
  id: string;
  /** Display name. */
  name: string;
  /** Short epithet under the title, as on the panel. */
  epithet: string;
  /** Book of the Odyssey this episode is told in. */
  book: string;
  /** Traditional location, degrees. Positive east and north. */
  lon: number;
  lat: number;
  /**
   * Days the poem states for this stop, or null when it states none.
   * Null is a fact about the source, not a missing value to fill in later.
   */
  days: number | null;
  /** What the stated duration covers, when there is one. */
  daysNote?: string;
  blurb: string;
  /**
   * Marker offset in percentage points, for legibility only.
   *
   * The traditional identifications cluster hard around Sicily and the
   * Tyrrhenian coast — seven pairs sit closer together than a marker is wide,
   * which makes the ones underneath unclickable. Only the buttons move, and
   * only by a couple of points. `MAX_NUDGE` and the collision test keep that
   * honest.
   */
  nudge?: readonly [number, number];
  /**
   * Sea marks the leg *arriving* at this stop is drawn through, in degrees.
   *
   * A voyage is not a straight line between two dots, and drawn as one it goes
   * over land: Ismarus to the Lotus-Eaters cut across the Peloponnese, and
   * Ogygia to Scheria crossed the whole of North Africa. These bend the leg
   * back onto water and round the headlands the poem actually names.
   *
   * They are drawing, not data. The poem gives no course, so no duration, no
   * distance and no claim is derived from them — they only decide where a line
   * on a picture goes, and the test that guards them only asks that they are
   * inside the map frame.
   */
  via?: readonly (readonly [number, number])[];
}

/** Largest marker offset allowed, in percentage points. Enforced by test. */
export const MAX_NUDGE = 3;

/** Map frame, shared with scripts/build-map.py. Changing one requires the other. */
export const FRAME = {
  lonMin: -8.0,
  lonMax: 30.5,
  latMin: 30.0,
  latMax: 47.0,
} as const;

/** True position as a percentage of the map box. The route is drawn from these. */
export function project(stop: Pick<Stop, "lon" | "lat">): {
  x: number;
  y: number;
} {
  const { lonMin, lonMax, latMin, latMax } = FRAME;
  return {
    x: ((stop.lon - lonMin) / (lonMax - lonMin)) * 100,
    y: ((latMax - stop.lat) / (latMax - latMin)) * 100,
  };
}

/** Points along the drawn route, sampled from a curve through the sea marks. */
export interface RoutePoint {
  x: number;
  y: number;
}

/**
 * The route as a smooth curve rather than a polyline.
 *
 * Catmull-Rom through every stop and every sea mark: it passes exactly through
 * its control points, which is what keeps the ship arriving on the marker, and
 * it needs no hand-authored tangents. Sampled here into plain points so the
 * page, the ship and the length arithmetic all work off one array in one
 * coordinate space.
 */
const SAMPLES_PER_SEGMENT = 12;

export function routePoints(): {
  points: RoutePoint[];
  /** Index into `points` of each stop, in order. */
  stopAt: number[];
} {
  const controls: RoutePoint[] = [];
  const stopAt: number[] = [];

  for (const stop of STOPS) {
    for (const [lon, lat] of stop.via ?? []) {
      controls.push(project({ lon, lat }));
    }
    stopAt.push(controls.length);
    controls.push(projectMarker(stop));
  }

  const at = (i: number) =>
    controls[Math.max(0, Math.min(controls.length - 1, i))]!;
  const points: RoutePoint[] = [];

  for (let i = 0; i < controls.length - 1; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    for (let s = 0; s < SAMPLES_PER_SEGMENT; s++) {
      const t = s / SAMPLES_PER_SEGMENT;
      const t2 = t * t;
      const t3 = t2 * t;
      points.push({
        x:
          0.5 *
          (2 * p1.x +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y:
          0.5 *
          (2 * p1.y +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  points.push(at(controls.length - 1));

  return {
    points,
    stopAt: stopAt.map((c) => Math.min(points.length - 1, c * SAMPLES_PER_SEGMENT)),
  };
}

/** Where the marker button goes: the true position plus its legibility nudge. */
export function projectMarker(stop: Stop): { x: number; y: number } {
  const { x, y } = project(stop);
  const [dx, dy] = stop.nudge ?? [0, 0];
  return { x: x + dx, y: y + dy };
}

/**
 * A marker is about 4.4% of the frame wide and 7.3% tall, so overlap has to be
 * measured on an ellipse. Two centres closer than this are one unclickable blob.
 */
export function markerGap(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return Math.hypot(a.x - b.x, ((a.y - b.y) * 4.4) / 7.3);
}

export const STOPS: Stop[] = [
  {
    id: "troy",
    name: "Troy",
    epithet: "Twelve ships turn for home",
    book: "Book 9",
    lon: 26.24,
    lat: 39.96,
    days: 0,
    blurb:
      "Ten years of siege end. Odysseus loads twelve ships with the spoils of Troy and turns west. Every other Greek captain is doing the same thing on the same day, out of the same harbour.",
  },
  {
    id: "cicones",
    name: "Ismarus",
    epithet: "The Cicones",
    book: "Book 9",
    lon: 25.9,
    lat: 40.9,
    days: null,
    blurb:
      "The fleet sacks the town and divides the plunder evenly. Odysseus wants to leave; the crew stays to drink. Cicone reinforcements arrive by morning and drive them back to the ships, six men dead from every ship.",
    nudge: [-1.6, -1.4],
  },
  {
    id: "lotus",
    name: "The Lotus-Eaters",
    epithet: "Nine days off course",
    book: "Book 9",
    lon: 11.1,
    lat: 33.9,
    // Round Cape Malea, because the poem says so and because the straight
    // line went over the Peloponnese. This is the hinge of the voyage: the
    // north wind here is what blows the fleet off the map.
    via: [
      [24.4, 37.6],
      [23.1, 36.1],
      [17.5, 34.4],
    ],
    days: 9,
    daysNote: "nine days blown off course past Cape Malea",
    blurb:
      "A north wind off Cape Malea drives the fleet nine days off course. Three scouts eat the lotus and stop caring about home. Odysseus drags them back to the ships in tears and sails before anyone else can taste it.",
  },
  {
    id: "cyclops",
    name: "The Cyclops",
    epithet: "Polyphemus, son of Poseidon",
    book: "Book 9",
    lon: 15.1,
    lat: 37.6,
    days: null,
    blurb:
      "Polyphemus blocks the cave with a boulder and eats six men over three meals. Odysseus gets him drunk, gives his name as Noman, and drives a fire-hardened stake into his eye. Escaping, he shouts his real name across the water — and Poseidon hears the curse that follows.",
    nudge: [-0.4, 2.2],
  },
  {
    id: "aeolus",
    name: "Aeolia",
    epithet: "The bag of winds",
    book: "Book 10",
    lon: 14.9,
    lat: 38.5,
    days: 39,
    daysNote: "a month hosted, then nine days at the rudder",
    blurb:
      "Aeolus hosts them a month and gives Odysseus a bag holding every contrary wind. He steers nine days and nights without sleeping. Ithaca is close enough to see the stubble fires burning when he finally sleeps — and the crew, certain the bag holds gold, opens it.",
    nudge: [-1.8, -1.2],
  },
  {
    id: "laestrygonians",
    name: "The Laestrygonians",
    epithet: "Eleven ships lost in an afternoon",
    book: "Book 10",
    lon: 13.0,
    lat: 41.4,
    days: null,
    blurb:
      "Eleven of the twelve ships moor inside a narrow harbour. Giants line the cliffs above and drop rocks through their hulls, spearing men in the water like fish. Only Odysseus, who kept his own ship outside, cuts his cable and gets away.",
    nudge: [0.6, -1.6],
  },
  {
    id: "circe",
    name: "Aeaea",
    epithet: "A year with Circe",
    book: "Book 10",
    lon: 13.1,
    lat: 40.6,
    days: 365,
    daysNote: "a full twelvemonth",
    blurb:
      "Circe turns twenty-two men into pigs, their minds still human. Hermes gives Odysseus the herb moly and he forces her to swear an oath. Then the crew stays a year — the longest stretch of the voyage until Ogygia, and the poem passes over it in a sentence.",
    nudge: [-2.2, 1.4],
  },
  {
    id: "underworld",
    name: "The Underworld",
    epithet: "A journey no living man had made",
    book: "Book 11",
    lon: 9.4,
    lat: 43.3,
    via: [
      [12.3, 40.3],
      [10.8, 42.4],
    ],
    days: null,
    blurb:
      "At Circe's direction he sails to the edge of Oceanus to ask the dead prophet Tiresias how to get home. He meets his own mother there and learns she died of missing him. Three times he tries to hold her; three times his hands pass through the air.",
  },
  {
    id: "sirens",
    name: "The Sirens",
    epithet: "Bound to the mast",
    book: "Book 12",
    lon: 14.3,
    lat: 40.4,
    via: [[11.6, 41.5]],
    days: null,
    blurb:
      "He stops the crew's ears with wax and has himself lashed upright to the mast, ordering them to bind him tighter if he begs. He is the only man to hear the song and live. The ship loses nobody and does not slow down.",
    nudge: [1.4, -0.8],
  },
  {
    id: "scylla",
    name: "Scylla and Charybdis",
    epithet: "The choice with no good answer",
    book: "Book 12",
    lon: 15.6,
    lat: 38.2,
    via: [[14.8, 39.3]],
    days: null,
    blurb:
      "Circe's advice is to hug the cliff, because losing six men beats losing the ship. He does not tell the crew. Scylla's six heads come down at once and take six of his best, calling his name as they go.",
    nudge: [2.6, 0.6],
  },
  {
    id: "thrinacia",
    name: "Thrinacia",
    epithet: "The cattle of the Sun",
    book: "Book 12",
    lon: 14.0,
    lat: 37.1,
    via: [[15.5, 36.7]],
    days: 45,
    daysNote: "a month becalmed, six days feasting, nine days adrift",
    blurb:
      "Both Tiresias and Circe warned him. Then the wind dies for a month and the food runs out, and the crew decides that drowning beats starving. They eat the god's cattle for six days. Zeus splits the ship with a thunderbolt and every man but one drowns.",
    nudge: [-2.4, 1.2],
  },
  {
    id: "ogygia",
    name: "Ogygia",
    epithet: "Seven years with Calypso",
    book: "Book 5",
    lon: -5.5,
    lat: 35.9,
    // Thrinacia's traditional coordinate sits inland on Sicily, so the leg
    // west has to be taken out to sea before it turns.
    via: [
      [12.3, 36.3],
      [10.5, 37.5],
      [8.0, 37.6],
      [2.0, 37.6],
      [-2.5, 36.2],
    ],
    days: 2576,
    daysNote: "seven years held, four days building the raft, seventeen sailing",
    blurb:
      "Calypso keeps him seven years and offers to make him immortal. He spends the days on the shore, weeping, looking at the water. This is eighty-five per cent of every day the poem accounts for, and it is the part nobody retells.",
  },
  {
    id: "phaeacians",
    name: "Scheria",
    epithet: "The Phaeacians",
    book: "Books 6–8",
    lon: 19.9,
    lat: 39.6,
    // Drawn straight this leg crossed Algeria, Tunisia and Libya end to end.
    via: [
      [-1.5, 36.4],
      [4.0, 37.6],
      [9.5, 37.6],
      [13.2, 35.8],
      [18.2, 37.4],
    ],
    days: null,
    blurb:
      "Shipwrecked and naked, he is found by Nausicaa doing the palace laundry. At dinner the court bard sings about the Trojan War and Odysseus weeps into his cloak, which is how they learn who he is. He tells them the whole voyage — everything above is him talking.",
  },
  {
    id: "ithaca",
    name: "Ithaca",
    epithet: "Asleep, and twenty years late",
    book: "Book 13",
    lon: 20.7,
    lat: 38.4,
    days: null,
    blurb:
      "The Phaeacians sail him home while he sleeps and lay him on the sand without waking him. He opens his eyes on his own island and does not recognise it. Athena has to tell him where he is.",
  },
];

/**
 * Other captains out of the same harbour, for the counter that tracks how far
 * behind Odysseus is running. Only three returns in the poem carry a stated
 * duration; see research/homeric-returns.md for the other ten, which do not.
 */
export interface Benchmark {
  id: string;
  who: string;
  day: number;
  note: string;
  source: string;
  inferred: boolean;
}

export const BENCHMARKS: Benchmark[] = [
  {
    id: "diomedes",
    who: "Diomedes",
    day: 4,
    note: "moored in Argos on the fourth day",
    source: "Book 3",
    inferred: false,
  },
  {
    id: "fleet",
    who: "A recorded ancient fleet",
    day: 7,
    note: "Troy to Alexandria, 550 nautical miles, seven days",
    source: "Casson, Ships and Seamanship, p. 293",
    inferred: true,
  },
  {
    id: "menelaus",
    who: "Menelaus",
    day: 2557,
    note: "home in the eighth year, by way of Egypt",
    source: "Book 4",
    inferred: true,
  },
];

/**
 * Days at sea, inferred --- never added to the days the poem states.
 *
 * Eight of the fourteen stops carry no stated duration, so the counter stands
 * still through them, which reads as broken rather than as absent. It is not
 * absent that the crossing took time; it is only unstated. The time a crossing
 * takes can be had from its length and a rate, and this one is not a guess:
 * the poem's own benchmark list already carries a fleet that made Troy to
 * Alexandria, 550 nautical miles, in seven days (Casson, *Ships and
 * Seamanship*, p. 293). That is 78.6 miles a day with the nights and the
 * stops already in it, which is why it is used rather than the 4 knots that
 * Bronze Age modelling takes from the same book --- a knot figure would have
 * to be turned into days by assuming how much of a day is spent sailing, and
 * this measurement has already answered that.
 *
 * It stays a separate number on the page for the same reason `days` stays
 * null: one of these two things is what the poem counts, and the other is
 * what a ship does. Nothing here changes TOTAL_STATED_DAYS.
 */
export const SAILING_NM_PER_DAY = 550 / 7;

/** Great-circle distance between two points on the map, in nautical miles. */
function nauticalMiles(
  a: { lon: number; lat: number },
  b: { lon: number; lat: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  // Earth's mean radius in nautical miles.
  return 2 * 3440.065 * Math.asin(Math.sqrt(h));
}

/**
 * The length of the leg arriving at a stop, in nautical miles, measured along
 * the course the map draws --- through the sea marks, not straight through the
 * Peloponnese.
 */
export function legDistance(index: number): number {
  if (index === 0) return 0;
  const stop = STOPS[index]!;
  const previous = STOPS[index - 1]!;
  const path = [
    previous,
    ...(stop.via ?? []).map(([lon, lat]) => ({ lon, lat })),
    stop,
  ];
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += nauticalMiles(path[i - 1]!, path[i]!);
  }
  return total;
}

/** Cumulative distance sailed on arriving at a stop, in nautical miles. */
export function distanceAt(index: number): number {
  let total = 0;
  for (let i = 1; i <= index; i++) total += legDistance(i);
  return total;
}

/**
 * Cumulative days at sea on arriving at a stop.
 *
 * Not rounded per leg. Three of the crossings are under fifty miles and take
 * well under a day, and rounding each of those up to one would be inventing
 * time the poem does not owe. Which is why the page leads with the distance:
 * that is measured off the drawn course and rises at every stop, where the day
 * figure carries a rate and cannot.
 */
export function sailingDaysAt(index: number): number {
  return distanceAt(index) / SAILING_NM_PER_DAY;
}

/** Total days the poem actually states. Derived, never hard-coded. */
export const TOTAL_STATED_DAYS = STOPS.reduce(
  (sum, stop) => sum + (stop.days ?? 0),
  0,
);

/** Cumulative day the voyage stands at once `index` is reached. */
export function dayAt(index: number): number {
  return STOPS.slice(0, index + 1).reduce((sum, s) => sum + (s.days ?? 0), 0);
}

/**
 * Where a stop sits on a calendar drawn to scale, as fractions of the whole.
 *
 * The stay at a stop runs from the day the voyage stood at when it arrived to
 * the day it stood at when it left, so a stop the poem gives no duration for
 * has `start === end` and no width at all. That is the point: on a true
 * calendar eight of the fourteen stops are lines with no thickness, and
 * Ogygia is most of the bar.
 */
export function calendarSpan(index: number): { start: number; end: number } {
  const end = dayAt(index) / TOTAL_STATED_DAYS;
  const start = index === 0 ? 0 : dayAt(index - 1) / TOTAL_STATED_DAYS;
  return { start, end };
}

/** Where a stop sits when the rail is drawn as the story is told: evenly. */
export function storyPosition(index: number): number {
  return index / (STOPS.length - 1);
}

/** How many stops give no duration at all. Shown on the page, not hidden. */
export const STOPS_WITHOUT_DURATION = STOPS.filter((s) => s.days === null).length;
