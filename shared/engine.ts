/**
 * The Ashen Skies weapon engine — pure functions of (build, ruleset).
 *
 * Implements Weapon Mechanics V5:
 *   round score  = Σ (cartridge dimension / normalization max) × weight
 *   round band   → number of damage dice
 *   joules band  → die size (+ flat bonus damage at high energies)
 *   barrel band  + firing mechanism + magazine (belt −1) → bonus dice
 *   final dice   = ceil(total / 2)
 * plus the bow, crossbow, grenade and melee systems from the same doc.
 *
 * No constant appears in this file — everything comes from the Ruleset so the
 * Rules Lab can rewrite the damage model live.
 */

import type {
  AnyBuild,
  BowBuild,
  CalcStep,
  CrossbowBuild,
  DiceExpr,
  FireModeStats,
  FirearmBuild,
  GrenadeBuild,
  MeleeBuild,
  RangeCell,
  Ruleset,
  WeaponStats,
} from "./types";

// ---------------------------------------------------------------------------
// Dice helpers
// ---------------------------------------------------------------------------

export function formatDice(expr: DiceExpr): string {
  const parts = expr.terms
    .filter((t) => t.count > 0)
    .map((t) => `${t.count}d${t.size}`);
  if (expr.bonus > 0) parts.push(String(expr.bonus));
  if (parts.length === 0) return "0";
  return parts.join("+");
}

export function averageDamage(expr: DiceExpr): number {
  const dice = expr.terms.reduce((sum, t) => sum + (t.count * (t.size + 1)) / 2, 0);
  return Math.round((dice + expr.bonus) * 10) / 10;
}

function scaleDiceCount(expr: DiceExpr, multiplier: number, divisor: number): DiceExpr {
  return {
    terms: expr.terms.map((t) => ({
      count: Math.ceil((t.count * multiplier) / divisor),
      size: t.size,
    })),
    bonus: expr.bonus,
  };
}

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export function findById<T extends { id: string }>(list: T[], id: string | undefined): T | undefined {
  return id === undefined ? undefined : list.find((x) => x.id === id);
}

