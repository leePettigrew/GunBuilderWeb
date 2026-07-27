"use client";

/**
 * Parametric firearm schematic. Every build choice changes the drawing:
 * frame → receiver silhouette; barrel length → drawn length + dimension;
 * stock/magazine → swapped shapes; attachments → rendered at their anchor;
 * barrel type & rifling → barrel detailing.
 *
 * Layout: muzzle points right. Long-gun receivers sit around x 200–390 with
 * the barrel axis at y≈180; barrel pixels = mm × 0.5 (clamped to the frame).
 */

import type { ReactNode } from "react";
import { findById } from "@shared/engine";
import type { FirearmBuild, Ruleset } from "@shared/types";
import {
  BlueprintFrame,
  CalloutLabel,
  DimensionLine,
  HatchDefs,
  stroke,
  strokeThin,
} from "./common";

interface Geo {
  rx0: number; // receiver rear
  rx1: number; // receiver front / barrel start
  top: number;
  bot: number;
  barrelY: number;
  barrelHalf: number;
}

const GEOS: Record<string, Geo> = {
  pistol: { rx0: 360, rx1: 505, top: 164, bot: 192, barrelY: 172, barrelHalf: 4 },
  smg: { rx0: 250, rx1: 420, top: 168, bot: 198, barrelY: 180, barrelHalf: 4.5 },
  carbine: { rx0: 230, rx1: 385, top: 166, bot: 196, barrelY: 178, barrelHalf: 5 },
  assaultRifle: { rx0: 220, rx1: 390, top: 164, bot: 198, barrelY: 177, barrelHalf: 5 },
  battleRifle: { rx0: 215, rx1: 392, top: 160, bot: 200, barrelY: 176, barrelHalf: 5.5 },
  shotgun: { rx0: 250, rx1: 392, top: 168, bot: 194, barrelY: 176, barrelHalf: 5.5 },
  dmr: { rx0: 215, rx1: 392, top: 164, bot: 196, barrelY: 176, barrelHalf: 5 },
  sniper: { rx0: 220, rx1: 385, top: 166, bot: 194, barrelY: 176, barrelHalf: 5.5 },
  lmg: { rx0: 200, rx1: 392, top: 154, bot: 206, barrelY: 174, barrelHalf: 6.5 },
};

const FALLBACK_GEO: Geo = { rx0: 230, rx1: 390, top: 164, bot: 196, barrelY: 177, barrelHalf: 5 };

const PX_PER_MM = 0.5;
const MAX_TIP_X = 810;

// ---------------------------------------------------------------------------
// Receivers — one recognisable silhouette per frame
// ---------------------------------------------------------------------------

