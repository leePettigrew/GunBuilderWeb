import type { ReactNode } from "react";
import type { MeleeBuild, Ruleset } from "@shared/types";
import { findById } from "@shared/engine";
import { BlueprintFrame, CalloutLabel, DimensionLine, HatchDefs } from "./common";

const BP = "rgb(var(--c-blueprint))";
const FAINT = "rgb(var(--c-bone-faint))";
const MONO = "var(--font-mono)";
const HATCH = "url(#bp-hatch)";

// All silhouettes share one convention: grip at the left, business end at the
// right, drawn about the y=185 axis. Lengths are nominal real-world figures.

interface SilhouetteDef {
  x1: number;
  x2: number;
  dimY: number;
  lengthLabel: string;
  grip: { x: number; y: number };
  shape: () => ReactNode;
}

const KNIFE: SilhouetteDef = {
  x1: 340,
  x2: 560,
  dimY: 288,
  lengthLabel: "250 mm OVERALL",
  grip: { x: 376, y: 185 },
  shape: () => (
    <g stroke={BP} fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
      <rect x={340} y={171} width={72} height={28} rx={8} fill={HATCH} strokeWidth={1.5} />
      <line x1={352} y1={171} x2={352} y2={199} strokeWidth={1} strokeOpacity={0.5} />
      <rect x={412} y={160} width={8} height={50} strokeWidth={1.5} />
      <path d="M 420 171 L 512 171 Q 545 174 560 185 Q 528 196 420 199 Z" />
      <path d="M 430 179 L 508 179" strokeWidth={1} strokeOpacity={0.5} />
    </g>
  ),
};

const PUSH_DAGGER: SilhouetteDef = {
  x1: 385,
  x2: 528,
  dimY: 288,
  lengthLabel: "140 mm OVERALL",
  grip: { x: 394, y: 185 },
  shape: () => (
    <g stroke={BP} fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
      {/* T-handle bar sits perpendicular to the blade, held in the fist */}
      <rect x={385} y={148} width={18} height={74} rx={8} fill={HATCH} strokeWidth={1.5} />
      <rect x={403} y={177} width={34} height={16} strokeWidth={1.5} />
      <path d="M 437 173 L 498 178 L 528 185 L 498 192 L 437 197 Z" />
      <path d="M 441 185 L 520 185" strokeWidth={1} strokeOpacity={0.5} />
    </g>
  ),
};

const MACHETE: SilhouetteDef = {
  x1: 260,
  x2: 640,
  dimY: 292,
  lengthLabel: "650 mm OVERALL",
  grip: { x: 295, y: 185 },
  shape: () => (
    <g stroke={BP} fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
      <rect x={260} y={168} width={70} height={34} rx={7} fill={HATCH} strokeWidth={1.5} />
      <circle cx={285} cy={185} r={2.5} strokeWidth={1} />
      <circle cx={308} cy={185} r={2.5} strokeWidth={1} />
      <rect x={330} y={164} width={8} height={42} strokeWidth={1.5} />
      <path d="M 338 170 L 596 170 L 640 191 Q 545 214 338 200 Z" />
      <path d="M 350 195 Q 520 206 616 193" strokeWidth={1} strokeOpacity={0.5} />
    </g>
  ),
};

const RAPIER: SilhouetteDef = {
  x1: 170,
  x2: 730,
  dimY: 288,
  lengthLabel: "1100 mm OVERALL",
  grip: { x: 207, y: 185 },
  shape: () => (
    <g stroke={BP} fill="none" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round">
      <circle cx={178} cy={185} r={8} />
      <rect x={186} y={177} width={42} height={16} rx={3} fill={HATCH} />
      <line x1={240} y1={158} x2={240} y2={212} />
      {/* swept guard bows */}
      <path d="M 228 170 C 258 152 282 164 266 185 C 282 206 258 218 228 200" />
      <path d="M 266 181 L 716 184 L 730 185 L 716 186 L 266 189 Z" />
      <path d="M 270 185 L 712 185" strokeWidth={1} strokeOpacity={0.4} />
    </g>
  ),
};

const CLUB: SilhouetteDef = {
  x1: 300,
  x2: 618,
  dimY: 292,
  lengthLabel: "600 mm OVERALL",
  grip: { x: 350, y: 185 },
  shape: () => (
    <g stroke={BP} fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
      <path d="M 306 176 L 470 171 C 556 149 618 160 616 185 C 618 210 556 221 470 199 L 306 194 Q 296 185 306 176 Z" />
      <rect x={312} y={174} width={84} height={22} fill={HATCH} strokeWidth={1} strokeOpacity={0.5} />
      <path d="M 484 178 C 524 173 566 176 600 183" strokeWidth={1} strokeOpacity={0.4} />
      <path d="M 484 192 C 524 197 566 194 598 188" strokeWidth={1} strokeOpacity={0.4} />
    </g>
  ),
};

