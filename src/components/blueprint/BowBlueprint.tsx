"use client";

/**
 * Parametric bow schematic. Limb span follows draw length, limb thickness
 * follows draw weight, silhouette follows the bow type, and the nocked arrow
 * is drawn from the selected arrow definition.
 *
 * Orientation: string on the left, limbs arcing right, arrow pointing right.
 */

import type { ReactNode } from "react";
import { findById } from "@shared/engine";
import type { BowBuild, Ruleset } from "@shared/types";
import {
  BlueprintFrame,
  CalloutLabel,
  DimensionLine,
  HatchDefs,
  stroke,
  strokeThin,
} from "./common";

const CX = 380; // string line x
const CY = 185;

function limbPath(typeId: string, span: number, thickness: number): ReactNode {
  const top = CY - span;
  const bot = CY + span;
  const limb = { ...stroke, strokeWidth: thickness };
  switch (typeId) {
    case "compound": {
      // rigid riser + short stiff limbs + cams + cables
      return (
        <g>
          <path d={`M${CX + 26},${CY - 24} l-6,-${span - 46} l14,-8`} {...limb} />
          <path d={`M${CX + 26},${CY + 24} l-6,${span - 46} l14,8`} {...limb} />
          {/* riser block */}
          <path d={`M${CX + 20},${CY - 26} q16,-6 14,10 l-4,32 q-2,16 -12,10 z`} {...stroke} fill="url(#bp-hatch)" />
          {/* cams */}
          <circle cx={CX + 34} cy={top + 10} r={10} {...stroke} />
          <circle cx={CX + 34} cy={bot - 10} r={10} {...stroke} />
          <circle cx={CX + 34} cy={top + 10} r={3} {...strokeThin} />
          <circle cx={CX + 34} cy={bot - 10} r={3} {...strokeThin} />
          {/* cables */}
          <line x1={CX + 30} y1={top + 18} x2={CX + 38} y2={bot - 18} {...strokeThin} />
          <line x1={CX + 38} y1={top + 18} x2={CX + 30} y2={bot - 18} {...strokeThin} />
        </g>
      );
    }
    case "longbow":
      return <path d={`M${CX},${top} Q${CX + 58},${CY} ${CX},${bot}`} {...limb} />;
    case "heavyWar":
      return (
        <g>
          <path d={`M${CX + 6},${top + 10} Q${CX + 64},${CY} ${CX + 6},${bot - 10}`} {...limb} />
          {/* recurved tips hook back toward the string */}
          <path d={`M${CX + 6},${top + 10} q-4,-10 -10,-12`} {...limb} />
          <path d={`M${CX + 6},${bot - 10} q-4,10 -10,12`} {...limb} />
        </g>
      );
    case "composite":
      return (
        <g>
          <path d={`M${CX + 2},${top + 16} Q${CX + 54},${CY} ${CX + 2},${bot - 16}`} {...limb} />
          {/* siyahs: stiff angled tip levers */}
          <path d={`M${CX + 2},${top + 16} l-8,-16`} {...limb} />
          <path d={`M${CX + 2},${bot - 16} l-8,16`} {...limb} />
        </g>
      );
    case "plastic":
      return (
        <g>
          <path d={`M${CX},${top} Q${CX + 36},${CY} ${CX},${bot}`} {...limb} />
          <rect x={CX + 12} y={CY - 20} width={12} height={40} rx={4} {...stroke} />
        </g>
      );
    case "improvised":
      return (
        <g>
          {/* two lashed staves with a kink at the grip */}
          <path d={`M${CX - 2},${top} L${CX + 34},${CY - 14} L${CX + 30},${CY}`} {...limb} />
          <path d={`M${CX + 30},${CY} L${CX + 36},${CY + 16} L${CX + 2},${bot}`} {...limb} />
          {[CY - 10, CY, CY + 10].map((y) => (
            <g key={y}>
              <line x1={CX + 24} y1={y - 4} x2={CX + 40} y2={y + 4} {...strokeThin} />
              <line x1={CX + 40} y1={y - 4} x2={CX + 24} y2={y + 4} {...strokeThin} />
            </g>
          ))}
        </g>
      );
    default:
      // hunting / lightHunting / unknown: clean recurve
      return (
        <g>
          <path d={`M${CX + 2},${top + 8} Q${CX + 50},${CY} ${CX + 2},${bot - 8}`} {...limb} />
          <path d={`M${CX + 2},${top + 8} q-3,-6 -8,-8`} {...limb} />
          <path d={`M${CX + 2},${bot - 8} q-3,6 -8,8`} {...limb} />
        </g>
      );
  }
}