function receiverFor(frameId: string, g: Geo, breakAction: boolean): ReactNode {
  const mid = (g.top + g.bot) / 2;
  switch (frameId) {
    case "pistol":
      return (
        <g>
          {/* slide with rear serrations */}
          <rect x={g.rx0} y={g.top} width={g.rx1 - g.rx0} height={16} rx={3} {...stroke} />
          {[0, 6, 12].map((o) => (
            <line key={o} x1={g.rx0 + 8 + o} y1={g.top + 3} x2={g.rx0 + 8 + o} y2={g.top + 13} {...strokeThin} />
          ))}
          {/* frame + trigger guard */}
          <path d={`M${g.rx0 + 4},${g.top + 16} h${g.rx1 - g.rx0 - 24} v10 h-52 q-16,22 -34,2 h-14 z`} {...stroke} />
          {/* grip */}
          <path d={`M${g.rx0 + 92},${g.top + 26} h44 l-14,62 q-24,8 -36,-4 z`} {...stroke} fill="url(#bp-hatch)" />
          {/* hammer */}
          <path d={`M${g.rx0 - 2},${g.top + 4} l-8,-6 l-3,7 l8,4 z`} {...strokeThin} />
        </g>
      );
    case "smg":
      return (
        <g>
          {/* tubular receiver */}
          <rect x={g.rx0} y={g.top} width={g.rx1 - g.rx0} height={g.bot - g.top} rx={14} {...stroke} />
          {/* charging handle slot */}
          <line x1={g.rx0 + 30} y1={mid - 6} x2={g.rx0 + 110} y2={mid - 6} {...strokeThin} />
          <circle cx={g.rx0 + 46} cy={mid - 6} r={3} {...strokeThin} />
          {/* grip */}
          <path d={`M${g.rx0 + 96},${g.bot} h26 l-8,44 h-20 z`} {...stroke} fill="url(#bp-hatch)" />
          <path d={`M${g.rx0 + 126},${g.bot} q10,14 24,4`} {...strokeThin} />
        </g>
      );
    case "assaultRifle":
      return (
        <g>
          {/* dust-cover receiver with rear slope */}
          <path d={`M${g.rx0},${g.top + 6} q40,-8 96,-6 l${g.rx1 - g.rx0 - 96},4 v${g.bot - g.top - 6} h-${g.rx1 - g.rx0} z`} {...stroke} />
          <line x1={g.rx0 + 14} y1={g.top + 14} x2={g.rx1 - 12} y2={g.top + 12} {...strokeThin} />
          {/* grip + trigger guard */}
          <path d={`M${g.rx0 + 58},${g.bot} h24 l-10,46 q-16,6 -22,-2 z`} {...stroke} fill="url(#bp-hatch)" />
          <path d={`M${g.rx0 + 86},${g.bot} q14,20 34,4`} {...strokeThin} />
        </g>
      );
    case "battleRifle":
      return (
        <g>
          {/* boxy receiver with rail teeth */}
          <rect x={g.rx0} y={g.top} width={g.rx1 - g.rx0} height={g.bot - g.top} rx={4} {...stroke} />
          {Array.from({ length: 9 }, (_, i) => (
            <line key={i} x1={g.rx0 + 16 + i * 18} y1={g.top} x2={g.rx0 + 16 + i * 18} y2={g.top - 4} {...strokeThin} />
          ))}
          <line x1={g.rx0 + 12} y1={g.top - 4} x2={g.rx1 - 12} y2={g.top - 4} {...strokeThin} />
          {/* ejection port + grip */}
          <rect x={g.rx0 + 96} y={mid - 8} width={34} height={12} rx={2} {...strokeThin} />
          <path d={`M${g.rx0 + 56},${g.bot} h24 l-9,44 q-15,7 -22,-2 z`} {...stroke} fill="url(#bp-hatch)" />
          <path d={`M${g.rx0 + 84},${g.bot} q13,19 32,4`} {...strokeThin} />
        </g>
      );
    case "shotgun":
      return (
        <g>
          <path d={`M${g.rx0},${g.top + 4} q30,-6 70,-4 h${g.rx1 - g.rx0 - 70} v${g.bot - g.top - 2} h-${g.rx1 - g.rx0} z`} {...stroke} />
          {breakAction && (
            /* hinge pin + opening lever for break actions */
            <g>
              <circle cx={g.rx1 - 18} cy={mid + 2} r={4} {...strokeThin} />
              <line x1={g.rx0 + 30} y1={g.top - 2} x2={g.rx0 + 78} y2={g.top - 2} {...strokeThin} />
            </g>
          )}
          <path d={`M${g.rx0 + 60},${g.bot + 2} q16,18 36,4`} {...strokeThin} />
        </g>
      );
    case "dmr":
      return (
        <g>
          <path d={`M${g.rx0},${g.top + 8} l34,-8 h${g.rx1 - g.rx0 - 34} v${g.bot - g.top} h-${g.rx1 - g.rx0} z`} {...stroke} />
          <line x1={g.rx0 + 10} y1={g.top + 2} x2={g.rx1 - 8} y2={g.top} {...strokeThin} />
          <rect x={g.rx0 + 104} y={mid - 7} width={30} height={11} rx={2} {...strokeThin} />
          <path d={`M${g.rx0 + 60},${g.bot} h22 l-9,42 q-14,6 -20,-2 z`} {...stroke} fill="url(#bp-hatch)" />
          <path d={`M${g.rx0 + 86},${g.bot} q13,18 30,4`} {...strokeThin} />
        </g>
      );
    case "sniper":
      return (
        <g>
          <path d={`M${g.rx0},${g.top + 4} q50,-6 110,-4 h${g.rx1 - g.rx0 - 110} v${g.bot - g.top} h-${g.rx1 - g.rx0} z`} {...stroke} />
          {/* bolt handle */}
          <path d={`M${g.rx0 + 118},${mid} q6,14 -4,22`} {...stroke} />
          <circle cx={g.rx0 + 112} cy={mid + 24} r={5} {...stroke} />
          <path d={`M${g.rx0 + 64},${g.bot + 2} q14,16 32,4`} {...strokeThin} />
        </g>
      );
    case "lmg":
      return (
        <g>
          <rect x={g.rx0} y={g.top} width={g.rx1 - g.rx0} height={g.bot - g.top} rx={5} {...stroke} />
          {/* feed cover bump + carry handle */}
          <path d={`M${g.rx0 + 30},${g.top} q30,-14 96,-12 l40,12`} {...stroke} />
          <path d={`M${g.rx0 + 70},${g.top - 14} q26,-16 60,-4`} {...strokeThin} />
          {/* grip + trigger guard */}
          <path d={`M${g.rx0 + 100},${g.bot} h26 l-10,44 q-16,6 -22,-2 z`} {...stroke} fill="url(#bp-hatch)" />
          <path d={`M${g.rx0 + 130},${g.bot} q14,18 32,4`} {...strokeThin} />
        </g>
      );
    default:
      // carbine + unknown frames share the neutral compact-rifle shape
      return (
        <g>
          <rect x={g.rx0} y={g.top} width={g.rx1 - g.rx0} height={g.bot - g.top} rx={6} {...stroke} />
          <rect x={g.rx0 + 88} y={mid - 7} width={30} height={11} rx={2} {...strokeThin} />
          <path d={`M${g.rx0 + 52},${g.bot} h22 l-9,42 q-14,6 -20,-2 z`} {...stroke} fill="url(#bp-hatch)" />
          <path d={`M${g.rx0 + 78},${g.bot} q13,18 30,4`} {...strokeThin} />
        </g>
      );
  }
}

