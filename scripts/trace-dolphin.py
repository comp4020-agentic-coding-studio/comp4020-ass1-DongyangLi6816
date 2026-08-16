#!/usr/bin/env python3
"""Trace one dolphin off a photograph of Exekias's Dionysus cup.

Not part of the build. It ran once and its output is pasted into
src/components/seamarks.astro as a single path. Kept so the provenance of that
path is checkable rather than asserted.

    curl -L -o cup.jpg \\
      "https://commons.wikimedia.org/wiki/Special:FilePath/Exekias_Dionysos_Staatliche_Antikensammlungen_2044.jpg?width=1400"
    python3 scripts/trace-dolphin.py cup.jpg 0.60 0.66 0.78 0.78

The vase (Munich, Staatliche Antikensammlungen 2044, c. 530 BC) is long out of
copyright. The photograph is CC BY 2.5 from Wikimedia Commons; what is taken
here is the outline of the ancient painting, not the photograph.

Three steps do work a plain threshold does not, each of them a thing that went
wrong first:

  closing     the painter incised light lines through the black slip and they
              cut the body into fragments. Closing at the width of an incision
              welds it back together.
  split RDP   a closed contour begins and ends on the same point, which makes
              the perpendicular-distance test degenerate. Cut it at the point
              furthest from the start, simplify each half, rejoin.
  levelling   the source dolphin dives at about thirty degrees. Rotating onto
              its own principal axis gives a canonical horizontal animal that
              the component can then rotate as it likes.

Usage: trace-dolphin.py IMAGE X0 Y0 X1 Y1 [BIAS] [EPSILON] [CLOSE_RADIUS]
The box is given as fractions of the image. Prints one JSON object.
"""

import json
import math
import sys
from collections import deque

from PIL import Image

image = sys.argv[1]
x0f, y0f, x1f, y1f = (float(a) for a in sys.argv[2:6])
bias = float(sys.argv[6]) if len(sys.argv) > 6 else 1.0
epsilon = float(sys.argv[7]) if len(sys.argv) > 7 else 1.2
radius = int(sys.argv[8]) if len(sys.argv) > 8 else 3

im = Image.open(image)
W, H = im.size
crop = im.crop(
    (int(x0f * W), int(y0f * H), int(x1f * W), int(y1f * H))
).convert("L")
crop.thumbnail((560, 560))
w, h = crop.size
px = crop.load()

# Otsu, so the threshold comes from the photograph rather than from taste.
hist = crop.histogram()
total = w * h
sum_all = sum(i * hist[i] for i in range(256))
sum_b = weight_b = 0
otsu = 0
best = -1.0
for t in range(256):
    weight_b += hist[t]
    if weight_b == 0:
        continue
    weight_f = total - weight_b
    if weight_f == 0:
        break
    sum_b += t * hist[t]
    between = weight_b * weight_f * ((sum_b / weight_b) - ((sum_all - sum_b) / weight_f)) ** 2
    if between > best:
        best, otsu = between, t

threshold = otsu * bias
mask = [[1 if px[x, y] < threshold else 0 for x in range(w)] for y in range(h)]


