/**
 * Ashen Armoury — shared domain types.
 *
 * Design rule #1: a saved weapon stores INPUTS ONLY (a `Build`). All stats are
 * recomputed on render from the active `Ruleset`, so editing the damage model
 * in the Rules Lab instantly re-stats every weapon in the armory. Nothing
 * derived is ever persisted.
 *
 * Design rule #2: every tunable number lives in `Ruleset`, never in code.
 * The engine (`engine.ts`) is pure functions of (build, ruleset).
 */

import type { ID } from "./ids";

// ---------------------------------------------------------------------------
// Dice
// ---------------------------------------------------------------------------

/** One dice term, e.g. 2d10. */
export interface DiceTerm {
  count: number;
  size: number; // 4 | 6 | 8 | 10 | 12 | 20
}

/** A full damage expression, e.g. 1d10+1d8+2 → terms + flat bonus. */
export interface DiceExpr {
  terms: DiceTerm[];
  bonus: number;
}

// ---------------------------------------------------------------------------
// Weapon families & builds (inputs only — see design rule #1)
// ---------------------------------------------------------------------------

export type WeaponFamily = "firearm" | "bow" | "crossbow" | "grenade" | "melee";

export const WEAPON_FAMILIES: { key: WeaponFamily; label: string }[] = [
  { key: "firearm", label: "Firearm" },
  { key: "bow", label: "Bow" },
  { key: "crossbow", label: "Crossbow" },
  { key: "grenade", label: "Grenade" },
  { key: "melee", label: "Melee" },
];

export interface FirearmBuild {
  family: "firearm";
  name: string;
  frameId: string;
  actionId: string;
  magazineId: string;
  /** Set when the frame feeds cartridges (everything except shotguns). */
  cartridgeId?: string;
  /** Set when the frame feeds shells (shotguns). */
  shellTypeId?: string;
  shellGaugeId?: string;
  barrelLengthMm: number;
  barrelTypeId: string;
  rifled: boolean;
  stockId: string;
  attachmentIds: string[];
  notes?: string;
}

export interface BowBuild {
  family: "bow";
  name: string;
  bowTypeId: string;
  drawWeightLbs: number;
  drawLengthIn: number;
  /** Ability to turn draw into arrow speed, 0–1. */
  efficiency: number;
  materialId: string;
  arrowId: string;
  notes?: string;
}

export interface CrossbowBuild {
  family: "crossbow";
  name: string;
  crossbowTypeId: string;
  attachmentIds: string[];
  notes?: string;
}

export interface GrenadeBuild {
  family: "grenade";
  name: string;
  payloadId: string;
  qualityId: string;
  focusId: string;
  notes?: string;
}

export interface MeleeBuild {
  family: "melee";
  name: string;
  presetId: string;
  /** Override the preset's damage die size (Rules Lab catalog stays intact). */
  dieSizeOverride?: number;
  notes?: string;
}

export type AnyBuild =
  | FirearmBuild
  | BowBuild
  | CrossbowBuild
  | GrenadeBuild
  | MeleeBuild;

/** The persisted armory entity. */
export interface Weapon {
  id: ID;
  createdAt: string;
  updatedAt: string;
  build: AnyBuild;
}

// ---------------------------------------------------------------------------
// Ruleset — every editable constant in the game system
// ---------------------------------------------------------------------------

/** A scored band: score in [min, max] (inclusive) yields `dice` damage dice. */
export interface ScoreBand {
  id: string; // "A".."H"
  min: number;
  max: number;
  dice: number;
}

/** Joules band: energy in [minJ, maxJ] yields a die size + flat bonus damage. */
export interface JoulesBand {
  band: number;
  minJ: number;
  maxJ: number;
  dieSize: number;
  bonusDamage: number;
}

export interface BarrelLengthBand {
  minMm: number;
  maxMm: number; // Infinity encoded as null in JSON exports; use a huge number
  dice: number;
}

export interface RangeBandDef {
  id: string; // "cqc" | "short" | "medium" | "long" | "xlr"
  label: string;
  minM: number;
  maxM: number | null; // null = open-ended
}

/**
 * Per-platform accuracy modifier per range band. `null` = "Varies" in the
 * source table (shown as an em-dash with the platform's note).
 */
export type RangeMalusRow = (number | null)[];

export type DamageReduction = "none" | "halveDice";

export interface FireModeRule {
  id: string; // "single" | "burst2" | "burst3" | "fullAuto" | "fullAutoLmg"
  label: string;
  ammoCost: number;
  recoil: string; // "Low" | "Moderate" | "High" | "Very High"
  /** Stacking to-hit penalty per consecutive shot after the first. */
  stackPenalty: number;
  /** SMG frames use this reduced penalty instead (doc: -1 instead of -2). */
  smgStackPenalty: number;
  damageReduction: DamageReduction;
}

