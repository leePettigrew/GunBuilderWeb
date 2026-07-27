"use client";

/**
 * Parametric firearm schematic, traced from real platform profiles.
 *
 * Every frame has a socket table: where the barrel, magazine (with feed
 * angle — the Sten feeds sideways, the Bren from the top), buttstock, optic
 * rail and accessory points live. Parts are drawn in their own local frame
 * and placed by socket transform, so every build choice visibly reshapes
 * the weapon while joins stay clean.
 *
 * Layout: muzzle right, 900×420 viewBox, barrels at 0.5 px/mm.
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

// ---------------------------------------------------------------------------
// Frame socket tables
// ---------------------------------------------------------------------------

interface Socket {
  x: number;
  y: number;
}

interface MagSocket extends Socket {
  /** Feed direction in degrees: 0 = down, 90 = rearward, 180 = up. */
  angle: number;
}

interface FrameSpec {
  rx1: number; // barrel start (breech face)
  barrelY: number;
  barrelHalf: number;
  stock: Socket | null; // null = integral (bullpup) or none (pistol)
  mag: MagSocket;
  rail: { x0: number; x1: number; y: number };
  under: Socket; // underbarrel accessories (ubgl / grip / bipod hinge)
  side: Socket;
  /** Belt feeds ignore the mag socket and hang from here. */
  belt: Socket;
  /** Sniper-style tapering barrel. */
  taper?: boolean;
  /** Bore hidden under an external shroud for this many px past rx1 (SMG). */
  barrelInset?: (barrelPx: number) => number;
  /** Barrel housed inside the frame BEHIND rx1 (pistol slide): only the
   *  remainder protrudes, and the dimension line shifts back by this much. */
  barrelBehind?: number;
  /** Box mags live inside the grip (pistols): draw a baseplate instead. */
  hiddenMag?: boolean;
  draw: (barrelPx: number) => ReactNode;
}

const S = stroke;
const T = strokeThin;
const HATCH = "url(#bp-hatch)";

