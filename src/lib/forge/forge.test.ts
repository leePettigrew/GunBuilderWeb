import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS, generateM1911, type M1911Params } from "./m1911-model";
import { newBuild, reconcilePlacements, type Placement } from "./types";

const withParams = (over: Partial<M1911Params>) => generateM1911({ ...DEFAULT_PARAMS, ...over });

describe("generateM1911", () => {
  it("builds the bare pistol with no attachments fitted", () => {
    const ids = withParams({}).map((p) => p.id).sort();
    expect(ids).toEqual(["barrel", "frame", "gripPanel", "hammer", "magazine", "slide", "trigger"]);
  });

  it("emits an attachment part only when its param selects one", () => {
    expect(withParams({}).some((p) => p.id === "suppressor")).toBe(false);
    expect(withParams({ muzzleDevice: "suppressor" }).some((p) => p.id === "suppressor")).toBe(true);
    expect(withParams({ muzzleDevice: "compensator" }).some((p) => p.id === "compensator")).toBe(true);
    expect(withParams({ optic: "reflex" }).some((p) => p.id === "optic")).toBe(true);
    expect(withParams({ light: "weapon" }).some((p) => p.id === "light")).toBe(true);
    expect(withParams({ beavertail: true }).some((p) => p.id === "beavertail")).toBe(true);
  });

  it("never fits two muzzle devices at once", () => {
    const parts = withParams({ muzzleDevice: "suppressor" });
    expect(parts.filter((p) => p.slot === "muzzle")).toHaveLength(1);
  });

  it("emits every part with a non-empty outline and a finite bbox", () => {
    const parts = withParams({ muzzleDevice: "suppressor", optic: "reflex", light: "weapon", beavertail: true });
    for (const part of parts) {
      expect(part.outline.length, `${part.id} outline`).toBeGreaterThan(0);
      expect(part.outline.join("")).not.toContain("NaN");
      expect(part.paths.join("")).not.toContain("NaN");
      expect(part.bbox.every(Number.isFinite), `${part.id} bbox`).toBe(true);
    }
  });
});

describe("reconcilePlacements", () => {
  it("returns the same array when the part set is unchanged", () => {
    const parts = withParams({});
    const placements = newBuild();
    expect(reconcilePlacements(placements, parts)).toBe(placements);
  });

  it("adds a placement when an attachment is fitted", () => {
    const before = newBuild();
    const after = reconcilePlacements(before, withParams({ muzzleDevice: "suppressor" }));
    expect(after).not.toBe(before);
    expect(after.map((p) => p.partId)).toContain("suppressor");
    expect(after).toHaveLength(before.length + 1);
  });

  it("drops the placement when an attachment is removed", () => {
    const fitted = reconcilePlacements(newBuild(), withParams({ muzzleDevice: "suppressor" }));
    const bare = reconcilePlacements(fitted, withParams({}));
    expect(bare.map((p) => p.partId)).not.toContain("suppressor");
  });

  it("preserves transforms the user dragged in for parts that survive", () => {
    const moved: Placement[] = newBuild().map((p) =>
      p.partId === "slide" ? { ...p, x: 40, y: -12, rot: 8, slot: null, locked: true } : p,
    );
    const after = reconcilePlacements(moved, withParams({ optic: "reflex" }));
    const slide = after.find((p) => p.partId === "slide");
    expect(slide).toMatchObject({ x: 40, y: -12, rot: 8, slot: null, locked: true });
  });

  it("swapping one muzzle device for another replaces rather than stacks", () => {
    const comp = reconcilePlacements(newBuild(), withParams({ muzzleDevice: "compensator" }));
    const can = reconcilePlacements(comp, withParams({ muzzleDevice: "suppressor" }));
    const ids = can.map((p) => p.partId);
    expect(ids).toContain("suppressor");
    expect(ids).not.toContain("compensator");
  });

  it("gives every generated part exactly one placement", () => {
    const parts = withParams({ muzzleDevice: "suppressor", optic: "reflex", light: "weapon", beavertail: true });
    const after = reconcilePlacements(newBuild(), parts);
    expect(after).toHaveLength(parts.length);
    expect(new Set(after.map((p) => p.partId)).size).toBe(parts.length);
  });
});
