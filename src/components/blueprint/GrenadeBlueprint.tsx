import type { ReactNode } from "react";
import type { GrenadeBuild, Ruleset } from "@shared/types";
import { computeStats, findById } from "@shared/engine";
import { BlueprintFrame, CalloutLabel, DimensionLine, HatchDefs } from "./common";

const BP = "rgb(var(--c-blueprint))";
const EMBER = "rgb(var(--c-ember))";
const INK = "rgb(var(--c-bone-soft))";
const FAINT = "rgb(var(--c-bone-faint))";
const MONO = "var(--font-mono)";

const r1 = (n: number): number => Math.round(n * 10) / 10;

/** Screen coords: y grows downward, so positive degrees sweep upward. */
function polar(cx: number, cy: number, radius: number, deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180;
  return { x: r1(cx + radius * Math.cos(rad)), y: r1(cy - radius * Math.sin(rad)) };
}

// ---------------------------------------------------------------------------
// Device details
// ---------------------------------------------------------------------------

/** Fuze cap + safety pin ring + spoon lever, sitting on top of a casing. */
function FuzeAssembly({ cx, topY }: { cx: number; topY: number }) {
  return (
    <g stroke={BP} fill="none" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round">
      <rect x={cx - 11} y={topY - 18} width={22} height={18} rx={2} />
      <path d={`M ${cx - 6} ${topY - 18} Q ${cx} ${topY - 27} ${cx + 6} ${topY - 18}`} />
      <circle cx={cx - 22} cy={topY - 10} r={7} />
      <line x1={cx - 15} y1={topY - 10} x2={cx - 5} y2={topY - 10} />
      <path
        d={`M ${cx + 9} ${topY - 14} C ${cx + 30} ${topY - 10} ${cx + 38} ${topY + 26} ${cx + 33} ${topY + 62}`}
        strokeWidth={2}
      />
    </g>
  );
}

