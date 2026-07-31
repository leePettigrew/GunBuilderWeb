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
  gripLength: 86,
  gripTexture: "checkered",
  checkerPitch: 4.4,
  magazine: "standard",
  dustCover: 186,
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

  det.push(circle(x1 - 11, yB * 0.5, yB * 0.33));   // barrel bushing
  det.push(circle(x1 - 11, yB * 0.5, yB * 0.18));   // muzzle crown

  return {
    id: "slide", label: "Slide", slot: "slide", category: "slide",
    outline, paths: det,
    bbox: [x0, yT - 5, x1 - x0, yB - yT + 5],
    anchors: { mount: [x0 + 12, yB], muzzle: [x1, (yT + yB) / 2] },
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
      .curve(
        [buttFront[0] - 1, buttFront[1] + 6],
        [buttFront[0] - 7, buttFront[1] + 9],
        [buttFront[0] - 15, buttFront[1] + 9.5],
      )
      .line([buttRear[0] + 7, buttRear[1] + 3])                              // butt
      .curve(
        [buttRear[0] + 2, buttRear[1] + 3],
        [buttRear[0] - 1, buttRear[1] + 1],
        [buttRear[0], buttRear[1] - 4],
      )
      .curve(                                                                // mainspring housing
        [buttRear[0] - 1.5, buttRear[1] - 26],
        [gripTopRear[0] - 6, gripTopRear[1] + 22],
        [gripTopRear[0] - 0.5, gripTopRear[1] - 4],
      )
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

const MAG_EXTRA: Record<MagLength, number> = { compact: -12, standard: 0, extended: 16 };

function magazinePart(p: M1911Params, g: Geometry): GeneratedPart {
  const extra = MAG_EXTRA[p.magazine] / p.gripLength; // as a fraction of the grip
  const U0 = 0.33, U1 = 0.67, V0 = 0.1, V1 = 0.92 + extra;
  const A = gripPoint(g, U0, V0);
  const B = gripPoint(g, U1, V0);
  const C = gripPoint(g, U1, V1);
  const D = gripPoint(g, U0, V1);
  const outline = [path().move(A).line(B).line(C).line(D).close().out];
  const det: string[] = [];
  const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  // floorplate, a touch wider than the tube
  const fA = lerp(D, A, -0.09);
  const fB = lerp(C, B, -0.09);
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

export function generateM1911(p: M1911Params): GeneratedPart[] {
  const g = geometry(p);
  return [
    framePart(p, g),
    magazinePart(p, g),
    gripPanelPart(p, g),
    triggerPart(p, g),
    hammerPart(p, g),
    barrelPart(p, g),
    slidePart(p, g),
  ];
}

export const PART_ORDER = [
  "frame", "magazine", "gripPanel", "trigger", "hammer", "barrel", "slide",
];
