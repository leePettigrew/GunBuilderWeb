/**
 * Engine tests pinned to the Weapon Mechanics V5 doc's worked examples and the
 * revised joules table. If a Rules Lab default drifts from the doc, these fail.
 */

import { describe, expect, it } from "vitest";
import { DEFAULT_RULESET } from "./default-rules";
import {
  averageDamage,
  computeBow,
  computeCrossbow,
  computeFirearm,
  computeGrenade,
  computeMelee,
  computeRoundScore,
  findById,
  formatDice,
} from "./engine";
import { newBowBuild, newFirearmBuild } from "./factories";
import { decodeShare, encodeShare } from "./share-codec";

const rules = DEFAULT_RULESET;

describe("round score (doc worked example)", () => {
  it("scores 7.62x39 at 0.414 → band C → 2 dice", () => {
    const cartridge = findById(rules.catalog.cartridges, "762x39")!;
    const rs = computeRoundScore(rules, cartridge);
    expect(rs.score).toBeCloseTo(0.414, 3);
    expect(rs.bandId).toBe("C");
    expect(rs.dice).toBe(2);
  });

  it("scores 14.5x114 at 1.0 → band F → 5 dice", () => {
    const cartridge = findById(rules.catalog.cartridges, "145x114")!;
    const rs = computeRoundScore(rules, cartridge);
    expect(rs.score).toBeCloseTo(1.0, 3);
    expect(rs.bandId).toBe("F");
    expect(rs.dice).toBe(5);
  });
});

describe("SKS scenario (doc worked example)", () => {
  it("semi-auto, 521mm barrel, 7.62x39 → 2d10", () => {
    const build = newFirearmBuild(rules, "carbine");
    build.actionId = "semi";
    build.magazineId = "enBloc";
    build.cartridgeId = "762x39";
    build.barrelLengthMm = 521;
    const stats = computeFirearm(build, rules);
    // Doc: round C (2 dice) + barrel band 2 (+1) + semi (0) = 3 → ceil(3/2) = 2
    expect(stats.damageLabel).toBe("2d10");
    expect(stats.warnings).toEqual([]);
  });
});

describe("revised joules bands", () => {
  it("maps energies to the revised table", () => {
    const die = (id: string) => {
      const build = newFirearmBuild(rules, "pistol");
      const cartridge = findById(rules.catalog.cartridges, id)!;
      build.cartridgeId = id;
      build.frameId = cartridge.class === "pistol" ? "pistol" : "sniper";
      const stats = computeFirearm(build, rules);
      return stats.damage.terms[0]?.size ?? 0;
    };
    expect(die("22lr")).toBe(4); // 160 J → band 1
    expect(die("9x19")).toBe(6); // 550 J → band 2
    expect(die("300blk")).toBe(10); // 1850 J → band 4
    expect(die("762x51")).toBe(12); // 3400 J → band 5
    expect(die("50bmg")).toBe(12); // 17 kJ → band 7
  });

  it("gives .50 BMG +4 flat and 14.5mm +6 flat bonus damage", () => {
    const build = newFirearmBuild(rules, "sniper");
    build.cartridgeId = "50bmg";
    expect(computeFirearm(build, rules).damage.bonus).toBe(4);
    build.cartridgeId = "145x114";
    expect(computeFirearm(build, rules).damage.bonus).toBe(6);
  });
});

describe("fire modes", () => {
  it("burst-3 on a 2-die weapon shows 3 dice if all shots hit", () => {
    const build = newFirearmBuild(rules, "assaultRifle");
    build.actionId = "semiBurst";
    build.cartridgeId = "762x39";
    build.barrelLengthMm = 521;
    // weapon = 2d10; burst3 all-hit = 6 dice → halved → 3
    const stats = computeFirearm(build, rules);
    const burst = stats.fireModes.find((m) => m.modeId === "burst3")!;
    expect(burst.damage.terms[0]?.count).toBe(3);
    expect(burst.ammoCost).toBe(3);
  });

  it("burst-3 on a 3-die weapon shows 5 dice if all shots hit (doc p.5 example)", () => {
    const build = newFirearmBuild(rules, "assaultRifle");
    build.actionId = "semiBurstFull";
    build.cartridgeId = "762x39";
    build.barrelLengthMm = 710; // +3 dice band → pre-halve 5 → weapon 3d10
    const stats = computeFirearm(build, rules);
    expect(stats.damage.terms[0]?.count).toBe(3);
    const burst = stats.fireModes.find((m) => m.modeId === "burst3")!;
    // 3 hits × 3 dice = 9, halved rounded up = 5 — the doc's worked example
    expect(burst.damage.terms[0]?.count).toBe(5);
  });

  it("locks LMG frames to 10-round full auto", () => {
    const build = newFirearmBuild(rules, "lmg");
    const stats = computeFirearm(build, rules);
    expect(stats.fireModes.map((m) => m.modeId)).toEqual(["fullAutoLmg"]);
    expect(stats.fireModes[0]!.ammoCost).toBe(10);
  });

  it("applies the SMG −1 stacking penalty", () => {
    const build = newFirearmBuild(rules, "smg");
    build.actionId = "semiBurstFull";
    build.cartridgeId = "9x19";
    const stats = computeFirearm(build, rules);
    const auto = stats.fireModes.find((m) => m.modeId === "fullAuto")!;
    expect(auto.stackPenalty).toBe(-1);
  });
});

