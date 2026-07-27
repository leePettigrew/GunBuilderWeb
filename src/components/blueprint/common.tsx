"use client";

/**
 * Shared blueprint-canvas chrome: the SVG frame with grid, registration
 * marks and title block, plus dimension lines, callout labels and hatch
 * pattern defs used by every family's drawing.
 *
 * All drawings live in a 900×420 viewBox; the weapon occupies roughly
 * y 60–320 and the title block claims the bottom-right corner.
 */

import type { ReactNode } from "react";
import { computeStats, formatDice } from "@shared/engine";
import type { AnyBuild, Ruleset } from "@shared/types";
import { WEAPON_FAMILIES } from "@shared/types";
import { cn } from "@/lib/cn";

const LINE = "rgb(var(--c-blueprint))";
const TEXT = "rgb(var(--c-bone-soft))";
const FAINT = "rgb(var(--c-bone-faint))";
export const EMBER = "rgb(var(--c-ember))";

export const MONO = "var(--font-mono)";

/** Corner registration cross. */
function RegMark({ x, y }: { x: number; y: number }) {
  return (
    <g stroke={LINE} strokeWidth={1} opacity={0.5}>
      <line x1={x - 7} y1={y} x2={x + 7} y2={y} />
      <line x1={x} y1={y - 7} x2={x} y2={y + 7} />
      <circle cx={x} cy={y} r={3.5} fill="none" />
    </g>
  );
}

export function HatchDefs() {
  // The pattern id repeats when several blueprints share a page (armory
  // grid). That's tolerated deliberately: every instance defines an identical
  // pattern, and url(#bp-hatch) resolves to the first one document-wide, so
  // rendering is correct. Making ids unique would force threading an id
  // through every family's fill="url(#…)" for zero visual gain.
  return (
    <defs>
      <pattern id="bp-hatch" width={6} height={6} patternUnits="userSpaceOnUse">
        <path d="M0,6 L6,0" stroke={LINE} strokeWidth={0.75} opacity={0.3} />
      </pattern>
    </defs>
  );
}

export function DimensionLine({ x1, x2, y, label }: { x1: number; x2: number; y: number; label: string }) {
  const mid = (x1 + x2) / 2;
  return (
    <g stroke={LINE} strokeWidth={1} opacity={0.7}>
      <line x1={x1} y1={y - 6} x2={x1} y2={y + 6} />
      <line x1={x2} y1={y - 6} x2={x2} y2={y + 6} />
      <line x1={x1} y1={y} x2={x2} y2={y} />
      {/* arrowheads */}
      <path d={`M${x1},${y} l7,-3.5 v7 z`} fill={LINE} stroke="none" />
      <path d={`M${x2},${y} l-7,-3.5 v7 z`} fill={LINE} stroke="none" />
      <text
        x={mid}
        y={y - 7}
        textAnchor="middle"
        fontFamily={MONO}
        fontSize={11}
        fill={TEXT}
        stroke="none"
      >
        {label}
      </text>
    </g>
  );
}

export function CalloutLabel({
  x,
  y,
  tx,
  ty,
  text,
  anchor = "start",
  accent = false,
}: {
  x: number;
  y: number;
  tx: number;
  ty: number;
  text: string;
  anchor?: "start" | "end";
  accent?: boolean;
}) {
  const color = accent ? EMBER : LINE;
  return (
    <g opacity={0.85}>
      <circle cx={x} cy={y} r={2.5} fill={color} />
      <polyline points={`${x},${y} ${tx},${ty}`} stroke={color} strokeWidth={1} fill="none" />
      <text
        x={tx + (anchor === "start" ? 5 : -5)}
        y={ty + 3.5}
        textAnchor={anchor}
        fontFamily={MONO}
        fontSize={10.5}
        letterSpacing="0.08em"
        fill={accent ? EMBER : TEXT}
      >
        {text.toUpperCase()}
      </text>
    </g>
  );
}

function familyLabel(build: AnyBuild): string {
  return WEAPON_FAMILIES.find((f) => f.key === build.family)?.label ?? build.family;
}

