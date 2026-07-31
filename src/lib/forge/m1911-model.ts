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
export type MuzzleDevice = "none" | "compensator" | "suppressor";
export type OpticFit = "none" | "reflex";
export type LightFit = "none" | "weapon";

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
  muzzleDevice: MuzzleDevice;
  optic: OpticFit;
  light: LightFit;
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
  gripLength: 86,
  gripTexture: "checkered",
  checkerPitch: 4.4,
  magazine: "standard",
  dustCover: 186,
  lightRail: false,
  muzzleDevice: "none",
  optic: "none",
  light: "none",
};

export interface ParamSpec {
  key: keyof M1911Params;
  label: string;
  group: "Slide" | "Frame" | "Grip" | "Controls" | "Attachments";
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
  {
    key: "muzzleDevice", label: "Muzzle", group: "Attachments", kind: "select",
    options: [
      { value: "none", label: "Bare crown" },
      { value: "compensator", label: "Compensator" },
      { value: "suppressor", label: "Suppressor" },
    ],
  },
  {
    key: "optic", label: "Optic", group: "Attachments", kind: "select",
    options: [
      { value: "none", label: "Irons only" },
      { value: "reflex", label: "Reflex sight" },
    ],
  },
  {
    key: "light", label: "Rail device", group: "Attachments", kind: "select",
    options: [
      { value: "none", label: "None" },
      { value: "weapon", label: "Weapon light" },
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

/** A corner: position plus the fillet radius to break it with. */
type Vert = [number, number, number];

/**
 * Closed outline from corners with true tangent fillets — every corner is a
 * real arc of the stated radius and every run between them is straight. The
 * sweep follows the turn direction, so this draws concave corners (a ramp
 * meeting a deck) as correctly as convex ones.
 */
function roundPoly(v: Vert[]): string {
  const n = v.length;
  const unit = (a: Pt, b: Pt): Pt => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const m = Math.hypot(dx, dy) || 1;
    return [dx / m, dy / m];
  };
  const seg = v.map((cur, i) => {
    const prev = v[(i - 1 + n) % n] as Vert;
    const next = v[(i + 1) % n] as Vert;
    const d1 = unit([prev[0], prev[1]], [cur[0], cur[1]]);
    const d2 = unit([cur[0], cur[1]], [next[0], next[1]]);
    const dot = Math.max(-1, Math.min(1, d1[0] * d2[0] + d1[1] * d2[1]));
    const turn = Math.acos(dot);
    const cross = d1[0] * d2[1] - d1[1] * d2[0];
    const rad = cur[2];
    const here: Pt = [cur[0], cur[1]];
    if (!(rad > 0) || turn < 1e-6) return { a: here, b: here, rad: 0, sweep: 1 as 0 | 1 };
    const t = rad * Math.tan(turn / 2);
    return {
      a: [cur[0] - d1[0] * t, cur[1] - d1[1] * t] as Pt,
      b: [cur[0] + d2[0] * t, cur[1] + d2[1] * t] as Pt,
      rad,
      sweep: (cross > 0 ? 1 : 0) as 0 | 1,
    };
  });
  const first = seg[0];
  if (!first) return "";
  const out = path().move(first.b);
  for (let i = 1; i <= n; i++) {
    const s = seg[i % n];
    if (!s) continue;
    out.line(s.a);
    if (s.rad > 0) out.arc(s.b, s.rad, s.sweep);
  }
  return out.close().out;
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
  // Government Model ground truth: 216 long, 135 tall, slide 199 x 25.4,
  // barrel 127, grip 54 front-to-back, trigger reach 68 from the backstrap.
  const slideRear = 17;
  const slideTop = 0;
  const slideBot = p.slideHeight;
  const muzzleX = slideRear + p.barrelLength + 72;
  const dustBot = slideBot + 9.6;                   // dust-cover underside
  const frameBot = dustBot;                         // frame underside ahead of the guard
  const tangY = slideBot + 2.1 - (p.beavertail ? 3 : 0);

  // Both grip edges rake down and back, the front strap a little harder than
  // the backstrap, so the butt sits under the tang and the grip narrows.
  const rakeB = ((p.gripAngle - 9) * Math.PI) / 180;
  const rakeF = ((p.gripAngle - 2) * Math.PI) / 180;
  const gripDir: Pt = [-Math.sin(rakeB), Math.cos(rakeB)];
  const L = p.gripLength;
  const gripTopRear: Pt = [14, slideBot + 18.6];
  const gripTopFront: Pt = [68, slideBot + 22.6];
  const buttRear: Pt = [
    gripTopRear[0] - L * Math.sin(rakeB),
    gripTopRear[1] + L * Math.cos(rakeB),
  ];
  const buttFront: Pt = [
    gripTopFront[0] - (L - 11) * Math.sin(rakeF),
    gripTopFront[1] + (L - 11) * Math.cos(rakeF),
  ];
  return {
    slideRear, slideTop, slideBot, muzzleX, frameBot, tangY, gripDir,
    gripTopRear, gripTopFront, buttRear, buttFront,
    guardFront: 104, guardRear: 81, guardBot: slideBot + 40.6,
    dustNose: Math.min(p.dustCover, muzzleX - 28),
    dustBot,
  };
}

/** A cubic run of the frame outline. A straight leg has its controls at the ends. */
interface Seg { a: Pt; c1: Pt; c2: Pt; b: Pt }

/**
 * The frame's lower boundary, from the top of the front strap round the toe
 * and butt to the top of the mainspring housing.
 *
 * framePart draws itself from these control points and the magazine ray-casts
 * against them to find where its tube leaves the receiver, so the two cannot
 * drift apart when the grip is re-raked or re-lengthened.
 */
function frameLowerEdge(g: Geometry): Seg[] {
  const bF = g.buttFront;
  const bR = g.buttRear;
  const gR = g.gripTopRear;
  const T1: Pt = [bF[0] - 15, bF[1] + 9.5];
  const T2: Pt = [bR[0] + 7, bR[1] + 3];
  const T3: Pt = [bR[0], bR[1] - 4];
  const straight = (a: Pt, b: Pt): Seg => ({ a, c1: a, c2: b, b });
  return [
    straight(g.gripTopFront, bF),                                              // front strap
    { a: bF, c1: [bF[0] - 1, bF[1] + 6], c2: [bF[0] - 7, bF[1] + 9], b: T1 },  // toe
    straight(T1, T2),                                                          // butt
    { a: T2, c1: [bR[0] + 2, bR[1] + 3], c2: [bR[0] - 1, bR[1] + 1], b: T3 },  // heel
    { a: T3, c1: [bR[0] - 1.5, bR[1] - 26], c2: [gR[0] - 6, gR[1] + 22], b: [gR[0] - 0.5, gR[1] - 4] },
  ];
}

function cubicAt(s: Seg, t: number): Pt {
  const k = 1 - t;
  const w = [k * k * k, 3 * k * k * t, 3 * k * t * t, t * t * t];
  return [
    w[0]! * s.a[0] + w[1]! * s.c1[0] + w[2]! * s.c2[0] + w[3]! * s.b[0],
    w[0]! * s.a[1] + w[1]! * s.c1[1] + w[2]! * s.c2[1] + w[3]! * s.b[1],
  ];
}

/** The lower boundary as a polyline, fine enough to intersect against. */
function sampleLowerEdge(g: Geometry, per = 24): Pt[] {
  const pts: Pt[] = [];
  for (const s of frameLowerEdge(g)) {
    for (let i = 0; i <= per; i++) pts.push(cubicAt(s, i / per));
  }
  return pts;
}

/** A cubic as four points, for splitting and measuring. */
type Cubic = [Pt, Pt, Pt, Pt];

const asCubic = (s: Seg): Cubic => [s.a, s.c1, s.c2, s.b];

function bez(c: Cubic, t: number): Pt {
  const k = 1 - t;
  const w = [k * k * k, 3 * k * k * t, 3 * k * t * t, t * t * t];
  return [
    w[0]! * c[0][0] + w[1]! * c[1][0] + w[2]! * c[2][0] + w[3]! * c[3][0],
    w[0]! * c[0][1] + w[1]! * c[1][1] + w[2]! * c[2][1] + w[3]! * c[3][1],
  ];
}

const mid = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** de Casteljau split: L is [0,t], R is [t,1]. */
function splitCubic(c: Cubic, t: number): { L: Cubic; R: Cubic } {
  const p01 = mid(c[0], c[1], t), p12 = mid(c[1], c[2], t), p23 = mid(c[2], c[3], t);
  const a = mid(p01, p12, t), b = mid(p12, p23, t);
  const m = mid(a, b, t);
  return { L: [c[0], p01, a, m], R: [m, b, p23, c[3]] };
}

function cubicLen(c: Cubic, t0: number, t1: number, n = 48): number {
  let total = 0;
  let prev = bez(c, t0);
  for (let i = 1; i <= n; i++) {
    const q = bez(c, t0 + ((t1 - t0) * i) / n);
    total += Math.hypot(q[0] - prev[0], q[1] - prev[1]);
    prev = q;
  }
  return total;
}

/** Bisect for the t where pred flips from false to true. */
function solveT(pred: (t: number) => boolean, iters = 40): number {
  let lo = 0, hi = 1, t = 0.5;
  for (let i = 0; i < iters; i++) {
    t = (lo + hi) / 2;
    if (pred(t)) hi = t; else lo = t;
  }
  return t;
}

/**
 * The frame's tang, as the two cubics framePart draws it with: the top surface
 * running forward from the tang tip onto the rail, and the upper backstrap
 * running from the mainspring housing back up to the tip. The beavertail is
 * cut from these, so it lands on the frame rather than crossing it.
 */
function frameTangEdge(g: Geometry, tangX: number): { top: Cubic; upper: Cubic } {
  const T: Pt = [tangX, g.tangY];
  const gR = g.gripTopRear;
  return {
    top: [T, [tangX + 3, g.tangY - 1.5], [15, g.slideBot], [19.5, g.slideBot]],
    upper: [[gR[0] - 0.5, gR[1] - 4], [gR[0], g.tangY + 8.5], [tangX + 4, g.tangY + 3.5], T],
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

  det.push(path().move([x0 + 3, yB - 4]).line([x1 - 5, yB - 4]).out); // frame parting line

  const n = Math.max(0, Math.round(p.serrations));
  const sStart = x0 + 15;
  const sEnd = x0 + 15 + Math.min(46, (x1 - x0) * 0.24);
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

  if (p.ejectionPort) det.push(box(x0 + 99, yT + 4, Math.min(36, (x1 - x0) * 0.19), 10, 2));

  // A slide milled for an optic has had the rear dovetail cut away — you can't
  // have the blade and the sight in the same slot.
  if (p.optic !== "none") {
    const cut0 = x0 + 42;
    const cut1 = x0 + 96;
    det.push(path().move([cut0 - 3, yT]).line([cut0, yT + 2.6])
      .line([cut1, yT + 2.6]).line([cut1 + 3, yT]).out);
  } else if (p.sight === "gi") {
    det.push(path().move([x0 + 5, yT]).line([x0 + 5, yT - 3.4]).line([x0 + 10, yT - 3.4]).line([x0 + 10, yT]).out);
    det.push(box(x1 - 16, yT - 3, 3.6, 3));
  } else if (p.sight === "combat") {
    det.push(box(x0 + 3, yT - 4.6, 11, 4.6, 1));
    det.push(box(x1 - 18, yT - 4.2, 4.6, 4.2, 1));
  } else {
    det.push(box(x0 + 3, yT - 4.6, x1 - x0 - 22, 4.6, 1));
    for (let rx = x0 + 9; rx < x1 - 22; rx += 6) det.push(path().move([rx, yT - 4.6]).line([rx, yT]).out);
  }

  det.push(circle(x1 - 11, yB * 0.5, yB * 0.33));   // barrel bushing
  det.push(circle(x1 - 11, yB * 0.5, yB * 0.18));   // muzzle crown

  return {
    id: "slide", label: "Slide", slot: "slide", category: "slide",
    outline, paths: det,
    bbox: [x0, yT - 5, x1 - x0, yB - yT + 5],
    anchors: {
      mount: [x0 + 12, yB],
      muzzle: [x1, (yT + yB) / 2],
      optic: [x0 + 60, yT],          // where an optic cut would be milled
    },
    z: 8,
  };
}

function barrelPart(p: M1911Params, g: Geometry): GeneratedPart {
  // The barrel is measured breech face to muzzle, so it sits at the front of
  // the slide with the breech block behind it.
  const yMid = g.slideBot * 0.5;
  const rBore = 5.6;
  const x1 = g.muzzleX;
  const x0 = x1 - p.barrelLength;
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
    path().move([x0 + 3, yMid + rBore]).line([x0 + 11, yMid + rBore + 4.4]).line([x0 + 19, yMid + rBore]).out, // lower lug
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
    slideBot: yb, dustBot, tangY, gripTopRear, gripTopFront,
    buttRear, buttFront, guardFront: gf, guardBot, dustNose: dn,
  } = g;
  const tangX = p.beavertail ? 4 : 8;
  const lower = frameLowerEdge(g);

  const outline = [
    path()
      .move([tangX, tangY])
      .curve([tangX + 3, tangY - 1.5], [15, yb], [19.5, yb])                // tang into the rail
      .line([dn - 2, yb])                                                    // frame rail
      .curve([dn + 1, yb], [dn + 2, yb + 2], [dn + 2, yb + 5])               // dust-cover nose
      .line([dn + 2, dustBot - 2])
      .curve([dn + 2, dustBot], [dn, dustBot], [dn - 3, dustBot])
      .line([gf + 4, dustBot])                                               // dust-cover underside
      .curve([gf + 1, dustBot + 2], [gf, dustBot + 5], [gf, dustBot + 9])    // shoulder into the pillar
      .curve([gf, guardBot - 8], [gf - 5, guardBot], [gf - 14, guardBot])
      .line([gripTopFront[0] + 13, guardBot])                                // guard bow floor
      .curve(
        [gripTopFront[0] + 5, guardBot - 0.5],
        [gripTopFront[0] + 0.5, guardBot - 7],
        gripTopFront,
      )
      .line(buttFront)                                                       // front strap
      // toe, butt, heel and mainspring housing — shared with the magazine
      .curve(lower[1]!.c1, lower[1]!.c2, lower[1]!.b)
      .line(lower[2]!.b)
      .curve(lower[3]!.c1, lower[3]!.c2, lower[3]!.b)
      .curve(lower[4]!.c1, lower[4]!.c2, lower[4]!.b)
      .curve([gripTopRear[0], tangY + 8.5], [tangX + 4, tangY + 3.5], [tangX, tangY])
      .close().out,
    // trigger guard opening: taller at the front, sweeping back to the trigger
    path()
      .move([71, yb + 16.6])
      .line([gf - 10, yb + 16.6])
      .curve([gf - 6.5, yb + 20.6], [gf - 6, yb + 27.6], [gf - 10, yb + 31.6])
      .curve([gf - 14, guardBot - 5.5], [gf - 22, guardBot - 5.5], [gf - 27, yb + 33.1])
      .curve([72.5, yb + 31.1], [70.5, yb + 24.6], [71, yb + 16.6])
      .close().out,
  ];

  const det: string[] = [];
  det.push(circle(60, yb + 5.6, 4.6));                                       // slide-stop pin
  det.push(circle(60, yb + 5.6, 1.5));
  det.push(circle(gf - 7, yb + 5.6, 2.2));                                   // hammer pin
  det.push(circle(63, yb + 18.6, 3.4));                                      // magazine release
  // grip-safety seam
  det.push(path().move([tangX + 5, yb + 4.6]).curve([12, yb + 10.1], [11.5, yb + 15.6], [12.5, yb + 21.6]).out);
  // thumb safety paddle
  det.push(
    path()
      .move([17, yb + 5.6])
      .curve([17, yb + 3.1], [20, yb + 2.4], [22, yb + 3.4])
      .line([34, yb + 4.6])
      .curve([37, yb + 5.1], [37, yb + 9.1], [34, yb + 9.6])
      .line([21, yb + 10.6])
      .curve([18, yb + 10.8], [17, yb + 8.6], [17, yb + 5.6])
      .close().out,
  );
  if (p.lightRail) {
    for (let rx = dn - 40; rx < dn - 6; rx += 9) det.push(box(rx, dustBot - 3.2, 5.2, 3.2));
    det.push(path().move([dn - 44, dustBot - 3.4]).line([dn, dustBot - 3.4]).out);
  }
  if (p.gripTexture !== "smooth") {
    for (let i = 1; i <= 13; i++) {
      const q = gripPoint(g, 1, 0.08 + i * 0.065);
      det.push(path().move([q[0] - 4.2, q[1] + 0.9]).line([q[0] - 0.6, q[1] - 0.7]).out);
    }
  }

  return {
    id: "frame", label: "Frame", slot: "frame", category: "frame",
    outline, paths: det,
    bbox: [0, tangY - 1, dn + 2, buttFront[1] + 13 - tangY],
    anchors: {
      slide: [g.slideRear + 12, yb],
      barrel: [g.slideRear + 6, g.slideBot * 0.45],
      hammer: [16, yb + 3],
      trigger: [76, yb + 16.6],
      gripPanel: gripPoint(g, 0.15, 0.06),
      magwell: gripPoint(g, 0.33, 0.1),
      rail: [dn - 30, dustBot],      // accessory rail under the dust cover
      tang: [tangX, tangY],          // grip-safety pivot
    },
    z: 1,
  };
}

const PANEL_U: [number, number] = [0.15, 0.85];
const PANEL_V: [number, number] = [0.06, 0.92];

/**
 * Diamond checkering. The lines run at 45 degrees in *millimetre* space, not
 * in patch space, so the diamonds stay square however the grip is raked or
 * tapered — a straight uv grid shears into parallelograms and reads as mesh.
 */
function checkerLines(g: Geometry, pitch: number): string[] {
  const [u0, u1] = [PANEL_U[0] + 0.06, PANEL_U[1] - 0.06];
  const [v0, v1] = [PANEL_V[0] + 0.035, PANEL_V[1] - 0.035];
  const at = (s: number, t: number) => gripPoint(g, u0 + (u1 - u0) * s, v0 + (v1 - v0) * t);
  const w = Math.hypot(at(1, 0.5)[0] - at(0, 0.5)[0], at(1, 0.5)[1] - at(0, 0.5)[1]);
  const h = Math.hypot(at(0.5, 1)[0] - at(0.5, 0)[0], at(0.5, 1)[1] - at(0.5, 0)[1]);
  if (w <= 0 || h <= 0) return [];
  const m0 = w / h;                                   // dt/ds for a 45-degree line
  const step = (pitch * Math.SQRT2) / h;
  const out: string[] = [];
  for (const sign of [1, -1]) {
    const m = m0 * sign;
    const stop = sign > 0 ? 1 : 1 + m0;
    for (let b = (sign > 0 ? -m0 : 0) + step * 0.5; b < stop; b += step) {
      const sA = -b / m;
      const sB = (1 - b) / m;
      const lo = Math.max(0, Math.min(sA, sB));
      const hi = Math.min(1, Math.max(sA, sB));
      if (hi - lo <= 1e-4) continue;
      out.push(path().move(at(lo, m * lo + b)).line(at(hi, m * hi + b)).out);
    }
  }
  return out;
}

function gripPanelPart(p: M1911Params, g: Geometry): GeneratedPart {
  const [U0, U1] = PANEL_U;
  const [V0, V1] = PANEL_V;
  const A = gripPoint(g, U0, V0);
  const B = gripPoint(g, U1, V0);
  const C = gripPoint(g, U1, V1);
  const D = gripPoint(g, U0, V1);
  const outline = [path().move(A).line(B).arc(C, 180, 1).line(D).arc(A, 180, 1).close().out];
  const det: string[] = [];
  const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const span = Math.hypot(D[0] - A[0], D[1] - A[1]);
  const across = Math.hypot(B[0] - A[0], B[1] - A[1]);
  if (p.gripTexture === "checkered") {
    det.push(...checkerLines(g, Math.max(2, p.checkerPitch)));
  } else if (p.gripTexture === "stippled") {
    for (let d = 3; d < span - 2; d += 4) {
      for (let e = 3; e < across - 2; e += 4) {
        const q = lerp(lerp(A, D, d / span), lerp(B, C, d / span), e / across);
        det.push(circle(q[0], q[1], 0.45));
      }
    }
  }
  for (const v of [0.3, 0.74]) {
    const q = lerp(lerp(A, B, 0.5), lerp(D, C, 0.5), v);
    det.push(circle(q[0], q[1], 3));
    det.push(path().move([q[0] - 2.3, q[1] + 0.9]).line([q[0] + 2.3, q[1] - 0.9]).out);
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

/**
 * M1911A1 seven-round .45 ACP box magazine.
 *
 * Dimensions off the Springfield Armory sheets (C8694 assembly, C8695 tube,
 * B7310043 base). The tube is 34.8 front-to-back on the drawing because a .45
 * round is 32.4 long and lies across the box — in side elevation you see the
 * cartridge end to end, which is why a magazine looks wide here and narrow
 * from the front. Scaled to 33 so it holds the true 0.61 tube-to-grip ratio
 * against this frame's 54 mm grip.
 *
 * The tube is a straight parallel box, never a wedge: it runs parallel to the
 * front strap at a constant stand-off (the receiver wall) and rakes with the
 * grip. Its bottom is found by ray-casting each wall against the frame's own
 * lower edge, so the floorplate lands flush on the butt at any rake or grip
 * length rather than at a guessed line.
 */
const MAG_W = 33;          // tube, front to back
const MAG_GAP = 4;         // stand-off from the front strap = receiver wall
const MAG_LIP_DROP = 2.6;  // feed-lip peak, below the frame rail
const MAG_U_PEAK = 0.32;   // peak, across the tube from the front wall
const MAG_FRONT_DROP = 10.6;
const MAG_REAR_DROP = 7.3;
const MAG_PLATE_T = 3;
const MAG_PLATE_OVER = 1.5;
const MAG_HOLE_PITCH = 12.4;   // one .45 ACP case diameter
const MAG_HOLE_U = [0.79, 0.42];

const v2 = {
  add: (a: Pt, b: Pt, k = 1): Pt => [a[0] + b[0] * k, a[1] + b[1] * k],
  sub: (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]],
  len: (a: Pt) => Math.hypot(a[0], a[1]),
  unit: (a: Pt): Pt => {
    const l = Math.hypot(a[0], a[1]) || 1;
    return [a[0] / l, a[1] / l];
  },
};

/** Intersection of line (A + s*u) with line (B + t*v). */
function meet(A: Pt, u: Pt, B: Pt, v: Pt): Pt {
  const den = u[0] * v[1] - u[1] * v[0];
  if (Math.abs(den) < 1e-9) return A;
  const s = ((B[0] - A[0]) * v[1] - (B[1] - A[1]) * v[0]) / den;
  return [A[0] + u[0] * s, A[1] + u[1] * s];
}

/** How far down its own axis a wall runs before it leaves the receiver. */
function exitAt(A: Pt, d: Pt, edge: Pt[], tMin: number): number {
  let best = Infinity;
  for (let i = 0; i + 1 < edge.length; i++) {
    const a = edge[i]!;
    const b = edge[i + 1]!;
    const w = v2.sub(b, a);
    const den = d[0] * -w[1] - d[1] * -w[0];
    if (Math.abs(den) < 1e-9) continue;
    const rx = a[0] - A[0];
    const ry = a[1] - A[1];
    const t = (rx * -w[1] - ry * -w[0]) / den;   // along the wall
    const s = (d[0] * ry - d[1] * rx) / den;     // along the edge segment
    if (s >= 0 && s <= 1 && t > tMin && t < best) best = t;
  }
  return best;
}

function magazinePart(p: M1911Params, g: Geometry): GeneratedPart {
  const kind = p.magazine;
  const { add, sub, unit, len } = v2;

  // Tube axis = the front strap, so the magazine rakes with the grip.
  const d = unit(sub(g.buttFront, g.gripTopFront));
  const n: Pt = [-d[1], d[0]];                       // across the tube, rearwards
  const F0 = add(g.gripTopFront, n, MAG_GAP);        // front wall at the grip top
  const R0 = add(F0, n, MAG_W);                      // rear wall at the grip top
  const at = (u: number, t: number): Pt => add(add(F0, n, u), d, t);

  // Feed lips ride just under the frame rail.
  const tPeak = (g.slideBot + MAG_LIP_DROP - F0[1] - n[1] * (MAG_U_PEAK * MAG_W)) / d[1];
  const PK = at(MAG_U_PEAK * MAG_W, tPeak);
  const FT = at(0, tPeak + MAG_FRONT_DROP);
  const RT = at(MAG_W, tPeak + MAG_REAR_DROP);

  // Bottom: cut where the receiver ends so the floorplate lands on the butt.
  const edge = sampleLowerEdge(g);
  const drop = kind === "compact" ? -12 : 0;         // flush with the butt
  const fall = len(sub(g.buttFront, g.gripTopFront)) + 12;
  const hit = (A: Pt) => {
    const t = exitAt(A, d, edge, tPeak);
    return Number.isFinite(t) ? t : fall;
  };
  // Each wall is cut where it actually leaves the receiver, so the floorplate
  // lands flush along the whole butt. The frame's butt is not quite square to
  // the grip axis, so a square-cut base would sit proud at the toe and buried
  // at the heel; the tube itself is hidden behind the panel, so only the plate
  // has to agree with the frame.
  const P0 = at(0, hit(F0) + drop);
  const P1 = at(MAG_W, hit(R0) + drop);
  const e = unit(sub(P1, P0));                       // along the butt, rearwards
  const m: Pt = [e[1], -e[0]];                       // off the butt, downwards
  const tubeBot = add(P0, m, -MAG_PLATE_T);
  const FB = meet(F0, d, tubeBot, e);
  const RB = meet(R0, d, tubeBot, e);

  const outline = [
    roundPoly([
      [FB[0], FB[1], 0], [FT[0], FT[1], 2], [PK[0], PK[1], 2.4],
      [RT[0], RT[1], 3.5], [RB[0], RB[1], 0],
    ]),
  ];

  // Floorplate, proud of the tube fore and aft.
  const PF = add(meet(F0, d, P0, e), e, -MAG_PLATE_OVER);
  const PR = add(meet(R0, d, P0, e), e, MAG_PLATE_OVER);
  const pfT = add(PF, m, -MAG_PLATE_T);
  const prT = add(PR, m, -MAG_PLATE_T);
  outline.push(roundPoly([
    [pfT[0], pfT[1], 0.6], [prT[0], prT[1], 0.6], [PR[0], PR[1], 0.6], [PF[0], PF[1], 0.6],
  ]));

  const det: string[] = [];
  // the dimple the mainspring housing's plate drops into
  const pMid = add(add(PF, e, len(sub(PR, PF)) * 0.42), m, -MAG_PLATE_T * 0.5);
  const dim = (du: number, dv: number) => add(add(pMid, e, du), m, dv);
  det.push(roundPoly([
    [...dim(-3.6, -0.75), 0] as Vert, [...dim(3.6, -0.75), 0] as Vert,
    [...dim(3.6, 0.75), 0] as Vert, [...dim(-3.6, 0.75), 0] as Vert,
  ]));

  if (kind === "extended") {
    const a0 = add(PF, e, -2);
    const a1 = add(PR, e, 2);
    const b1 = add(a1, m, 13);
    const b0 = add(a0, m, 13);
    outline.push(roundPoly([
      [a0[0], a0[1], 0], [a1[0], a1[1], 0], [b1[0], b1[1], 2.4], [b0[0], b0[1], 2.4],
    ]));
    det.push(path()
      .move(add(add(a0, m, 6.8), e, 2.4))
      .line(add(add(a1, m, 6.8), e, -2.4)).out);
  }

  // Witness holes: two staggered columns one cartridge pitch apart.
  const holes = kind === "extended" ? 6 : kind === "compact" ? 4 : 5;
  for (let i = 0; i < holes; i++) {
    const q = at(MAG_HOLE_U[i % 2]! * MAG_W, tPeak + 28 + i * MAG_HOLE_PITCH);
    det.push(circle(q[0], q[1], 2));
  }

  // Magazine-catch notch, open on the front wall so it reads as a cut into the
  // silhouette rather than a rectangle floating inside it.
  const tN = (g.slideBot + 24 - F0[1]) / d[1];
  det.push(path()
    .move(at(0.4, tN))
    .line(at(7.3, tN))
    .arc(at(8, tN + 0.7), 0.7, 0)
    .line(at(8, tN + 3.3))
    .arc(at(7.3, tN + 4), 0.7, 0)
    .line(at(0.4, tN + 4)).out);

  // The far feed lip: starts on the peak and lands on the rear wall, so both
  // ends terminate on the silhouette instead of in mid-air.
  det.push(path()
    .move(PK)
    .line(at(MAG_W * 0.62, tPeak + 3.4))
    .line(RT).out);

  const xs = [FB, FT, PK, RT, RB, PF, PR].map((q) => q[0]);
  const ys = [FB, FT, PK, RT, RB, PF, PR].map((q) => q[1]);
  return {
    id: "magazine", label: "Magazine", slot: "magwell", category: "magazine",
    outline, paths: det,
    bbox: [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)],
    anchors: { lips: PK, base: P0 },
    z: 2,
  };
}

function hammerPart(p: M1911Params, g: Geometry): GeneratedPart {
  // At full cock. The neck below the tang is covered by the frame; what shows
  // is the spur, a flat paddle angled up and back over the grip safety.
  const yb = g.slideBot;
  const outline: string[] = [];
  const det: string[] = [];
  if (p.hammer === "commander") {
    outline.push(path()
      .move([20, yb + 5.6])
      .curve([19, yb - 1], [17, yb - 6], [13, yb - 9.5])
      .curve([8, yb - 13.5], [1.5, yb - 10], [3, yb - 4])
      .curve([4.5, yb - 1], [9, yb + 2], [13, yb + 5.6])
      .close().out);
    det.push(circle(8.5, yb - 6.5, 3.6));
  } else if (p.hammer === "skeleton") {
    outline.push(path()
      .move([20, yb + 5.6])
      .curve([19.5, yb + 0.6], [18.5, yb - 3.9], [17.5, yb - 6.4])
      .line([8, yb - 18.4])
      .curve([6, yb - 20.2], [3.2, yb - 19], [2.6, yb - 16.6])
      .curve([2.2, yb - 15.2], [2.5, yb - 14.8], [3, yb - 14.4])
      .line([12.5, yb - 2.4])
      .curve([13, yb + 0.6], [13, yb + 3.1], [13, yb + 5.6])
      .close().out);
    det.push(circle(8.5, yb - 9, 2.8));
  } else {
    outline.push(path()
      .move([20, yb + 5.6])
      .curve([19.5, yb + 0.6], [18.5, yb - 3.9], [17.5, yb - 6.4])   // neck, front edge
      .line([8, yb - 18.4])                                          // spur top edge
      .curve([6, yb - 20.2], [3.2, yb - 19], [2.6, yb - 16.6])       // squared tip
      .curve([2.2, yb - 15.2], [2.5, yb - 14.8], [3, yb - 14.4])
      .line([12.5, yb - 2.4])                                        // spur underside
      .curve([13, yb + 0.6], [13, yb + 3.1], [13, yb + 5.6])         // neck, rear edge
      .close().out);
  }
  return {
    id: "hammer", label: "Hammer", slot: "hammer", category: "fireControl",
    outline, paths: det,
    bbox: [2, yb - 21, 19, 27],
    anchors: { pin: [16, yb + 3] },
    z: 5,
  };
}

function triggerPart(p: M1911Params, g: Geometry): GeneratedPart {
  // Flat-face shoe hanging at the rear of the guard opening, just ahead of the
  // magwell — the bow has to clear the magazine, which fixes it there.
  const x = 72;
  const yT = g.slideBot + 16.6;       // hangs from the frame, level with the opening
  const w = p.trigger === "long" ? 9 : 7.5;
  const yB = yT + (p.trigger === "long" ? 12.5 : 9.5);
  const outline = [
    path()
      .move([x, yT])
      .line([x + w, yT])
      .line([x + w, yB])
      .curve([x + w, yB + 3], [x + w - 2.5, yB + 4.3], [x + w - 4.9, yB + 3.3])
      .curve([x + 0.8, yB + 2.5], [x, yB + 0.5], [x, yB - 2])
      .close().out,
  ];
  const det: string[] = [];
  if (p.trigger === "skeleton") {
    det.push(box(x + 1.8, yT + 3, w - 3.6, yB - yT - 2, 1));
  } else if (p.trigger === "long") {
    for (let i = 0; i < 4; i++) {
      det.push(path().move([x + 1.2, yT + 3 + i * 2.6]).line([x + w - 1.2, yT + 3 + i * 2.6]).out);
    }
  }
  return {
    id: "trigger", label: "Trigger", slot: "trigger", category: "fireControl",
    outline, paths: det,
    bbox: [x - 1, yT, w + 3, yB - yT + 6],
    anchors: { pin: [x, yT] },
    z: 4,
  };
}

// ---------------------------------------------------------------------------
// Attachments — fitted parts, each anchored to a socket on its host
// ---------------------------------------------------------------------------

/**
 * Extended beavertail grip safety, memory-bump pattern.
 *
 * Cut from the frame's own tang and backstrap curves: the top surface
 * continues the frame's top line, the blade runs 38 mm of backstrap arc down
 * from the tang, and the front seam is closed by the .250 in radius relief cut
 * centred on the thumb-safety pin — the cut a smith actually makes to fit one.
 */
function beavertailPart(p: M1911Params, g: Geometry): GeneratedPart {
  void p;
  const yb = g.slideBot;
  const tangX = 4;                                   // fitted tang sits further back
  const T: Pt = [tangX, g.tangY];
  const { top: topEdge, upper } = frameTangEdge(g, tangX);
  const msh = asCubic(frameLowerEdge(g)[4]!);

  // .250 in relief centred on the thumb-safety pin.
  const R = 6.35;
  const pin: Pt = [g.slideRear + 2, yb + 5.6];
  const tA = solveT((t) => {
    const q = bez(topEdge, t);
    return Math.hypot(q[0] - pin[0], q[1] - pin[1]) <= R;
  });
  const A = bez(topEdge, tA);
  const topSeg = splitCubic(topEdge, tA).L;
  const ang = (125 * Math.PI) / 180;
  const B: Pt = [pin[0] + R * Math.cos(ang), pin[1] + R * Math.sin(ang)];

  // Web pocket: the most forward point of the upper backstrap.
  let tPocket = 0;
  for (let i = 0; i <= 200; i++) {
    if (bez(upper, i / 200)[0] > bez(upper, tPocket)[0]) tPocket = i / 200;
  }
  const pocket = bez(upper, tPocket);
  const upSeg = splitCubic(upper, tPocket).L;

  // Blade runs 38 mm of backstrap arc down from the tang.
  const upLen = cubicLen(upper, 0, 1);
  const tb = solveT((t) => upLen + cubicLen(msh, t, 1) <= 38);
  const heel = bez(msh, tb);
  const lowSeg = splitCubic(msh, tb).R;

  /** The backstrap point at a given height, in the blade region. */
  const bs = (y: number): Pt => bez(msh, solveT((t) => bez(msh, t)[1] <= y));

  const tipTop: Pt = [tangX - 7, g.tangY + 2.7];
  const tipBot: Pt = [tangX - 5.9, g.tangY + 6.3];
  const seamKnee: Pt = [18.8, yb + 24.6];
  const seamBot: Pt = [16.5, yb + 36.6];
  const joint: Pt = [15.4, yb + 39.1];

  const outline = [
    path()
      .move(A)
      .curve(topSeg[2], topSeg[1], T)                       // frame's own top line
      .curve([tangX - 1.8, g.tangY + 0.9], [tangX - 4.2, g.tangY + 1.7], tipTop)
      .arc(tipBot, 2, 0)
      .curve([tipBot[0] + 3.6, tipBot[1] + 0.4], [pocket[0], pocket[1] - 2.1], pocket)
      .curve(upSeg[2], upSeg[1], upper[0])                  // the part IS the backstrap here
      .curve(lowSeg[1], lowSeg[2], heel)
      .line(joint)                                          // joint with the mainspring housing
      .arc(seamBot, 2, 0)
      .curve([17.4, yb + 32.6], [seamKnee[0], seamKnee[1] + 4], seamKnee)
      .curve([18.8, yb + 18.6], [B[0] + 3.7, B[1] + 2.6], B)
      .arc(A, R, 1)
      .close().out,
  ];

  // Memory-groove pad.
  const padTopY = yb + 22.1, padBotY = yb + 35.1;
  const pt0 = bs(padTopY), pb0 = bs(padBotY);
  const REAR = 0.9, FRONT = 5.6, PR = 1.4;
  const det = [
    path()
      .move([pt0[0] + REAR + PR, padTopY])
      .line([pt0[0] + FRONT - PR, padTopY]).arc([pt0[0] + FRONT, padTopY + PR], PR, 1)
      .line([pb0[0] + FRONT, padBotY - PR]).arc([pb0[0] + FRONT - PR, padBotY], PR, 1)
      .line([pb0[0] + REAR + PR, padBotY]).arc([pb0[0] + REAR, padBotY - PR], PR, 1)
      .line([pt0[0] + REAR, padTopY + PR]).arc([pt0[0] + REAR + PR, padTopY], PR, 1)
      .close().out,
  ];
  for (let i = 0; i < 4; i++) {
    const y = padTopY + 2.6 + i * 2.4;
    const q = bs(y);
    det.push(path().move([q[0] + REAR + 0.7, y]).line([q[0] + FRONT - 0.7, y]).out);
  }
  // hammer pocket: the countersink that lets a ring hammer drop in
  det.push(path()
    .move([tangX + 1.6, g.tangY + 0.8])
    .curve([tangX - 1.7, g.tangY + 2.2], [tangX - 4.6, g.tangY + 2.9], [tipTop[0] + 1.4, tipTop[1] + 1.5])
    .out);

  return {
    id: "beavertail", label: "Beavertail safety", slot: "tang", category: "safety",
    outline, paths: det,
    bbox: [tangX - 7, g.tangY - 2, 30, yb + 41 - g.tangY],
    anchors: { pin: pin },
    z: 6,
  };
}

function compensatorPart(p: M1911Params, g: Geometry): GeneratedPart {
  void p;
  const OAL = 54.61;
  const yc = g.slideBot / 2;
  const R = Math.min(25.27, g.slideBot * 0.995) / 2;
  const yT = yc - R;
  const yB = yc + R;
  const face = g.muzzleX;
  const x0 = face;                           // butts the muzzle plane, no overlap
  const x1 = face + OAL;
  const chamR = R * 0.596;
  const roof = yc - chamR;
  const chamBot = yc + chamR;
  const bore = 5.08;                         // .400 in through hole
  const thread = 8.7;                        // .685-40 thread bore
  const pr = 1.2, cr = 2, rr = 1.5;
  const ports: [number, number][] = [
    [face + 7, face + 17],                   // oversize, takes the first hit
    [face + 21, face + 29.5],
    [face + 33.5, face + 42],
  ];
  const relX = face + 8;                     // guide-rod head relief, bottom rear
  const relD = 2;

  const body = path().move([x0, yT]);
  for (const [a, b] of ports) {
    body
      .line([a, yT])
      .line([a, roof - pr]).arc([a + pr, roof], pr, 0)
      .line([b - pr, roof]).arc([b, roof - pr], pr, 0)
      .line([b, yT]);
  }
  body
    .line([x1 - cr, yT]).arc([x1, yT + cr], cr, 1)
    .line([x1, yB - cr]).arc([x1 - cr, yB], cr, 1)
    .line([relX + rr, yB]).arc([relX, yB - rr], rr, 1)
    .line([relX, yB - relD + rr]).arc([relX - rr, yB - relD], rr, 0)
    .line([x0, yB - relD])
    .line([x0, yT])
    .close();

  const chamStart = face + 5.6;
  const chamEnd = face + 42;
  const crown = chamEnd + 4;                 // cone from the chamber down to the bore
  const seg = (ax: number, ay: number, bx: number, by: number) =>
    path().move([ax, ay]).line([bx, by]).out;

  // Everything the bullet passes through, in side elevation: thread bore, the
  // step onto the expansion chamber, the chamber itself, the cone, then the
  // .400 bore out to the muzzle face. No line ends in mid-air.
  const det = [
    seg(x0, yT, x0, yB - relD),                          // joint with the barrel
    seg(x0, yc - thread, chamStart, yc - thread),        // thread bore
    seg(x0, yc + thread, chamStart, yc + thread),
    seg(chamStart, yc - thread, chamStart, roof),        // step onto the chamber
    seg(chamStart, chamBot, chamStart, yc + thread),
    seg(chamStart, chamBot, chamEnd, chamBot),           // chamber floor
    seg(chamEnd, roof, crown, yc - bore),                // cone into the bore
    seg(chamEnd, chamBot, crown, yc + bore),
    seg(crown, yc - bore, x1, yc - bore),                // bore to the muzzle face
    seg(crown, yc + bore, x1, yc + bore),
    seg(x1 - 2.2, yc - bore, x1, yc - bore - 1.6),       // crown chamfer
    seg(x1 - 2.2, yc + bore, x1, yc + bore + 1.6),
  ];
  // Chamber roof, broken where the ports cut through it.
  const roofRuns: [number, number][] = [
    [chamStart, ports[0]![0]],
    [ports[0]![1], ports[1]![0]],
    [ports[1]![1], ports[2]![0]],
    [ports[2]![1], chamEnd],
  ];
  for (const [a, b] of roofRuns) {
    if (b - a > 2.5) det.push(seg(a, roof, b, roof));
  }

  return {
    id: "compensator", label: "Compensator", slot: "muzzle", category: "muzzle",
    outline: [body.out], paths: det,
    bbox: [x0, yT, x1 - x0, R * 2],
    anchors: { thread: [face, yc] },
    z: 9,
  };
}

/**
 * SilencerCo Osprey 45, 200.7 long on a 33 x 44.45 profile, 0.578-28 piston.
 *
 * The Osprey is eccentric — the bore rides high in the tube so the mass hangs
 * below the sight line rather than blocking it. The offset splits the
 * published 44.45 height as 16.3 above the bore and 28.15 below it, which puts
 * the tube's top level with a GI front-sight blade.
 */
function suppressorPart(p: M1911Params, g: Geometry): GeneratedPart {
  void p;
  const bore = g.slideBot / 2;
  const x0 = g.muzzleX;
  const LEN = 200.7;
  const TOP = bore - 16.3;
  const BOT = bore + 28.15;
  const xb0 = x0 + 10;                 // tube rear face, past the piston + boss
  const xb1 = x0 + LEN;
  const rShank = 6.6, rBoss = 9.2, xStep = x0 + 5.7;
  const rc = 2, ch = 3;
  const scA = xb1 - 12, scB = xb1 - 5, scR = 6.6;   // wrench scallops in the cap rim
  const facetT = TOP + 7.2, facetB = BOT - 8;

  const mount = path()
    .move([x0, bore - rShank]).line([xStep, bore - rShank])
    .line([xStep, bore - rBoss]).line([xb0, bore - rBoss])
    .line([xb0, bore + rBoss]).line([xStep, bore + rBoss])
    .line([xStep, bore + rShank]).line([x0, bore + rShank])
    .close().out;

  const tube = path()
    .move([xb0 + rc, TOP])
    .line([scA, TOP]).arc([scB, TOP], scR, 0)
    .line([xb1 - ch, TOP]).line([xb1, TOP + ch])
    .line([xb1, BOT - ch]).line([xb1 - ch, BOT])
    .line([scB, BOT]).arc([scA, BOT], scR, 0)
    .line([xb0 + rc, BOT]).arc([xb0, BOT - rc], rc, 1)
    .line([xb0, TOP + rc]).arc([xb0 + rc, TOP], rc, 1)
    .close().out;

  const seg = (ax: number, ay: number, bx: number, by: number) =>
    path().move([ax, ay]).line([bx, by]).out;
  const det = [
    seg(xb0, facetT, xb1, facetT),                 // polygonal facet edges
    seg(xb0, facetB, xb1, facetB),
    seg(xb0 + 44, TOP, xb0 + 44, BOT),             // mount-module joint
    seg(xb1 - 14, TOP, xb1 - 14, BOT),             // end-cap joint
    seg(xStep, bore - rShank, xStep, bore + rShank),
    circle(xb0 + 6.5, BOT - 13.5, 3.4),            // push-button index release
    circle(xb0 + 6.5, BOT - 13.5, 1.5),
    // laser-engraved data block on the mount module
    box(xb0 + 15, facetT + 4.5, 24, 9, 1),
    // tube section seams, so 130 mm of tube is not left blank
    seg(xb0 + 92, facetT, xb0 + 92, facetB),
    seg(xb0 + 134, facetT, xb0 + 134, facetB),
  ];
  for (let i = 0; i < 5; i++) {                    // engraved band under the seams
    const bx = xb0 + 100 + i * 6;
    det.push(seg(bx, facetB - 3, bx + 3.4, facetB - 9));
  }

  return {
    id: "suppressor", label: "Suppressor", slot: "muzzle", category: "muzzle",
    outline: [mount, tube], paths: det,
    bbox: [x0, TOP, LEN, BOT - TOP],
    anchors: { thread: [x0, bore] },
    z: 9,
  };
}

/**
 * Miniature reflex sight after the Trijicon RM06: 45 x 25.4 overall, 21 x 16
 * objective. Sits on a low adapter plate over a milled cut in the rear half of
 * the slide, so the whole assembly is at negative y.
 */
function opticPart(p: M1911Params, g: Geometry): GeneratedPart {
  void p;
  const L = 45, H = 25.4, PLATE = 2.6;
  const X0 = g.slideRear + 46;
  const yBase = g.slideTop - PLATE;
  const yTop = yBase - H;
  const X = (u: number) => X0 + u;
  const Y = (v: number) => yTop + v;
  const V = (u: number, v: number, rad: number): Vert => [X(u), Y(v), rad];

  // roof -> front face -> base -> rear face -> chamfer -> rear deck -> ramp
  const body = roundPoly([
    V(29, 0, 2.6),
    V(41.14, 0, 4),
    V(45, 25.4, 1.2),
    V(0, 25.4, 0.85),
    V(0, 17.7, 1.5),
    V(3.44, 13.6, 1.5),
    V(22.2, 13.6, 3.6),
  ]);
  // Objective aperture, raked with the front face so it leans forward as it drops.
  const aperture = roundPoly([
    V(30.8, 4.2, 1.2), V(39.3, 4.2, 1.2), V(41.7, 20.2, 1.2), V(31.6, 20.2, 1.2),
  ]);
  const plate = roundPoly([
    [X0 - 2.4, g.slideTop, 0.5],
    [X0 - 1, yBase, 0.5],
    [X0 + L + 1, yBase, 0.5],
    [X0 + L + 2.4, g.slideTop, 0.5],
  ]);

  const det = [
    // reflector: concave element raked back toward the eye
    path()
      .move([X(41), Y(19.6)])
      .curve([X(39.95), Y(14.33)], [X(38.29), Y(9.27)], [X(36), Y(4.4)]).out,
    // LED emitter boss on the housing floor
    path().move([X(32.5), Y(20.2)]).line([X(32.5), Y(18.3)])
      .line([X(34.5), Y(18.3)]).line([X(34.5), Y(20.2)]).out,
    // machined chamfer along the sidewall, ramp and roof
    path().move([X(24.6), Y(12.6)]).line([X(29.7), Y(2.4)])
      .line([X(31.2), Y(1.3)]).line([X(38.6), Y(1.3)]).out,
    circle(X(8.5), Y(21), 2.8),
    path().move([X(6.3), Y(21)]).line([X(10.7), Y(21)]).out,
    path().move([X(4.4), Y(13.6)]).line([X(4.4), Y(14.6)])
      .line([X(9.4), Y(14.6)]).line([X(9.4), Y(13.6)]).out,
    circle(X(15.6), Y(16.3), 1.1),
    circle(X(7), yBase + PLATE / 2, 1),
    circle(X(38), yBase + PLATE / 2, 1),
  ];

  return {
    id: "optic", label: "Reflex sight", slot: "optic", category: "optic",
    outline: [body, aperture, plate], paths: det,
    bbox: [X0 - 3, yTop, L + 6, H + PLATE],
    anchors: { mount: [X0 + L / 2, g.slideTop] },
    z: 10,
  };
}

/**
 * Streamlight TLR-1 HL clamped under the dust cover: 87 long, 36.5 tall from
 * the rail face, 29.4 bezel. The rear switch housing steps down twice — that
 * staircase is the relief that clears a pistol's trigger-guard front — and the
 * recoil key rises into one of the frame's rail cross-slots.
 *
 * Mounted as far rearward as the guard allows, the way anyone actually runs
 * one, so the bezel stops short of the muzzle.
 */
function lightPart(p: M1911Params, g: Geometry): GeneratedPart {
  void p;
  const LEN = 87;
  const yTop = g.dustBot;                    // clamp face on the rail underside
  const xNose = Math.max(g.guardFront + 1 + LEN, Math.min(g.dustNose + 6, g.muzzleX - 6));
  const X = (u: number) => xNose - u;
  const Y = (v: number) => yTop + v;
  const V = (u: number, v: number, rad = 0): Vert => [X(u), Y(v), rad];

  // Recoil key: engage whichever frame cross-slot sits under the clamp platform.
  const platRear = X(58.1);
  const platFront = X(29.6);
  const mid = (platRear + platFront) / 2;
  let slot: number | null = null;
  for (let rx = g.dustNose - 40; rx < g.dustNose - 6; rx += 9) {
    if (rx < platRear + 1 || rx + 5.2 > platFront - 1) continue;
    if (slot === null || Math.abs(rx + 2.6 - mid) < Math.abs(slot + 2.6 - mid)) slot = rx;
  }

  const body: Vert[] = [
    V(76.6, 5.87, 2.2),                      // rear-top of the switch housing
    V(67.4, 5.87, 1.6),                      // trigger-guard relief, lower step
    V(63.1, 2.8, 1.2),                       // relief, upper step
    V(61.7, 2.8, 1.2),
    V(58.1, 0, 1.4),                         // clamp platform, rear
  ];
  if (slot !== null) {
    body.push(
      [slot, Y(0), 0.4], [slot, Y(-3.2), 0.4],
      [slot + 5.2, Y(-3.2), 0.4], [slot + 5.2, Y(0), 0.4],
    );
  }
  body.push(
    V(29.6, 0, 2),                           // clamp platform, front
    V(22, 7, 2),                             // head shoulder, top
    V(0, 7, 2), V(0, 36.4, 2),               // bezel face
    V(23.3, 36.4, 1.5), V(27.3, 32.15, 1.5),
    V(63, 32.15, 1), V(64.4, 33.45, 1),
    V(76.6, 33.45, 2.2),
  );
  // Rocker paddle: flat rear face rather than a wedge, and tall enough to read
  // as a switch against the 33 mm rear housing.
  const paddle: Vert[] = [
    V(76.6, 15.5), V(85.8, 17.4, 1.5), V(85.8, 27.6, 1.5), V(76.6, 29.5),
  ];

  const seg = (ax: number, ay: number, bx: number, by: number) =>
    path().move([ax, ay]).line([bx, by]).out;
  const det: string[] = [];
  // Head grip grooves, spread far enough apart to stay separate at pistol zoom.
  for (const u of [12.5, 16.5, 20.5]) {
    det.push(seg(X(u), Y(7.4), X(u), Y(36)));
  }
  det.push(
    seg(X(8.6), Y(7.4), X(8.6), Y(36)),                 // bezel parting band
    seg(X(2), Y(10.5), X(2), Y(32.9)),                  // lens behind the rim
    // Rail clamp jaw: the block the crossbolt pulls up against the rail. This
    // is the feature that makes a light read as clamped rather than floating.
    box(X(58.1), Y(0), 28.5, 4.6, 0.8),
    circle(X(48), Y(2.3), 2.75),                        // crossbolt
    seg(X(50.4), Y(2.3), X(45.6), Y(2.3)),              // crossbolt slot
    seg(X(27.5), Y(25.2), X(63), Y(25.2)),              // body chamfer
    circle(X(38), Y(12.5), 4.5),                        // rotary mode selector
    circle(X(38), Y(12.5), 1.5),
  );
  for (const u of [79.5, 81.5, 83.5]) {                 // paddle serrations
    det.push(seg(X(u), Y(19), X(u), Y(26)));
  }

  return {
    id: "light", label: "Weapon light", slot: "rail", category: "accessory",
    outline: [roundPoly(body), roundPoly(paddle)], paths: det,
    bbox: [X(86.6), Y(-3.2), 86.6, 39.7],
    anchors: { clamp: [X(43.85), yTop] },
    z: 9,
  };
}

// ---------------------------------------------------------------------------

export function generateM1911(p: M1911Params): GeneratedPart[] {
  const g = geometry(p);
  const parts: GeneratedPart[] = [
    framePart(p, g),
    magazinePart(p, g),
    gripPanelPart(p, g),
    triggerPart(p, g),
    hammerPart(p, g),
    barrelPart(p, g),
    slidePart(p, g),
  ];
  // Attachments exist only while fitted, so the bench shows exactly what is on
  // the gun. A muzzle device is exclusive — the thread only takes one.
  if (p.beavertail) parts.push(beavertailPart(p, g));
  if (p.muzzleDevice === "compensator") parts.push(compensatorPart(p, g));
  if (p.muzzleDevice === "suppressor") parts.push(suppressorPart(p, g));
  if (p.optic === "reflex") parts.push(opticPart(p, g));
  if (p.light === "weapon") parts.push(lightPart(p, g));
  return parts;
}

export const PART_ORDER = [
  "frame", "magazine", "gripPanel", "trigger", "hammer", "beavertail",
  "barrel", "slide", "compensator", "suppressor", "optic", "light",
];