function arrowHead(arrowId: string, x: number, y: number): ReactNode {
  switch (arrowId) {
    case "bodkin":
      return <path d={`M${x},${y - 2} l26,2 l-26,2 z`} {...stroke} fill="rgb(var(--c-blueprint))" />;
    case "broadhead":
      return <path d={`M${x},${y - 9} l24,9 l-24,9 l7,-9 z`} {...stroke} fill="url(#bp-hatch)" />;
    case "obsidianGlass":
      return <path d={`M${x},${y - 7} l8,3 l4,-2 l6,4 l4,2 l-4,2 l-6,4 l-4,-2 l-8,3 l5,-7 z`} {...stroke} />;
    case "explosive":
      return (
        <g>
          <circle cx={x + 9} cy={y} r={7} {...stroke} stroke="rgb(var(--c-ember))" />
          <path d={`M${x + 16},${y} l9,0`} {...strokeThin} stroke="rgb(var(--c-ember))" />
        </g>
      );
    default:
      // improvised / unknown: crude triangle
      return <path d={`M${x},${y - 5} l16,5 l-16,5 z`} {...strokeThin} />;
  }
}

export function BowBlueprint({
  build,
  rules,
  className,
}: {
  build: BowBuild;
  rules: Ruleset;
  className?: string;
}) {
  const span = Math.max(60, Math.min(70 + build.drawLengthIn * 2.6, 130));
  const thickness = Math.max(3, Math.min(3 + build.drawWeightLbs * 0.045, 10.5));
  const material = findById(rules.catalog.bowMaterials, build.materialId);
  const arrow = findById(rules.catalog.arrows, build.arrowId);
  const bowType = findById(rules.catalog.bowTypes, build.bowTypeId);
  const drawPx = Math.max(60, Math.min(build.drawLengthIn * 4.5, 220));

  return (
    <BlueprintFrame build={build} rules={rules} className={className}>
      <HatchDefs />
      {/* string */}
      <line x1={CX} y1={CY - span} x2={CX} y2={CY + span} {...strokeThin} />
      {limbPath(build.bowTypeId, span, thickness)}
      {/* grip wrap */}
      <rect x={CX + 14} y={CY - 18} width={13} height={36} rx={5} {...stroke} fill="url(#bp-hatch)" />
      {/* nocked arrow */}
      <line x1={CX - 34} y1={CY} x2={CX + 175} y2={CY} {...stroke} strokeWidth={1.6} />
      {[0, 8, 16].map((o) => (
        <line key={o} x1={CX - 30 + o} y1={CY} x2={CX - 36 + o} y2={CY - 8} {...strokeThin} />
      ))}
      {arrowHead(build.arrowId, CX + 175, CY)}

      {bowType && <CalloutLabel x={CX + 30} y={CY - span + 26} tx={CX + 150} ty={84} text={bowType.label} />}
      <CalloutLabel x={CX + 40} y={CY + span - 30} tx={CX + 170} ty={CY + span + 6} text={`${build.drawWeightLbs} LBS DRAW`} accent />
      {material && <CalloutLabel x={CX + 24} y={CY + 10} tx={200} ty={CY + 52} text={material.label} anchor="end" />}
      {arrow && <CalloutLabel x={CX + 182} y={CY} tx={CX + 240} ty={CY - 34} text={`${arrow.label} arrow`} />}
      <DimensionLine x1={CX} x2={CX + drawPx} y={318} label={`${build.drawLengthIn}" DRAW · EFF ${build.efficiency.toFixed(2)}`} />
    </BlueprintFrame>
  );
}
