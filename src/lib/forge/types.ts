/**
 * The Forge — 2D schematic parts bench.
 *
 * A build is a list of placements: a part id plus a transform. Parts either
 * sit in a slot (anchored — their transform is derived from the frame's
 * socket) or float free on the bench with an explicit transform the user
 * dragged, rotated, stretched or flipped into place.
 */

import { M1911_PARTS, type ForgePart } from "./m1911-parts";

export { M1911_PARTS };

export type { ForgePart };

export interface Placement {
  key: string;
  partId: string;
  /** Slot id when anchored to the frame, or null when free-floating. */
  slot: string | null;
  /** Offset from the anchored home position (or absolute when free). */
  x: number;
  y: number;
  rot: number; // degrees
  sx: number; // stretch along the part's own X
  sy: number; // stretch along the part's own Y
  flipX: boolean;
  flipY: boolean;
  hidden: boolean;
  locked: boolean;
}

export interface ForgeState {
  placements: Placement[];
  selectedKey: string | null;
  explode: number;
  showAnchors: boolean;
  showGrid: boolean;
  gridSnap: boolean;
  ink: string; // stroke token
}

export const PART_BY_ID = new Map<string, ForgePart>(M1911_PARTS.map((p) => [p.id, p]));

export const INK_OPTIONS = [
  { id: "blueprint", label: "Blueprint", css: "rgb(var(--c-blueprint))" },
  { id: "bone", label: "Bone", css: "rgb(var(--c-bone))" },
  { id: "ember", label: "Ember", css: "rgb(var(--c-ember))" },
  { id: "hazard", label: "Hazard", css: "rgb(var(--c-hazard))" },
] as const;

/** A fresh, fully assembled pistol. */
export function newBuild(): Placement[] {
  return M1911_PARTS.map((p) => ({
    key: `k-${p.id}`,
    partId: p.id,
    slot: p.slot,
    x: 0,
    y: 0,
    rot: 0,
    sx: 1,
    sy: 1,
    flipX: false,
    flipY: false,
    hidden: false,
    locked: false,
  }));
}

export function newForgeState(): ForgeState {
  return {
    placements: newBuild(),
    selectedKey: null,
    explode: 0,
    showAnchors: false,
    showGrid: true,
    gridSnap: false,
    ink: "blueprint",
  };
}

/** Direction each part flies when the assembly is exploded. */
export const EXPLODE_DIR: Record<string, [number, number]> = {
  slide: [6, -34],
  barrel: [26, -16],
  hammer: [-26, -18],
  gripSafety: [-30, -2],
  thumbSafety: [-16, -24],
  mainspring: [-26, 16],
  gripPanel: [10, 34],
  magazine: [-2, 52],
  trigger: [4, -12],
  triggerGuard: [16, 22],
  frame: [0, 0],
};

/** Centre of a part's drawn bbox — the pivot for rotation and stretching. */
export function partPivot(part: ForgePart): [number, number] {
  const [x, y, w, h] = part.bbox;
  return [x + w / 2, y + h / 2];
}

/** Full transform for a placement, including the exploded offset. */
export function placementTransform(p: Placement, part: ForgePart, explode: number): string {
  const [cx, cy] = partPivot(part);
  const dir = EXPLODE_DIR[part.id] ?? [0, 0];
  const tx = p.x + dir[0] * explode;
  const ty = p.y + dir[1] * explode;
  const fx = p.flipX ? -1 : 1;
  const fy = p.flipY ? -1 : 1;
  return [
    `translate(${tx.toFixed(2)} ${ty.toFixed(2)})`,
    `translate(${cx.toFixed(2)} ${cy.toFixed(2)})`,
    `rotate(${p.rot.toFixed(2)})`,
    `scale(${(p.sx * fx).toFixed(4)} ${(p.sy * fy).toFixed(4)})`,
    `translate(${(-cx).toFixed(2)} ${(-cy).toFixed(2)})`,
  ].join(" ");
}

export const FORGE_STORAGE_KEY = "ashen-armoury:v1:forge";

export interface ForgeExport {
  schema: "ashen-skies/forge@1";
  exportedAt: string;
  placements: Placement[];
}
