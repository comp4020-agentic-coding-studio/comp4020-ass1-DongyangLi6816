#!/usr/bin/env python3
"""Generate the Mediterranean coastline SVG from Natural Earth data.

Run once; the output is committed. Nothing at build or run time depends on
this script or on network access.

    python3 scripts/build-map.py src/components/coastline.svg

Source: Natural Earth 1:50m land polygons, public domain.
https://github.com/nvkelso/natural-earth-vector

The projection is equirectangular, which is wrong for navigation and right
here: the map is a diagram of a voyage, not a chart, and the stop positions
are themselves later scholarship rather than anything Homer states (see
research/odyssey-journey-facts.md).
"""

from __future__ import annotations

import json
import math
import sys
import urllib.request
from pathlib import Path

SOURCE = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/"
    "master/geojson/ne_50m_land.geojson"
)
CACHE = Path("/tmp/ne_50m_land.geojson")

# Troy sits at 26.2E; Ogygia is placed near Gibraltar at 5.5W. The frame has
# to hold both, with enough margin that the westmost marker is not on the edge.
LON_MIN, LON_MAX = -8.0, 30.5
LAT_MIN, LAT_MAX = 30.0, 47.0

WIDTH = 1600.0
# Latitude is stretched so the basin is not squashed; a plain 1:1 degree
# mapping makes the Mediterranean look far flatter than any reader expects.
LAT_STRETCH = 1.35

# Douglas-Peucker tolerance in output units. Big enough to drop scanner-level
# detail, small enough to keep Italy, Greece and the larger islands readable.
TOLERANCE = 0.9
MIN_AREA = 6.0  # drop islets smaller than this, in square output units


def project(lon: float, lat: float) -> tuple[float, float]:
    x = (lon - LON_MIN) / (LON_MAX - LON_MIN) * WIDTH
    span = (LAT_MAX - LAT_MIN) * LAT_STRETCH
    y = (LAT_MAX - lat) * LAT_STRETCH / span * height()
    return x, y


def height() -> float:
    return WIDTH * ((LAT_MAX - LAT_MIN) * LAT_STRETCH) / (LON_MAX - LON_MIN)


def perp_distance(p, a, b) -> float:
    (px, py), (ax, ay), (bx, by) = p, a, b
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def simplify(pts: list[tuple[float, float]], tol: float) -> list[tuple[float, float]]:
    if len(pts) < 3:
        return pts
    dmax, index = 0.0, 0
    for i in range(1, len(pts) - 1):
        d = perp_distance(pts[i], pts[0], pts[-1])
        if d > dmax:
            dmax, index = d, i
    if dmax <= tol:
        return [pts[0], pts[-1]]
    left = simplify(pts[: index + 1], tol)
    right = simplify(pts[index:], tol)
    return left[:-1] + right


def ring_area(pts: list[tuple[float, float]]) -> float:
    a = 0.0
    for i in range(len(pts)):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % len(pts)]
        a += x1 * y2 - x2 * y1
    return abs(a) / 2.0


def clip_ring(ring) -> list[tuple[float, float]] | None:
    """Keep rings that intersect the frame; project and drop far-outside points."""
    if not any(
        LON_MIN - 6 <= lon <= LON_MAX + 6 and LAT_MIN - 6 <= lat <= LAT_MAX + 6
        for lon, lat in ring
    ):
        return None
    return [project(lon, lat) for lon, lat in ring]


def rings_of(geom):
    t = geom["type"]
    if t == "Polygon":
        return [geom["coordinates"][0]]
    if t == "MultiPolygon":
        return [poly[0] for poly in geom["coordinates"]]
    return []


def fmt(v: float) -> str:
    return f"{v:.1f}".rstrip("0").rstrip(".")


def main() -> int:
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "coastline.svg")

    if not CACHE.exists():
        print(f"fetching {SOURCE}")
        urllib.request.urlretrieve(SOURCE, CACHE)
    data = json.loads(CACHE.read_text())

    paths: list[str] = []
    for feature in data["features"]:
        for ring in rings_of(feature["geometry"]):
            projected = clip_ring(ring)
            if projected is None:
                continue
            pts = simplify(projected, TOLERANCE)
            if len(pts) < 3 or ring_area(pts) < MIN_AREA:
                continue
            d = "M" + " ".join(f"{fmt(x)},{fmt(y)}" for x, y in pts) + "Z"
            paths.append(d)

    h = height()
    body = "\n".join(f'  <path d="{d}" />' for d in paths)
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'viewBox="0 0 {fmt(WIDTH)} {fmt(h)}" '
        f'class="coastline" aria-hidden="true" focusable="false">\n'
        f"{body}\n</svg>\n"
    )
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(svg)
    print(f"{out}  {len(paths)} paths  {out.stat().st_size // 1024} KB")
    print(f"viewBox 0 0 {fmt(WIDTH)} {fmt(h)}")
    return 0


if __name__ == "__main__":
    sys.setrecursionlimit(20000)
    sys.exit(main())