const FRAME_SPECS: Record<string, FrameSpec> = {
  // ----- M1911-pattern service pistol --------------------------------------
  pistol: {
    rx1: 544,
    barrelY: 172,
    barrelHalf: 3.5,
    stock: null,
    mag: { x: 486, y: 252, angle: -14 },
    rail: { x0: 400, x1: 528, y: 158 },
    under: { x: 520, y: 190 },
    side: { x: 502, y: 188 },
    belt: { x: 470, y: 216 },
    barrelBehind: 82,
    hiddenMag: true,
    draw: () => (
      <g>
        {/* slide with rear cocking serrations */}
        <path d="M376,161 h158 q9,0 9,7 v9 q0,7 -9,7 h-158 l-5,-6 v-11 z" {...S} />
        {[388, 394, 400, 406].map((x) => (
          <line key={x} x1={x} y1={164} x2={x} y2={181} {...T} />
        ))}
        <line x1={530} y1={161} x2={530} y2={184} {...T} />
        {/* front + rear sights on the slide */}
        <rect x={526} y={157} width={4} height={4} {...T} />
        <rect x={384} y={156} width={6} height={5} {...T} />
        {/* hammer spur + beavertail */}
        <path d="M376,163 l-9,-6 -3,7 8,4" {...T} />
        <path d="M375,184 q-7,4 -5,11" {...T} />
        {/* frame: dust cover, clean round trigger guard, grip junction */}
        <path d="M380,184 h154 v9 l-64,1 q-1,3 -4,3 h-14 q-22,0 -22,-16 v0 h-14 q-5,0 -6,6 q-2,10 6,12 h10 l-4,6 h-30 q-9,-1 -12,-8 z" {...S} />
        {/* trigger blade */}
        <path d="M452,196 q-1,7 -6,9" {...T} />
        {/* grip, raked back, hatched panels + mainspring curve */}
        <path d="M486,197 h36 q4,0 3,5 l-11,44 q-2,6 -8,6 l-20,-2 q-6,-1 -5,-8 l4,-40 q1,-5 3,-5 z" {...S} fill={HATCH} />
        <path d="M522,202 q7,24 -9,48" {...T} />
      </g>
    ),
  },

  // ----- Sten-pattern tube SMG ---------------------------------------------
  smg: {
    rx1: 432,
    barrelY: 181,
    barrelHalf: 4,
    stock: { x: 252, y: 182 },
    mag: { x: 372, y: 195, angle: 6 }, // bottom feed ahead of the trigger group
    rail: { x0: 300, x1: 420, y: 164 },
    under: { x: 420, y: 192 },
    side: { x: 300, y: 172 },
    belt: { x: 380, y: 196 },
    barrelInset: (b) => Math.max(28, Math.min(96, b * 0.55)),
    draw: (barrelPx) => (
      <g>
        {/* tube receiver with rounded ends */}
        <rect x={252} y={167} width={180} height={29} rx={14} {...S} />
        {/* charging-handle slot + knob */}
        <line x1={286} y1={178} x2={352} y2={178} {...T} />
        <circle cx={300} cy={178} r={3.5} {...T} />
        {/* magazine housing collar */}
        <path d="M360,196 h24 l-2,8 h-20 z" {...T} />
        {/* trigger group box + grip */}
        <path d="M318,196 h48 v14 h-16 l-3,-4 h-12 q-2,18 -16,16 q-10,-2 -8,-16 z" {...S} />
        <path d="M322,210 l-4,24 q10,6 16,0 l4,-20" {...T} />
        {/* perforated barrel shroud */}
        <rect x={432} y={173} width={Math.max(28, Math.min(96, barrelPx * 0.55))} height={16} rx={8} {...S} />
        {[16, 34, 52, 70, 88]
          .filter((o) => o < Math.min(96, barrelPx * 0.55) - 8)
          .map((o) => (
            <circle key={o} cx={432 + o} cy={181} r={2.6} {...T} />
          ))}
      </g>
    ),
  },

  // ----- AUG-pattern bullpup carbine ---------------------------------------
  carbine: {
    rx1: 442,
    barrelY: 174,
    barrelHalf: 4.5,
    stock: null, // bullpup: butt is integral
    mag: { x: 306, y: 214, angle: 2 },
    rail: { x0: 322, x1: 388, y: 148 },
    under: { x: 414, y: 186 },
    side: { x: 398, y: 168 },
    belt: { x: 330, y: 218 },
    draw: () => (
      <g>
        {/* one-piece polymer housing, closed outline:
            butt → top line → barrel collar → underside with hand loop */}
        <path
          d="M250,163 q56,-9 120,-7 l50,4 q14,2 22,8 v12 q-6,8 -20,8 l-30,2 -14,14 q-14,4 -22,0 l-2,-14 -22,2 -10,12 h-32 l-40,4 q-8,-22 -6,-45 z"
          {...S}
        />
        {/* butt plate */}
        <path d="M250,163 l-4,2 q-7,22 5,44 l3,-1" {...T} />
        {/* full-hand trigger guard loop + grip core */}
        <path d="M342,204 q-10,26 8,30 q20,4 26,-24" {...T} />
        <path d="M350,202 h14 l-5,24 q-6,4 -11,0 z" {...S} fill={HATCH} />
        {/* trigger blade */}
        <path d="M360,206 q-1,7 -5,9" {...T} />
        {/* integral scope bridge */}
        <path d="M330,156 l6,-12 h44 l6,12" {...S} />
        <line x1={332} y1={144} x2={384} y2={144} {...S} />
        {/* stowed folding foregrip */}
        <path d="M412,186 l8,18 6,-2 -7,-17" {...T} />
      </g>
    ),
  },

  // ----- AN-94 / Kalashnikov-lineage assault rifle -------------------------
  assaultRifle: {
    rx1: 398,
    barrelY: 177,
    barrelHalf: 4.5,
    stock: { x: 254, y: 183 },
    mag: { x: 376, y: 200, angle: -8 }, // mag well FORWARD of the trigger
    rail: { x0: 262, x1: 390, y: 162 },
    under: { x: 430, y: 188 },
    side: { x: 300, y: 170 },
    belt: { x: 370, y: 202 },
    draw: (barrelPx) => (
      <g>
        {/* receiver: sloped rear dust cover */}
        <path d="M252,174 q34,-9 70,-9 h76 v34 h-146 z" {...S} />
        <line x1={262} y1={173} x2={392} y2={168} {...T} />
        {/* rear sight block */}
        <path d="M300,165 l6,-8 h14 l4,8" {...T} />
        {/* ejection port */}
        <rect x={318} y={176} width={28} height={11} rx={2} {...T} />
        {/* raked grip behind the guard, then guard spanning to the mag well */}
        <path d="M330,199 h20 q4,0 3,5 l-9,38 q-2,6 -8,5 l-12,-2 q-5,-1 -4,-7 l7,-34 q1,-5 3,-5 z" {...S} fill={HATCH} />
        <path d="M352,201 q4,14 18,13 l4,-3" {...T} />
        <path d="M356,203 q-1,7 -5,9" {...T} />
        {/* gas tube + slim front sight tower */}
        <line x1={398} y1={168} x2={398 + Math.min(70, barrelPx * 0.4)} y2={168} {...S} />
        <path
          d={`M${398 + Math.min(74, barrelPx * 0.42)},172 l2,-18 h4 l2,18 M${398 + Math.min(74, barrelPx * 0.42) - 1},154 h10`}
          {...T}
        />
      </g>
    ),
  },

  // ----- SCAR-H-pattern battle rifle ---------------------------------------
  battleRifle: {
    rx1: 404,
    barrelY: 172,
    barrelHalf: 5,
    stock: { x: 246, y: 178 },
    mag: { x: 374, y: 204, angle: 0 }, // straight box forward of the trigger
    rail: { x0: 250, x1: 400, y: 152 },
    under: { x: 420, y: 186 },
    side: { x: 388, y: 168 },
    belt: { x: 370, y: 208 },
    draw: () => (
      <g>
        {/* monolithic upper with full-length rail teeth */}
        <path d="M246,156 h152 l6,6 v16 h-158 z" {...S} />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
          <line key={i} x1={254 + i * 12} y1={156} x2={254 + i * 12} y2={152} {...T} />
        ))}
        <line x1={252} y1={152} x2={398} y2={152} {...T} />
        {/* charging handle slot */}
        <line x1={258} y1={164} x2={318} y2={164} {...T} />
        {/* lower receiver, angular front */}
        <path d="M250,178 h150 l4,8 v14 l-8,4 h-146 z" {...S} />
        {/* ejection port */}
        <rect x={322} y={160} width={32} height={12} rx={2} {...T} />
        {/* grip behind the guard, guard spanning forward to the mag well */}
        <path d="M330,204 h20 q4,1 3,6 l-9,36 q-2,6 -8,5 l-12,-2 q-5,-1 -4,-7 l7,-33 q1,-5 3,-5 z" {...S} fill={HATCH} />
        <path d="M352,206 q4,13 18,12 l4,-3" {...T} />
        <path d="M357,208 q-1,7 -5,9" {...T} />
        {/* folding front sight, stowed */}
        <path d="M388,152 l3,-8 h6 l3,8" {...T} />
      </g>
    ),
  },

  // ----- TOZ-34 over/under break shotgun -----------------------------------
  shotgun: {
    rx1: 396,
    barrelY: 174,
    barrelHalf: 4,
    stock: { x: 322, y: 184 },
    mag: { x: 360, y: 198, angle: 0 },
    rail: { x0: 330, x1: 392, y: 160 },
    under: { x: 430, y: 188 },
    side: { x: 350, y: 172 },
    belt: { x: 360, y: 200 },
    draw: (barrelPx) => (
      <g>
        {/* action body, rounded rear flowing into the wrist */}
        <path d="M322,170 q22,-4 42,-3 h32 v30 h-70 q-10,-12 -4,-27 z" {...S} />
        {/* top lever + hinge pin */}
        <path d="M330,168 q20,-6 42,-5" {...T} />
        <circle cx={390} cy={188} r={4} {...T} />
        {/* double triggers in slender guard */}
        <path d="M344,197 q-4,18 12,20 q10,1 14,-10" {...T} />
        <line x1={352} y1={200} x2={350} y2={208} {...T} />
        <line x1={360} y1={200} x2={358} y2={208} {...T} />
        {/* wooden forend under the barrels */}
        <path
          d={`M396,182 h${Math.min(96, barrelPx * 0.4)} q6,0 4,6 q-2,7 -10,7 h-84 q-8,0 -8,-7 z`}
          {...S}
          fill={HATCH}
        />
        {/* bead sight lives on the rib (drawn with the barrels) */}
      </g>
    ),
  },

  // ----- SVD-pattern DMR ---------------------------------------------------
  dmr: {
    rx1: 400,
    barrelY: 174,
    barrelHalf: 4,
    stock: { x: 306, y: 180 },
    mag: { x: 378, y: 196, angle: -10 }, // short curved box ahead of the trigger
    rail: { x0: 308, x1: 392, y: 156 },
    under: { x: 470, y: 186 },
    side: { x: 320, y: 168 },
    belt: { x: 372, y: 200 },
    taper: true,
    draw: (barrelPx) => {
      const hg = Math.min(92, Math.max(40, barrelPx * 0.4)); // handguard length
      return (
        <g>
          {/* slim milled receiver */}
          <path d="M306,170 q26,-5 52,-4 h42 v30 h-94 q-6,-14 0,-26 z" {...S} />
          <rect x={326} y={172} width={26} height={10} rx={2} {...T} />
          {/* grip behind the guard, guard forward to the mag well */}
          <path d="M336,196 h18 q4,1 3,6 l-8,32 q-2,6 -8,5 l-10,-2 q-5,-1 -4,-6 l6,-30 q1,-5 3,-5 z" {...S} fill={HATCH} />
          <path d="M356,198 q4,12 16,11 l4,-3" {...T} />
          <path d="M361,200 q-1,6 -5,8" {...T} />
          {/* vented handguard above + below the barrel */}
          <path d={`M400,168 h${hg} l4,4 v8 l-4,4 h-${hg}`} {...S} />
          {[0.18, 0.36, 0.54, 0.72].map((f) => (
            <g key={f}>
              <rect x={400 + hg * f} y={169.5} width={hg * 0.1} height={3} rx={1.5} {...T} />
              <rect x={400 + hg * f} y={179.5} width={hg * 0.1} height={3} rx={1.5} {...T} />
            </g>
          ))}
          {/* gas block + front sight hood past the handguard */}
          <path d={`M${400 + hg + 8},170 l2,-14 h6 l2,14 M${400 + hg + 8},156 h10`} {...T} />
        </g>
      );
    },
  },

  // ----- Mosin-pattern bolt sniper -----------------------------------------
  sniper: {
    rx1: 396,
    barrelY: 174,
    barrelHalf: 4.5,
    stock: { x: 306, y: 181 },
    mag: { x: 352, y: 194, angle: 0 },
    rail: { x0: 310, x1: 386, y: 158 },
    under: { x: 470, y: 186 },
    side: { x: 320, y: 168 },
    belt: { x: 350, y: 206 },
    taper: true,
    draw: () => (
      <g>
        {/* round receiver with rear tang */}
        <path d="M306,172 q20,-6 44,-5 h46 v26 h-90 q-8,-10 0,-21 z" {...S} />
        {/* bolt handle, turned down, ball knob */}
        <path d="M356,184 q8,10 4,20" {...S} />
        <circle cx={359} cy={209} r={5} {...S} />
        {/* integral magazine wedge */}
        <path d="M336,198 h30 l-4,14 h-22 z" {...S} fill={HATCH} />
        {/* trigger + guard */}
        <path d="M372,198 q4,12 16,11" {...T} />
        {/* chamber reinforce step */}
        <line x1={396} y1={170} x2={396} y2={179} {...T} />
      </g>
    ),
  },

  // ----- Bren-pattern LMG --------------------------------------------------
  lmg: {
    rx1: 402,
    barrelY: 176,
    barrelHalf: 5.5,
    stock: { x: 240, y: 184 },
    mag: { x: 330, y: 158, angle: 176 }, // top feed, slight forward cant
    rail: { x0: 254, x1: 300, y: 150 },
    under: { x: 470, y: 194 },
    side: { x: 280, y: 168 },
    belt: { x: 340, y: 210 },
    draw: (barrelPx) => {
      const gas = Math.min(150, Math.max(60, barrelPx * 0.6));
      return (
        <g>
          {/* deep receiver body */}
          <path d="M240,160 h158 l6,8 v34 l-6,6 h-158 z" {...S} />
          {/* top feed cover + ejection below */}
          <path d="M304,160 h52 l-4,-6 h-44 z" {...T} />
          <rect x={318} y={196} width={26} height={8} rx={2} {...T} />
          {/* carrying handle, folded forward */}
          <path d="M282,158 q4,-14 18,-14 h24 q6,0 6,6" {...T} />
          {/* rear drum sight */}
          <path d="M254,160 l2,-10 h10 l2,10" {...T} />
          {/* trigger guard + grip */}
          <path d="M344,208 q7,15 24,13" {...T} />
          <path d="M368,208 h20 q4,1 3,6 l-8,30 q-2,6 -8,5 l-12,-2 q-5,-1 -4,-6 l6,-28 q1,-5 3,-5 z" {...S} fill={HATCH} />
          {/* gas cylinder under the barrel */}
          <rect x={402} y={184} width={gas} height={9} rx={4.5} {...S} />
          <line x1={402 + gas * 0.35} y1={184} x2={402 + gas * 0.35} y2={193} {...T} />
        </g>
      );
    },
  },
};