/** Pick the band containing `value`; clamps to the nearest band outside the table. */
function pickBand<T extends { min: number; max: number }>(bands: T[], value: number): T | undefined {
  if (bands.length === 0) return undefined;
  const sorted = [...bands].sort((a, b) => a.min - b.min);
  for (const band of sorted) {
    if (value >= band.min && value <= band.max) return band;
  }
  const first = sorted[0]!;
  if (value < first.min) return first;
  return sorted[sorted.length - 1];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------------------
// Range rows
// ---------------------------------------------------------------------------

function bandDistance(minM: number, maxM: number | null): string {
  return maxM === null ? `${minM}m+` : `${minM}–${maxM}m`;
}

function buildRangeRow(
  rules: Ruleset,
  malusRow: (number | null)[],
  bandCount?: number,
): RangeCell[] {
  const bands = rules.firearms.rangeBands.slice(0, bandCount ?? rules.firearms.rangeBands.length);
  return bands.map((band, i) => ({
    bandId: band.id,
    bandLabel: band.label,
    distance: bandDistance(band.minM, band.maxM),
    malus: malusRow[i] ?? null,
  }));
}

// ---------------------------------------------------------------------------
// Firearms
// ---------------------------------------------------------------------------

export interface RoundScoreResult {
  score: number;
  bandId: string;
  dice: number;
  steps: CalcStep[];
}

export function computeRoundScore(
  rules: Ruleset,
  cartridge: { bulletDiameterMm: number; caseLengthMm: number; overallLengthMm: number; baseDiameterMm: number },
): RoundScoreResult {
  const n = rules.firearms.normalization;
  const w = rules.firearms.weights;
  const parts = [
    { label: "Bullet diameter", value: cartridge.bulletDiameterMm, max: n.bulletDiameterMm, weight: w.bulletDiameter },
    { label: "Case length", value: cartridge.caseLengthMm, max: n.caseLengthMm, weight: w.caseLength },
    { label: "Overall length", value: cartridge.overallLengthMm, max: n.overallLengthMm, weight: w.overallLength },
    { label: "Base diameter", value: cartridge.baseDiameterMm, max: n.baseDiameterMm, weight: w.baseDiameter },
  ];
  let score = 0;
  const steps: CalcStep[] = parts.map((p) => {
    // The doc rounds each contribution to 3 decimals BEFORE summing
    // (its 7.62×39 example: 0.159 + 0.093 + 0.099 + 0.063 = 0.414).
    const contribution = p.max > 0 ? Math.round((p.value / p.max) * p.weight * 1000) / 1000 : 0;
    score += contribution;
    return {
      label: p.label,
      value: contribution.toFixed(3),
      detail: `(${p.value} / ${p.max}) × ${p.weight}`,
    };
  });
  score = Math.round(score * 1000) / 1000;
  const band = pickBand(rules.firearms.roundScoreBands, score);
  steps.push({
    label: "Round score",
    value: score.toFixed(3),
    detail: band ? `Band ${band.id} → ${band.dice} dice` : "no band matched",
  });
  return { score, bandId: band?.id ?? "?", dice: band?.dice ?? 0, steps };
}

export function computeFirearm(build: FirearmBuild, rules: Ruleset): WeaponStats {
  const c = rules.catalog;
  const trace: CalcStep[] = [];
  const warnings: string[] = [];
  const notes: string[] = [];

  const frame = findById(c.frames, build.frameId);
  const action = findById(c.actions, build.actionId);
  const magazine = findById(c.magazines, build.magazineId);
  const barrelType = findById(c.barrelTypes, build.barrelTypeId);
  const stock = findById(c.stocks, build.stockId);
  const attachments = build.attachmentIds
    .map((id) => findById(c.attachments, id))
    .filter((a): a is NonNullable<typeof a> => a !== undefined);

  if (!frame) warnings.push("No frame selected.");
  if (!action) warnings.push("No action selected.");
  if (!magazine) warnings.push("No magazine selected.");

  const isShotgun = frame !== undefined && frame.ammoClasses.includes("shell");
  const cartridge = findById(c.cartridges, build.cartridgeId);
  const shellType = findById(c.shellTypes, build.shellTypeId);
  const shellGauge = findById(c.shellGauges, build.shellGaugeId);

  // --- Dice pool -----------------------------------------------------------
  // V5 has no per-platform base die (dice come from round + barrel +
  // mechanism); frames default to 0 but the knob exists for house rules.
  let dice = frame?.baseDice ?? 0;
  if (dice !== 0) trace.push({ label: "Frame base dice", value: `${dice}`, detail: frame?.label ?? "—" });

  if (action) {
    dice += action.damageDice;
    if (action.damageDice !== 0)
      trace.push({ label: "Firing mechanism", value: `${action.damageDice > 0 ? "+" : ""}${action.damageDice}`, detail: action.label });
  }
  if (magazine) {
    dice += magazine.damageDice;
    if (magazine.damageDice !== 0)
      trace.push({ label: "Feed system", value: `${magazine.damageDice}`, detail: magazine.label });
  }

  const barrelBand = pickBand(
    rules.firearms.barrelLengthBands.map((b) => ({ min: b.minMm, max: b.maxMm, dice: b.dice })),
    build.barrelLengthMm,
  );
  const barrelDice = barrelBand?.dice ?? 0;
  dice += barrelDice;
  trace.push({ label: "Barrel length", value: `+${barrelDice}`, detail: `${build.barrelLengthMm}mm` });

  if (build.rifled && rules.firearms.rifledBonusDice !== 0) {
    dice += rules.firearms.rifledBonusDice;
    trace.push({ label: "Rifling", value: `+${rules.firearms.rifledBonusDice}` });
  }

  for (const att of attachments) {
    if (att.damageDice !== 0) {
      dice += att.damageDice;
      trace.push({ label: att.label, value: `+${att.damageDice}` });
    }
  }

  // --- Die size ------------------------------------------------------------
  let dieSize = 0;
  let bonusDamage = 0;

  if (isShotgun) {
    if (!shellType || !shellGauge) {
      warnings.push("Select a shell type and gauge.");
    } else {
      dieSize = shellType.dieSize;
      dice += shellGauge.diceMod;
      trace.push({ label: "Shell", value: `d${dieSize}`, detail: shellType.label });
      trace.push({ label: "Gauge", value: `+${shellGauge.diceMod} dice`, detail: shellGauge.label });
      if (shellType.note) notes.push(shellType.note);
    }
  } else {
    if (!cartridge) {
      warnings.push("Select a cartridge.");
    } else {
      if (frame && !frame.ammoClasses.includes(cartridge.class)) {
        warnings.push(`${cartridge.label} is ${cartridge.class}-class ammo — this frame accepts: ${frame.ammoClasses.join(", ")}.`);
      }
      const rs = computeRoundScore(rules, cartridge);
      trace.push(...rs.steps);
      dice += rs.dice;

      const jb = pickBand(
        rules.firearms.joulesBands.map((b) => ({ min: b.minJ, max: b.maxJ, ...b })),
        cartridge.joules,
      );
      if (jb) {
        dieSize = jb.dieSize;
        bonusDamage = jb.bonusDamage;
        const topBand = rules.firearms.joulesBands[rules.firearms.joulesBands.length - 1];
        if (topBand && cartridge.joules > topBand.maxJ) {
          notes.push(`Energy (${cartridge.joules}J) exceeds the top joules band — clamped to band ${topBand.band}.`);
        }
        trace.push({
          label: "Energy",
          value: `d${dieSize}${bonusDamage > 0 ? ` +${bonusDamage} flat` : ""}`,
          detail: `${cartridge.joules}J → band ${jb.band}`,
        });
      }
      if (cartridge.note) notes.push(cartridge.note);
    }
  }

  // --- Halve, round up -----------------------------------------------------
  const divisor = rules.firearms.diceHalveDivisor;
  const finalDice = Math.max(0, Math.ceil(dice / divisor));
  trace.push({ label: "Final dice", value: `${finalDice}`, detail: `ceil(${dice} / ${divisor})` });

  const damage: DiceExpr = { terms: dieSize > 0 ? [{ count: finalDice, size: dieSize }] : [], bonus: bonusDamage };

  // --- Fire modes ----------------------------------------------------------
  let modeIds = action?.fireModeIds ?? [];
  if (frame?.lmgHandling) {
    modeIds = ["fullAutoLmg"];
    notes.push("LMG platform: locked to 10-round full-auto fire.");
  }
  const fireModes: FireModeStats[] = modeIds
    .map((id) => findById(rules.firearms.fireModes, id))
    .filter((m): m is NonNullable<typeof m> => m !== undefined)
    .map((mode) => {
      const stack = frame?.smgHandling ? mode.smgStackPenalty : mode.stackPenalty;
      const reduced = mode.damageReduction === "halveDice";
      // All-shots-hit dice pool: hits × weapon dice, halved again if reduced.
      const burstDamage = scaleDiceCount(damage, mode.ammoCost, reduced ? divisor : 1);
      return {
        modeId: mode.id,
        label: mode.label,
        ammoCost: mode.ammoCost,
        stackPenalty: stack,
        damage: burstDamage,
        note:
          mode.ammoCost > 1
            ? `${formatDice(burstDamage)} if all ${mode.ammoCost} shots hit${reduced ? " (dice halved, rounded up)" : ""}`
            : undefined,
      };
    });

  if (frame?.smgHandling) notes.push("SMG handling: stacking recoil penalty reduced to −1; cannot be mounted or braced.");
  if (frame?.note) notes.push(frame.note);
  if (action?.note) notes.push(action.note);
  if (magazine?.reloadNote) notes.push(magazine.reloadNote);
  if (barrelType?.note) notes.push(barrelType.note);
  if (stock?.note) notes.push(stock.note);
  for (const att of attachments) if (att.note) notes.push(att.note);

  // --- Price / weight / modifiers -----------------------------------------
  const pricePct =
    (action?.pricePct ?? 0) +
    (magazine?.pricePct ?? 0) +
    (barrelType?.pricePct ?? 0) +
    (stock?.pricePct ?? 0) +
    attachments.reduce((s, a) => s + a.pricePct, 0);
  const weightPct =
    (action?.weightPct ?? 0) +
    (magazine?.weightPct ?? 0) +
    (barrelType?.weightPct ?? 0) +
    (stock?.weightPct ?? 0) +
    attachments.reduce((s, a) => s + a.weightPct, 0);

  const priceRats = Math.round((frame?.basePriceRats ?? 0) * (1 + pricePct) * rules.economy.priceScale);
  const weightKg = round2((frame?.baseWeightKg ?? 0) * (1 + weightPct));
  trace.push({ label: "Price", value: `${priceRats} ${rules.economy.currencyAbbr}`, detail: `${frame?.basePriceRats ?? 0} × ${(1 + pricePct).toFixed(3)} × ${rules.economy.priceScale}` });
  trace.push({ label: "Weight", value: `${weightKg} kg`, detail: `${frame?.baseWeightKg ?? 0} × ${(1 + weightPct).toFixed(3)}` });

  const hideMod =
    (stock?.hideMod ?? 0) + (cartridge?.hideMod ?? 0) + attachments.reduce((s, a) => s + a.hideMod, 0);
  const accuracyMod = attachments.reduce((s, a) => s + a.accuracyMod, 0);

  const malusRow = frame ? rules.firearms.platformRangeMalus[frame.rangeMalusId] ?? [] : [];

  return {
    family: "firearm",
    name: build.name,
    damage,
    damageLabel: formatDice(damage),
    priceRats,
    weightKg,
    hideMod,
    accuracyMod,
    rangeRow: buildRangeRow(rules, malusRow),
    fireModes,
    notes,
    trace,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Bows
// ---------------------------------------------------------------------------

export function computeBow(build: BowBuild, rules: Ruleset): WeaponStats {
  const c = rules.catalog;
  const trace: CalcStep[] = [];
  const warnings: string[] = [];
  const notes: string[] = [];

  const bowType = findById(c.bowTypes, build.bowTypeId);
  const material = findById(c.bowMaterials, build.materialId);
  const arrow = findById(c.arrows, build.arrowId);
  if (!bowType) warnings.push("No bow type selected.");
  if (!material) warnings.push("No material selected.");
  if (!arrow) warnings.push("No arrow selected.");

  const n = rules.bows.normalization;
  const w = rules.bows.weights;
  const dw = Math.max(0, build.drawWeightLbs);
  const dl = Math.max(0, build.drawLengthIn);
  const eff = Math.min(Math.max(build.efficiency, 0), n.efficiency);

  const contributions = [
    { label: "Draw weight", value: (dw / n.drawWeightLbs) * w.drawWeight, detail: `(${dw} / ${n.drawWeightLbs}) × ${w.drawWeight}` },
    { label: "Draw length", value: (dl / n.drawLengthIn) * w.drawLength, detail: `(${dl} / ${n.drawLengthIn}) × ${w.drawLength}` },
    { label: "Efficiency", value: (eff / n.efficiency) * w.efficiency, detail: `(${eff} / ${n.efficiency}) × ${w.efficiency}` },
  ];
  let score = 0;
  for (const part of contributions) {
    score += part.value;
    trace.push({ label: part.label, value: part.value.toFixed(3), detail: part.detail });
  }
  score = Math.round(score * 1000) / 1000;

  const band = pickBand(rules.bows.scoreBands, score);
  trace.push({ label: "Bow score", value: score.toFixed(3), detail: band ? `Band ${band.id} → ${formatDice(band.damage)}` : "no band" });

  const flatMod = (material?.damageMod ?? 0) + (arrow?.damageMod ?? 0);
  const damage: DiceExpr = band
    ? { terms: band.damage.terms.map((t) => ({ ...t })), bonus: band.damage.bonus + flatMod }
    : { terms: [], bonus: 0 };
  if (flatMod !== 0)
    trace.push({ label: "Material + arrow", value: `${flatMod > 0 ? "+" : ""}${flatMod} flat`, detail: `${material?.label ?? "—"}, ${arrow?.label ?? "—"}` });
  if (damage.terms.length === 0) notes.push("Band H — decorative. It looks nice on a wall.");

  if (bowType && dw > bowType.maxDrawWeightLbs)
    warnings.push(`${bowType.label} maxes out at ${bowType.maxDrawWeightLbs}lbs draw.`);
  if (dw > n.drawWeightLbs)
    warnings.push(`Draw weight exceeds the ${n.drawWeightLbs}lbs normalization ceiling.`);

  const strBand = [...rules.bows.strengthBands]
    .sort((a, b) => a.maxDrawLbs - b.maxDrawLbs)
    .find((b) => dw <= b.maxDrawLbs);
  const strengthReq = strBand?.strength ?? rules.bows.strengthBands[rules.bows.strengthBands.length - 1]?.strength;
  if (arrow?.note) notes.push(arrow.note);
  if (arrow) notes.push(`Armor penetration ${arrow.armorPen >= 0 ? "+" : ""}${arrow.armorPen} (${arrow.label}).`);

  const priceRats = Math.round(rules.bows.basePriceRats * (1 + (material?.pricePct ?? 0)) * rules.economy.priceScale);
  const weightKg = round2(rules.bows.baseWeightKg * (1 + (material?.weightPct ?? 0)));

  return {
    family: "bow",
    name: build.name,
    damage,
    damageLabel: formatDice(damage),
    priceRats,
    weightKg,
    hideMod: 0,
    accuracyMod: material?.accuracyMod ?? 0,
    rangeRow: bowType ? buildRangeRow(rules, bowType.rangeMalus, 4) : [],
    fireModes: [],
    strengthReq,
    notes,
    trace,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Crossbows
// ---------------------------------------------------------------------------

export function computeCrossbow(build: CrossbowBuild, rules: Ruleset): WeaponStats {
  const c = rules.catalog;
  const warnings: string[] = [];
  const notes: string[] = [];
  const trace: CalcStep[] = [];

  const type = findById(c.crossbowTypes, build.crossbowTypeId);
  if (!type) warnings.push("No crossbow type selected.");
  const attachments = build.attachmentIds
    .map((id) => findById(c.attachments, id))
    .filter((a): a is NonNullable<typeof a> => a !== undefined);

  const damage: DiceExpr = type
    ? { terms: type.damage.terms.map((t) => ({ ...t })), bonus: type.damage.bonus }
    : { terms: [], bonus: 0 };
  if (type) {
    trace.push({ label: "Type", value: formatDice(damage), detail: `${type.label} — pre-computed band ${type.bandId}` });
    notes.push(`Reload: ${type.reload}. Operator: ${type.operatorReq}.`);
    if (type.note) notes.push(type.note);
  }
  notes.push("Mechanically pre-loaded: braced +2 to hit, bipod/rest +4 (as semi-automatic).");
  notes.push("Lined-Up Shot applies: spend an action aiming for +2 to hit next turn.");
  notes.push("Single-fire only — no burst or automatic options.");
  for (const att of attachments) if (att.note) notes.push(att.note);

  const pricePct = attachments.reduce((s, a) => s + a.pricePct, 0);
  const weightPct = attachments.reduce((s, a) => s + a.weightPct, 0);
  const priceRats = Math.round((type?.basePriceRats ?? 0) * (1 + pricePct) * rules.economy.priceScale);
  const weightKg = round2((type?.baseWeightKg ?? 0) * (1 + weightPct));

  return {
    family: "crossbow",
    name: build.name,
    damage,
    damageLabel: formatDice(damage),
    priceRats,
    weightKg,
    hideMod: attachments.reduce((s, a) => s + a.hideMod, 0),
    accuracyMod: attachments.reduce((s, a) => s + a.accuracyMod, 0),
    rangeRow: type ? buildRangeRow(rules, type.rangeMalus, 4) : [],
    fireModes: [],
    reloadNote: type?.reload,
    notes,
    trace,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Grenades
// ---------------------------------------------------------------------------

export function computeGrenade(build: GrenadeBuild, rules: Ruleset): WeaponStats {
  const c = rules.catalog;
  const warnings: string[] = [];
  const notes: string[] = [];
  const trace: CalcStep[] = [];

  const payload = findById(c.grenadePayloads, build.payloadId);
  const quality = findById(c.grenadeQualities, build.qualityId);
  const focus = findById(c.grenadeFocuses, build.focusId);
  if (!payload) warnings.push("No payload selected.");
  if (!quality) warnings.push("No quality selected.");
  if (!focus) warnings.push("No focus selected.");

  const w = rules.grenades.weights;
  const contributions = [
    { label: "Payload", value: (payload?.rating ?? 0) * w.payload, detail: `${payload?.rating ?? 0} × ${w.payload} (${payload?.label ?? "—"})` },
    { label: "Quality", value: (quality?.rating ?? 0) * w.quality, detail: `${quality?.rating ?? 0} × ${w.quality} (${quality?.label ?? "—"})` },
    { label: "Focus", value: (focus?.rating ?? 0) * w.focus, detail: `${focus?.rating ?? 0} × ${w.focus} (${focus?.label ?? "—"})` },
  ];
  let score = 0;
  for (const part of contributions) {
    score += part.value;
    trace.push({ label: part.label, value: part.value.toFixed(3), detail: part.detail });
  }
  score = Math.round(score * 1000) / 1000;

  const band = pickBand(rules.grenades.scoreBands, score);
  trace.push({ label: "Explosive score", value: score.toFixed(3), detail: band ? `Band ${band.id} → ${formatDice(band.damage)}` : "no band" });

  const damage: DiceExpr = band
    ? { terms: band.damage.terms.map((t) => ({ ...t })), bonus: band.damage.bonus }
    : { terms: [], bonus: 0 };

  const radius = focus?.radiusM ?? 0;
  const quarters = rules.grenades.falloffQuarters;
  const quarterLabels = ["Full damage roll", "¾ damage roll (round up)", "½ damage roll (round up)", "¼ damage roll (round up)"];
  const falloff = quarters.map((q, i) => ({
    fromM: round2((radius / quarters.length) * i),
    toM: round2((radius / quarters.length) * (i + 1)),
    label: quarterLabels[i] ?? `×${q}`,
    damage,
  }));

  if (payload?.example) notes.push(`Payload example: ${payload.example}.`);
  notes.push(`Effective radius ${radius}m — damage falls off by quarter (${quarters.map((q) => `${q * 100}%`).join(" / ")}).`);

  const priceRats = Math.round((payload?.basePriceRats ?? 0) * (quality?.priceMult ?? 1) * rules.economy.priceScale);
  const weightKg = round2(payload?.baseWeightKg ?? 0);

  return {
    family: "grenade",
    name: build.name,
    damage,
    damageLabel: formatDice(damage),
    priceRats,
    weightKg,
    hideMod: 0,
    accuracyMod: 0,
    rangeRow: [],
    fireModes: [],
    falloff,
    notes,
    trace,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Melee
// ---------------------------------------------------------------------------

export function computeMelee(build: MeleeBuild, rules: Ruleset): WeaponStats {
  const c = rules.catalog;
  const warnings: string[] = [];
  const notes: string[] = [];
  const trace: CalcStep[] = [];

  const preset = findById(c.meleePresets, build.presetId);
  if (!preset) warnings.push("No melee weapon selected.");

  const dieSize = build.dieSizeOverride ?? preset?.dieSize ?? 4;
  const damage: DiceExpr = { terms: [{ count: 1, size: dieSize }], bonus: 0 };
  trace.push({ label: "Weapon die", value: `1d${dieSize}`, detail: preset?.label ?? "—" });

  if (preset?.kind === "unarmed") {
    notes.push(rules.melee.unarmedNote);
  } else if (preset) {
    const gov = preset.governing.toUpperCase();
    notes.push(`${gov}-based weapon — to hit: attack roll + ${gov} modifier; to wound: 1d${dieSize} + STR modifier.`);
  }
  notes.push(`Everyone in a brawl takes ${rules.melee.brawlDrPenalty} DR against melee attacks.`);
  if (preset?.note) notes.push(preset.note);

  return {
    family: "melee",
    name: build.name,
    damage,
    damageLabel: `${formatDice(damage)} + STR`,
    priceRats: Math.round((preset?.basePriceRats ?? 0) * rules.economy.priceScale),
    weightKg: preset?.baseWeightKg ?? 0,
    hideMod: 0,
    accuracyMod: 0,
    rangeRow: [],
    fireModes: [],
    notes,
    trace,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export function computeStats(build: AnyBuild, rules: Ruleset): WeaponStats {
  switch (build.family) {
    case "firearm":
      return computeFirearm(build, rules);
    case "bow":
      return computeBow(build, rules);
    case "crossbow":
      return computeCrossbow(build, rules);
    case "grenade":
      return computeGrenade(build, rules);
    case "melee":
      return computeMelee(build, rules);
  }
}
