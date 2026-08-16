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
   * which makes the ones underneath unclickable. The route is drawn from the
   * true positions; only the buttons move, and only by a couple of points.
   * `MAX_NUDGE` and the collision test keep that honest.
   */
  nudge?: readonly [number, number];
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

/** Total days the poem actually states. Derived, never hard-coded. */
export const TOTAL_STATED_DAYS = STOPS.reduce(
  (sum, stop) => sum + (stop.days ?? 0),
  0,
);

/** Cumulative day the voyage stands at once `index` is reached. */
export function dayAt(index: number): number {
  return STOPS.slice(0, index + 1).reduce((sum, s) => sum + (s.days ?? 0), 0);
}

/** How many stops give no duration at all. Shown on the page, not hidden. */
export const STOPS_WITHOUT_DURATION = STOPS.filter((s) => s.days === null).length;
