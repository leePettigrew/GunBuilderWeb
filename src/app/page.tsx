"use client";

import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { WEAPON_FAMILIES, type WeaponFamily } from "@shared/types";
import { NAV_ITEMS } from "@/components/shell/nav-items";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import {
  IconBlade,
  IconBow,
  IconCrossbow,
  IconGrenade,
  IconRifle,
} from "@/components/ui/icons";
import { useRuleset } from "@/lib/data/context";

const FAMILY_ICONS: Record<WeaponFamily, ComponentType<SVGProps<SVGSVGElement>>> = {
  firearm: IconRifle,
  bow: IconBow,
  crossbow: IconCrossbow,
  grenade: IconGrenade,
  melee: IconBlade,
};

const FAMILY_TAGS: Record<WeaponFamily, string> = {
  firearm: "Sidearms to LMGs",
  bow: "Draw, limbs, arrows",
  crossbow: "Pistol to siege",
  grenade: "Payload & fuse",
  melee: "Blades & bludgeons",
};

export default function HomePage() {
  const { ruleset, isCustomized } = useRuleset();

  return (
    <div className="animate-fade-in space-y-10">
      {/* Hero */}
      <section className="surface-panel overflow-hidden">
        <div className="blueprint-grid px-6 py-10 sm:px-10 sm:py-14">
          <span className="stamp-ember">Weapon Fabricator</span>
          <h1 className="heading-stencil mt-4 text-4xl leading-none text-bone sm:text-6xl">
            Ashen <span className="text-ember">Armoury</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base text-bone-soft sm:text-lg">
            The bombs took the factories, not the craft. Spec a pattern part by
            part, watch its blueprint redraw itself, and read out exactly what
            it will cost, weigh, and kill under the Ashen Skies rules.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/builder" className={buttonClasses("primary", "lg")}>
              Open the Fabricator
            </Link>
            <Link href="/armory" className={buttonClasses("secondary", "lg")}>
              Browse the Armory
            </Link>
          </div>
        </div>
        <div className="hazard-stripe" />
      </section>

      {/* Family quick start */}
      <section>
        <h2 className="font-display text-xs uppercase tracking-stamp text-bone-faint">
          Quick start — pick a family
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {WEAPON_FAMILIES.map(({ key, label }) => {
            const Icon = FAMILY_ICONS[key];
            return (
              <Link
                key={key}
                href={`/builder/${key}`}
                className="surface-raised group flex flex-col items-center gap-2 px-3 py-5 text-center transition-colors hover:border-ember/60"
              >
                <Icon className="h-8 w-8 text-blueprint transition-colors group-hover:text-ember" />
                <span className="font-display text-sm uppercase tracking-title text-bone">
                  {label}
                </span>
                <span className="font-mono text-[11px] text-bone-faint">
                  {FAMILY_TAGS[key]}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Sector tiles */}
      <section>
        <h2 className="font-display text-xs uppercase tracking-stamp text-bone-faint">
          Sectors
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="surface-panel group flex flex-col gap-3 p-5 transition-colors hover:border-ember/60"
              >
                <Icon className="h-7 w-7 text-ember" />
                <span className="heading-stencil text-lg text-bone transition-colors group-hover:text-ember">
                  {item.label}
                </span>
                <p className="text-sm text-bone-soft">{item.blurb}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Active ruleset strip */}
      <section className="surface-inset flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <span className="font-display text-xs uppercase tracking-stamp text-bone-faint">
          Active ruleset
        </span>
        <span className="numerals text-sm text-bone">{ruleset.name}</span>
        {isCustomized ? <Badge tone="hazard">Customized</Badge> : null}
        <Link
          href="/rules"
          className="ml-auto font-display text-xs uppercase tracking-stamp text-ember transition-colors hover:text-ember-deep"
        >
          Open Rules Lab →
        </Link>
      </section>
    </div>
  );
}