const FALLBACK_SPEC: FrameSpec = {
  rx1: 398,
  barrelY: 177,
  barrelHalf: 4.5,
  stock: { x: 254, y: 183 },
  mag: { x: 326, y: 198, angle: 5 },
  rail: { x0: 260, x1: 390, y: 162 },
  under: { x: 420, y: 188 },
  side: { x: 300, y: 170 },
  belt: { x: 330, y: 202 },
  draw: () => (
    <g>
      <rect x={252} y={166} width={146} height={32} rx={6} {...S} />
      <rect x={336} y={174} width={28} height={11} rx={2} {...T} />
      <path d="M336,198 q6,16 22,14" {...T} />
      <path d="M358,198 h20 q4,1 3,6 l-8,34 q-2,6 -8,5 l-12,-2 q-5,-1 -4,-7 l6,-31 q1,-5 3,-5 z" {...S} fill={HATCH} />
    </g>
  ),
};

const PX_PER_MM = 0.5;
const MAX_TIP_X = 812;

// ---------------------------------------------------------------------------
// Stocks — drawn in local coords, origin at the socket, extending rearward
// ---------------------------------------------------------------------------

function stockShape(stockId: string): ReactNode {
  switch (stockId) {
    case "pistolGrip":
      return null;
    case "wireframe":
      return (
        <g>
          <line x1={0} y1={-9} x2={-96} y2={-4} {...S} />
          <line x1={0} y1={11} x2={-96} y2={30} {...S} />
          <line x1={-52} y1={-6} x2={-52} y2={20} {...T} />
          <path d="M-96,-10 h-10 q-4,0 -4,4 v36 q0,4 4,4 h10 z" {...S} />
        </g>
      );
    case "thumbhole":
      return (
        <g>
          <path d="M0,-13 q-40,-2 -66,6 l-28,10 q-8,4 -8,12 v14 q0,8 8,9 l30,2 q36,-2 64,-38 z" {...S} fill={HATCH} />
          <ellipse cx={-42} cy={9} rx={13} ry={8} {...S} fill="rgb(var(--c-steel-950))" />
        </g>
      );
    case "skeleton":
      return (
        <g>
          <path d="M0,-13 l-88,10 q-8,1 -9,9 l-3,22 q-1,8 7,9 l16,2 q42,-6 77,-40 z" {...S} />
          <path d="M-16,-6 l-58,10 -4,22 12,2 q30,-8 50,-24 z" {...T} />
        </g>
      );
    case "collapsible":
      return (
        <g>
          {/* buffer tube with position notches */}
          <path d="M0,-7 h-64 v13 h64 z" {...S} />
          {[-16, -30, -44].map((x) => (
            <line key={x} x1={x} y1={-7} x2={x} y2={6} {...T} />
          ))}
          {/* sliding stock body + rubber pad */}
          <path d="M-58,-12 l-26,4 q-8,2 -9,10 l-2,18 q0,8 8,8 h22 q10,-2 12,-12 l-2,-22 z" {...S} fill={HATCH} />
          <path d="M-93,-7 q-4,14 0,28" {...T} />
        </g>
      );
    default:
      // classic fixed rifle butt: wrist → comb → butt plate, gentle drop
      return (
        <g>
          <path d="M0,-12 q-30,-3 -52,1 q-24,5 -34,10 q-6,3 -7,10 l-2,16 q-1,7 6,8 l18,1 q40,-6 71,-32 z" {...S} fill={HATCH} />
          <path d="M-93,7 q-5,13 -2,27" {...T} />
          <line x1={-4} y1={-10} x2={-32} y2={-6} {...T} />
        </g>
      );
  }
}

