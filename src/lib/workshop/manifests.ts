/**
 * Workshop model manifests: how each sourced GLB is normalized (rotation to
 * muzzle-right, part-mesh grouping) and where its attachment sockets sit in
 * normalized space (gun scaled to length 1 along X, centered at origin).
 *
 * All models sourced from poly.pizza under CC-BY / Public Domain — credits
 * rendered in the workshop footer.
 */

export type PartId = "frame" | "slide" | "barrel" | "mag" | "trigger" | "misc";

export interface SocketDef {
  /** Position in normalized gun space (gun length = 1 along +X, muzzle at +X). */
  pos: [number, number, number];
}

export interface WeaponModelDef {
  id: string;
  label: string;
  url: string;
  credit: { title: string; author: string; license: string; source: string };
  /** Euler rotation (radians) applied BEFORE normalization so muzzle faces +X. */
  preRotation: [number, number, number];
  /** mesh-name regex → part group. First match wins; default "frame". */
  parts: [RegExp, PartId][];
  /** Mesh names hidden by default (stray props baked into the model). */
  hidden?: RegExp;
  sockets: {
    muzzle: SocketDef;
    rail: SocketDef;
    under: SocketDef;
    grip: SocketDef;
  };
}

export const WEAPON_MODELS: WeaponModelDef[] = [
  {
    id: "glockModular",
    label: "G-Pattern (modular)",
    url: "/models/pistol-modular.glb",
    credit: {
      title: "Glock",
      author: "J [CC-BY] via poly.pizza",
      license: "CC-BY",
      source: "https://poly.pizza/m/q3lsX3tSta",
    },
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
    sockets: {
      muzzle: { pos: [0.52, 0.1, 0] },
      rail: { pos: [0.1, 0.22, 0] },
      under: { pos: [0.3, -0.02, 0] },
      grip: { pos: [-0.25, -0.28, 0] },
    },
  },
  {
    id: "glock19",
    label: "G19 Pattern",
    url: "/models/glock19.glb",
    credit: {
      title: "Rigged Glock 19",
      author: "PuKk [CC-BY] via poly.pizza",
      license: "CC-BY",
      source: "https://poly.pizza/m/gDhOo5jkNX",
    },
    preRotation: [0, Math.PI, 0],
    parts: [
      [/charger|slide/i, "slide"],
      [/magazine/i, "mag"],
      [/trigger$/i, "trigger"],
      [/base|frame/i, "frame"],
    ],
    sockets: {
      muzzle: { pos: [0.52, 0.1, 0] },
      rail: { pos: [0.1, 0.22, 0] },
      under: { pos: [0.3, -0.02, 0] },
      grip: { pos: [-0.25, -0.28, 0] },
    },
  },
];

export interface AttachmentModelDef {
  id: string;
  label: string;
  socket: keyof WeaponModelDef["sockets"];
  /** GLB url, or null for procedurally built attachments. */
  url: string | null;
  credit?: { title: string; author: string; license: string; source: string };
  preRotation: [number, number, number];
  /** Length along X as a fraction of gun length. */
  lengthFrac: number;
}

export const ATTACHMENT_MODELS: AttachmentModelDef[] = [
  {
    id: "suppressor",
    label: "Suppressor",
    socket: "muzzle",
    url: "/models/suppressor-a.glb",
    credit: { title: "Suppressor", author: "Quaternius via poly.pizza", license: "CC0", source: "https://poly.pizza/m/QWfBIqy0VW" },
    preRotation: [0, Math.PI / 2, 0],
    lengthFrac: 0.34,
  },
  {
    id: "scope",
    label: "Scope",
    socket: "rail",
    url: "/models/scope.glb",
    credit: { title: "Rifle Scope", author: "sergeilihandristov [CC-BY] via poly.pizza", license: "CC-BY", source: "https://poly.pizza/m/00FLhNqY7M" },
    preRotation: [0, Math.PI / 2, 0],
    lengthFrac: 0.28,
  },
  { id: "redDot", label: "Red Dot", socket: "rail", url: null, preRotation: [0, 0, 0], lengthFrac: 0.14 },
  { id: "laser", label: "Laser", socket: "under", url: null, preRotation: [0, 0, 0], lengthFrac: 0.1 },
  { id: "flashlight", label: "Flashlight", socket: "under", url: null, preRotation: [0, 0, 0], lengthFrac: 0.11 },
];