// --- Catalog part definitions (all editable in the Rules Lab) ---

export interface FrameDef {
  id: string;
  label: string;
  example: string; // flavor: "M1911", "Sten Gun"…
  /** Which ammo classes this frame accepts. */
  ammoClasses: ("pistol" | "rifle" | "shell")[];
  /** Which row of the range-malus table this frame reads. */
  rangeMalusId: string;
  baseDice: number; // frame contribution to the dice pool (default 1)
  baseWeightKg: number;
  basePriceRats: number;
  defaultBarrelMm: number;
  /** SMG rule: reduced stacking penalty on burst/auto. */
  smgHandling?: boolean;
  /** LMG rule: locked to LMG full-auto fire mode. */
  lmgHandling?: boolean;
  note?: string;
}

export interface ActionDef {
  id: string;
  label: string;
  /** V5 firing-mechanism damage dice (+1 manual loaders, 0 self-loaders). */
  damageDice: number;
  pricePct: number;
  weightPct: number;
  fireModeIds: string[];
  note?: string;
}

export interface MagazineDef {
  id: string;
  label: string;
  /** V5: belt-fed −1 die, everything else 0. */
  damageDice: number;
  pricePct: number;
  weightPct: number;
  reloadNote?: string;
}

export interface BarrelTypeDef {
  id: string;
  label: string;
  pricePct: number;
  weightPct: number;
  note?: string;
}

export interface StockDef {
  id: string;
  label: string;
  pricePct: number;
  weightPct: number;
  hideMod: number;
  note?: string;
}

export type AttachmentAnchor =
  | "muzzle"
  | "rail"
  | "underbarrel"
  | "side"
  | "stock";

export interface AttachmentDef {
  id: string;
  label: string;
  anchor: AttachmentAnchor;
  pricePct: number;
  weightPct: number;
  accuracyMod: number;
  hideMod: number;
  damageDice: number;
  note?: string;
}

export interface CartridgeDef {
  id: string;
  label: string;
  class: "pistol" | "rifle";
  bulletDiameterMm: number;
  caseLengthMm: number;
  overallLengthMm: number;
  baseDiameterMm: number;
  joules: number;
  hideMod: number;
  note?: string;
}

export interface ShellTypeDef {
  id: string;
  label: string;
  dieSize: number;
  /** Slugs don't spray bystanders (doc: CQC scatter rule excludes slugs). */
  slugLike: boolean;
  note?: string;
}

export interface ShellGaugeDef {
  id: string;
  label: string;
  /** Extra dice added to the pool before halving (10ga +3 … .410 +0). */
  diceMod: number;
}

export interface BowTypeDef {
  id: string;
  label: string;
  /** CQC / Short / Medium / Long — null = cannot reach that band. */
  rangeMalus: RangeMalusRow;
  maxDrawWeightLbs: number;
  note?: string;
}

export interface BowMaterialDef {
  id: string;
  label: string;
  accuracyMod: number;
  durabilityMod: number;
  /** Flat damage bonus/penalty (applied — the WPF app only displayed it). */
  damageMod: number;
  pricePct: number;
  weightPct: number;
}

export interface ArrowDef {
  id: string;
  label: string;
  armorPen: number;
  damageMod: number;
  note?: string;
}

export interface CrossbowTypeDef {
  id: string;
  label: string;
  bandId: string; // "A".."E" — the doc pre-computes these
  damage: DiceExpr;
  reload: string; // "Half round" | "Full round" | "2 full rounds"
  operatorReq: string;
  rangeMalus: RangeMalusRow; // CQC / Short / Medium / Long
  basePriceRats: number;
  baseWeightKg: number;
  note?: string;
}

export interface GrenadePayloadDef {
  id: string;
  label: string;
  rating: number; // P: 0.3 … 1.0
  example: string;
  basePriceRats: number;
  baseWeightKg: number;
}

export interface GrenadeQualityDef {
  id: string;
  label: string;
  rating: number; // Q: 0.3 … 1.0
  priceMult: number;
}

export interface GrenadeFocusDef {
  id: string;
  label: string;
  rating: number; // F: 0.2 … 1.0
  radiusM: number;
}

export interface MeleePresetDef {
  id: string;
  label: string;
  kind: "unarmed" | "weapon";
  governing: "str" | "dex";
  dieSize: number; // unarmed fixed 1d4 (count is always 1 for melee)
  baseWeightKg: number;
  basePriceRats: number;
  note?: string;
}

// --- Family rule groups ---

