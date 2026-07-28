/**
 * Workshop model + part manifests.
 *
 * Weapons: sourced GLBs normalized to muzzle → +X, length 1. Sockets are
 * MEASURED from part bounding boxes at load (see WeaponViewer), so the
 * manifest only describes orientation, part grouping and credits.
 *
 * Pieces: the Tarkov-style attachment catalog. A piece is either a sourced
 * GLB or a procedural build (modelled in code — bevelled lathes and slotted
 * rails, not naked boxes). Pieces declare which socket TYPE they occupy and
 * may PROVIDE new sockets when mounted (a rail segment offers `railTop`),
 * which is what makes chained builds possible.
 *
 * All sourced models are CC-BY / Public Domain via poly.pizza — credited in
 * the workshop footer.
 */

export type PartId = "frame" | "slide" | "barrel" | "mag" | "trigger" | "misc";

export type SocketType = "muzzle" | "railTop" | "under" | "side" | "magwell";

export interface Credit {
  title: string;
  author: string;
  license: string;
  source: string;
}

export interface WeaponModelDef {
  id: string;
  label: string;
  url: string;
  credit: Credit;
  preRotation: [number, number, number];
  parts: [RegExp, PartId][];
  hidden?: RegExp;
  /** Optional hand overrides for measured sockets (normalized gun space). */
  socketOverrides?: Partial<Record<"muzzle" | "railTop" | "under" | "magwell", [number, number, number]>>;
}

export interface PieceDef {
  id: string;
  label: string;
  category: "suppressor" | "optic" | "magazine" | "rail" | "muzzle" | "grip" | "laser" | "light";
  socket: SocketType;
  /** GLB url, or null when the piece is modelled procedurally. */
  url: string | null;
  credit?: Credit;
  preRotation: [number, number, number];
  /** Length along X as a fraction of gun length (GLB pieces only). */
  lengthFrac: number;
  /** Sockets this piece provides once mounted, offset from its center. */
  provides?: { type: SocketType; offset: [number, number, number] }[];
}

export const WEAPON_MODELS: WeaponModelDef[] = [
  {
    id: "glockModular",
    label: "G-Pattern (modular)",
    url: "/models/pistol-modular.glb",
    credit: { title: "Glock", author: "J [CC-BY] via poly.pizza", license: "CC-BY", source: "https://poly.pizza/m/q3lsX3tSta" },
    preRotation: [0, Math.PI, 0],
    parts: [
      [/slide/i, "slide"],
      [/mag/i, "mag"],
      [/barrel|chamber/i, "barrel"],
      [/trigger/i, "trigger"],
      [/bullet/i, "misc"],
      [/body/i, "frame"],
    ],
    hidden: /bullet/i,
  },
  {
    id: "glock19",
    label: "G19 Pattern",
    url: "/models/glock19.glb",
    credit: { title: "Rigged Glock 19", author: "PuKk [CC-BY] via poly.pizza", license: "CC-BY", source: "https://poly.pizza/m/gDhOo5jkNX" },
    preRotation: [0, Math.PI, 0],
    parts: [
      [/charger|slide/i, "slide"],
      [/magazine/i, "mag"],
      [/trigger$/i, "trigger"],
      [/base|frame/i, "frame"],
    ],
  },
  {
    id: "sniperRifle",
    label: "Marksman Rifle (PD)",
    url: "/models/sniper-rifle.glb",
    credit: { title: "Sniper Rifle", author: "Quaternius via poly.pizza", license: "Public Domain", source: "https://poly.pizza/m/ASOMZIErq3" },
    preRotation: [0, 0, 0],
    socketOverrides: { railTop: [0.16, 0.09, 0] }, // ahead of the integral scope
    parts: [
      [/bolt|slide/i, "slide"],
      [/mag/i, "mag"],
      [/barrel/i, "barrel"],
      [/trigger/i, "trigger"],
      [/scope|sight/i, "misc"],
    ],
  },
];