// ---------------------------------------------------------------------------
// Magazines — local coords, origin at insertion, +y away from the receiver
// ---------------------------------------------------------------------------

function magazineShape(magId: string): ReactNode {
  switch (magId) {
    case "box":
      // long curved rifle magazine — unmistakably a banana, not a grip
      return (
        <g>
          <path d="M-12,0 q-16,34 -6,62 q3,9 12,8 l16,-3 q8,-2 8,-10 q4,-32 -4,-57 z" {...S} />
          {[14, 28, 42].map((o) => (
            <path key={o} d={`M${-13 + o * 0.12},${o} q14,4 28,1`} {...T} opacity={0.7} />
          ))}
          <path d={`M-16,58 q10,8 24,4`} {...T} />
        </g>
      );
    case "detachable":
      return (
        <g>
          <path d="M-13,0 l-2,44 q0,7 7,7 h18 q7,0 7,-7 l-2,-44 z" {...S} fill={HATCH} />
          <line x1={-14} y1={44} x2={16} y2={46} {...T} />
          <circle cx={17} cy={7} r={2.6} {...T} />
        </g>
      );
    case "drum":
      return (
        <g>
          <circle cx={0} cy={32} r={26} {...S} fill={HATCH} />
          <circle cx={0} cy={32} r={7} {...S} fill="rgb(var(--c-steel-950))" />
          <line x1={0} y1={25} x2={0} y2={39} {...T} />
          <line x1={-7} y1={32} x2={7} y2={32} {...T} />
        </g>
      );
    case "integratedDrum":
      return <circle cx={-6} cy={24} r={21} {...S} strokeDasharray="5 4" />;
    case "tube":
    case "cylinder":
    case "clip":
    case "enBloc":
    case "belt":
      return null; // placed by frame-specific logic below
    default:
      return null; // muzzle / breach / unknown: no external feed device
  }
}

