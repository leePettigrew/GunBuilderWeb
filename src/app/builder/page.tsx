"use client";

import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { WEAPON_FAMILIES, type WeaponFamily } from "@shared/types";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  IconBlade,
  IconBow,
  IconCrossbow,
  IconGrenade,
  IconRifle,
} from "@/components/ui/icons";

const TILE_META: Record<
  WeaponFamily,
  { icon: ComponentType<SVGProps<SVGSVGElement>>; blurb: string }
> = {
  firearm: {
    icon: IconRifle,
    blurb:
      "Frame, action, feed, cartridge, barrel and furniture — the full V5 ballistic model, live.",
  },
  bow: {
    icon: IconBow,
    blurb: "Draw weight, draw length and limb efficiency scored into a damage band.",
  },
  crossbow: {
    icon: IconCrossbow,
    blurb: "Pre-computed prods from pistol to siege — mechanically pre-loaded accuracy.",
  },
  grenade: {
    icon: IconGrenade,
    blurb: "Payload, quality and focus — with a blast-radius falloff readout.",
  },
  melee: {
    icon: IconBlade,
    blurb: "Ten field-tested implements, from push dagger to sledgehammer.",
  },
};

export default function BuilderPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Fabricator"
        title="Select a pattern family"
        description="Every weapon starts from a family template. Pick one — every part after that is yours to configure, and the stat sheet recomputes as you turn the screws."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {WEAPON_FAMILIES.map((fam) => {
          const meta = TILE_META[fam.key];
          const Icon = meta.icon;
          return (
            <Link
              key={fam.key}
              href={`/builder/${fam.key}`}
              className="group surface-panel flex animate-fade-in flex-col gap-3 p-6 transition hover:border-ember/60 hover:shadow-ember"
            >
              <Icon className="h-9 w-9 text-ember" />
              <span className="heading-stencil text-xl text-bone transition-colors group-hover:text-ember">
                {fam.label}
              </span>
              <span className="text-sm text-bone-soft">{meta.blurb}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
