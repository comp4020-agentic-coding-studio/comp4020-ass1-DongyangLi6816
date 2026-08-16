/**
 * Roughen the coastline at build time, instead of filtering it in the browser.
 *
 * A painter's incision wanders; a plotted vector does not. That wander used to
 * come from an SVG turbulence filter on the coastline paths, and it cost two
 * separate bugs:
 *
 * 1. The displacement is in the map's user units, so the map's zoom multiplied
 *    it --- a 2.6px wobble at rest became 13px at 5x and the coast melted.
 * 2. Worse, WebKit drops a filter whose region exceeds its raster limit, and
 *    it drops it silently: on iPad Safari every large landmass vanished while
 *    the small islands, whose filter regions are small, still drew. Most of the
 *    map was simply missing.
 *
 * Both go away if the wander is in the coordinates. It is computed once during
 * `astro build`, ships as ordinary path data, costs nothing at runtime, and
 * cannot be scaled or dropped by anybody's renderer.
 *
 * The noise has to be smooth in space, not per-point random: neighbouring
 * vertices must move together or the coast comes out serrated rather than
 * hand-cut. This is value noise on a coarse lattice, smoothstep-interpolated,
 * with separate fields for x and y.
 */

/** Lattice spacing, in map units. Roughly the wavelength of the wander. */
const CELL = 50;

/** How far a point may move, in map units. */
export const ROUGHNESS = 2.2;

/** Deterministic, so a build is reproducible and a diff is reviewable. */
function hash(x: number, y: number, salt: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453;
  return (n - Math.floor(n)) * 2 - 1;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

function noise(x: number, y: number, salt: number): number {
  const gx = Math.floor(x / CELL);
  const gy = Math.floor(y / CELL);
  const fx = smooth(x / CELL - gx);
  const fy = smooth(y / CELL - gy);

  const top =
    hash(gx, gy, salt) + (hash(gx + 1, gy, salt) - hash(gx, gy, salt)) * fx;
  const bottom =
    hash(gx, gy + 1, salt) +
    (hash(gx + 1, gy + 1, salt) - hash(gx, gy + 1, salt)) * fx;
  return top + (bottom - top) * fy;
}

/** Displace every vertex of every path in a coastline SVG. */
export function roughen(svg: string): string {
  return svg.replace(/ d="([^"]+)"/g, (_match, d: string) => {
    const roughened = d.replace(
      /(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g,
      (_pair, xs: string, ys: string) => {
        const x = Number(xs);
        const y = Number(ys);
        return `${(x + noise(x, y, 1) * ROUGHNESS).toFixed(1)},${(
          y +
          noise(x, y, 2) * ROUGHNESS
        ).toFixed(1)}`;
      },
    );
    return ` d="${roughened}"`;
  });
}
