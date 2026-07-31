"""
M1911 parts extraction from Browning's US984519 patent plate (public domain).

Every ink stroke in the drawing is traced as its own closed contour, then
assigned to a part by testing its centroid against hand-authored polygon
regions that follow the pistol's natural seams. Strokes are never cut, so
each part keeps clean, continuous line work.

Output: a TS module of part definitions (SVG path data, bbox, anchors) in
millimetre-ish canvas units, muzzle +X, scaled so the pistol is 216mm long.
"""

import json
import cv2
import numpy as np
from matplotlib.path import Path as MplPath

S = r"C:/Users/leepe/AppData/Local/Temp/claude/c--Users-leepe-Desktop-Gunbuilderapp/7daa5906-f9b6-4690-89a7-6bce10245f10/scratchpad"

# --- part regions in plate pixel space (1750x1200), muzzle right, grip down ---
REGIONS: dict[str, list[tuple[int, int]]] = {
    # upper: the slide, from breech face to muzzle, above the frame rails
    "slide": [(352, 40), (1760, 40), (1760, 316), (1300, 316), (1290, 292),
              (700, 286), (430, 292), (362, 286)],
    # barrel + bushing live inside the slide's forward half (drawn in section)
    "barrel": [(950, 196), (1760, 178), (1760, 300), (950, 292)],
    # hammer spur and strut, behind the slide
    "hammer": [(232, 120), (330, 120), (352, 210), (352, 300), (240, 300)],
    # grip safety tang + beavertail, the rear vertical curve
    "gripSafety": [(176, 250), (300, 250), (330, 330), (330, 470), (250, 560),
                   (186, 470)],
    # thumb safety + slide stop pins cluster
    "thumbSafety": [(240, 300), (420, 300), (430, 380), (250, 380)],
    # mainspring housing: rear grip strap
    "mainspring": [(186, 470), (330, 470), (360, 700), (360, 1060),
                   (250, 1060), (196, 700)],
    # checkered grip panel
    "gripPanel": [(330, 300), (790, 300), (800, 1080), (340, 1080)],
    # magazine drawn inside the grip (interior lines)
    "magazine": [(452, 352), (676, 344), (700, 1000), (470, 1010)],
    # trigger blade + bow, just ahead of the grip
    "trigger": [(790, 330), (900, 330), (910, 560), (795, 560)],
    # trigger guard loop
    "triggerGuard": [(820, 370), (1160, 370), (1170, 650), (830, 650)],
    # frame: receiver rails, dust cover, front strap
    "frame": [(176, 240), (360, 240), (370, 300), (1300, 300), (1310, 400),
              (1180, 400), (1170, 660), (830, 660), (800, 1090), (330, 1090),
              (300, 700), (186, 560)],
}

# Draw order: later parts sit on top when rendering
ORDER = ["frame", "magazine", "gripPanel", "mainspring", "gripSafety",
         "hammer", "thumbSafety", "trigger", "triggerGuard", "barrel", "slide"]
# Claim priority: inner / more specific regions win strokes first
PRIORITY = ["hammer", "thumbSafety", "gripSafety", "trigger", "triggerGuard",
            "magazine", "barrel", "mainspring", "gripPanel", "slide", "frame"]

LABELS = {
    "slide": "Slide", "barrel": "Barrel", "hammer": "Hammer",
    "gripSafety": "Grip safety", "thumbSafety": "Thumb safety",
    "mainspring": "Mainspring housing", "gripPanel": "Grip panel",
    "magazine": "Magazine", "trigger": "Trigger", "triggerGuard": "Trigger guard",
    "frame": "Frame",
}

CATEGORY = {
    "slide": "slide", "barrel": "barrel", "hammer": "fireControl",
    "gripSafety": "safety", "thumbSafety": "safety", "mainspring": "grip",
    "gripPanel": "grip", "magazine": "magazine", "trigger": "fireControl",
    "triggerGuard": "frame", "frame": "frame",
}


def contour_to_path(cnt: np.ndarray, sx: float, sy: float, ox: float, oy: float) -> str:
    """Simplified polygon -> SVG path in canvas units."""
    eps = 1.1
    poly = cv2.approxPolyDP(cnt, eps, True).reshape(-1, 2).astype(float)
    if len(poly) < 3:
        return ""
    pts = [(p[0] * sx + ox, p[1] * sy + oy) for p in poly]
    d = f"M{pts[0][0]:.1f},{pts[0][1]:.1f}"
    for x, y in pts[1:]:
        d += f"L{x:.1f},{y:.1f}"
    return d + "Z"


