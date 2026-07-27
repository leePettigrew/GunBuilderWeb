"use client";

import type { AnyBuild, Ruleset } from "@shared/types";
import { BowBlueprint } from "./BowBlueprint";
import { CrossbowBlueprint } from "./CrossbowBlueprint";
import { FirearmBlueprint } from "./FirearmBlueprint";
import { GrenadeBlueprint } from "./GrenadeBlueprint";
import { MeleeBlueprint } from "./MeleeBlueprint";

/** Family dispatcher — the one blueprint entry point pages should use. */
export function WeaponBlueprint({
  build,
  rules,
  className,
}: {
  build: AnyBuild;
  rules: Ruleset;
  className?: string;
}) {
  switch (build.family) {
    case "firearm":
      return <FirearmBlueprint build={build} rules={rules} className={className} />;
    case "bow":
      return <BowBlueprint build={build} rules={rules} className={className} />;
    case "crossbow":
      return <CrossbowBlueprint build={build} rules={rules} className={className} />;
    case "grenade":
      return <GrenadeBlueprint build={build} rules={rules} className={className} />;
    case "melee":
      return <MeleeBlueprint build={build} rules={rules} className={className} />;
  }
}