// ---------------------------------------------------------------------------
// Barrel + muzzle devices
// ---------------------------------------------------------------------------

function barrelAssembly(
  build: FirearmBuild,
  spec: FrameSpec,
  barrelPx: number,
  doubleBore: boolean,
): { node: ReactNode; tipX: number } {
  let half = spec.barrelHalf;
  if (build.barrelTypeId === "heavy") half += 1.6;
  if (build.barrelTypeId === "light") half -= 1.2;
  const y = spec.barrelY;
  // The bore may hide under an external shroud (SMG) or live inside the
  // frame behind the muzzle face (pistol slide) — only the rest is drawn.
  const behind = spec.barrelBehind ?? 0;
  const x1 = spec.rx1 + Math.max(0, barrelPx - behind);
  const inset = Math.min(spec.barrelInset?.(barrelPx) ?? 0, Math.max(0, x1 - spec.rx1));
  const x0 = spec.rx1 + inset;
  const boreVisible = x1 - x0 > 4;
  const choke = build.barrelTypeId === "choked" ? 2 : 0;
  const tipHalf = spec.taper ? Math.max(2.2, half - 1.8) - choke : half - choke;

  const parts: ReactNode[] = [];
  if (!boreVisible) {
    // Fully housed barrel (short pistol barrel): just the muzzle face.
    parts.push(<line key="muzzle" x1={x1} y1={y - half} x2={x1} y2={y + half} {...T} />);
  } else if (doubleBore) {
    // over/under: two bores + ventilated rib
    parts.push(
      <g key="bores">
        <path d={`M${x0},${y - half - 3.5} L${x1},${y - tipHalf - 3} L${x1},${y - 0.6} L${x0},${y - 0.6} z`} {...S} />
        <path d={`M${x0},${y + 0.6} L${x1},${y + 0.6} L${x1},${y + tipHalf + 3} L${x0},${y + half + 3.5} z`} {...S} />
        <line x1={x0 + 4} y1={y - half - 5.5} x2={x1 - 2} y2={y - tipHalf - 5} {...T} />
        <circle cx={x1 - 4} cy={y - tipHalf - 7.5} r={1.6} fill="rgb(var(--c-blueprint))" stroke="none" />
      </g>,
    );
  } else {
    parts.push(
      <path
        key="bore"
        d={`M${x0},${y - half} L${x1},${y - tipHalf} L${x1},${y + tipHalf} L${x0},${y + half} z`}
        {...S}
      />,
    );
  }
  if (build.barrelTypeId === "fluted" && barrelPx > 40) {
    parts.push(
      <g key="flutes">
        <line x1={x0 + 16} y1={y - half / 2} x2={x1 - 14} y2={y - tipHalf / 2} {...T} />
        <line x1={x0 + 16} y1={y + half / 2} x2={x1 - 14} y2={y + tipHalf / 2} {...T} />
      </g>,
    );
  }
  if (build.rifled && x1 - x0 > 50) {
    parts.push(
      <g key="rifling" opacity={0.45}>
        {[0.3, 0.55, 0.8].map((f) => (
          <line
            key={f}
            x1={x0 + (x1 - x0) * f - 6}
            y1={y + half * 0.4}
            x2={x0 + (x1 - x0) * f + 6}
            y2={y - half * 0.4}
            {...T}
            strokeDasharray="4 3"
          />
        ))}
      </g>,
    );
  }

  let tip = x1;
  const has = (id: string) => build.attachmentIds.includes(id);
  if (has("suppressor")) {
    parts.push(
      <g key="sup">
        <rect x={tip + 2} y={y - half - 3.5} width={74} height={(half + 3.5) * 2} rx={5} {...S} fill={HATCH} />
        <line x1={tip + 12} y1={y - half - 3.5} x2={tip + 12} y2={y + half + 3.5} {...T} />
      </g>,
    );
    tip += 76;
  }
  if (has("muzzleBrake")) {
    parts.push(
      <g key="brake">
        <rect x={tip + 1} y={y - half - 2} width={26} height={(half + 2) * 2} rx={2.5} {...S} />
        {[6, 13, 20].map((o) => (
          <line key={o} x1={tip + o} y1={y - half - 6} x2={tip + o + 4} y2={y - half - 2} {...T} />
        ))}
      </g>,
    );
    tip += 27;
  }
  if (has("compensator")) {
    parts.push(
      <g key="comp">
        <rect x={tip + 1} y={y - half - 2} width={22} height={(half + 2) * 2} rx={2.5} {...S} />
        <line x1={tip + 7} y1={y - half - 2} x2={tip + 7} y2={y - half - 6} {...T} />
        <line x1={tip + 14} y1={y - half - 2} x2={tip + 14} y2={y - half - 6} {...T} />
      </g>,
    );
    tip += 23;
  }
  if (has("bayonet")) {
    parts.push(
      <g key="bayonet">
        <circle cx={x1 + 5} cy={y + half + 6} r={3.2} {...T} />
        <path d={`M${x1 + 9},${y + half + 3} h80 q16,1 22,5 q-8,4 -22,4 h-80 z`} {...S} fill={HATCH} />
      </g>,
    );
  }
  // front sight post unless a suppressor swallows the muzzle or the frame
  // draws its own front furniture (AK tower, SVD hood, TOZ bead rib, slide)
  const ownFrontSight = ["assaultRifle", "dmr", "shotgun", "pistol"].includes(build.frameId);
  if (!has("suppressor") && !ownFrontSight && boreVisible && x1 - x0 > 30) {
    parts.push(
      <g key="fsight">
        <line x1={x1 - 9} y1={y - tipHalf} x2={x1 - 9} y2={y - tipHalf - 8} {...T} />
        <circle cx={x1 - 9} cy={y - tipHalf - 10} r={1.7} fill="rgb(var(--c-blueprint))" stroke="none" />
      </g>,
    );
  }
  return { node: <g>{parts}</g>, tipX: tip };
}

