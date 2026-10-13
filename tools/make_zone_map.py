#!/usr/bin/env python3
"""Dessine la carte de zone d'intervention (SVG inline) : provinces de Luxembourg et de Namur.

    python3 tools/make_zone_map.py   ->   src/partials/zone-map.html
"""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GEO = json.loads((ROOT / "tools" / "data" / "belgium-provinces.geojson").read_text(encoding="utf-8"))

SERVED = {"Luxemburg": "Province de Luxembourg", "Namen": "Province de Namur"}
CORBION = (5.0087, 49.7975)
# Réalisations citées sur l'ancien site (Arlon, Marche, Bertrix, Beauraing)
PLACES = {"Arlon": (5.8167, 49.6833), "Marche-en-Famenne": (5.3428, 50.2276),
          "Bertrix": (5.2411, 49.8531), "Beauraing": (4.9556, 50.1097)}

LAT0 = 50.0
KX = math.cos(math.radians(LAT0))


def project(lon, lat):
    return lon * KX, -lat          # équirectangulaire corrigée de la latitude


def rings(geom):
    polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
    for poly in polys:
        for ring in poly:
            yield ring


def dp(points, eps):
    """Douglas-Peucker (itératif)."""
    if len(points) < 4:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = points[a]; bx, by = points[b]
        dx, dy = bx - ax, by - ay
        norm = math.hypot(dx, dy) or 1e-12
        best, idx = 0, None
        for i in range(a + 1, b):
            px, py = points[i]
            d = abs(dy * (px - ax) - dx * (py - ay)) / norm
            if d > best:
                best, idx = d, i
        if idx is not None and best > eps:
            keep[idx] = True
            stack += [(a, idx), (idx, b)]
    return [p for p, k in zip(points, keep) if k]


def simplify_ring(pts, eps):
    """Les anneaux sont fermés : on les coupe au point le plus éloigné du départ."""
    if pts[0] == pts[-1]:
        pts = pts[:-1]
    far = max(range(len(pts)), key=lambda i: math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]))
    first = dp(pts[: far + 1], eps)
    second = dp(pts[far:] + [pts[0]], eps)
    return first + second[1:-1]


def centroid(pts):
    a = cx = cy = 0.0
    for (x0, y0), (x1, y1) in zip(pts, pts[1:] + pts[:1]):
        c = x0 * y1 - x1 * y0
        a += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c
    a *= 0.5
    return (cx / (6 * a), cy / (6 * a)) if a else pts[0]


feats = {f["properties"]["shapeName"]: f for f in GEO["features"]}

# cadre : les deux provinces + une marge
xs, ys = [], []
for name in SERVED:
    for ring in rings(feats[name]["geometry"]):
        for lon, lat in ring:
            x, y = project(lon, lat); xs.append(x); ys.append(y)
pad = 0.08
minx, maxx, miny, maxy = min(xs) - pad, max(xs) + pad, min(ys) - pad, max(ys) + pad
S = 560 / (maxx - minx)                    # largeur du viewBox = 560
W, H = 560, round((maxy - miny) * S)


def to_svg(lon, lat):
    x, y = project(lon, lat)
    return (x - minx) * S, (y - miny) * S


def path_for(geom, eps=0.9):
    d = []
    for ring in rings(geom):
        pts = [to_svg(lon, lat) for lon, lat in ring]
        pts = simplify_ring(pts, eps)
        if len(pts) < 3:
            continue
        d.append("M" + " ".join(f"{x:.1f} {y:.1f}" for x, y in pts) + "Z")
    return "".join(d)


def bbox_in_frame(geom):
    for ring in rings(geom):
        for lon, lat in ring:
            x, y = to_svg(lon, lat)
            if -20 <= x <= W + 20 and -20 <= y <= H + 20:
                return True
    return False


out = [f'<svg class="zone-svg" viewBox="0 0 {W} {H}" role="img" '
       f'aria-labelledby="zone-title zone-desc" xmlns="http://www.w3.org/2000/svg">',
       '<title id="zone-title">Zone d’intervention de JMI Vérandas</title>',
       '<desc id="zone-desc">Carte des provinces de Luxembourg et de Namur, avec Corbion, '
       'Arlon, Marche-en-Famenne, Bertrix et Beauraing.</desc>']

# provinces de contexte, puis provinces desservies par-dessus
for name, f in feats.items():
    if name in SERVED or not bbox_in_frame(f["geometry"]):
        continue
    out.append(f'<path class="zone-land" d="{path_for(f["geometry"], 2.6)}"/>')
for name, label in SERVED.items():
    g = feats[name]["geometry"]
    out.append(f'<path class="zone-served" data-province="{label}" d="{path_for(g, 1.3)}"/>')

# libellés des provinces au centre du plus grand anneau
for name, label in SERVED.items():
    g = feats[name]["geometry"]
    biggest = max(rings(g), key=len)
    cx, cy = centroid([to_svg(lon, lat) for lon, lat in biggest])
    if name == "Luxemburg":
        cx, cy = cx + 62, cy + 96         # au sud-est, loin des étiquettes de villes
    else:
        cy -= 22
    out.append(f'<text class="zone-label" x="{cx:.0f}" y="{cy:.0f}" text-anchor="middle">{label.upper()}</text>')

# villes de réalisations
for place, (lon, lat) in PLACES.items():
    x, y = to_svg(lon, lat)
    anchor, dx = ("end", -9) if place in ("Arlon", "Bertrix") else ("start", 9)
    out.append(f'<g class="zone-place"><circle cx="{x:.1f}" cy="{y:.1f}" r="4.5"/>'
               f'<text x="{x + dx:.1f}" y="{y + 4:.1f}" text-anchor="{anchor}">{place}</text></g>')

# Corbion
x, y = to_svg(*CORBION)
out.append(f'<g class="zone-pin" transform="translate({x:.1f} {y:.1f})">'
           '<circle class="pulse" r="10"/><circle class="dot" r="7"/>'
           '<text x="-14" y="-10" text-anchor="end" class="pin-label">Corbion</text></g>')
out.append("</svg>")

(ROOT / "src" / "partials" / "zone-map.html").write_text("\n".join(out) + "\n", encoding="utf-8")
print("zone-map.html :", W, "×", H, "-", sum(len(l) for l in out) // 1024, "Ko")
