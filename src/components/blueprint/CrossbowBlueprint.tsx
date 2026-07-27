"use client";

/**
 * Parametric crossbow schematic — size and mechanism detail scale with the
 * chosen type, from the one-hand pistol crossbow to the crewed siege
 * windlass. Muzzle points right; string drawn cocked at the latch.
 */

import { findById } from "@shared/engine";
import type { CrossbowBuild, Ruleset } from "@shared/types";
import {
  BlueprintFrame,
  CalloutLabel,
  DimensionLine,
  HatchDefs,
  stroke,
  strokeThin,
} from "./common";

const SCALES: Record<string, number> = {
  pistolXbow: 0.58,
  lightXbow: 0.82,
  standardXbow: 1.0,
  heavyXbow: 1.12,
  siegeXbow: 1.3,
};

const CY = 190;
const PROD_X = 640;

export function CrossbowBlueprint({
  build,
  rules,
  className,
}: {
  build: CrossbowBuild;
  rules: Ruleset;
  className?: string;
}) {
  const type = findById(rules.catalog.crossbowTypes, build.crossbowTypeId);
  const s = SCALES[build.crossbowTypeId] ?? 1.0;
  const isSiege = build.crossbowTypeId === "siegeXbow";
  const isHeavy = build.crossbowTypeId === "heavyXbow";

  const buttX = PROD_X - 340 * s;
  const latchX = PROD_X - 145 * s;
  const prodSpan = 78 * s + 28;
  const tipCurve = 34 * s;
  const has = (id: string) => build.attachmentIds.includes(id);

  return (
    <BlueprintFrame build={build} rules={rules} className={className}>
      <HatchDefs />
      {/* stock: butt + rail to front */}
      <path
        d={`M${buttX},${CY - 13 * s - 4} l${70 * s},2 L${PROD_X + 18},${CY - 6} h6 v12 h-6 L${buttX + 70 * s},${CY + 13 * s + 2} q-${40 * s},8 -${70 * s},4 z`}
        {...stroke}
      />
      {/* bolt groove */}
      <line x1={latchX} y1={CY - 5} x2={PROD_X + 16} y2={CY - 5} {...strokeThin} />
      {/* prod (bow limbs), curving forward */}
      <path d={`M${PROD_X},${CY - 6} q10,-${prodSpan * 0.55} ${tipCurve},-${prodSpan}`} {...stroke} strokeWidth={3 + 2.5 * s} />
      <path d={`M${PROD_X},${CY + 6} q10,${prodSpan * 0.55} ${tipCurve},${prodSpan}`} {...stroke} strokeWidth={3 + 2.5 * s} />
      {/* cocked string to the latch */}
      <line x1={PROD_X + tipCurve} y1={CY - prodSpan - 4} x2={latchX} y2={CY - 6} {...strokeThin} />
      <line x1={PROD_X + tipCurve} y1={CY + prodSpan + 4} x2={latchX} y2={CY + 2} {...strokeThin} />
      {/* relaxed string, dashed */}
      <path
        d={`M${PROD_X + tipCurve},${CY - prodSpan - 4} Q${PROD_X + tipCurve + 10},${CY} ${PROD_X + tipCurve},${CY + prodSpan + 4}`}
        {...strokeThin}
        strokeDasharray="4 4"
        opacity={0.5}
      />
      {/* latch + trigger + grip */}
      <circle cx={latchX} cy={CY - 2} r={4} {...strokeThin} />
      <path d={`M${latchX - 18 * s},${CY + 13 * s} q6,16 20,6`} {...strokeThin} />
      <path d={`M${latchX - 60 * s},${CY + 12 * s} h${20 * s} l-${6 * s},${34 * s} h-${16 * s} z`} {...stroke} fill="url(#bp-hatch)" />
      {/* stirrup */}
      <ellipse cx={PROD_X + 34} cy={CY} rx={9} ry={14 + 4 * s} {...stroke} />

      {/* bolt, loaded */}
      <line x1={latchX + 4} y1={CY - 5} x2={PROD_X + 30} y2={CY - 5} {...stroke} strokeWidth={1.6} />
      <path d={`M${PROD_X + 30},${CY - 9} l14,4 l-14,4 z`} {...stroke} fill="rgb(var(--c-blueprint))" />

      {isHeavy && (
        /* spanning hook stowed on the stock */
        <path d={`M${buttX + 30},${CY - 13 * s - 8} q10,-8 20,0`} {...strokeThin} />
      )}
      {isSiege && (
        <g>
          {/* windlass wheel + crank at the butt */}
          <circle cx={buttX + 6} cy={CY - 2} r={15} {...stroke} />
          <circle cx={buttX + 6} cy={CY - 2} r={4} {...strokeThin} />
          <line x1={buttX + 6} y1={CY - 2} x2={buttX - 12} y2={CY - 20} {...stroke} />
          <circle cx={buttX - 14} cy={CY - 22} r={3.5} {...strokeThin} />
          {/* support legs */}
          <line x1={PROD_X - 40} y1={CY + 10} x2={PROD_X - 62} y2={CY + 78} {...stroke} />
          <line x1={PROD_X - 40} y1={CY + 10} x2={PROD_X - 18} y2={CY + 78} {...stroke} />
          <line x1={PROD_X - 68} y1={CY + 78} x2={PROD_X - 12} y2={CY + 78} {...strokeThin} />
        </g>
      )}

      {has("scope") && (
        <g>
          <line x1={latchX + 30} y1={CY - 12} x2={latchX + 30} y2={CY - 26} {...stroke} />
          <line x1={latchX + 80} y1={CY - 10} x2={latchX + 80} y2={CY - 26} {...stroke} />
          <rect x={latchX + 16} y={CY - 38} width={86} height={12} rx={6} {...stroke} />
        </g>
      )}
      {has("laser") && <rect x={PROD_X - 30} y={CY - 20} width={22} height={8} rx={3} {...stroke} />}

      {type && (
        <>
          <CalloutLabel x={latchX} y={CY - 8} tx={latchX + 40} ty={92} text={`${type.reload} reload`} />
          <CalloutLabel x={PROD_X + tipCurve} y={CY - prodSpan - 2} tx={PROD_X + 120} ty={110} text={type.label} accent />
        </>
      )}
      <DimensionLine x1={buttX} x2={PROD_X + 40} y={308} label={`OVERALL ${(Math.round((PROD_X + 40 - buttX) / PX))} CM`} />
    </BlueprintFrame>
  );
}

// 900 SVG units ≈ 180cm of weapon at 1.0 scale → 5 units per cm.
const PX = 5;