// ---------------------------------------------------------------------------
// Rail / underbarrel / side attachments + special feeds
// ---------------------------------------------------------------------------

function attachmentsFor(build: FirearmBuild, spec: FrameSpec, barrelPx: number): ReactNode {
  const has = (id: string) => build.attachmentIds.includes(id);
  const parts: ReactNode[] = [];
  if (has("scope")) {
    const cx = (spec.rail.x0 + spec.rail.x1) / 2;
    const y = spec.rail.y - 16;
    parts.push(
      <g key="scope">
        {/* mount feet down to the rail line */}
        <line x1={cx - 26} y1={spec.rail.y} x2={cx - 26} y2={y + 10} {...S} />
        <line x1={cx + 26} y1={spec.rail.y} x2={cx + 26} y2={y + 10} {...S} />
        {/* main tube + objective bell + ocular + turret */}
        <rect x={cx - 46} y={y} width={82} height={11} rx={5.5} {...S} />
        <path d={`M${cx + 36},${y - 2.5} h16 q4,0 4,4 v8 q0,4 -4,4 h-16 z`} {...S} />
        <rect x={cx - 52} y={y - 1.5} width={6} height={14} rx={2} {...S} />
        <rect x={cx - 10} y={y - 6} width={10} height={6} rx={1.5} {...T} />
        <circle cx={cx + 44} cy={y + 5.5} r={3.4} {...T} />
      </g>,
    );
  }
  if (has("ubgl")) {
    parts.push(
      <g key="ubgl">
        <rect x={spec.under.x - 16} y={spec.under.y + 8} width={104} height={16} rx={8} {...S} fill={HATCH} />
        <line x1={spec.under.x + 66} y1={spec.under.y + 8} x2={spec.under.x + 66} y2={spec.under.y + 24} {...T} />
        <path d={`M${spec.under.x - 16},${spec.under.y + 24} q-8,10 -16,7`} {...T} />
      </g>,
    );
  }
  if (has("bipod")) {
    const bx = Math.min(spec.rx1 + barrelPx * 0.7, spec.rx1 + barrelPx - 14);
    const by = spec.barrelY + spec.barrelHalf;
    parts.push(
      <g key="bipod">
        <circle cx={bx} cy={by + 3} r={2.4} {...T} />
        <line x1={bx} y1={by + 3} x2={bx - 18} y2={by + 54} {...S} />
        <line x1={bx} y1={by + 3} x2={bx + 18} y2={by + 54} {...S} />
        <line x1={bx - 23} y1={by + 54} x2={bx - 13} y2={by + 54} {...S} />
        <line x1={bx + 13} y1={by + 54} x2={bx + 23} y2={by + 54} {...S} />
      </g>,
    );
  }
  if (has("foregrip")) {
    parts.push(
      <path
        key="foregrip"
        d={`M${spec.under.x},${spec.under.y + 2} h11 q2,8 -1,22 h-9 q-3,-14 -1,-22 z`}
        {...S}
        fill={HATCH}
      />,
    );
  }
  let sideOffset = 0;
  if (has("laser")) {
    parts.push(
      <g key="laser">
        <rect x={spec.side.x} y={spec.side.y - 16} width={22} height={8} rx={2.5} {...S} />
        <line x1={spec.side.x + 22} y1={spec.side.y - 12} x2={spec.side.x + 34} y2={spec.side.y - 12} {...T} strokeDasharray="2 3" />
      </g>,
    );
    sideOffset = 28;
  }
  if (has("flashlight")) {
    parts.push(
      <g key="light">
        <rect x={spec.side.x + sideOffset} y={spec.side.y - 16} width={22} height={8} rx={4} {...S} />
        <path d={`M${spec.side.x + sideOffset + 22},${spec.side.y - 15} l6,-3 M${spec.side.x + sideOffset + 22},${spec.side.y - 9} l6,3`} {...T} />
      </g>,
    );
  }
  return <g>{parts}</g>;
}