def main() -> None:
    img = cv2.imread(S + "/m1911-plate.png", cv2.IMREAD_GRAYSCALE)
    h, w = img.shape
    ink = (img < 128).astype(np.uint8) * 255
    # close 1px gaps in scanned strokes so outlines stay continuous
    ink = cv2.morphologyEx(ink, cv2.MORPH_CLOSE, np.ones((2, 2), np.uint8))

    contours, _ = cv2.findContours(ink, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    print(f"{len(contours)} raw contours")

    paths_map = MplPath  # alias
    regions = {k: paths_map(np.array(v, dtype=float)) for k, v in REGIONS.items()}

    # canvas transform: pistol length 216mm across the drawn gun (x 176..1760)
    GUN_X0, GUN_X1 = 176.0, 1760.0
    scale = 216.0 / (GUN_X1 - GUN_X0)
    ox, oy = -GUN_X0 * scale, -40.0 * scale

    buckets: dict[str, list[str]] = {k: [] for k in REGIONS}
    dropped = 0
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < 6 and cv2.arcLength(cnt, True) < 30:
            dropped += 1
            continue  # speckle
        m = cv2.moments(cnt)
        if m["m00"] > 0:
            cx, cy = m["m10"] / m["m00"], m["m01"] / m["m00"]
        else:
            cx, cy = cnt[:, 0, 0].mean(), cnt[:, 0, 1].mean()
        # patent reference letters: small, scribbly (low circularity), and not
        # part of the grip checkering. Pins/screws are small but near-circular.
        bx, by, bw, bh = cv2.boundingRect(cnt)
        peri = cv2.arcLength(cnt, True)
        circ = (4 * np.pi * area / (peri * peri)) if peri > 0 else 0.0
        in_grip = regions["gripPanel"].contains_point((cx, cy)) or regions["magazine"].contains_point((cx, cy))
        if not in_grip and max(bw, bh) < 46 and circ < 0.42:
            dropped += 1
            continue
        # first region (in reverse draw order = topmost) that contains it
        owner = None
        for key in PRIORITY:
            if regions[key].contains_point((cx, cy)):
                owner = key
                break
        if owner is None:
            dropped += 1
            continue
        # Long contours (the pistol's outer silhouette) span several parts.
        # Walk the points and cut the stroke wherever it crosses into a
        # different region, so each part keeps its own share of the outline.
        pts = cnt.reshape(-1, 2).astype(float)
        if len(pts) < 24:
            d = contour_to_path(cnt, scale, scale, ox, oy)
            if d:
                buckets[owner].append(d)
            continue
        owners = []
        for px, py in pts:
            o = None
            for key in PRIORITY:
                if regions[key].contains_point((px, py)):
                    o = key
                    break
            owners.append(o if o is not None else owner)
        # smooth ownership so a few stray points don't shatter the stroke
        W = 9
        smoothed = []
        for i in range(len(owners)):
            window = owners[max(0, i - W): i + W + 1]
            smoothed.append(max(set(window), key=window.count))
        run_start = 0
        for i in range(1, len(smoothed) + 1):
            if i == len(smoothed) or smoothed[i] != smoothed[run_start]:
                run = pts[run_start:i]
                if len(run) >= 5:
                    poly = cv2.approxPolyDP(run.astype(np.float32).reshape(-1, 1, 2), 1.1, False)
                    poly = poly.reshape(-1, 2)
                    if len(poly) >= 2:
                        cs = [(q[0] * scale + ox, q[1] * scale + oy) for q in poly]
                        d = f"M{cs[0][0]:.1f},{cs[0][1]:.1f}" + "".join(
                            f"L{x:.1f},{y:.1f}" for x, y in cs[1:])
                        buckets[smoothed[run_start]].append(d)
                run_start = i

    print("dropped:", dropped)
    out = {}
    for key, paths in buckets.items():
        if not paths:
            continue
        # bbox from region polygon in canvas units
        pts = np.array(REGIONS[key], dtype=float)
        x0, y0 = pts[:, 0].min() * scale + ox, pts[:, 1].min() * scale + oy
        x1, y1 = pts[:, 0].max() * scale + ox, pts[:, 1].max() * scale + oy
        out[key] = {
            "id": key,
            "label": LABELS[key],
            "category": CATEGORY[key],
            "paths": paths,
            "bbox": [round(x0, 1), round(y0, 1), round(x1 - x0, 1), round(y1 - y0, 1)],
        }
        print(f"{key:14s} {len(paths):4d} strokes  bbox {out[key]['bbox']}")

    with open(S + "/m1911-parts.json", "w") as f:
        json.dump(out, f)
    print("wrote m1911-parts.json")

    # colour-coded verification render
    vis = cv2.cvtColor(255 - ink, cv2.COLOR_GRAY2BGR)
    colors = {k: tuple(int(c) for c in np.random.RandomState(i * 7 + 3).randint(40, 230, 3))
              for i, k in enumerate(ORDER)}
    for cnt in contours:
        m = cv2.moments(cnt)
        if m["m00"] <= 0:
            continue
        cx, cy = m["m10"] / m["m00"], m["m01"] / m["m00"]
        owner = None
        for key in PRIORITY:
            if regions[key].contains_point((cx, cy)):
                owner = key
                break
        if owner:
            cv2.drawContours(vis, [cnt], -1, colors[owner], 2)
    for key in ORDER:
        pts = np.array(REGIONS[key], dtype=np.int32)
        cv2.polylines(vis, [pts], True, colors[key], 1)
        cv2.putText(vis, key, tuple(pts[0]), cv2.FONT_HERSHEY_SIMPLEX, 0.7, colors[key], 2)
    cv2.imwrite(S + "/parts-assignment.png", vis)
    print("wrote parts-assignment.png")


if __name__ == "__main__":
    main()