// ---------------------------------------------------------------------------
// Stocks
// ---------------------------------------------------------------------------

function stockFor(stockId: string, g: Geo): ReactNode {
  const t = g.top + 2;
  const b = g.bot;
  switch (stockId) {
    case "pistolGrip":
      return null;
    case "wireframe":
      return (
        <g>
          <line x1={g.rx0} y1={t + 4} x2={g.rx0 - 100} y2={t + 12} {...stroke} />
          <line x1={g.rx0} y1={b - 4} x2={g.rx0 - 100} y2={b + 22} {...stroke} />
          <rect x={g.rx0 - 112} y={t + 8} width={12} height={b + 26 - t - 8} rx={4} {...stroke} />
        </g>
      );
    case "thumbhole":
      return (
        <g>
          <path d={`M${g.rx0},${t} l-92,10 l-22,${b - t + 28} l20,4 l94,-${b - t + 2} z`} {...stroke} fill="url(#bp-hatch)" />
          <ellipse cx={g.rx0 - 46} cy={(t + b) / 2 + 12} rx={15} ry={9} {...stroke} fill="rgb(var(--c-steel-950))" />
        </g>
      );
    case "skeleton":
      return (
        <g>
          <path d={`M${g.rx0},${t} l-94,10 l-20,${b - t + 26} l18,6 l96,-${b - t + 2} z`} {...stroke} />
          <path d={`M${g.rx0 - 22},${t + 10} l-58,10 l-10,${b - t + 4} l14,2 z`} {...strokeThin} />
        </g>
      );
    case "collapsible":
      return (
        <g>
          <rect x={g.rx0 - 72} y={(t + b) / 2 - 7} width={72} height={12} rx={3} {...stroke} />
          {[16, 30, 44].map((o) => (
            <line key={o} x1={g.rx0 - o} y1={(t + b) / 2 - 7} x2={g.rx0 - o} y2={(t + b) / 2 + 5} {...strokeThin} />
          ))}
          <path d={`M${g.rx0 - 74},${t + 4} h-30 v${b - t + 26} h22 l8,-14 z`} {...stroke} fill="url(#bp-hatch)" />
        </g>
      );
    default:
      // standard + unknown
      return (
        <path
          d={`M${g.rx0},${t} l-90,8 l-26,${b - t + 30} l22,6 l94,-${b - t + 6} z`}
          {...stroke}
          fill="url(#bp-hatch)"
        />
      );
  }
}

// ---------------------------------------------------------------------------
// Magazines
// ---------------------------------------------------------------------------