const ROAD_SIGN: SilhouetteDef = {
  x1: 150,
  x2: 748,
  dimY: 292,
  lengthLabel: "1600 mm OVERALL",
  grip: { x: 215, y: 185 },
  shape: () => (
    <g stroke={BP} fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
      <rect x={150} y={179} width={490} height={12} strokeWidth={1.5} />
      <rect x={162} y={179} width={100} height={12} fill={HATCH} strokeWidth={1} strokeOpacity={0.5} />
      <g strokeWidth={1} strokeOpacity={0.6}>
        <circle cx={500} cy={185} r={2.5} />
        <circle cx={532} cy={185} r={2.5} />
        <circle cx={564} cy={185} r={2.5} />
        <circle cx={596} cy={185} r={2.5} />
      </g>
      <rect x={640} y={173} width={12} height={24} strokeWidth={1.5} />
      <polygon points="720,137 748,165 748,205 720,233 680,233 652,205 652,165 680,137" />
      <polygon
        points="717,144 741,168 741,202 717,226 683,226 659,202 659,168 683,144"
        strokeWidth={1}
        strokeOpacity={0.5}
      />
      <text
        x={700}
        y={192}
        textAnchor="middle"
        stroke="none"
        fill="rgb(var(--c-bone-soft))"
        fillOpacity={0.9}
        fontFamily={MONO}
        fontSize={20}
        letterSpacing={3}
      >
        STOP
      </text>
    </g>
  ),
};

const SPEAR: SilhouetteDef = {
  x1: 84,
  x2: 820,
  dimY: 288,
  lengthLabel: "1800 mm OVERALL",
  grip: { x: 425, y: 185 },
  shape: () => (
    <g stroke={BP} fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
      <rect x={92} y={181} width={648} height={8} strokeWidth={1.5} />
      <rect x={84} y={179} width={8} height={12} fill={HATCH} strokeWidth={1.5} />
      <rect x={386} y={181} width={84} height={8} fill={HATCH} strokeWidth={1} strokeOpacity={0.5} />
      {/* cord lashing behind the head */}
      <g strokeWidth={1} strokeOpacity={0.6}>
        <line x1={706} y1={181} x2={712} y2={189} />
        <line x1={714} y1={181} x2={720} y2={189} />
        <line x1={722} y1={181} x2={728} y2={189} />
        <line x1={730} y1={181} x2={736} y2={189} />
      </g>
      <path d="M 740 179 L 762 176 L 762 194 L 740 191 Z" strokeWidth={1.5} />
      <path d="M 762 172 Q 800 177 820 185 Q 800 193 762 198 Q 752 185 762 172 Z" fill={HATCH} />
      <path d="M 764 185 L 812 185" strokeWidth={1} strokeOpacity={0.5} />
    </g>
  ),
};

const FIRE_AXE: SilhouetteDef = {
  x1: 216,
  x2: 670,
  dimY: 308,
  lengthLabel: "900 mm OVERALL",
  grip: { x: 280, y: 186 },
  shape: () => (
    <g stroke={BP} fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
      <path d="M 226 176 C 380 168 520 172 610 179 L 610 193 C 520 200 380 202 226 196 Q 214 186 226 176 Z" />
      <rect x={234} y={176} width={92} height={20} fill={HATCH} strokeWidth={1} strokeOpacity={0.4} />
      {/* head: eye, top pick, down-swept blade */}
      <rect x={606} y={146} width={44} height={76} rx={5} fill={HATCH} />
      <path d="M 612 146 L 630 112 L 648 146 Z" fill={HATCH} />
      <path d="M 606 222 L 650 222 C 666 244 670 262 664 284 C 632 276 602 274 580 278 C 588 254 598 236 606 222 Z" fill={HATCH} />
    </g>
  ),
};

