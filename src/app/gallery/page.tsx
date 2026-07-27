"use client";

/**
 * Pattern gallery — every firearm frame rendered side by side with
 * representative loadouts. Not linked from the nav; used for visual tuning
 * of the blueprint canvases (and handy as a quick reference sheet).
 */

import { useMemo } from "react";
import { newFirearmBuild } from "@shared/factories";
import type { AnyBuild } from "@shared/types";
import { WeaponBlueprint } from "@/components/blueprint";
import { PageHeader } from "@/components/ui/PageHeader";
import { useRuleset } from "@/lib/data/context";

export default function GalleryPage() {
  const { ruleset } = useRuleset();

  const builds = useMemo<AnyBuild[]>(() => {
    const make = (
      frameId: string,
      name: string,
      patch: Partial<ReturnType<typeof newFirearmBuild>> = {},
    ) => ({ ...newFirearmBuild(ruleset, frameId), name, ...patch });

    return [
      make("pistol", "M1911 Pattern", { cartridgeId: "45acp", actionId: "singleAction", barrelLengthMm: 127 }),
      make("smg", "Sten Pattern", { cartridgeId: "9x19", actionId: "semiFull", magazineId: "box", barrelLengthMm: 196 }),
      make("carbine", "AUG Pattern", { cartridgeId: "556x45", actionId: "semiBurst", barrelLengthMm: 508 }),
      make("assaultRifle", "AN-94 Pattern", { actionId: "semiBurstFull", barrelLengthMm: 405 }),
      make("battleRifle", "SCAR-H Pattern", { cartridgeId: "762x51", actionId: "semiFull", barrelLengthMm: 400, attachmentIds: ["scope", "foregrip"] }),
      make("shotgun", "TOZ-34 Pattern", { actionId: "break", magazineId: "breach", barrelLengthMm: 711 }),
      make("dmr", "SVD Pattern", { cartridgeId: "762x54r", barrelLengthMm: 620, attachmentIds: ["scope"] }),
      make("sniper", "Mosin Pattern", { cartridgeId: "762x54r", actionId: "bolt", magazineId: "clip", barrelLengthMm: 730 }),
      make("lmg", "Bren Pattern", { cartridgeId: "303brit", actionId: "auto", magazineId: "box", barrelLengthMm: 635, attachmentIds: ["bipod"] }),
      make("assaultRifle", "Suppressed Drum Variant", { actionId: "semiBurstFull", magazineId: "drum", barrelLengthMm: 405, attachmentIds: ["suppressor", "scope", "laser"], stockId: "collapsible" }),
      make("pistol", "Holdout Variant", { cartridgeId: "9x19", actionId: "semi", barrelLengthMm: 100, attachmentIds: ["suppressor", "flashlight"], stockId: "pistolGrip" }),
      make("sniper", "AT Variant", { cartridgeId: "145x114", actionId: "bolt", magazineId: "box", barrelLengthMm: 900, attachmentIds: ["bipod", "scope", "muzzleBrake"] }),
    ];
  }, [ruleset]);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        eyebrow="Reference sheet"
        title="Pattern Gallery"
        description="Every platform silhouette with a representative loadout — the visual tuning bench."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        {builds.map((b, i) => (
          <WeaponBlueprint key={i} build={b} rules={ruleset} />
        ))}
      </div>
    </div>
  );
}