/** Fragmentation crosshatch, computed as ellipse chords so no clipPath id is needed. */
function FragGrid() {
  const cx = 235;
  const cy = 206;
  const rx = 60;
  const ry = 82;
  const lines: ReactNode[] = [];
  for (const dx of [-40, -20, 0, 20, 40]) {
    const hh = ry * Math.sqrt(Math.max(0, 1 - (dx / rx) ** 2)) - 4;
    if (hh > 0)
      lines.push(<line key={`v${dx}`} x1={cx + dx} y1={r1(cy - hh)} x2={cx + dx} y2={r1(cy + hh)} />);
  }
  for (const dy of [-63, -42, -21, 0, 21, 42, 63]) {
    const hw = rx * Math.sqrt(Math.max(0, 1 - (dy / ry) ** 2)) - 4;
    if (hw > 0)
      lines.push(<line key={`h${dy}`} x1={r1(cx - hw)} y1={cy + dy} x2={r1(cx + hw)} y2={cy + dy} />);
  }
  return (
    <g stroke={BP} strokeWidth={1} strokeOpacity={0.45}>
      {lines}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Casing variants
// ---------------------------------------------------------------------------

type CasingId = "frag" | "smoke" | "breaching" | "shaped" | "stun";

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface CasingSpec {
  caption: string;
  /** Rough main-body rect used to place quality detailing. */
  body: Box;
  payloadPoint: { x: number; y: number };
  qualityPoint: { x: number; y: number };
  shape: () => ReactNode;
}

const CASINGS: Record<CasingId, CasingSpec> = {
  frag: {
    caption: "FRAGMENTATION CASING",
    body: { x: 190, y: 155, w: 90, h: 105 },
    payloadPoint: { x: 196, y: 152 },
    qualityPoint: { x: 192, y: 262 },
    shape: () => (
      <g stroke={BP} fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
        <path d="M 235 118 C 280 122 302 165 302 212 C 302 262 272 294 235 294 C 198 294 168 262 168 212 C 168 165 190 122 235 118 Z" />
        <path d="M 221 118 L 221 102 L 249 102 L 249 118" strokeWidth={1.5} />
        <FragGrid />
        <FuzeAssembly cx={235} topY={102} />
      </g>
    ),
  },
  smoke: {
    caption: "DISPERSAL CANISTER",
    body: { x: 185, y: 148, w: 100, h: 132 },
    payloadPoint: { x: 183, y: 158 },
    qualityPoint: { x: 183, y: 270 },
    shape: () => (
      <g stroke={BP} fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
        <ellipse cx={235} cy={138} rx={55} ry={10} />
        <line x1={180} y1={138} x2={180} y2={288} />
        <line x1={290} y1={138} x2={290} y2={288} />
        <path d="M 180 288 A 55 10 0 0 0 290 288" />
        <path d="M 180 170 A 55 10 0 0 0 290 170" strokeWidth={1} strokeOpacity={0.5} />
        <path d="M 180 252 A 55 10 0 0 0 290 252" strokeWidth={1} strokeOpacity={0.5} />
        <g strokeWidth={1} strokeOpacity={0.7}>
          <circle cx={200} cy={157} r={4} />
          <circle cx={223} cy={160} r={4} />
          <circle cx={246} cy={160} r={4} />
          <circle cx={269} cy={157} r={4} />
          <circle cx={200} cy={272} r={4} />
          <circle cx={223} cy={275} r={4} />
          <circle cx={246} cy={275} r={4} />
          <circle cx={269} cy={272} r={4} />
        </g>
        <FuzeAssembly cx={235} topY={128} />
      </g>
    ),
  },
  breaching: {
    caption: "FRAME CHARGE",
    body: { x: 140, y: 168, w: 190, h: 88 },
    payloadPoint: { x: 146, y: 174 },
    qualityPoint: { x: 150, y: 252 },
    shape: () => (
      <g stroke={BP} fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
        <rect x={140} y={168} width={190} height={88} rx={6} />
        <rect x={152} y={180} width={166} height={64} fill="url(#bp-hatch)" strokeWidth={1} strokeOpacity={0.6} />
        <path d="M 168 168 L 168 146 L 186 146" />
        <path d="M 302 168 L 302 146 L 284 146" />
        <rect x={330} y={198} width={22} height={26} strokeWidth={1.5} />
        <path d="M 352 210 C 372 208 378 188 379 168" strokeWidth={1.5} />
        <circle cx={379} cy={163} r={4} strokeWidth={1.5} />
      </g>
    ),
  },
  shaped: {
    caption: "SHAPED CHARGE",
    body: { x: 158, y: 165, w: 96, h: 80 },
    payloadPoint: { x: 156, y: 163 },
    qualityPoint: { x: 158, y: 247 },
    shape: () => (
      <g stroke={BP} fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
        <ellipse cx={152} cy={205} rx={9} ry={45} />
        <line x1={152} y1={160} x2={258} y2={160} />
        <line x1={152} y1={250} x2={258} y2={250} />
        <path d="M 258 160 A 8 45 0 0 1 258 250" strokeWidth={1} strokeOpacity={0.5} />
        <path d="M 258 160 L 324 203 M 258 250 L 324 207 M 324 203 L 324 207" />
        {/* inner liner cone */}
        <path d="M 258 172 L 306 205 M 258 238 L 306 205" strokeWidth={1} strokeOpacity={0.6} strokeDasharray="4 3" />
        {/* standoff legs + probe */}
        <path d="M 296 178 L 352 162 M 352 155 L 352 169" strokeWidth={1.5} />
        <path d="M 296 232 L 352 248 M 352 241 L 352 255" strokeWidth={1.5} />
        <line x1={324} y1={205} x2={362} y2={205} />
        <circle cx={365} cy={205} r={3} strokeWidth={1.5} />
        {/* rear detonator + wire */}
        <rect x={128} y={196} width={16} height={18} strokeWidth={1.5} />
        <path d="M 128 205 C 116 205 114 190 124 186" strokeWidth={1} />
        {/* blast direction, pointing at the falloff plot */}
        <g stroke={EMBER} strokeWidth={1.5}>
          <line x1={336} y1={228} x2={398} y2={228} />
          <path d="M 398 228 L 389 223 M 398 228 L 389 233" />
        </g>
      </g>
    ),
  },
  stun: {
    caption: "PERFORATED CANISTER",
    body: { x: 200, y: 140, w: 70, h: 138 },
    payloadPoint: { x: 197, y: 152 },
    qualityPoint: { x: 197, y: 268 },
    shape: () => (
      <g stroke={BP} fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
        <ellipse cx={235} cy={130} rx={40} ry={9} />
        <line x1={195} y1={130} x2={195} y2={284} />
        <line x1={275} y1={130} x2={275} y2={284} />
        <path d="M 195 284 A 40 9 0 0 0 275 284" />
        <g strokeWidth={1} strokeOpacity={0.7}>
          {[156, 180, 204, 228, 252].map((y) =>
            [212, 235, 258].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r={3.5} />),
          )}
        </g>
        <FuzeAssembly cx={235} topY={121} />
      </g>
    ),
  },
};

/** Stun payloads always read as a flashbang tube; otherwise the focus decides. */
function casingVariant(payloadId: string, focusId: string): CasingId {
  if (payloadId === "stun") return "stun";
  switch (focusId) {
    case "dispersed":
      return "smoke";
    case "breaching":
      return "breaching";
    case "shaped":
      return "shaped";
    default:
      return "frag";
  }
}

/** Crude builds get tape + wire wraps; specialized builds get machined index lines. */
function QualityDetail({ qualityId, body }: { qualityId: string; body: Box }) {
  const { x, y, w, h } = body;
  if (qualityId === "crude") {
    return (
      <g stroke={BP} fill="none" strokeLinecap="round">
        <g strokeWidth={1.5} strokeOpacity={0.65}>
          <line x1={x} y1={r1(y + h * 0.3)} x2={x + w} y2={r1(y + h * 0.14)} />
          <line x1={x} y1={r1(y + h * 0.3) + 9} x2={x + w} y2={r1(y + h * 0.14) + 9} />
          <line x1={x} y1={r1(y + h * 0.56)} x2={x + w} y2={r1(y + h * 0.74)} />
          <line x1={x} y1={r1(y + h * 0.56) + 9} x2={x + w} y2={r1(y + h * 0.74) + 9} />
        </g>
        <g strokeWidth={1} strokeOpacity={0.7}>
          <line x1={x + 3} y1={y + h - 20} x2={x + w - 3} y2={y + h - 20} />
          <line x1={x + 3} y1={y + h - 15} x2={x + w - 3} y2={y + h - 15} />
          <line x1={x + 3} y1={y + h - 10} x2={x + w - 3} y2={y + h - 10} />
          <polyline
            points={`${x + w - 3},${y + h - 15} ${x + w + 7},${y + h - 20} ${x + w + 3},${y + h - 10} ${x + w + 11},${y + h - 14}`}
          />
        </g>
      </g>
    );
  }
  if (qualityId === "specialized") {
    return (
      <g stroke={BP} fill="none" strokeWidth={1} strokeOpacity={0.5} strokeLinecap="round">
        <line x1={x + 5} y1={r1(y + h * 0.25)} x2={x + w - 5} y2={r1(y + h * 0.25)} />
        <line x1={x + 5} y1={r1(y + h * 0.5)} x2={x + w - 5} y2={r1(y + h * 0.5)} />
        <line x1={x + 5} y1={r1(y + h * 0.75)} x2={x + w - 5} y2={r1(y + h * 0.75)} />
        <line x1={r1(x + w * 0.35)} y1={r1(y + h * 0.5) - 5} x2={r1(x + w * 0.35)} y2={r1(y + h * 0.5) + 5} />
        <line x1={r1(x + w * 0.65)} y1={r1(y + h * 0.5) - 5} x2={r1(x + w * 0.65)} y2={r1(y + h * 0.5) + 5} />
      </g>
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// Blast falloff diagram (right half)
// ---------------------------------------------------------------------------

const BLAST_CX = 512;
const BLAST_CY = 300;
const BLAST_MAX_R = 222;

function stripParenthetical(label: string): string {
  return label.replace(/\s*\(.+\)\s*$/, "");
}

// ---------------------------------------------------------------------------
// Blueprint
// ---------------------------------------------------------------------------

export function GrenadeBlueprint({
  build,
  rules,
  className,
}: {
  build: GrenadeBuild;
  rules: Ruleset;
  className?: string;
}) {
  const stats = computeStats(build, rules);
  const payload = findById(rules.catalog.grenadePayloads, build.payloadId);
  const quality = findById(rules.catalog.grenadeQualities, build.qualityId);

  const casing = CASINGS[casingVariant(build.payloadId, build.focusId)];

  const falloff = stats.falloff ?? [];
  const lastRing = falloff.length > 0 ? falloff[falloff.length - 1] : undefined;
  const totalM = lastRing?.toM ?? 0;
  const rings = totalM > 0 ? falloff.filter((f) => f.toM > 0) : [];

  return (
    <BlueprintFrame build={build} rules={rules} eyebrow="ASHEN SKIES — ORDNANCE SCHEMATIC" className={className}>
      <HatchDefs />

      {/* --- Left half: the device ------------------------------------- */}
      {casing.shape()}
      <QualityDetail qualityId={build.qualityId} body={casing.body} />
      <text
        x={235}
        y={316}
        textAnchor="middle"
        fontFamily={MONO}
        fontSize={10}
        fill={FAINT}
        letterSpacing={1.5}
      >
        {casing.caption}
      </text>
      <CalloutLabel
        x={casing.payloadPoint.x}
        y={casing.payloadPoint.y}
        tx={64}
        ty={90}
        text={(payload?.label ?? build.payloadId).toUpperCase()}
        anchor="start"
      />
      <CalloutLabel
        x={casing.qualityPoint.x}
        y={casing.qualityPoint.y}
        tx={64}
        ty={300}
        text={(quality?.label ?? build.qualityId).toUpperCase()}
        anchor="start"
      />

      {/* --- Right half: blast falloff --------------------------------- */}
      {rings.length > 0 ? (
        <g>
          <g stroke={BP} strokeWidth={1} strokeOpacity={0.35} strokeDasharray="2 4">
            <line x1={BLAST_CX} y1={BLAST_CY} x2={BLAST_CX + BLAST_MAX_R + 8} y2={BLAST_CY} />
            <line x1={BLAST_CX} y1={BLAST_CY} x2={BLAST_CX} y2={BLAST_CY - BLAST_MAX_R - 8} />
          </g>

          {rings.map((ring, i) => {
            const rr = (ring.toM / totalM) * BLAST_MAX_R;
            const inner = i === 0;
            const frac = polar(BLAST_CX, BLAST_CY, Math.max(rr - 13, 10), 64);
            const rad = polar(BLAST_CX, BLAST_CY, rr + 10, 45);
            const short = (ring.label.split(" ")[0] ?? ring.label).toUpperCase();
            return (
              <g key={`ring-${i}`}>
                <path
                  d={`M ${r1(BLAST_CX + rr)} ${BLAST_CY} A ${r1(rr)} ${r1(rr)} 0 0 0 ${BLAST_CX} ${r1(BLAST_CY - rr)}`}
                  fill="none"
                  stroke={inner ? EMBER : BP}
                  strokeWidth={inner ? 2 : 1.5}
                  strokeOpacity={inner ? 0.95 : Math.max(0.3, 0.8 - i * 0.16)}
                  strokeLinecap="round"
                />
                <text
                  x={frac.x}
                  y={frac.y}
                  textAnchor="middle"
                  fontFamily={MONO}
                  fontSize={11}
                  fill={inner ? EMBER : INK}
                  fillOpacity={0.85}
                >
                  {short}
                </text>
                <text
                  x={rad.x}
                  y={rad.y}
                  textAnchor="middle"
                  fontFamily={MONO}
                  fontSize={10}
                  fill={INK}
                  fillOpacity={0.75}
                >
                  {`${ring.toM}m`}
                </text>
              </g>
            );
          })}

          {/* detonation point */}
          <g stroke={EMBER} strokeWidth={1.5} strokeLinecap="round">
            {[15, 45, 75].map((deg) => {
              const a = polar(BLAST_CX, BLAST_CY, 8, deg);
              const b = polar(BLAST_CX, BLAST_CY, 16, deg);
              return <line key={deg} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
            })}
          </g>
          <circle cx={BLAST_CX} cy={BLAST_CY} r={3} fill={EMBER} stroke="none" />

          {/* legend from the engine's falloff table */}
          <text x={866} y={64} textAnchor="end" fontFamily={MONO} fontSize={10} fill={FAINT} letterSpacing={1.5}>
            BLAST FALLOFF
          </text>
          {rings.map((ring, i) => (
            <text
              key={`legend-${i}`}
              x={866}
              y={80 + i * 15}
              textAnchor="end"
              fontFamily={MONO}
              fontSize={10}
              fill={i === 0 ? INK : FAINT}
            >
              {`${ring.fromM}–${ring.toM} m · ${stripParenthetical(ring.label)}`}
            </text>
          ))}

          <DimensionLine x1={BLAST_CX} x2={BLAST_CX + BLAST_MAX_R} y={318} label={`${totalM} m BLAST RADIUS`} />
        </g>
      ) : (
        <g fontFamily={MONO}>
          <text x={640} y={196} textAnchor="middle" fontSize={12} fill={INK}>
            NO BLAST RADIUS DATA
          </text>
          <text x={640} y={214} textAnchor="middle" fontSize={10} fill={FAINT}>
            SELECT A FOCUS TO PLOT FALLOFF
          </text>
        </g>
      )}
    </BlueprintFrame>
  );
}