function magazineFor(magId: string, g: Geo, barrelPx: number): ReactNode {
  const mx = g.rx0 + (g.rx1 - g.rx0) * 0.66;
  const b = g.bot;
  switch (magId) {
    case "box":
    case "detachable":
      return (
        <g>
          <path d={`M${mx - 13},${b} l-5,44 q2,10 14,10 l12,-2 q8,-2 8,-10 l-2,-42 z`} {...stroke} fill="url(#bp-hatch)" />
          {magId === "detachable" && <circle cx={mx + 18} cy={b + 8} r={3} {...strokeThin} />}
        </g>
      );
    case "drum":
      return (
        <g>
          <circle cx={mx} cy={b + 34} r={28} {...stroke} fill="url(#bp-hatch)" />
          <circle cx={mx} cy={b + 34} r={8} {...strokeThin} fill="rgb(var(--c-steel-950))" />
        </g>
      );
    case "integratedDrum":
      return <circle cx={mx - 8} cy={b + 26} r={22} {...stroke} strokeDasharray="5 4" />;
    case "belt":
      return (
        <g>
          <path d={`M${mx - 10},${b + 2} q-12,30 -46,44 q-24,10 -40,6`} {...stroke} />
          {[0.15, 0.35, 0.55, 0.75, 0.92].map((f) => {
            const px = mx - 10 - f * 82;
            const py = b + 6 + f * 42;
            return <line key={f} x1={px} y1={py - 5} x2={px + 6} y2={py + 5} {...strokeThin} />;
          })}
        </g>
      );
    case "tube":
      return <rect x={g.rx1} y={g.barrelY + g.barrelHalf + 4} width={Math.max(60, barrelPx * 0.72)} height={7} rx={3.5} {...stroke} />;
    case "cylinder":
      return (
        <g>
          <circle cx={g.rx0 + (g.rx1 - g.rx0) * 0.42} cy={(g.top + g.bot) / 2 + 3} r={15} {...stroke} fill="url(#bp-hatch)" />
          <circle cx={g.rx0 + (g.rx1 - g.rx0) * 0.42} cy={(g.top + g.bot) / 2 + 3} r={4} {...strokeThin} />
        </g>
      );
    case "clip":
    case "enBloc":
      return (
        <g>
          <rect x={mx - 8} y={g.top - 18} width={16} height={15} rx={2} {...stroke} />
          <line x1={mx} y1={g.top - 2} x2={mx} y2={g.top + 6} {...strokeThin} strokeDasharray="3 3" />
        </g>
      );
    default:
      // muzzle loader / breach loader / unknown: no external feed device
      return null;
  }
}

// ---------------------------------------------------------------------------
// Barrel assembly + muzzle devices
// ---------------------------------------------------------------------------