/** Feeds that aren't a simple socketed magazine. */
function specialFeed(build: FirearmBuild, spec: FrameSpec, barrelPx: number): ReactNode {
  switch (build.magazineId) {
    case "tube":
      return (
        <rect
          x={spec.rx1}
          y={spec.barrelY + spec.barrelHalf + 3}
          width={Math.max(56, barrelPx * 0.7)}
          height={6.5}
          rx={3.25}
          {...S}
        />
      );
    case "cylinder":
      return (
        <g>
          <circle cx={spec.mag.x - 10} cy={spec.mag.y - 14} r={13} {...S} fill={HATCH} />
          <circle cx={spec.mag.x - 10} cy={spec.mag.y - 14} r={3.5} {...T} />
        </g>
      );
    case "clip":
    case "enBloc":
      return (
        <g>
          <rect x={spec.mag.x - 7} y={spec.rail.y - 20} width={14} height={13} rx={2} {...S} />
          <line x1={spec.mag.x} y1={spec.rail.y - 6} x2={spec.mag.x} y2={spec.rail.y + 4} {...T} strokeDasharray="3 3" />
        </g>
      );
    case "belt":
      return (
        <g>
          <path d={`M${spec.belt.x},${spec.belt.y} q-10,28 -42,40 q-22,9 -38,6`} {...S} />
          {[0.18, 0.38, 0.58, 0.78, 0.94].map((f) => {
            const px = spec.belt.x - 8 - f * 74;
            const py = spec.belt.y + 4 + f * 40;
            return <line key={f} x1={px} y1={py - 5} x2={px + 6} y2={py + 4} {...T} />;
          })}
        </g>
      );
    default:
      return null;
  }
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
  const spec = FRAME_SPECS[build.frameId] ?? FALLBACK_SPEC;
  const breakAction = BREAK_ACTIONS.has(build.actionId);
  const doubleBore = breakAction && build.frameId === "shotgun";
  const barrelPx = Math.max(26, Math.min(build.barrelLengthMm * PX_PER_MM, MAX_TIP_X - spec.rx1 - 84));
  const { node: barrelNode, tipX } = barrelAssembly(build, spec, barrelPx, doubleBore);

  const magNode = magazineShape(build.magazineId);
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

  const stockNode = spec.stock !== null ? stockShape(build.stockId) : null;

  return (
    <BlueprintFrame build={build} rules={rules} className={className}>
      <HatchDefs />
      {stockNode !== null && spec.stock !== null && (
        <g transform={`translate(${spec.stock.x},${spec.stock.y})`}>{stockNode}</g>
      )}
      {spec.hiddenMag === true && ["box", "detachable"].includes(build.magazineId) ? (
        // Pistols carry the magazine inside the grip: baseplate + witness line.
        <g transform={`translate(${spec.mag.x},${spec.mag.y}) rotate(${spec.mag.angle})`}>
          <rect x={-13} y={0} width={28} height={5} rx={2} {...strokeThin} />
          <line x1={1} y1={0} x2={4} y2={-34} {...strokeThin} strokeDasharray="3 4" opacity={0.5} />
        </g>
      ) : (
        magNode !== null && (
          <g transform={`translate(${spec.mag.x},${spec.mag.y}) rotate(${spec.mag.angle})`}>{magNode}</g>
        )
      )}
      {specialFeed(build, spec, barrelPx)}
      {spec.draw(barrelPx)}
      {barrelNode}
      {attachmentsFor(build, spec, barrelPx)}
      {/* rear sight tick (frames with their own furniture already have one) */}
      {!["assaultRifle", "battleRifle", "lmg", "carbine"].includes(build.frameId) && (
        <rect x={spec.rail.x0 + 4} y={spec.rail.y - 5} width={6} height={5} {...T} />
      )}

      {action && (
        <CalloutLabel x={spec.rail.x0 + 44} y={spec.rail.y - 6} tx={spec.rail.x0 + 4} ty={84} text={action.label} />
      )}
      {feedLabel && (
        <CalloutLabel x={spec.rx1 + 8} y={spec.barrelY - spec.barrelHalf} tx={spec.rx1 + 100} ty={98} text={feedLabel} />
      )}
      {firstAttachment && (
        <CalloutLabel
          x={
            firstAttachment.anchor === "muzzle"
              ? tipX - 10
              : firstAttachment.anchor === "rail"
                ? (spec.rail.x0 + spec.rail.x1) / 2 + 30
                : firstAttachment.anchor === "side"
                  ? spec.side.x + 12
                  : spec.under.x + 10
          }
          y={
            firstAttachment.anchor === "muzzle"
              ? spec.barrelY - spec.barrelHalf
              : firstAttachment.anchor === "rail"
                ? spec.rail.y - 26
                : firstAttachment.anchor === "side"
                  ? spec.side.y - 14
                  : spec.under.y + 16
          }
          tx={Math.min(tipX + 16, 720)}
          ty={64}
          text={firstAttachment.label}
          accent
        />
      )}
      <DimensionLine
        x1={spec.rx1 - (spec.barrelBehind ?? 0)}
        x2={spec.rx1 - (spec.barrelBehind ?? 0) + barrelPx}
        y={300}
        label={`${build.barrelLengthMm} MM BARREL`}
      />
    </BlueprintFrame>
  );
}
