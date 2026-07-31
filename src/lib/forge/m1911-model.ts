/**
 * Procedural M1911 — the pistol as geometry, not as a picture.
 *
 * Every part is generated from a small parameter set at true dimensions
 * (1 unit = 1 mm, muzzle toward +X, grip toward +Y, origin at the rearmost
 * point of the frame on the slide's top line). Proportions follow the
 * M1911A1 spec and Browning's US984,519 plate: 216 mm overall on a 127 mm
 * barrel, 25.4 mm slide, 135 mm tall, grip raked 16°.
 *
 * Because parts are drawn rather than traced, changing a parameter rebuilds
 * the part properly: a longer barrel grows the slide and respaces its
 * serrations instead of smearing a bitmap outline.
 */

export type SlideProfile = "government" | "commander" | "longslide";
export type SerrationStyle = "vertical" | "angled" | "scalloped";
export type HammerStyle = "spur" | "commander" | "skeleton";
export type SightStyle = "gi" | "combat" | "target";
export type TriggerStyle = "solid" | "skeleton" | "long";
export type GripTexture = "checkered" | "smooth" | "stippled";
export type MagLength = "standard" | "extended" | "compact";

export interface M1911Params {
  slideProfile: SlideProfile;
  barrelLength: number;
  slideHeight: number;
  serrations: number;
  serrationStyle: SerrationStyle;
  ejectionPort: boolean;
  sight: SightStyle;
  hammer: HammerStyle;
  trigger: TriggerStyle;
  beavertail: boolean;
  gripAngle: number;
  gripLength: number;
  gripTexture: GripTexture;
  checkerPitch: number;
  magazine: MagLength;
  dustCover: number;
  lightRail: boolean;
}

/** A profile is a barrel-length preset; the slide follows the barrel. */
export const PROFILE_BARREL: Record<SlideProfile, number> = {
  commander: 108,
  government: 127,
  longslide: 152,
};

export const DEFAULT_PARAMS: M1911Params = {
  slideProfile: "government",
  barrelLength: 127,
  slideHeight: 25.4,
  serrations: 16,
  serrationStyle: "vertical",
  ejectionPort: true,
  sight: "gi",
  hammer: "spur",
  trigger: "solid",
  beavertail: false,
  gripAngle: 16,
  gripLength: 101,
  gripTexture: "checkered",
  checkerPitch: 3.2,
  magazine: "standard",
  dustCover: 150,
  lightRail: false,
};

export interface ParamSpec {
  key: keyof M1911Params;
  label: string;
  group: "Slide" | "Frame" | "Grip" | "Controls";
  kind: "number" | "select" | "toggle";
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: { value: string; label: string }[];
}