function barrelAssembly(
  build: FirearmBuild,
  g: Geo,
  barrelPx: number,
  breakAction: boolean,
): { node: ReactNode; tipX: number } {
  const barrelTypeId = build.barrelTypeId;
  let half = g.barrelHalf;
  if (barrelTypeId === "heavy") half += 1.6;
  if (barrelTypeId === "light") half -= 1.4;
  const y = g.barrelY;
  const x0 = g.rx1;
  const x1 = x0 + barrelPx;
  const choked = barrelTypeId === "choked";
  const taper = choked ? 2.5 : 0;

  const parts: ReactNode[] = [];
  if (breakAction && build.frameId === "shotgun") {
    // over/under double bore
    parts.push(
      <g key="bores">
        <path d={`M${x0},${y - half - 3} L${x1},${y - half - 3 + taper} L${x1},${y - 0.5} L${x0},${y - 0.5} z`} {...stroke} />
        <path d={`M${x0},${y + 0.5} L${x1},${y + 0.5} L${x1},${y + half + 3 - taper} L${x0},${y + half + 3} z`} {...stroke} />
      </g>,
    );
  } else {
    parts.push(
      <path
        key="bore"
        d={`M${x0},${y - half} L${x1},${y - half + taper} L${x1},${y + half - taper} L${x0},${y + half} z`}
        {...stroke}
      />,
    );
  }
  if (barrelTypeId === "fluted" && barrelPx > 34) {
    parts.push(
      <g key="flutes">
        <line x1={x0 + 14} y1={y - half / 2} x2={x1 - 12} y2={y - half / 2} {...strokeThin} />
        <line x1={x0 + 14} y1={y + half / 2} x2={x1 - 12} y2={y + half / 2} {...strokeThin} />
      </g>,
    );
  }
  if (build.rifled) {
    parts.push(
      <g key="rifling" opacity={0.5}>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={x0 + barrelPx * f - 7}
            y1={y + half * 0.5}
            x2={x0 + barrelPx * f + 7}
            y2={y - half * 0.5}
            {...strokeThin}
            strokeDasharray="4 3"
          />
        ))}
      </g>,
    );
  }
  // SMG perforated shroud homage — only holes that fit the drawn barrel
  if (build.frameId === "smg") {
    parts.push(
      <g key="shroud">
        {[14, 32, 50, 68]
          .filter((o) => o < barrelPx - 8)
          .map((o) => (
            <circle key={o} cx={x0 + o} cy={y} r={2.5} {...strokeThin} />
          ))}
      </g>,
    );
  }

  // muzzle devices extend the tip in sequence
  let tip = x1;
  const has = (id: string) => build.attachmentIds.includes(id);
  if (has("suppressor")) {
    parts.push(<rect key="sup" x={tip} y={y - half - 4} width={76} height={(half + 4) * 2} rx={6} {...stroke} fill="url(#bp-hatch)" />);
    tip += 76;
  }
  if (has("muzzleBrake")) {
    parts.push(
      <g key="brake">
        <rect x={tip} y={y - half - 2} width={28} height={(half + 2) * 2} rx={3} {...stroke} />
        {[6, 14, 22].map((o) => (
          <line key={o} x1={tip + o} y1={y - half - 6} x2={tip + o + 4} y2={y - half - 2} {...strokeThin} />
        ))}
      </g>,
    );
    tip += 28;
  }
  if (has("compensator")) {
    parts.push(
      <g key="comp">
        <rect x={tip} y={y - half - 2} width={24} height={(half + 2) * 2} rx={3} {...stroke} />
        <line x1={tip + 7} y1={y - half - 2} x2={tip + 7} y2={y - half - 6} {...strokeThin} />
        <line x1={tip + 15} y1={y - half - 2} x2={tip + 15} y2={y - half - 6} {...strokeThin} />
      </g>,
    );
    tip += 24;
  }
  if (has("bayonet")) {
    parts.push(
      <g key="bayonet">
        <circle cx={x1 + 6} cy={y + half + 6} r={3.5} {...strokeThin} />
        <path d={`M${x1 + 10},${y + half + 3} h84 l18,4 l-18,5 h-84 z`} {...stroke} fill="url(#bp-hatch)" />
      </g>,
    );
  }
  // front sight post (skip when a suppressor swallows the muzzle)
  if (!has("suppressor")) {
    parts.push(
      <g key="fsight">
        <line x1={x1 - 10} y1={y - half} x2={x1 - 10} y2={y - half - 9} {...strokeThin} />
        <circle cx={x1 - 10} cy={y - half - 11} r={1.8} fill="rgb(var(--c-blueprint))" stroke="none" />
      </g>,
    );
  }
  return { node: <g>{parts}</g>, tipX: tip };
}

// ---------------------------------------------------------------------------
// Rail / underbarrel / side attachments
// ---------------------------------------------------------------------------

function attachmentsFor(build: FirearmBuild, g: Geo, barrelPx: number): ReactNode {
  const has = (id: string) => build.attachmentIds.includes(id);
  const parts: ReactNode[] = [];
  const railX = g.rx0 + 26;
  if (has("scope")) {
    const yTop = g.top - 24;
    parts.push(
      <g key="scope">
        <line x1={railX + 16} y1={g.top} x2={railX + 16} y2={yTop + 10} {...stroke} />
        <line x1={railX + 78} y1={g.top} x2={railX + 78} y2={yTop + 10} {...stroke} />
        <rect x={railX} y={yTop} width={104} height={12} rx={6} {...stroke} />
        <path d={`M${railX + 104},${yTop - 2} h14 v16 h-14 z`} {...stroke} />
        <rect x={railX + 42} y={yTop - 7} width={12} height={7} rx={2} {...strokeThin} />
      </g>,
    );
  }
  if (has("ubgl")) {
    parts.push(
      <g key="ubgl">
        <rect x={g.rx1 - 6} y={g.barrelY + g.barrelHalf + 12} width={112} height={17} rx={8} {...stroke} fill="url(#bp-hatch)" />
        <path d={`M${g.rx1 - 6},${g.barrelY + g.barrelHalf + 29} q-8,12 -18,8`} {...strokeThin} />
      </g>,
    );
  }
  if (has("bipod")) {
    const bx = g.rx1 + barrelPx * 0.55;
    const by = g.barrelY + g.barrelHalf;
    parts.push(
      <g key="bipod">
        <circle cx={bx} cy={by + 3} r={2.5} {...strokeThin} />
        <line x1={bx} y1={by + 3} x2={bx - 20} y2={by + 58} {...stroke} />
        <line x1={bx} y1={by + 3} x2={bx + 20} y2={by + 58} {...stroke} />
        <line x1={bx - 25} y1={by + 58} x2={bx - 15} y2={by + 58} {...stroke} />
        <line x1={bx + 15} y1={by + 58} x2={bx + 25} y2={by + 58} {...stroke} />
      </g>,
    );
  }
  if (has("foregrip")) {
    parts.push(
      <path
        key="foregrip"
        d={`M${g.rx1 + 34},${g.barrelY + g.barrelHalf + 2} h12 l-2,26 h-8 z`}
        {...stroke}
        fill="url(#bp-hatch)"
      />,
    );
  }
  let sideOffset = 0;
  if (has("laser")) {
    parts.push(<rect key="laser" x={g.rx1 + 8} y={g.barrelY - g.barrelHalf - 14} width={24} height={9} rx={3} {...stroke} />);
    sideOffset = 30;
  }
  if (has("flashlight")) {
    parts.push(
      <g key="light">
        <rect x={g.rx1 + 8 + sideOffset} y={g.barrelY - g.barrelHalf - 14} width={26} height={9} rx={4.5} {...stroke} />
        <line x1={g.rx1 + 36 + sideOffset} y1={g.barrelY - g.barrelHalf - 12} x2={g.rx1 + 42 + sideOffset} y2={g.barrelY - g.barrelHalf - 14} {...strokeThin} />
      </g>,
    );
  }
  return <g>{parts}</g>;
}

