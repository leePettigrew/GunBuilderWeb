"use client";

/**
 * Sticky live preview: pick an armory weapon (or the reference AK pattern)
 * and watch it re-stat with every Rules Lab keystroke — the whole point of
 * the Lab made visible.
 */

import { useMemo, useState } from "react";
import { computeStats } from "@shared/engine";
import { newFirearmBuild } from "@shared/factories";
import type { AnyBuild, Ruleset } from "@shared/types";
import { WeaponBlueprint } from "@/components/blueprint";
import { StatCard } from "@/components/builder/StatCard";
import { Panel } from "@/components/ui/Panel";
import { SelectField } from "@/components/ui/Field";
import { useWeapons } from "@/lib/data/context";

function referenceBuild(rules: Ruleset): AnyBuild {
  const build = newFirearmBuild(rules, "assaultRifle");
  build.name = "Reference AK Pattern";
  if (rules.catalog.cartridges.some((c) => c.id === "762x39")) build.cartridgeId = "762x39";
  if (rules.catalog.actions.some((a) => a.id === "semiBurstFull")) build.actionId = "semiBurstFull";
  build.barrelLengthMm = 415;
  return build;
}

export function RulePreview({ ruleset }: { ruleset: Ruleset }) {
  const { weapons } = useWeapons();
  const [selectedId, setSelectedId] = useState("reference");

  const build = useMemo<AnyBuild>(() => {
    const weapon = weapons.find((w) => w.id === selectedId);
    return weapon ? weapon.build : referenceBuild(ruleset);
  }, [weapons, selectedId, ruleset]);

  const stats = useMemo(() => computeStats(build, ruleset), [build, ruleset]);

  return (
    <Panel title="Live preview" eyebrow="Every edit re-stats instantly" tone="raised">
      <div className="space-y-3">
        <SelectField
          label="Preview weapon"
          value={weapons.some((w) => w.id === selectedId) ? selectedId : "reference"}
          onChange={setSelectedId}
          options={[
            { value: "reference", label: "Reference AK pattern (7.62×39)" },
            ...weapons.map((w) => ({ value: w.id, label: w.build.name || "Unnamed" })),
          ]}
        />
        <WeaponBlueprint build={build} rules={ruleset} />
        <StatCard stats={stats} rules={ruleset} />
      </div>
    </Panel>
  );
}