describe("shotguns", () => {
  it("uses shell die size + gauge dice, skipping round score", () => {
    const build = newFirearmBuild(rules, "shotgun");
    build.actionId = "pump";
    build.shellTypeId = "buckshot";
    build.shellGaugeId = "12ga";
    build.barrelLengthMm = 700;
    const stats = computeFirearm(build, rules);
    // pump +1, barrel 700 (+2), gauge +2 = 5 → ceil(5/2) = 3, d10 buckshot
    expect(stats.damageLabel).toBe("3d10");
  });
});

describe("bows (doc worked example)", () => {
  it("elite heavy war bow (150lbs/32in/1.0) scores 1.0 → 3d10", () => {
    const build = newBowBuild(rules);
    build.bowTypeId = "heavyWar";
    build.drawWeightLbs = 150;
    build.drawLengthIn = 32;
    build.efficiency = 1.0;
    build.materialId = "fiberglass"; // 0 damage mod
    build.arrowId = "bodkin"; // 0 damage mod
    const stats = computeBow(build, rules);
    expect(stats.damageLabel).toBe("3d10");
    expect(stats.strengthReq).toBe(18);
  });

  it("maps draw weight to STR requirements", () => {
    const build = newBowBuild(rules);
    build.drawWeightLbs = 45;
    expect(computeBow(build, rules).strengthReq).toBe(10);
    build.drawWeightLbs = 95;
    build.bowTypeId = "composite";
    expect(computeBow(build, rules).strengthReq).toBe(16);
  });
});

describe("crossbows", () => {
  it("heavy crossbow → 2d10, full-round reload", () => {
    const stats = computeCrossbow(
      { family: "crossbow", name: "t", crossbowTypeId: "heavyXbow", attachmentIds: [] },
      rules,
    );
    expect(stats.damageLabel).toBe("2d10");
    expect(stats.reloadNote).toBe("Full round");
  });
});

describe("grenades", () => {
  it("military-surplus frag with standard focus → band C → 4d10, 10m radius", () => {
    const stats = computeGrenade(
      { family: "grenade", name: "t", payloadId: "offensive", qualityId: "surplus", focusId: "standard" },
      rules,
    );
    // 0.7×0.6 + 0.8×0.15 + 0.5×0.25 = 0.665 → band C
    expect(stats.damageLabel).toBe("4d10");
    expect(stats.falloff).toHaveLength(4);
    expect(stats.falloff![3]!.toM).toBe(10);
  });
});

describe("melee", () => {
  it("sledgehammer → 1d12 + STR", () => {
    const stats = computeMelee({ family: "melee", name: "t", presetId: "sledgehammer" }, rules);
    expect(stats.damageLabel).toBe("1d12 + STR");
  });
});

describe("share codec", () => {
  it("round-trips a build through the URL payload", () => {
    const build = newFirearmBuild(rules, "battleRifle");
    build.name = "Rustbucket «Ярость»"; // unicode survives
    const decoded = decodeShare(encodeShare(build));
    expect(decoded).toEqual(build);
  });

  it("rejects garbage", () => {
    expect(decodeShare("not-a-payload!!")).toBeNull();
    expect(decodeShare("")).toBeNull();
  });
});

describe("dice helpers", () => {
  it("formats and averages expressions", () => {
    expect(formatDice({ terms: [{ count: 2, size: 10 }], bonus: 4 })).toBe("2d10+4");
    expect(formatDice({ terms: [{ count: 1, size: 10 }, { count: 1, size: 8 }], bonus: 0 })).toBe("1d10+1d8");
    expect(formatDice({ terms: [], bonus: 0 })).toBe("0");
    expect(averageDamage({ terms: [{ count: 2, size: 10 }], bonus: 4 })).toBe(15);
  });

  it("renders negative flat bonuses and floors averages at zero", () => {
    expect(formatDice({ terms: [{ count: 2, size: 10 }], bonus: -3 })).toBe("2d10-3");
    expect(formatDice({ terms: [], bonus: -2 })).toBe("-2");
    expect(averageDamage({ terms: [{ count: 1, size: 4 }], bonus: -4 })).toBe(0);
  });
});

describe("band gaps resolve to the nearest band", () => {
  it("a 550.5mm barrel gets +1 die (nearest), not the +3 top band", () => {
    const build = newFirearmBuild(rules, "sniper");
    build.actionId = "bolt";
    build.cartridgeId = "762x39";
    build.barrelLengthMm = 550.5;
    // round C (2) + bolt (+1) + barrel nearest band 201–550 (+1) = 4 → 2d10
    expect(computeFirearm(build, rules).damageLabel).toBe("2d10");
  });

  it("a 700.5J cartridge gets d6 (nearest), not the d12+6 top band", () => {
    const custom = structuredClone(rules);
    const nine = custom.catalog.cartridges.find((c) => c.id === "9x19")!;
    nine.joules = 700.5;
    const build = newFirearmBuild(custom, "pistol");
    build.cartridgeId = "9x19";
    const stats = computeFirearm(build, custom);
    expect(stats.damage.terms[0]?.size).toBe(6);
    expect(stats.damage.bonus).toBe(0);
  });
});

describe("untrusted build validation", () => {
  it("rejects unknown families and malformed firearm builds on import", async () => {
    const { parseWeaponExport } = await import("./export");
    expect(parseWeaponExport(JSON.stringify({ schema: "ashen-skies/weapon@1", build: { family: "laser", name: "x" } }))).toBeNull();
    expect(
      parseWeaponExport(
        JSON.stringify({ schema: "ashen-skies/weapon@1", build: { family: "firearm", name: "x" } }),
      ),
    ).toBeNull();
    const valid = newFirearmBuild(rules, "pistol");
    expect(parseWeaponExport(JSON.stringify({ schema: "ashen-skies/weapon@1", build: valid }))).toEqual(valid);
  });
});