const SLEDGEHAMMER: SilhouetteDef = {
  x1: 246,
  x2: 666,
  dimY: 296,
  lengthLabel: "800 mm OVERALL",
  grip: { x: 300, y: 185 },
  shape: () => (
    <g stroke={BP} fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
      <rect x={246} y={178} width={354} height={14} rx={6} strokeWidth={1.5} />
      <rect x={254} y={178} width={96} height={14} fill={HATCH} strokeWidth={1} strokeOpacity={0.4} />
      <rect x={600} y={132} width={66} height={106} rx={6} fill={HATCH} />
      <line x1={612} y1={132} x2={612} y2={238} strokeWidth={1} strokeOpacity={0.5} />
      <line x1={654} y1={132} x2={654} y2={238} strokeWidth={1} strokeOpacity={0.5} />
    </g>
  ),
};

const UNARMED: SilhouetteDef = {
  x1: 344,
  x2: 478,
  dimY: 258,
  lengthLabel: "WRIST TO KNUCKLE — 180 mm",
  grip: { x: 436, y: 190 },
  shape: () => (
    <g stroke={BP} fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
      {/* closed fist, side view */}
      <path d="M 344 168 L 402 163 C 432 156 462 160 472 174 C 480 184 480 196 472 203 C 476 212 470 220 458 221 C 452 229 438 231 430 225 C 418 230 406 226 402 218 C 394 219 387 212 389 204 L 344 206 Z" />
      <g strokeWidth={1} strokeOpacity={0.6}>
        <path d="M 470 182 Q 458 184 450 182" />
        <path d="M 471 194 Q 458 196 450 194" />
        <path d="M 466 206 Q 456 208 448 206" />
        <path d="M 430 160 Q 438 154 446 160 Q 454 154 462 161" />
      </g>
      <path d="M 402 214 C 416 220 436 218 446 208" strokeWidth={1.5} strokeOpacity={0.8} />
      {/* knuckle spacing study */}
      <g strokeWidth={1.5}>
        <circle cx={568} cy={170} r={6} />
        <circle cx={596} cy={166} r={6} />
        <circle cx={624} cy={166} r={6} />
        <circle cx={652} cy={171} r={6} />
      </g>
      <path d="M 560 186 Q 610 176 660 186" strokeWidth={1} strokeOpacity={0.5} />
      <text
        x={610}
        y={212}
        textAnchor="middle"
        stroke="none"
        fill={FAINT}
        fontFamily={MONO}
        fontSize={10}
        letterSpacing={1.5}
      >
        KNUCKLE STUDY
      </text>
    </g>
  ),
};

const GENERIC: SilhouetteDef = {
  x1: 300,
  x2: 600,
  dimY: 288,
  lengthLabel: "500 mm OVERALL (EST.)",
  grip: { x: 346, y: 185 },
  shape: () => (
    <g stroke={BP} fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
      <rect x={300} y={172} width={90} height={26} rx={6} fill={HATCH} strokeWidth={1.5} />
      <rect x={390} y={166} width={10} height={38} strokeWidth={1.5} />
      <rect x={400} y={176} width={200} height={18} />
      <text
        x={450}
        y={146}
        textAnchor="middle"
        stroke="none"
        fill={FAINT}
        fontFamily={MONO}
        fontSize={10}
        letterSpacing={2}
      >
        UNSPECIFIED PATTERN
      </text>
    </g>
  ),
};

const SILHOUETTES: Record<string, SilhouetteDef> = {
  knife: KNIFE,
  pushDagger: PUSH_DAGGER,
  machete: MACHETE,
  rapier: RAPIER,
  club: CLUB,
  roadSign: ROAD_SIGN,
  spear: SPEAR,
  fireAxe: FIRE_AXE,
  sledgehammer: SLEDGEHAMMER,
  unarmed: UNARMED,
};

export function MeleeBlueprint({
  build,
  rules,
  className,
}: {
  build: MeleeBuild;
  rules: Ruleset;
  className?: string;
}) {
  const preset = findById(rules.catalog.meleePresets, build.presetId);
  const sil = SILHOUETTES[build.presetId] ?? GENERIC;

  return (
    <BlueprintFrame build={build} rules={rules} className={className}>
      <HatchDefs />
      <line
        x1={sil.x1 - 22}
        y1={185}
        x2={sil.x2 + 22}
        y2={185}
        stroke={BP}
        strokeWidth={1}
        strokeDasharray="6 6"
        strokeOpacity={0.25}
      />
      {sil.shape()}
      <DimensionLine x1={sil.x1} x2={sil.x2} y={sil.dimY} label={sil.lengthLabel} />
      {preset ? (
        <CalloutLabel
          x={sil.grip.x}
          y={sil.grip.y}
          tx={sil.grip.x + 96}
          ty={102}
          text={`${preset.governing.toUpperCase()}-BASED`}
          anchor="start"
        />
      ) : null}
    </BlueprintFrame>
  );
}