def dilate(m, r):
    out = [[0] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            if not m[y][x]:
                continue
            for dy in range(-r, r + 1):
                yy = y + dy
                if not 0 <= yy < h:
                    continue
                for dx in range(-r, r + 1):
                    xx = x + dx
                    if 0 <= xx < w and dx * dx + dy * dy <= r * r:
                        out[yy][xx] = 1
    return out


def erode(m, r):
    out = [[0] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            solid = True
            for dy in range(-r, r + 1):
                if not solid:
                    break
                for dx in range(-r, r + 1):
                    if dx * dx + dy * dy > r * r:
                        continue
                    xx, yy = x + dx, y + dy
                    if not (0 <= xx < w and 0 <= yy < h and m[yy][xx]):
                        solid = False
                        break
            out[y][x] = 1 if solid else 0
    return out


if radius > 0:
    mask = erode(dilate(mask, radius), radius)

# Largest dark component: the animal, not the shadows around it.
seen = [[False] * w for _ in range(h)]
blob_pts = []
for y0 in range(h):
    for x0 in range(w):
        if not mask[y0][x0] or seen[y0][x0]:
            continue
        queue = deque([(x0, y0)])
        seen[y0][x0] = True
        comp = []
        while queue:
            x, y = queue.popleft()
            comp.append((x, y))
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and mask[ny][nx] and not seen[ny][nx]:
                    seen[ny][nx] = True
                    queue.append((nx, ny))
        if len(comp) > len(blob_pts):
            blob_pts = comp

blob = [[0] * w for _ in range(h)]
for x, y in blob_pts:
    blob[y][x] = 1

# Moore-neighbour boundary trace.
start = min(blob_pts, key=lambda p: (p[1], p[0]))
offsets = [(1, 0), (1, 1), (0, 1), (-1, 1), (-1, 0), (-1, -1), (0, -1), (1, -1)]
contour = [start]
cur, direction = start, 0
for _ in range(400_000):
    for k in range(8):
        d = (direction + 5 + k) % 8
        nx, ny = cur[0] + offsets[d][0], cur[1] + offsets[d][1]
        if 0 <= nx < w and 0 <= ny < h and blob[ny][nx]:
            cur, direction = (nx, ny), d
            contour.append(cur)
            break
    else:
        break
    if cur == start and len(contour) > 8:
        break


def rdp(points, eps):
    if len(points) < 3:
        return points
    (ax, ay), (bx, by) = points[0], points[-1]
    dx, dy = bx - ax, by - ay
    norm = (dx * dx + dy * dy) ** 0.5 or 1
    idx, furthest = 0, 0.0
    for i in range(1, len(points) - 1):
        x, y = points[i]
        dist = abs(dy * x - dx * y + bx * ay - by * ax) / norm
        if dist > furthest:
            idx, furthest = i, dist
    if furthest > eps:
        return rdp(points[: idx + 1], eps)[:-1] + rdp(points[idx:], eps)
    return [points[0], points[-1]]


sys.setrecursionlimit(20_000)
if contour[0] == contour[-1]:
    contour = contour[:-1]
head = contour[0]
far = max(
    range(len(contour)),
    key=lambda i: (contour[i][0] - head[0]) ** 2 + (contour[i][1] - head[1]) ** 2,
)
simple = rdp(contour[: far + 1], epsilon)[:-1] + rdp(contour[far:] + [head], epsilon)[:-1]

# Level on the principal axis, then normalise to 200 units long, facing left.
cx = sum(p[0] for p in simple) / len(simple)
cy = sum(p[1] for p in simple) / len(simple)
sxx = sum((p[0] - cx) ** 2 for p in simple)
syy = sum((p[1] - cy) ** 2 for p in simple)
sxy = sum((p[0] - cx) * (p[1] - cy) for p in simple)
theta = 0.5 * math.atan2(2 * sxy, sxx - syy)
cos_t, sin_t = math.cos(-theta), math.sin(-theta)
rotated = [
    ((p[0] - cx) * cos_t - (p[1] - cy) * sin_t, (p[0] - cx) * sin_t + (p[1] - cy) * cos_t)
    for p in simple
]

xs = [p[0] for p in rotated]
ys = [p[1] for p in rotated]
min_x, min_y = min(xs), min(ys)
scale = 200.0 / (max(xs) - min_x)
points = [((x - min_x) * scale, (y - min_y) * scale) for x, y in rotated]

# Put the tail on the right, so the animal faces left.
#
# Measured at the ends, not over each half: the body is deepest a third of the
# way back from the head, so comparing halves picks the head as often as not.
# In the outermost tenth the shapes are unambiguous --- the tail flares, the
# beak comes to a point.
def tip_depth(select):
    band = [y for x, y in points if select(x)]
    return max(band) - min(band) if band else 0.0


if tip_depth(lambda x: x < 20.0) > tip_depth(lambda x: x > 180.0):
    points = [(200.0 - x, y) for x, y in points]

print(
    json.dumps(
        {
            "otsu": otsu,
            "threshold": round(threshold, 1),
            "contour": len(contour),
            "points": len(points),
            "height": round(max(ys) - min_y, 1) and round((max(ys) - min_y) * scale, 1),
            "d": "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in points) + " Z",
        }
    )
)