export const PIECES: PieceDef[] = [
  // --- muzzle devices ---
  {
    id: "suppressorA",
    label: "Suppressor (surplus)",
    category: "suppressor",
    socket: "muzzle",
    url: "/models/suppressor-a.glb",
    credit: { title: "Suppressor", author: "Quaternius via poly.pizza", license: "CC0", source: "https://poly.pizza/m/QWfBIqy0VW" },
    preRotation: [0, Math.PI / 2, 0],
    lengthFrac: 0.34,
  },
  { id: "suppressorSlim", label: "Suppressor (slim can)", category: "suppressor", socket: "muzzle", url: null, preRotation: [0, 0, 0], lengthFrac: 0.3 },
  { id: "suppressorHeavy", label: "Suppressor (heavy can)", category: "suppressor", socket: "muzzle", url: null, preRotation: [0, 0, 0], lengthFrac: 0.24 },
  { id: "compensator", label: "Compensator", category: "muzzle", socket: "muzzle", url: null, preRotation: [0, 0, 0], lengthFrac: 0.09 },
  // --- rail + optics (optics mount on railTop: the slide offers one, and a
  // rail segment provides a raised one — Tarkov-style chaining) ---
  {
    id: "railSegment",
    label: "Rail segment",
    category: "rail",
    socket: "railTop",
    url: null,
    preRotation: [0, 0, 0],
    lengthFrac: 0.3,
    provides: [{ type: "railTop", offset: [0, 0.03, 0] }],
  },
  { id: "redDot", label: "Red dot sight", category: "optic", socket: "railTop", url: null, preRotation: [0, 0, 0], lengthFrac: 0.12 },
  {
    id: "holoSight",
    label: "Holo sight",
    category: "optic",
    socket: "railTop",
    url: "/models/holo-sight.glb",
    credit: { title: "Holographic Sight", author: "Quaternius via poly.pizza", license: "Public Domain", source: "https://poly.pizza/m/9rPJxvm9sw" },
    preRotation: [0, Math.PI / 2, 0],
    lengthFrac: 0.14,
  },
  {
    id: "scope",
    label: "Scope",
    category: "optic",
    socket: "railTop",
    url: "/models/scope.glb",
    credit: { title: "Rifle Scope", author: "sergeilihandristov [CC-BY] via poly.pizza", license: "CC-BY", source: "https://poly.pizza/m/00FLhNqY7M" },
    preRotation: [0, Math.PI / 2, 0],
    lengthFrac: 0.26,
  },
  // --- magazines (mount at the magwell; fitting one hides the stock mag) ---
  { id: "magExtended", label: "Extended magazine", category: "magazine", socket: "magwell", url: null, preRotation: [0, 0, 0], lengthFrac: 0.3 },
  { id: "magDrum", label: "Snail drum", category: "magazine", socket: "magwell", url: null, preRotation: [0, 0, 0], lengthFrac: 0.26 },
  {
    id: "magSpare",
    label: "Spare magazine",
    category: "magazine",
    socket: "magwell",
    url: "/models/spare-mag.glb",
    credit: { title: "Magazine", author: "jeremy [CC-BY] via poly.pizza", license: "CC-BY", source: "https://poly.pizza/m/OMzty7kxKo" },
    preRotation: [0, Math.PI / 2, 0],
    lengthFrac: 0.16,
  },
  // --- under-barrel ---
  {
    id: "bayonetKnife",
    label: "Bayonet (knife)",
    category: "muzzle",
    socket: "muzzle",
    url: "/models/bayonet-knife.glb",
    credit: { title: "Knife", author: "Quaternius via poly.pizza", license: "Public Domain", source: "https://poly.pizza/m/0g8M6yYtE4" },
    preRotation: [0, Math.PI / 2, 0],
    lengthFrac: 0.22,
  },
  { id: "portedBrake", label: "Ported brake", category: "muzzle", socket: "muzzle", url: null, preRotation: [0, 0, 0], lengthFrac: 0.11 },
  { id: "verticalGrip", label: "Vertical grip", category: "grip", socket: "under", url: null, preRotation: [0, 0, 0], lengthFrac: 0.09 },
  { id: "cantedIrons", label: "Canted iron sights", category: "optic", socket: "railTop", url: null, preRotation: [0, 0, 0], lengthFrac: 0.1 },
  { id: "laser", label: "Laser module", category: "laser", socket: "under", url: null, preRotation: [0, 0, 0], lengthFrac: 0.1 },
  { id: "flashlight", label: "Flashlight", category: "light", socket: "under", url: null, preRotation: [0, 0, 0], lengthFrac: 0.11 },
  { id: "foregrip", label: "Stub foregrip", category: "grip", socket: "under", url: null, preRotation: [0, 0, 0], lengthFrac: 0.08 },
];

/** One mounted or loose piece on the bench. */
export interface PlacedPiece {
  key: string;
  pieceId: string;
  /** Socket instance id (e.g. "muzzle", "railTop", "railTop@<key>") or null = loose. */
  attachedTo: string | null;
  /** Free position when loose (normalized gun space). */
  pos: [number, number, number];
  rot: [number, number, number];
  scale: [number, number, number];
}

export const SLIDE_FINISHES = [
  { id: "gunmetal", label: "Gunmetal", color: "#5d656f" },
  { id: "graphite", label: "Graphite black", color: "#33373d" },
  { id: "tan", label: "Wasteland tan", color: "#8a7a5c" },
  { id: "olive", label: "Olive drab", color: "#5c6650" },
] as const;