export interface FirearmRules {
  normalization: {
    bulletDiameterMm: number;
    caseLengthMm: number;
    overallLengthMm: number;
    baseDiameterMm: number;
  };
  weights: {
    bulletDiameter: number;
    caseLength: number;
    overallLength: number;
    baseDiameter: number;
  };
  roundScoreBands: ScoreBand[];
  joulesBands: JoulesBand[];
  barrelLengthBands: BarrelLengthBand[];
  /** Final dice pool is divided by this and rounded up (doc: 2). */
  diceHalveDivisor: number;
  /**
   * Bonus dice for a rifled barrel. V5 default is 0 (the doc doesn't award
   * dice for rifling); the old desktop app used +2 — set it here if you want
   * that behavior back.
   */
  rifledBonusDice: number;
  rangeBands: RangeBandDef[];
  /** Keyed by FrameDef.rangeMalusId. Row order matches `rangeBands`. */
  platformRangeMalus: Record<string, RangeMalusRow>;
  fireModes: FireModeRule[];
}

export interface BowRules {
  normalization: {
    drawWeightLbs: number;
    drawLengthIn: number;
    efficiency: number;
  };
  weights: { drawWeight: number; drawLength: number; efficiency: number };
  /** Bands map score → a full dice expression (doc: A=3d10 … H=0). */
  scoreBands: { id: string; min: number; max: number; damage: DiceExpr }[];
  strengthBands: { maxDrawLbs: number; strength: number }[];
  basePriceRats: number;
  baseWeightKg: number;
}

export interface GrenadeRules {
  weights: { payload: number; quality: number; focus: number };
  scoreBands: { id: string; min: number; max: number; damage: DiceExpr }[];
  /** Damage multiplier per quarter of the blast radius, centre outward. */
  falloffQuarters: number[]; // [1, 0.75, 0.5, 0.25]
}

export interface MeleeRules {
  /** Defence Rating penalty for everyone inside a brawl. */
  brawlDrPenalty: number;
  unarmedNote: string;
}

export interface EconomyRules {
  currencyName: string;
  currencyAbbr: string;
  /** The anchor that defines the scale, e.g. "1L of clean water = 50 rats". */
  anchorNote: string;
  waterLitrePriceRats: number;
  /** Global multiplier applied to every computed price. */
  priceScale: number;
}

export interface Catalog {
  frames: FrameDef[];
  actions: ActionDef[];
  magazines: MagazineDef[];
  barrelTypes: BarrelTypeDef[];
  stocks: StockDef[];
  attachments: AttachmentDef[];
  cartridges: CartridgeDef[];
  shellTypes: ShellTypeDef[];
  shellGauges: ShellGaugeDef[];
  bowTypes: BowTypeDef[];
  bowMaterials: BowMaterialDef[];
  arrows: ArrowDef[];
  crossbowTypes: CrossbowTypeDef[];
  grenadePayloads: GrenadePayloadDef[];
  grenadeQualities: GrenadeQualityDef[];
  grenadeFocuses: GrenadeFocusDef[];
  meleePresets: MeleePresetDef[];
}

export interface Ruleset {
  schemaVersion: 1;
  name: string;
  firearms: FirearmRules;
  bows: BowRules;
  grenades: GrenadeRules;
  melee: MeleeRules;
  economy: EconomyRules;
  catalog: Catalog;
}

// ---------------------------------------------------------------------------
// Engine outputs
// ---------------------------------------------------------------------------

/** One step of a calculation, so the UI can show its working. */
export interface CalcStep {
  label: string;
  value: string;
  detail?: string;
}

export interface FireModeStats {
  modeId: string;
  label: string;
  ammoCost: number;
  stackPenalty: number;
  damage: DiceExpr;
  note?: string;
}

export interface RangeCell {
  bandId: string;
  bandLabel: string;
  distance: string;
  malus: number | null;
}

export interface WeaponStats {
  family: WeaponFamily;
  name: string;
  /** Baseline single-hit damage. */
  damage: DiceExpr;
  damageLabel: string;
  priceRats: number;
  weightKg: number;
  hideMod: number;
  accuracyMod: number;
  rangeRow: RangeCell[];
  fireModes: FireModeStats[];
  strengthReq?: number;
  reloadNote?: string;
  /** Grenades: damage per quarter of the blast radius, centre outward. */
  falloff?: { fromM: number; toM: number; label: string; damage: DiceExpr }[];
  notes: string[];
  trace: CalcStep[];
  /** Non-fatal problems with the build (missing cartridge, etc). */
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Share / export envelopes
// ---------------------------------------------------------------------------

/** Encoded into share links and downloaded .json files. */
export interface WeaponExport {
  schema: "ashen-skies/weapon@1";
  exportedAt: string;
  rulesetName: string;
  build: AnyBuild;
  /** Snapshot of computed stats under the exporter's ruleset, for reference. */
  computed: {
    damageLabel: string;
    priceRats: number;
    weightKg: number;
  };
}

export interface RulesetExport {
  schema: "ashen-skies/ruleset@1";
  exportedAt: string;
  ruleset: Ruleset;
}
