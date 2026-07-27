/**
 * Structured JSON export — the interchange format the future Ashen Skies
 * companion app will consume. Versioned via the `schema` string.
 */

import { computeStats } from "./engine";
import { nowISO } from "./ids";
import type { AnyBuild, Ruleset, RulesetExport, WeaponExport } from "./types";

export function exportWeapon(build: AnyBuild, rules: Ruleset): WeaponExport {
  const stats = computeStats(build, rules);
  return {
    schema: "ashen-skies/weapon@1",
    exportedAt: nowISO(),
    rulesetName: rules.name,
    build,
    computed: {
      damageLabel: stats.damageLabel,
      priceRats: stats.priceRats,
      weightKg: stats.weightKg,
    },
  };
}

export function exportRuleset(rules: Ruleset): RulesetExport {
  return {
    schema: "ashen-skies/ruleset@1",
    exportedAt: nowISO(),
    ruleset: rules,
  };
}

/** Parse a previously exported ruleset; returns null if it isn't one. */
export function parseRulesetExport(json: string): Ruleset | null {
  try {
    const parsed = JSON.parse(json) as Partial<RulesetExport>;
    if (parsed.schema !== "ashen-skies/ruleset@1" || !parsed.ruleset) return null;
    if (parsed.ruleset.schemaVersion !== 1) return null;
    return parsed.ruleset;
  } catch {
    return null;
  }
}

/** Parse a previously exported weapon; returns null if it isn't one. */
export function parseWeaponExport(json: string): AnyBuild | null {
  try {
    const parsed = JSON.parse(json) as Partial<WeaponExport>;
    if (parsed.schema !== "ashen-skies/weapon@1" || !parsed.build) return null;
    return parsed.build;
  } catch {
    return null;
  }
}