/** Second line of the title block: the most identifying part choice. */
function classLine(build: AnyBuild, rules: Ruleset): string {
  const c = rules.catalog;
  switch (build.family) {
    case "firearm": {
      const frame = c.frames.find((f) => f.id === build.frameId)?.label ?? "Custom frame";
      const feed =
        build.cartridgeId !== undefined
          ? c.cartridges.find((a) => a.id === build.cartridgeId)?.label
          : c.shellTypes.find((s) => s.id === build.shellTypeId)?.label;
      return feed ? `${frame} — ${feed}` : frame;
    }
    case "bow": {
      const type = c.bowTypes.find((b) => b.id === build.bowTypeId)?.label ?? "Custom bow";
      return `${type} — ${build.drawWeightLbs} lbs`;
    }
    case "crossbow":
      return c.crossbowTypes.find((t) => t.id === build.crossbowTypeId)?.label ?? "Custom crossbow";
    case "grenade": {
      const payload = c.grenadePayloads.find((p) => p.id === build.payloadId)?.label ?? "Payload";
      const quality = c.grenadeQualities.find((q) => q.id === build.qualityId)?.label ?? "";
      return quality ? `${payload} — ${quality}` : payload;
    }
    case "melee":
      return c.meleePresets.find((p) => p.id === build.presetId)?.label ?? "Custom implement";
  }
}

export function BlueprintFrame({
  build,
  rules,
  eyebrow = "ASHEN SKIES — PATTERN SCHEMATIC",
  className,
  children,
}: {
  build: AnyBuild;
  rules: Ruleset;
  eyebrow?: string;
  className?: string;
  children: ReactNode;
}) {
  const stats = computeStats(build, rules);
  const rows: [string, string][] = [
    ["PATTERN", (build.name || "UNNAMED").toUpperCase()],
    ["CLASS", `${familyLabel(build)} · ${classLine(build, rules)}`.toUpperCase()],
    ["DAMAGE", formatDice(stats.damage) + (build.family === "melee" ? " + STR" : "")],
    ["MASS", `${stats.weightKg} KG`],
    ["PRICE", `${stats.priceRats} ${rules.economy.currencyAbbr.toUpperCase()}`],
  ];
  const blockX = 552;
  const blockY = 330;
  return (
    <svg
      viewBox="0 0 900 420"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`Blueprint schematic of ${build.name || "an unnamed weapon"}`}
      className={cn("blueprint-grid w-full h-auto rounded-card border border-rivet/40", className)}
    >
      {/* inner border */}
      <rect x={14} y={14} width={872} height={392} fill="none" stroke={LINE} strokeWidth={1} opacity={0.35} />
      <RegMark x={30} y={30} />
      <RegMark x={870} y={30} />
      <RegMark x={30} y={390} />
      {/* eyebrow */}
      <text x={48} y={34} fontFamily={MONO} fontSize={11} letterSpacing="0.25em" fill={FAINT}>
        {eyebrow}
      </text>
      <line x1={48} y1={42} x2={420} y2={42} stroke={LINE} strokeWidth={1} opacity={0.3} />

      {children}

      {/* title block */}
      <g>
        <rect x={blockX} y={blockY} width={330} height={76} fill="rgb(var(--c-steel-950) / 0.7)" stroke={LINE} strokeWidth={1} opacity={0.9} />
        <line x1={blockX + 92} y1={blockY} x2={blockX + 92} y2={blockY + 76} stroke={LINE} strokeWidth={0.75} opacity={0.4} />
        {rows.map(([k, v], i) => (
          <g key={k}>
            {i > 0 && (
              <line x1={blockX} y1={blockY + i * 15.2} x2={blockX + 330} y2={blockY + i * 15.2} stroke={LINE} strokeWidth={0.5} opacity={0.25} />
            )}
            <text x={blockX + 8} y={blockY + 11.5 + i * 15.2} fontFamily={MONO} fontSize={9} letterSpacing="0.15em" fill={FAINT}>
              {k}
            </text>
            <text x={blockX + 100} y={blockY + 11.5 + i * 15.2} fontFamily={MONO} fontSize={10} fill={i === 2 ? EMBER : TEXT}>
              {v.length > 34 ? `${v.slice(0, 33)}…` : v}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

/** Stroke props shared by all weapon linework. */
export const stroke = {
  stroke: LINE,
  strokeWidth: 1.8,
  strokeLinejoin: "round" as const,
  strokeLinecap: "round" as const,
  fill: "none" as const,
};

export const strokeThin = { ...stroke, strokeWidth: 1.1 };
export const strokeAccent = { ...stroke, stroke: EMBER };