export const PARAM_SPECS: ParamSpec[] = [
  {
    key: "slideProfile", label: "Pattern", group: "Slide", kind: "select",
    options: [
      { value: "commander", label: "Commander (4¼″)" },
      { value: "government", label: "Government (5″)" },
      { value: "longslide", label: "Longslide (6″)" },
    ],
  },
  { key: "barrelLength", label: "Barrel", group: "Slide", kind: "number", min: 89, max: 178, step: 1, unit: "mm" },
  { key: "slideHeight", label: "Slide height", group: "Slide", kind: "number", min: 22, max: 30, step: 0.2, unit: "mm" },
  { key: "serrations", label: "Serrations", group: "Slide", kind: "number", min: 0, max: 30, step: 1 },
  {
    key: "serrationStyle", label: "Serration cut", group: "Slide", kind: "select",
    options: [
      { value: "vertical", label: "Vertical" },
      { value: "angled", label: "Angled" },
      { value: "scalloped", label: "Scalloped" },
    ],
  },
  { key: "ejectionPort", label: "Ejection port", group: "Slide", kind: "toggle" },
  {
    key: "sight", label: "Sights", group: "Slide", kind: "select",
    options: [
      { value: "gi", label: "GI blade" },
      { value: "combat", label: "Combat" },
      { value: "target", label: "Target rib" },
    ],
  },
  { key: "dustCover", label: "Dust cover", group: "Frame", kind: "number", min: 90, max: 190, step: 1, unit: "mm" },
  { key: "lightRail", label: "Accessory rail", group: "Frame", kind: "toggle" },
  { key: "beavertail", label: "Beavertail tang", group: "Frame", kind: "toggle" },
  { key: "gripAngle", label: "Grip rake", group: "Grip", kind: "number", min: 10, max: 22, step: 0.5, unit: "°" },
  { key: "gripLength", label: "Grip length", group: "Grip", kind: "number", min: 84, max: 118, step: 1, unit: "mm" },
  {
    key: "gripTexture", label: "Panel texture", group: "Grip", kind: "select",
    options: [
      { value: "checkered", label: "Checkered" },
      { value: "smooth", label: "Smooth" },
      { value: "stippled", label: "Stippled" },
    ],
  },
  { key: "checkerPitch", label: "Checker pitch", group: "Grip", kind: "number", min: 2, max: 6, step: 0.2, unit: "mm" },
  {
    key: "magazine", label: "Magazine", group: "Grip", kind: "select",
    options: [
      { value: "compact", label: "Compact" },
      { value: "standard", label: "Standard 7-rd" },
      { value: "extended", label: "Extended 10-rd" },
    ],
  },
  {
    key: "hammer", label: "Hammer", group: "Controls", kind: "select",
    options: [
      { value: "spur", label: "GI spur" },
      { value: "commander", label: "Commander ring" },
      { value: "skeleton", label: "Skeletonised" },
    ],
  },
  {
    key: "trigger", label: "Trigger", group: "Controls", kind: "select",
    options: [
      { value: "solid", label: "Solid short" },
      { value: "skeleton", label: "Skeletonised" },
      { value: "long", label: "Long match" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Path helpers — straight runs and true arcs, no freehand wobble
// ---------------------------------------------------------------------------

type Pt = [number, number];

const r = (n: number) => Math.round(n * 100) / 100;

class P {
  private d = "";
  move(p: Pt) { this.d += `M${r(p[0])},${r(p[1])}`; return this; }
  line(p: Pt) { this.d += `L${r(p[0])},${r(p[1])}`; return this; }
  arc(p: Pt, rad: number, sweep: 0 | 1) {
    this.d += `A${r(rad)},${r(rad)} 0 0 ${sweep} ${r(p[0])},${r(p[1])}`;
    return this;
  }
  curve(c1: Pt, c2: Pt, p: Pt) {
    this.d += `C${r(c1[0])},${r(c1[1])} ${r(c2[0])},${r(c2[1])} ${r(p[0])},${r(p[1])}`;
    return this;
  }
  close() { this.d += "Z"; return this; }
  get out() { return this.d; }
}
const path = () => new P();

function box(x: number, y: number, w: number, h: number, rad = 0): string {
  if (rad <= 0) {
    return path().move([x, y]).line([x + w, y]).line([x + w, y + h]).line([x, y + h]).close().out;
  }
  return path()
    .move([x + rad, y])
    .line([x + w - rad, y]).arc([x + w, y + rad], rad, 1)
    .line([x + w, y + h - rad]).arc([x + w - rad, y + h], rad, 1)
    .line([x + rad, y + h]).arc([x, y + h - rad], rad, 1)
    .line([x, y + rad]).arc([x + rad, y], rad, 1)
    .close().out;
}

function circle(cx: number, cy: number, rad: number): string {
  return path().move([cx - rad, cy]).arc([cx + rad, cy], rad, 1).arc([cx - rad, cy], rad, 1).close().out;
}

// ---------------------------------------------------------------------------
// Derived geometry
// ---------------------------------------------------------------------------

export interface Geometry {
  slideRear: number;
  slideTop: number;
  slideBot: number;
  muzzleX: number;
  frameBot: number;
  tangY: number;
  gripDir: Pt;
  gripTopRear: Pt;
  gripTopFront: Pt;
  buttRear: Pt;
  buttFront: Pt;
  guardFront: number;
  guardRear: number;
  guardBot: number;
  dustNose: number;
  dustBot: number;
}

export function geometry(p: M1911Params): Geometry {
  // Landmarks measured off Browning's US984,519 plate, then parameterised.
  const slideRear = 24;
  const slideTop = 0;
  const slideBot = p.slideHeight;
  const muzzleX = slideRear + p.barrelLength + 63.5;
  const frameBot = slideBot + 32.5;                 // receiver underside at the guard
  const dustBot = slideBot + 16.5;
  const tangY = slideBot - (p.beavertail ? 7 : 0) - 0.5;
  const rad = (p.gripAngle * Math.PI) / 180;
  const gripDir: Pt = [Math.sin(rad), Math.cos(rad)];
  // The tang is the rearmost point; the backstrap bows forward then out to
  // the butt, so the grip is defined by its two real edges.
  const gripTopRear: Pt = [10, slideBot + 4.5];
  const gripTopFront: Pt = [88, frameBot - 1.5];
  const L = p.gripLength;
  const buttRear: Pt = [14 + (L - 97) * 0.28, slideBot + 4.5 + L];
  const buttFront: Pt = [75 + (L - 97) * 0.16, slideBot + 4.5 + L];
  return {
    slideRear, slideTop, slideBot, muzzleX, frameBot, tangY, gripDir,
    gripTopRear, gripTopFront, buttRear, buttFront,
    guardFront: 131, guardRear: 92, guardBot: frameBot + 13,
    dustNose: Math.min(p.dustCover, muzzleX - 30),
    dustBot,
  };
}

/**
 * Any point inside the grip, as a fraction across (u: 0 backstrap -> 1 front
 * strap) and down (v: 0 at the frame -> 1 at the butt). Interpolating the
 * real edges keeps panels and magazines inside the frame at any rake.
 */
export function gripPoint(g: Geometry, u: number, v: number): Pt {
  const top: Pt = [
    g.gripTopRear[0] + (g.gripTopFront[0] - g.gripTopRear[0]) * u,
    g.gripTopRear[1] + (g.gripTopFront[1] - g.gripTopRear[1]) * u,
  ];
  const bot: Pt = [
    g.buttRear[0] + (g.buttFront[0] - g.buttRear[0]) * u,
    g.buttRear[1] + (g.buttFront[1] - g.buttRear[1]) * u,
  ];
  return [top[0] + (bot[0] - top[0]) * v, top[1] + (bot[1] - top[1]) * v];
}

// ---------------------------------------------------------------------------
// Parts
// ---------------------------------------------------------------------------

export interface GeneratedPart {
  id: string;
  label: string;
  slot: string;
  category: string;
  /** Silhouette paths, drawn at full weight and lightly filled. */
  outline: string[];
  /** Detail lines, drawn thinner. */
  paths: string[];
  bbox: [number, number, number, number];
  anchors: Record<string, [number, number]>;
  z: number;
}

function slidePart(p: M1911Params, g: Geometry): GeneratedPart {
  const { slideRear: x0, muzzleX: x1, slideTop: yT, slideBot: yB } = g;
  const outline: string[] = [];
  const det: string[] = [];

  outline.push(
    path()
      .move([x0, yT + 3])
      .arc([x0 + 3, yT], 3, 1)
      .line([x1 - 5, yT])
      .arc([x1, yT + 5], 5, 1)
      .line([x1, yB - 3])
      .arc([x1 - 3, yB], 3, 1)
      .line([x0 + 2, yB])
      .arc([x0, yB - 2], 2, 1)
      .close().out,
  );

  det.push(path().move([x0 + 1, yB - 6]).line([x1 - 3, yB - 6]).out); // frame parting line

  const n = Math.max(0, Math.round(p.serrations));
  const sStart = x0 + 8;
  const sEnd = x0 + 54;
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    const sx = sStart + (sEnd - sStart) * t;
    if (p.serrationStyle === "angled") {
      det.push(path().move([sx, yT + 4]).line([sx - 3, yB - 8]).out);
    } else if (p.serrationStyle === "scalloped") {
      det.push(path().move([sx, yT + 5]).curve([sx - 1.5, yT + 9], [sx - 1.5, yB - 12], [sx, yB - 8]).out);
    } else {
      det.push(path().move([sx, yT + 4]).line([sx, yB - 8]).out);
    }
  }

  if (p.ejectionPort) det.push(box(x0 + 76, yT + 5, 38, 10.5, 2));

  if (p.sight === "gi") {
    det.push(path().move([x0 + 5, yT]).line([x0 + 5, yT - 3.4]).line([x0 + 10, yT - 3.4]).line([x0 + 10, yT]).out);
    det.push(box(x1 - 16, yT - 3, 3.6, 3));
  } else if (p.sight === "combat") {
    det.push(box(x0 + 3, yT - 4.6, 11, 4.6, 1));
    det.push(box(x1 - 18, yT - 4.2, 4.6, 4.2, 1));
  } else {
    det.push(box(x0 + 3, yT - 4.6, x1 - x0 - 22, 4.6, 1));
    for (let rx = x0 + 9; rx < x1 - 22; rx += 6) det.push(path().move([rx, yT - 4.6]).line([rx, yT]).out);
  }

  det.push(path().move([x1 - 13, yT + 3]).line([x1 - 13, yB - 3]).out); // bushing seam

  return {
    id: "slide", label: "Slide", slot: "slide", category: "slide",
    outline, paths: det,
    bbox: [x0, yT - 5, x1 - x0, yB - yT + 5],
    anchors: { mount: [x0 + 12, yB], muzzle: [x1, (yT + yB) / 2] },
    z: 8,
  };
}

function barrelPart(p: M1911Params, g: Geometry): GeneratedPart {
  const yMid = g.slideBot * 0.44;
  const rBore = 5.6;
  const x0 = g.slideRear + 5;
  const x1 = x0 + p.barrelLength;
  const outline = [
    path()
      .move([x0, yMid - rBore - 2.5])
      .line([x1 - 3, yMid - rBore])
      .arc([x1, yMid - rBore + 3], 3, 1)
      .line([x1, yMid + rBore - 3])
      .arc([x1 - 3, yMid + rBore], 3, 1)
      .line([x0, yMid + rBore + 2.5])
      .close().out,
  ];
  const det = [
    path().move([x0 + 3, yMid + rBore + 2.5]).line([x0 + 13, yMid + rBore + 8]).line([x0 + 19, yMid + rBore + 2.5]).out,
    path().move([x0 + 8, yMid]).line([x1 - 5, yMid]).out,
    circle(x1 - 4, yMid, 2.4),
  ];
  return {
    id: "barrel", label: "Barrel", slot: "barrel", category: "barrel",
    outline, paths: det,
    bbox: [x0, yMid - rBore - 3, x1 - x0, rBore * 2 + 11],
    anchors: { mount: [x0, yMid] },
    z: 7,
  };
}

function framePart(p: M1911Params, g: Geometry): GeneratedPart {
  const {
    slideBot: yT, frameBot: yB, dustBot, tangY, gripTopFront,
    buttRear, buttFront, guardFront, guardRear, guardBot, dustNose,
  } = g;
  const tang: Pt = [2, tangY + 1];

  const outline = [
    path()
      .move(tang)
      .curve([tang[0] + 3, tang[1] - 8], [16, yT - 3], [28, yT])           // tang into the rail
      .line([dustNose, yT])                                                 // rail top
      .line([dustNose + 4, yT + 5])
      .line([dustNose + 4, dustBot - 4])
      .line([dustNose - 3, dustBot])                                        // dust-cover underside
      .line([guardFront + 8, dustBot])
      .line([guardFront + 2, yB - 4])
      .line([guardFront, yB])
      .curve([guardFront + 1, yB + 7], [guardFront - 4, guardBot], [guardFront - 14, guardBot])
      .line([guardRear + 8, guardBot])                                      // guard bow
      .curve([guardRear, guardBot], [gripTopFront[0] - 6, guardBot - 6], [gripTopFront[0], gripTopFront[1]])
      .line([buttFront[0], buttFront[1]])                                   // front strap
      .curve(
        [buttFront[0] - 2, buttFront[1] + 8],
        [buttRear[0] + 10, buttRear[1] + 7],
        [buttRear[0], buttRear[1]],
      )                                                                     // butt
      .curve([buttRear[0] + 12, buttRear[1] - 34], [26, tang[1] + 34], tang) // backstrap
      .close().out,
    // trigger guard opening
    path()
      .move([guardFront - 6, yB + 1])
      .curve([guardFront - 5, yB + 7], [guardFront - 10, guardBot - 5], [guardFront - 18, guardBot - 5])
      .line([guardRear + 10, guardBot - 5])
      .curve([guardRear + 4, guardBot - 5], [gripTopFront[0] - 8, guardBot - 9], [gripTopFront[0] - 5, gripTopFront[1] + 2])
      .close().out,
  ];

  const det: string[] = [];
  det.push(path().move([30, yT + 2]).line([dustNose - 3, yT + 2]).out);     // rail line
  det.push(circle(46, yT + 9, 3));                                          // takedown pin
  det.push(circle(76, yT + 10, 2));                                         // slide-stop pin
  if (p.lightRail) {
    for (let rx = dustNose - 38; rx < dustNose - 6; rx += 9) det.push(box(rx, dustBot - 3.2, 5.2, 3.2));
    det.push(path().move([dustNose - 42, dustBot - 3.4]).line([dustNose, dustBot - 3.4]).out);
  }
  if (p.gripTexture !== "smooth") {
    for (let i = 1; i <= 13; i++) {
      const q = gripPoint(g, 1, 0.1 + i * 0.065);
      det.push(path().move([q[0] - 3, q[1]]).line([q[0] + 1, q[1] - 1]).out);
    }
  }

  return {
    id: "frame", label: "Frame", slot: "frame", category: "frame",
    outline, paths: det,
    bbox: [0, tangY - 1, dustNose + 4, buttFront[1] + 10 - tangY],
    anchors: {
      slide: [g.slideRear + 12, yT],
      barrel: [g.slideRear + 6, g.slideBot * 0.45],
      hammer: [14, yT + 1],
      trigger: [100, yB - 10],
      gripPanel: gripPoint(g, 0.16, 0.2),
      magwell: gripPoint(g, 0.3, 0.06),
    },
    z: 1,
  };
}

function gripPanelPart(p: M1911Params, g: Geometry): GeneratedPart {
  const U0 = 0.2, U1 = 0.8, V0 = 0.22, V1 = 0.84;
  const A = gripPoint(g, U0, V0);
  const B = gripPoint(g, U1, V0);
  const C = gripPoint(g, U1, V1);
  const D = gripPoint(g, U0, V1);
  const outline = [path().move(A).line(B).arc(C, 120, 1).line(D).arc(A, 120, 1).close().out];
  const det: string[] = [];
  const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const span = Math.hypot(D[0] - A[0], D[1] - A[1]);
  const across = Math.hypot(B[0] - A[0], B[1] - A[1]);
  if (p.gripTexture === "checkered") {
    const pitch = Math.max(2, p.checkerPitch);
    for (let d = pitch; d < span - 1; d += pitch) {
      const t = d / span;
      det.push(path().move(lerp(A, D, t)).line(lerp(B, C, t)).out);
    }
    for (let d = pitch; d < across - 1; d += pitch) {
      const t = d / across;
      det.push(path().move(lerp(A, B, t)).line(lerp(D, C, t)).out);
    }
  } else if (p.gripTexture === "stippled") {
    for (let d = 3; d < span - 2; d += 4) {
      for (let e = 3; e < across - 2; e += 4) {
        const q = lerp(lerp(A, D, d / span), lerp(B, C, d / span), e / across);
        det.push(circle(q[0], q[1], 0.45));
      }
    }
  }
  for (const v of [0.26, 0.74]) {
    const q = lerp(lerp(A, B, 0.5), lerp(D, C, 0.5), v);
    det.push(circle(q[0], q[1], 3));
    det.push(path().move([q[0] - 2, q[1]]).line([q[0] + 2, q[1]]).out);
  }
  const xs = [A[0], B[0], C[0], D[0]];
  const ys = [A[1], B[1], C[1], D[1]];
  return {
    id: "gripPanel", label: "Grip panel", slot: "gripPanel", category: "grip",
    outline, paths: det,
    bbox: [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)],
    anchors: { mount: [A[0], A[1]] },
    z: 3,
  };
}

const MAG_EXTRA: Record<MagLength, number> = { compact: -12, standard: 0, extended: 16 };

function magazinePart(p: M1911Params, g: Geometry): GeneratedPart {
  const extra = MAG_EXTRA[p.magazine] / p.gripLength; // as a fraction of the grip
  const U0 = 0.3, U1 = 0.68, V0 = 0.08, V1 = 0.95 + extra;
  const A = gripPoint(g, U0, V0);
  const B = gripPoint(g, U1, V0);
  const C = gripPoint(g, U1, V1);
  const D = gripPoint(g, U0, V1);
  const outline = [path().move(A).line(B).line(C).line(D).close().out];
  const det: string[] = [];
  const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  // floorplate, a touch wider than the tube
  const fA = lerp(D, A, -0.03);
  const fB = lerp(C, B, -0.03);
  det.push(path().move(D).line(C).line(fB).line(fA).close().out);
  const holes = p.magazine === "extended" ? 5 : p.magazine === "compact" ? 3 : 4;
  for (let i = 0; i < holes; i++) {
    const t = 0.28 + (0.62 * i) / Math.max(1, holes - 1);
    const q = lerp(lerp(A, D, t), lerp(B, C, t), 0.68);
    det.push(circle(q[0], q[1], 1.4));
  }
  const xs = [A[0], B[0], C[0], D[0], fA[0], fB[0]];
  const ys = [A[1], B[1], C[1], D[1], fA[1], fB[1]];
  return {
    id: "magazine", label: "Magazine", slot: "magwell", category: "magazine",
    outline, paths: det,
    bbox: [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)],
    anchors: { mount: [A[0], A[1]] },
    z: 2,
  };
}

function hammerPart(p: M1911Params, g: Geometry): GeneratedPart {
  const px = 14;
  const py = g.slideBot + 1;
  const outline: string[] = [];
  const det: string[] = [];
  if (p.hammer === "commander") {
    outline.push(path()
      .move([px - 3, py - 3])
      .curve([px - 9, py - 13], [px - 2, py - 21], [px + 5, py - 18])
      .curve([px + 11, py - 15], [px + 8, py - 5], [px + 3, py - 3])
      .close().out);
    det.push(circle(px + 3, py - 14, 3.6));
  } else if (p.hammer === "skeleton") {
    outline.push(path()
      .move([px - 3, py - 3])
      .line([px - 6, py - 16]).line([px + 2, py - 22]).line([px + 8, py - 16])
      .line([px + 4, py - 3]).close().out);
    det.push(circle(px + 1, py - 14, 4.2));
  } else {
    outline.push(path()
      .move([px - 3, py - 3])
      .curve([px - 8, py - 12], [px - 6, py - 20], [px + 2, py - 21])
      .line([px + 9, py - 19]).line([px + 7, py - 15])
      .curve([px + 6, py - 8], [px + 5, py - 5], [px + 3, py - 3])
      .close().out);
    for (let i = 0; i < 4; i++) {
      det.push(path().move([px + 1 + i * 1.8, py - 21 + i * 0.4]).line([px + 2.3 + i * 1.8, py - 18.6 + i * 0.4]).out);
    }
  }
  det.push(circle(px, py - 2, 2));
  return {
    id: "hammer", label: "Hammer", slot: "hammer", category: "fireControl",
    outline, paths: det,
    bbox: [px - 8, py - 23, 20, 23],
    anchors: { pin: [px, py - 2] },
    z: 5,
  };
}

function triggerPart(p: M1911Params, g: Geometry): GeneratedPart {
  const x = 100;
  const yT = g.frameBot - 10;         // face starts up inside the frame
  const yB = g.guardBot - 8;          // hangs down into the guard bow
  const w = p.trigger === "long" ? 7 : 5.5;
  const outline = [
    path()
      .move([x, yT])
      .line([x + w, yT])
      .line([x + w, yB - 2.5])
      .arc([x, yB - 2.5], 2.6, 1)
      .close().out,
  ];
  const det: string[] = [];
  if (p.trigger === "skeleton") {
    det.push(box(x + 1.4, yT + 5, w - 2.8, yB - yT - 11, 1));
  } else if (p.trigger === "long") {
    for (let i = 0; i < 4; i++) {
      det.push(path().move([x + 1, yT + 7 + i * 3]).line([x + w - 1, yT + 7 + i * 3]).out);
    }
  }
  return {
    id: "trigger", label: "Trigger", slot: "trigger", category: "fireControl",
    outline, paths: det,
    bbox: [x - 1, yT, w + 3, yB - yT + 2],
    anchors: { pin: [x, yT] },
    z: 4,
  };
}

function safetiesPart(p: M1911Params, g: Geometry): GeneratedPart {
  const yT = g.slideBot;
  const tangY = g.tangY;
  const outline: string[] = [];
  const det: string[] = [];

  // grip-safety tang: one clean blade following the backstrap
  outline.push(
    path()
      .move([6, tangY + 2])
      .curve([16, tangY + 3], [22, yT + 4], [21, yT + 15])
      .line([11, yT + 18])
      .curve([8, yT + 10], [5, yT + 3], [6, tangY + 2])
      .close().out,
  );

  // thumb safety: pin boss plus a straight paddle
  outline.push(
    path()
      .move([48, yT + 3])
      .line([62, yT + 2])
      .line([63.5, yT + 6])
      .line([48, yT + 8])
      .close().out,
  );
  det.push(circle(45, yT + 5.5, 2.8));
  void p;

  return {
    id: "safeties", label: "Safeties", slot: "safeties", category: "safety",
    outline, paths: det,
    bbox: [4, tangY, 60, yT + 20 - tangY],
    anchors: { pin: [45, yT + 5.5] },
    z: 6,
  };
}

// ---------------------------------------------------------------------------

export function generateM1911(p: M1911Params): GeneratedPart[] {
  const g = geometry(p);
  return [
    framePart(p, g),
    magazinePart(p, g),
    gripPanelPart(p, g),
    triggerPart(p, g),
    hammerPart(p, g),
    safetiesPart(p, g),
    barrelPart(p, g),
    slidePart(p, g),
  ];
}

export const PART_ORDER = [
  "frame", "magazine", "gripPanel", "trigger", "hammer", "safeties", "barrel", "slide",
];