// ---------------------------------------------------------------------------

const BREAK_ACTIONS = new Set(["break", "flintlock", "matchlock"]);

export function FirearmBlueprint({
  build,
  rules,
  className,
}: {
  build: FirearmBuild;
  rules: Ruleset;
  className?: string;
}) {
  const g = GEOS[build.frameId] ?? FALLBACK_GEO;
  const breakAction = BREAK_ACTIONS.has(build.actionId);
  const barrelPx = Math.max(30, Math.min(build.barrelLengthMm * PX_PER_MM, MAX_TIP_X - g.rx1 - 90));
  const { node: barrelNode, tipX } = barrelAssembly(build, g, barrelPx, breakAction);

  const action = findById(rules.catalog.actions, build.actionId);
  const feedLabel =
    build.cartridgeId !== undefined
      ? findById(rules.catalog.cartridges, build.cartridgeId)?.label
      : [
          findById(rules.catalog.shellTypes, build.shellTypeId)?.label,
          findById(rules.catalog.shellGauges, build.shellGaugeId)?.label,
        ]
          .filter(Boolean)
          .join(" · ");
  const firstAttachment = build.attachmentIds
    .map((id) => findById(rules.catalog.attachments, id))
    .find((a) => a !== undefined);

  return (
    <BlueprintFrame build={build} rules={rules} className={className}>
      <HatchDefs />
      {stockFor(build.stockId, g)}
      {magazineFor(build.magazineId, g, barrelPx)}
      {receiverFor(build.frameId, g, breakAction)}
      {barrelNode}
      {attachmentsFor(build, g, barrelPx)}
      {/* rear sight */}
      <rect x={g.rx0 + 12} y={g.top - 6} width={7} height={5} {...strokeThin} />

      {action && (
        <CalloutLabel x={g.rx0 + 70} y={g.top - 8} tx={g.rx0 + 30} ty={86} text={action.label} />
      )}
      {feedLabel && (
        <CalloutLabel x={g.rx1 + 6} y={g.barrelY - g.barrelHalf} tx={g.rx1 + 96} ty={100} text={feedLabel} />
      )}
      {firstAttachment && (
        <CalloutLabel
          x={
            firstAttachment.anchor === "muzzle"
              ? tipX - 12
              : firstAttachment.anchor === "rail"
                ? g.rx0 + 80
                : firstAttachment.anchor === "side"
                  ? g.rx1 + 20
                  : g.rx1 + 40 // underbarrel devices hang off the handguard
          }
          y={
            firstAttachment.anchor === "muzzle"
              ? g.barrelY
              : firstAttachment.anchor === "rail"
                ? g.top - 30
                : firstAttachment.anchor === "side"
                  ? g.barrelY - g.barrelHalf - 12
                  : g.barrelY + g.barrelHalf + 20
          }
          tx={Math.min(tipX + 10, 700)}
          ty={64}
          text={firstAttachment.label}
          accent
        />
      )}
      <DimensionLine x1={g.rx1} x2={g.rx1 + barrelPx} y={302} label={`${build.barrelLengthMm} MM BARREL`} />
    </BlueprintFrame>
  );
}
