import json
S = r"C:/Users/leepe/AppData/Local/Temp/claude/c--Users-leepe-Desktop-Gunbuilderapp/7daa5906-f9b6-4690-89a7-6bce10245f10/scratchpad"
A = r"c:/Users/leepe/Desktop/Gunbuilderapp/GunBuilderWeb"
parts = json.load(open(S + "/m1911-parts.json"))
ANCHORS = {
    "frame": {"slideRail": (60, 24), "gripPanel": (46, 60), "magwell": (52, 60),
              "mainspring": (14, 60), "triggerPin": (92, 46), "guard": (100, 48),
              "gripSafetyPin": (16, 33), "safetyPin": (20, 38), "hammerPin": (14, 26)},
    "slide": {"mount": (60, 24), "muzzle": (216, 22), "rail": (60, 2)},
    "barrel": {"mount": (105, 26)}, "hammer": {"pin": (14, 26)},
    "gripSafety": {"pin": (16, 33)}, "thumbSafety": {"pin": (20, 38)},
    "mainspring": {"mount": (14, 60)}, "gripPanel": {"mount": (46, 60)},
    "magazine": {"mount": (52, 60)}, "trigger": {"pin": (92, 46)},
    "triggerGuard": {"mount": (100, 48)},
}
SLOT = {"frame":"frame","slide":"slide","barrel":"barrel","hammer":"hammer",
        "gripSafety":"gripSafety","thumbSafety":"thumbSafety","mainspring":"mainspring",
        "gripPanel":"gripPanel","magazine":"magwell","trigger":"trigger","triggerGuard":"guard"}
LAB = {"slide":"Slide","barrel":"Barrel","hammer":"Hammer","gripSafety":"Grip safety",
       "thumbSafety":"Thumb safety","mainspring":"Mainspring housing","gripPanel":"Grip panel",
       "magazine":"Magazine","trigger":"Trigger","triggerGuard":"Trigger guard","frame":"Frame"}
ORDER = ["frame","magazine","gripPanel","mainspring","gripSafety","hammer",
         "thumbSafety","trigger","triggerGuard","barrel","slide"]
L = ['/**',
 " * M1911 parts library — traced from J. M. Browning's US patent 984,519",
 ' * (filed 1910, granted 1911), a public-domain technical drawing.',
 ' *',
 ' * Each part is a bundle of ink strokes (SVG path data) in shared canvas',
 ' * units: 1 unit = 1 mm, muzzle toward +X, grip toward +Y. Strokes were',
 ' * traced from the original plate and cut only where a stroke crosses from',
 ' * one part into the next, so every part carries its own share of the',
 ' * pistol\'s outline. Nothing here is redrawn by hand.',
 ' */', '',
 'export interface ForgePart {', '  id: string;', '  label: string;',
 '  category: string;', '  /** Socket this part occupies on the frame. */',
 '  slot: string;', '  /** Ink strokes as SVG path data, in canvas units. */',
 '  paths: string[];', '  /** [x, y, w, h] of the part as drawn. */',
 '  bbox: [number, number, number, number];',
 '  /** Named connection points in canvas units. */',
 '  anchors: Record<string, [number, number]>;',
 '  /** Default z-order in the assembled pistol. */', '  z: number;', '}', '',
 'export const M1911_PARTS: ForgePart[] = [']
for i, key in enumerate(ORDER):
    p = parts.get(key)
    if not p: continue
    anc = ", ".join(f'{k}: [{v[0]}, {v[1]}]' for k, v in ANCHORS[key].items())
    bb = [round(float(x), 1) for x in p["bbox"]]
    L += ["  {", f'    id: "{key}",', f'    label: "{LAB[key]}",',
          f'    category: "{p["category"]}",', f'    slot: "{SLOT[key]}",',
          f'    bbox: [{bb[0]}, {bb[1]}, {bb[2]}, {bb[3]}],',
          f'    anchors: {{ {anc} }},', f'    z: {i},', '    paths: [']
    L += [f'      "{d}",' for d in p["paths"]]
    L += ["    ],", "  },"]
L += ["];", ""]
open(A + "/src/lib/forge/m1911-parts.ts", "w", encoding="utf-8").write("\n".join(L))
print("emitted", sum(len(parts[k]["paths"]) for k in parts), "strokes across", len(parts), "parts")
