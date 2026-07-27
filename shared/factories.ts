/**
 * Factories for fresh builds. Defaults come from the ruleset catalog so they
 * stay valid even after the catalog is edited in the Rules Lab.
 */

import type {
  AnyBuild,
  BowBuild,
  CrossbowBuild,
  FirearmBuild,
  GrenadeBuild,
  MeleeBuild,
  Ruleset,
  WeaponFamily,
} from "./types";

export function newFirearmBuild(rules: Ruleset, frameId?: string): FirearmBuild {
  const c = rules.catalog;
  const frame = c.frames.find((f) => f.id === frameId) ?? c.frames.find((f) => f.id === "assaultRifle") ?? c.frames[0];
  const isShotgun = frame !== undefined && frame.ammoClasses.includes("shell");
  // Prefer the iconic defaults (7.62×39 / 9×19) over raw catalog order.
  const preferred = frame?.ammoClasses.includes("rifle") ? "762x39" : "9x19";
  const cartridge = frame
    ? (c.cartridges.find((a) => a.id === preferred && frame.ammoClasses.includes(a.class)) ??
      c.cartridges.find((a) => frame.ammoClasses.includes(a.class)))
    : undefined;
  return {
    family: "firearm",
    name: "Unnamed Pattern",
    frameId: frame?.id ?? "",
    actionId: frame?.id === "lmg" ? "auto" : "semi",
    magazineId: frame?.id === "lmg" ? "belt" : isShotgun ? "tube" : "box",
    cartridgeId: isShotgun ? undefined : cartridge?.id,
    shellTypeId: isShotgun ? c.shellTypes.find((s) => s.id === "buckshot")?.id ?? c.shellTypes[0]?.id : undefined,
    shellGaugeId: isShotgun ? c.shellGauges.find((g) => g.id === "12ga")?.id ?? c.shellGauges[0]?.id : undefined,
    barrelLengthMm: frame?.defaultBarrelMm ?? 400,
    barrelTypeId: "normal",
    rifled: !isShotgun,
    stockId: frame?.id === "pistol" ? "pistolGrip" : "standard",
    attachmentIds: [],
  };
}

export function newBowBuild(rules: Ruleset): BowBuild {
  const c = rules.catalog;
  return {
    family: "bow",
    name: "Unnamed Bow",
    bowTypeId: c.bowTypes.find((b) => b.id === "hunting")?.id ?? c.bowTypes[0]?.id ?? "",
    drawWeightLbs: 50,
    drawLengthIn: 28,
    efficiency: 0.75,
    materialId: c.bowMaterials.find((m) => m.id === "fiberglass")?.id ?? c.bowMaterials[0]?.id ?? "",
    arrowId: c.arrows.find((a) => a.id === "bodkin")?.id ?? c.arrows[0]?.id ?? "",
  };
}

export function newCrossbowBuild(rules: Ruleset): CrossbowBuild {
  return {
    family: "crossbow",
    name: "Unnamed Crossbow",
    crossbowTypeId:
      rules.catalog.crossbowTypes.find((t) => t.id === "standardXbow")?.id ??
      rules.catalog.crossbowTypes[0]?.id ??
      "",
    attachmentIds: [],
  };
}

export function newGrenadeBuild(rules: Ruleset): GrenadeBuild {
  const c = rules.catalog;
  return {
    family: "grenade",
    name: "Unnamed Charge",
    payloadId: c.grenadePayloads.find((p) => p.id === "offensive")?.id ?? c.grenadePayloads[0]?.id ?? "",
    qualityId: c.grenadeQualities.find((q) => q.id === "surplus")?.id ?? c.grenadeQualities[0]?.id ?? "",
    focusId: c.grenadeFocuses.find((f) => f.id === "standard")?.id ?? c.grenadeFocuses[0]?.id ?? "",
  };
}

export function newMeleeBuild(rules: Ruleset): MeleeBuild {
  return {
    family: "melee",
    name: "Unnamed Implement",
    presetId: rules.catalog.meleePresets.find((p) => p.id === "machete")?.id ?? rules.catalog.meleePresets[0]?.id ?? "",
  };
}

export function newBuildForFamily(family: WeaponFamily, rules: Ruleset): AnyBuild {
  switch (family) {
    case "firearm":
      return newFirearmBuild(rules);
    case "bow":
      return newBowBuild(rules);
    case "crossbow":
      return newCrossbowBuild(rules);
    case "grenade":
      return newGrenadeBuild(rules);
    case "melee":
      return newMeleeBuild(rules);
  }
}
