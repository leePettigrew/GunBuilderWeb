"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { computeStats } from "@shared/engine";
import { encodeShare } from "@shared/share-codec";
import { WEAPON_FAMILIES } from "@shared/types";
import type { AnyBuild, Ruleset, Weapon, WeaponFamily } from "@shared/types";
import { WeaponBlueprint } from "@/components/blueprint";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { StatChip } from "@/components/ui/StatChip";
import { IconShare, IconTrash } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { copyText } from "@/lib/download";

type BadgeTone = "neutral" | "ember" | "hazard" | "blood" | "olive";

export const FAMILY_BADGE_TONE: Record<WeaponFamily, BadgeTone> = {
  firearm: "ember",
  bow: "olive",
  crossbow: "hazard",
  grenade: "blood",
  melee: "neutral",
};

export function familyLabel(family: WeaponFamily): string {
  return WEAPON_FAMILIES.find((f) => f.key === family)?.label ?? family;
}

export function compactDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Absolute share URL — fragment payload, so it never hits access logs. */
export function buildShareUrl(build: AnyBuild): string {
  return `${window.location.origin}/share#${encodeShare(build)}`;
}

export interface WeaponCardProps {
  weapon: Weapon;
  rules: Ruleset;
  onDelete(): void;
  className?: string;
}

export function WeaponCard({ weapon, rules, onDelete, className }: WeaponCardProps) {
  const { build } = weapon;
  // Stats computed at render: Rules Lab edits re-stat every card automatically.
  const stats = useMemo(() => computeStats(build, rules), [build, rules]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleShare = async () => {
    if (await copyText(buildShareUrl(build))) setCopied(true);
  };

  const name = build.name || "Unnamed pattern";

  return (
    <article className={cn("surface-panel flex flex-col overflow-hidden animate-fade-in", className)}>
      <Link
        href={`/armory/${weapon.id}`}
        aria-label={`Open ${name}`}
        className="block h-40 overflow-hidden border-b border-rivet/40"
      >
        <WeaponBlueprint build={build} rules={rules} className="h-full w-full" />
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="heading-stencil text-lg leading-tight">{name}</h3>
          <Badge tone={FAMILY_BADGE_TONE[build.family]}>{familyLabel(build.family)}</Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatChip label="Damage" value={stats.damageLabel} />
          <StatChip
            label="Price"
            value={`${Math.round(stats.priceRats).toLocaleString()} ${rules.economy.currencyAbbr}`}
          />
          <StatChip label="Weight" value={`${stats.weightKg.toFixed(1)} kg`} />
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="numerals text-xs text-bone-faint">Upd {compactDate(weapon.updatedAt)}</span>
          <div className="flex items-center gap-1.5">
            <Link href={`/armory/${weapon.id}`} className={buttonClasses("secondary", "sm")}>
              Open
            </Link>
            <Button variant="ghost" size="sm" onClick={handleShare} title="Copy share link">
              <IconShare className="h-4 w-4" />
              {copied ? "Copied" : "Share"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              aria-label={`Delete ${name}`}
              title="Delete"
            >
              <IconTrash className="h-4 w-4 text-blood" />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
