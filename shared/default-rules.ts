/**
 * The default Ashen Skies ruleset — Weapon Mechanics V5 encoded as data, plus
 * the parts/economy catalog carried over from the original GunBuilder desktop
 * app (cleaned up — see docs/CHANGES-FROM-WPF.md).
 *
 * EVERYTHING here is a default. The Rules Lab edits a copy of this object at
 * runtime; nothing in the engine reads these values directly.
 *
 * Deliberate deviations from the V5 PDF, per the designer:
 *  - Joules→die-size table replaced with the revised 8-band table
 *    (1–450 d4 … 22,001–35,000 d12+6). Energies above the top band clamp to
 *    band 8; add a 9th band here if you want the old 60 kJ+ D20 back.
 */

import type { Ruleset } from "./types";

export const DEFAULT_RULESET: Ruleset = {
  schemaVersion: 1,
  name: "Ashen Skies V5 (default)",

  // -------------------------------------------------------------------------
  // Firearms
  // -------------------------------------------------------------------------
  firearms: {
    normalization: {
      bulletDiameterMm: 14.88,
      caseLengthMm: 114,
      overallLengthMm: 155.8,
      baseDiameterMm: 26.95,
    },
    weights: {
      bulletDiameter: 0.3,
      caseLength: 0.275,
      overallLength: 0.275,
      baseDiameter: 0.15,
    },
    roundScoreBands: [
      { id: "-", min: 0, max: 0.0999, dice: 0 },
      { id: "A", min: 0.1, max: 0.1999, dice: 0 },
      { id: "B", min: 0.2, max: 0.3999, dice: 1 },
      { id: "C", min: 0.4, max: 0.5999, dice: 2 },
      { id: "D", min: 0.6, max: 0.8499, dice: 3 },
      { id: "E", min: 0.85, max: 0.9999, dice: 4 },
      { id: "F", min: 1, max: 999, dice: 5 },
    ],
    joulesBands: [
      { band: 1, minJ: 1, maxJ: 450, dieSize: 4, bonusDamage: 0 },
      { band: 2, minJ: 451, maxJ: 700, dieSize: 6, bonusDamage: 0 },
      { band: 3, minJ: 701, maxJ: 1750, dieSize: 8, bonusDamage: 0 },
      { band: 4, minJ: 1751, maxJ: 2750, dieSize: 10, bonusDamage: 0 },
      { band: 5, minJ: 2751, maxJ: 6000, dieSize: 12, bonusDamage: 0 },
      { band: 6, minJ: 6001, maxJ: 12000, dieSize: 12, bonusDamage: 2 },
      { band: 7, minJ: 12001, maxJ: 22000, dieSize: 12, bonusDamage: 4 },
      { band: 8, minJ: 22001, maxJ: 35000, dieSize: 12, bonusDamage: 6 },
    ],
    barrelLengthBands: [
      { minMm: 0, maxMm: 200, dice: 0 },
      { minMm: 201, maxMm: 550, dice: 1 },
      { minMm: 551, maxMm: 700, dice: 2 },
      { minMm: 701, maxMm: 99999, dice: 3 },
    ],
    diceHalveDivisor: 2,
    rifledBonusDice: 0,
    rangeBands: [
      { id: "cqc", label: "CQC", minM: 0, maxM: 20 },
      { id: "short", label: "Short", minM: 21, maxM: 50 },
      { id: "medium", label: "Medium", minM: 51, maxM: 200 },
      { id: "long", label: "Long", minM: 201, maxM: 500 },
      { id: "xlr", label: "XLR", minM: 501, maxM: null },
    ],
    platformRangeMalus: {
      pistol: [-1, 0, -2, -4, -8],
      smg: [-2, 0, -1, -3, -8],
      shotgun: [null, 1, null, -4, -10],
      assaultRifle: [-4, -2, 0, 0, -2],
      battleRifle: [-4, -2, 0, 1, -1],
      carbine: [-2, 0, 0, -2, -3],
      sniperDmr: [-8, -4, 0, 1, 0],
      lmg: [-4, -2, 0, 0, -2],
    },
    fireModes: [
      {
        id: "single",
        label: "Single Shot",
        ammoCost: 1,
        recoil: "Low",
        stackPenalty: 0,
        smgStackPenalty: 0,
        damageReduction: "none",
      },
      {
        id: "burst2",
        label: "Burst (2-Round)",
        ammoCost: 2,
        recoil: "Moderate",
        stackPenalty: -2,
        smgStackPenalty: -1,
        damageReduction: "none",
      },
      {
        id: "burst3",
        label: "Burst (3-Round)",
        ammoCost: 3,
        recoil: "Moderate",
        stackPenalty: -2,
        smgStackPenalty: -1,
        damageReduction: "halveDice",
      },
      {
        id: "fullAuto",
        label: "Full Auto",
        ammoCost: 5,
        recoil: "High",
        stackPenalty: -2,
        smgStackPenalty: -1,
        damageReduction: "halveDice",
      },
      {
        id: "fullAutoLmg",
        label: "Full Auto (LMG)",
        ammoCost: 10,
        recoil: "Very High",
        stackPenalty: -2,
        smgStackPenalty: -2,
        damageReduction: "halveDice",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Bows
  // -------------------------------------------------------------------------
  bows: {
    normalization: { drawWeightLbs: 150, drawLengthIn: 32, efficiency: 1.0 },
    weights: { drawWeight: 0.5, drawLength: 0.3, efficiency: 0.2 },
    scoreBands: [
      { id: "A", min: 0.8, max: 1.0, damage: { terms: [{ count: 3, size: 10 }], bonus: 0 } },
      { id: "B", min: 0.6, max: 0.7999, damage: { terms: [{ count: 2, size: 10 }], bonus: 0 } },
      {
        id: "C",
        min: 0.4,
        max: 0.5999,
        damage: { terms: [{ count: 1, size: 10 }, { count: 1, size: 8 }], bonus: 0 },
      },
      { id: "D", min: 0.25, max: 0.3999, damage: { terms: [{ count: 1, size: 10 }], bonus: 0 } },
      { id: "E", min: 0.15, max: 0.2499, damage: { terms: [{ count: 1, size: 8 }], bonus: 0 } },
      { id: "F", min: 0.05, max: 0.1499, damage: { terms: [{ count: 1, size: 6 }], bonus: 0 } },
      { id: "G", min: 0.01, max: 0.0499, damage: { terms: [{ count: 1, size: 4 }], bonus: 0 } },
      { id: "H", min: 0, max: 0.0099, damage: { terms: [], bonus: 0 } },
    ],
    strengthBands: [
      { maxDrawLbs: 30, strength: 8 },
      { maxDrawLbs: 50, strength: 10 },
      { maxDrawLbs: 70, strength: 12 },
      { maxDrawLbs: 90, strength: 14 },
      { maxDrawLbs: 110, strength: 16 },
      { maxDrawLbs: 150, strength: 18 },
    ],
    basePriceRats: 300,
    baseWeightKg: 1.4,
  },

  // -------------------------------------------------------------------------
  // Grenades & explosives
  // -------------------------------------------------------------------------
  grenades: {
    weights: { payload: 0.6, quality: 0.15, focus: 0.25 },
    scoreBands: [
      { id: "A", min: 0.9, max: 1.0, damage: { terms: [{ count: 5, size: 20 }], bonus: 0 } },
      { id: "B", min: 0.7, max: 0.8999, damage: { terms: [{ count: 5, size: 12 }], bonus: 0 } },
      { id: "C", min: 0.5, max: 0.6999, damage: { terms: [{ count: 4, size: 10 }], bonus: 0 } },
      { id: "D", min: 0.3, max: 0.4999, damage: { terms: [{ count: 2, size: 10 }], bonus: 0 } },
      { id: "E", min: 0.1, max: 0.2999, damage: { terms: [{ count: 2, size: 8 }], bonus: 0 } },
      { id: "F", min: 0.01, max: 0.0999, damage: { terms: [{ count: 1, size: 6 }], bonus: 0 } },
    ],
    falloffQuarters: [1, 0.75, 0.5, 0.25],
  },

  // -------------------------------------------------------------------------
  // Melee
  // -------------------------------------------------------------------------
  melee: {
    brawlDrPenalty: -2,
    unarmedNote:
      "Unarmed — to hit: attack roll + DEX modifier; to wound: 1d4 + STR modifier. Everyone in a brawl takes the brawl DR penalty against melee attacks.",
  },

  // -------------------------------------------------------------------------
  // Economy — rats (ration tablets)
  // -------------------------------------------------------------------------
  economy: {
    currencyName: "Rats (Ration Tablets)",
    currencyAbbr: "rats",
    anchorNote: "Scale anchor: 1L of clean water = 50 rats.",
    waterLitrePriceRats: 50,
    priceScale: 1,
  },

  // -------------------------------------------------------------------------
  // Parts catalog (carried over from the desktop GunBuilder, cleaned up)
  // -------------------------------------------------------------------------
  catalog: {
    frames: [
      {
        id: "pistol",
        label: "Pistol",
        example: "M1911",
        ammoClasses: ["pistol"],
        rangeMalusId: "pistol",
        baseDice: 0,
        baseWeightKg: 1.0,
        basePriceRats: 400,
        defaultBarrelMm: 120,
        note: "Concealable holdout. Stealth attacks from an unaware target add one damage die to the first shot.",
      },
      {
        id: "smg",
        label: "SMG",
        example: "Sten Gun",
        ammoClasses: ["pistol"],
        rangeMalusId: "smg",
        baseDice: 0,
        baseWeightKg: 3.0,
        basePriceRats: 1000,
        defaultBarrelMm: 200,
        smgHandling: true,
        note: "Reduced stacking recoil (−1) in burst/auto. Cannot be mounted or braced.",
      },
      {
        id: "carbine",
        label: "Carbine",
        example: "Steyr AUG",
        ammoClasses: ["rifle", "pistol"],
        rangeMalusId: "carbine",
        baseDice: 0,
        baseWeightKg: 3.2,
        basePriceRats: 1200,
        defaultBarrelMm: 400,
      },
      {
        id: "assaultRifle",
        label: "Assault Rifle",
        example: "AN-94",
        ammoClasses: ["rifle"],
        rangeMalusId: "assaultRifle",
        baseDice: 0,
        baseWeightKg: 3.5,
        basePriceRats: 1600,
        defaultBarrelMm: 415,
      },
      {
        id: "battleRifle",
        label: "Battle Rifle",
        example: "SCAR-H",
        ammoClasses: ["rifle"],
        rangeMalusId: "battleRifle",
        baseDice: 0,
        baseWeightKg: 4.0,
        basePriceRats: 1750,
        defaultBarrelMm: 400,
      },
      {
        id: "shotgun",
        label: "Shotgun",
        example: "TOZ 34",
        ammoClasses: ["shell"],
        rangeMalusId: "shotgun",
        baseDice: 0,
        baseWeightKg: 3.2,
        basePriceRats: 1450,
        defaultBarrelMm: 700,
        note: "Non-slug ammo can scatter onto characters within 2m of the target (DEX save DC10).",
      },
      {
        id: "dmr",
        label: "DMR",
        example: "SVD",
        ammoClasses: ["rifle"],
        rangeMalusId: "sniperDmr",
        baseDice: 0,
        baseWeightKg: 4.3,
        basePriceRats: 1400,
        defaultBarrelMm: 620,
        note: "Lined-up shot: spend a firing action aiming for +2 to hit next turn.",
      },
      {
        id: "sniper",
        label: "Sniper Rifle",
        example: "Mosin Nagant",
        ammoClasses: ["rifle"],
        rangeMalusId: "sniperDmr",
        baseDice: 0,
        baseWeightKg: 4.0,
        basePriceRats: 1800,
        defaultBarrelMm: 730,
        note: "Lined-up shot: spend a firing action aiming for +2 to hit next turn.",
      },
      {
        id: "lmg",
        label: "LMG",
        example: "Bren Gun",
        ammoClasses: ["rifle"],
        rangeMalusId: "lmg",
        baseDice: 0,
        baseWeightKg: 8.5,
        basePriceRats: 2000,
        defaultBarrelMm: 635,
        lmgHandling: true,
        note: "No single fire — always expends 10 rounds. Reload and setup are full-round actions. −8 to hit while moving.",
      },
    ],

    actions: [
      { id: "flintlock", label: "Flintlock", damageDice: 1, pricePct: 0.05, weightPct: 0.1, fireModeIds: ["single"], note: "Muzzle-loading mechanism (+1 die)." },
      { id: "matchlock", label: "Matchlock", damageDice: 1, pricePct: 0.04, weightPct: 0.08, fireModeIds: ["single"], note: "Muzzle-loading mechanism (+1 die)." },
      { id: "pump", label: "Pump Action", damageDice: 1, pricePct: 0.06, weightPct: 0.12, fireModeIds: ["single"], note: "Manual repeater (+1 die)." },
      { id: "lever", label: "Lever Action", damageDice: 1, pricePct: 0.055, weightPct: 0.11, fireModeIds: ["single"], note: "Manual repeater (+1 die)." },
      { id: "bolt", label: "Bolt Action", damageDice: 1, pricePct: 0.08, weightPct: 0.15, fireModeIds: ["single"], note: "+1 die (V5 firing-mechanism table)." },
      { id: "break", label: "Break Action", damageDice: 1, pricePct: 0.07, weightPct: 0.13, fireModeIds: ["single"], note: "Breach loader (+1 die)." },
      { id: "singleAction", label: "Single Action", damageDice: 0, pricePct: 0.045, weightPct: 0.09, fireModeIds: ["single"] },
      { id: "doubleAction", label: "Double Action", damageDice: 0, pricePct: 0.05, weightPct: 0.1, fireModeIds: ["single"] },
      { id: "semi", label: "Semi-Automatic", damageDice: 0, pricePct: 0.1, weightPct: 0.18, fireModeIds: ["single"], note: "No stacking recoil penalty; +2 to hit braced, +4 on bipod/rest." },
      { id: "burst", label: "Burst", damageDice: 0, pricePct: 0.11, weightPct: 0.2, fireModeIds: ["burst3"] },
      { id: "auto", label: "Automatic", damageDice: 0, pricePct: 0.15, weightPct: 0.25, fireModeIds: ["fullAuto"] },
      { id: "semiBurst", label: "Semi/Burst", damageDice: 0, pricePct: 0.12, weightPct: 0.22, fireModeIds: ["single", "burst3"] },
      { id: "semiBurst2", label: "Semi/Burst (2-Round)", damageDice: 0, pricePct: 0.14, weightPct: 0.22, fireModeIds: ["single", "burst2"], note: "Rare pre-collapse trigger group — burst efficiency without the damage loss." },
      { id: "semiFull", label: "Semi/Full", damageDice: 0, pricePct: 0.13, weightPct: 0.24, fireModeIds: ["single", "fullAuto"] },
      { id: "semiBurstFull", label: "Semi/Burst/Full", damageDice: 0, pricePct: 0.16, weightPct: 0.28, fireModeIds: ["single", "burst3", "fullAuto"] },
    ],

    magazines: [
      { id: "muzzle", label: "Muzzle Loader", damageDice: 0, pricePct: 0.08, weightPct: 0.15, reloadNote: "Full-round reload." },
      { id: "breach", label: "Breachloader", damageDice: 0, pricePct: 0.07, weightPct: 0.12, reloadNote: "Full-round reload." },
      { id: "tube", label: "Tube-Fed", damageDice: 0, pricePct: 0.06, weightPct: 0.1, reloadNote: "Full round to top up (half round for a single shell)." },
      { id: "cylinder", label: "Cylinder", damageDice: 0, pricePct: 0.09, weightPct: 0.14 },
      { id: "clip", label: "Stripper Clip", damageDice: 0, pricePct: 0.05, weightPct: 0.08 },
      { id: "enBloc", label: "En Bloc Clip", damageDice: 0, pricePct: 0.065, weightPct: 0.09 },
      { id: "box", label: "Box Magazine", damageDice: 0, pricePct: 0.1, weightPct: 0.16, reloadNote: "Half-round reload." },
      { id: "drum", label: "Drum Magazine", damageDice: 0, pricePct: 0.12, weightPct: 0.2, reloadNote: "Half-round reload." },
      { id: "detachable", label: "Detachable Magazine", damageDice: 0, pricePct: 0.11, weightPct: 0.18, reloadNote: "Half-round reload." },
      { id: "belt", label: "Belt-Fed", damageDice: -1, pricePct: 0.14, weightPct: 0.22, reloadNote: "Full-round reload. −1 die (V5 balance: sustained-fire tradeoff)." },
      { id: "integratedDrum", label: "Integrated Drum", damageDice: 0, pricePct: 0.16, weightPct: 0.25 },
    ],

    barrelTypes: [
      { id: "normal", label: "Normal", pricePct: 0, weightPct: 0 },
      { id: "heavy", label: "Heavy", pricePct: 0.1, weightPct: 0.15, note: "Slower to overheat; steadier sustained fire." },
      { id: "fluted", label: "Fluted", pricePct: 0.15, weightPct: 0.05, note: "Lighter than heavy at similar stiffness." },
      { id: "choked", label: "Choked", pricePct: 0.2, weightPct: 0.03, note: "Tightens shotgun spread at range." },
      { id: "light", label: "Lightweight", pricePct: -0.05, weightPct: -0.1, note: "Handier, heats faster." },
    ],

    stocks: [
      { id: "standard", label: "Standard", pricePct: 0, weightPct: 0, hideMod: 0 },
      { id: "wireframe", label: "Wireframe", pricePct: 0.05, weightPct: -0.05, hideMod: 1 },
      { id: "thumbhole", label: "Thumbhole", pricePct: 0.075, weightPct: 0.02, hideMod: 0 },
      { id: "skeleton", label: "Skeleton", pricePct: 0.1, weightPct: -0.07, hideMod: 1 },
      { id: "collapsible", label: "Collapsible", pricePct: 0.125, weightPct: 0.03, hideMod: 1 },
      { id: "pistolGrip", label: "Pistol Grip (no stock)", pricePct: 0.15, weightPct: -0.1, hideMod: 2, note: "Stockless — easier to stash, harder to steady." },
    ],

    attachments: [
      { id: "scope", label: "Scope", anchor: "rail", pricePct: 0.1, weightPct: 0.05, accuracyMod: 2, hideMod: -1, damageDice: 0 },
      { id: "laser", label: "Laser Module", anchor: "side", pricePct: 0.08, weightPct: 0.03, accuracyMod: 1, hideMod: 0, damageDice: 0 },
      { id: "flashlight", label: "Flashlight", anchor: "side", pricePct: 0.05, weightPct: 0.02, accuracyMod: 0, hideMod: 0, damageDice: 0 },
      { id: "ubgl", label: "Underbarrel Grenade Launcher", anchor: "underbarrel", pricePct: 0.5, weightPct: 0.2, accuracyMod: 0, hideMod: -2, damageDice: 0, note: "Fires 40mm grenades — build its projectile in the Grenade fabricator." },
      { id: "bipod", label: "Bipod", anchor: "underbarrel", pricePct: 0.25, weightPct: 0.07, accuracyMod: 0, hideMod: -1, damageDice: 0, note: "Stabilized fire halves stacking accuracy penalties (V5)." },
      { id: "foregrip", label: "Foregrip", anchor: "underbarrel", pricePct: 0.17, weightPct: 0.05, accuracyMod: 1, hideMod: 0, damageDice: 0 },
      { id: "suppressor", label: "Suppressor", anchor: "muzzle", pricePct: 0.3, weightPct: 0.04, accuracyMod: 0, hideMod: -1, damageDice: 0, note: "Muffled report — harder to locate the shooter." },
      { id: "muzzleBrake", label: "Muzzle Brake", anchor: "muzzle", pricePct: 0.2, weightPct: 0.03, accuracyMod: 0, hideMod: 0, damageDice: 0, note: "Tames recoil; louder for everyone nearby." },
      { id: "compensator", label: "Compensator", anchor: "muzzle", pricePct: 0.22, weightPct: 0.03, accuracyMod: 1, hideMod: 0, damageDice: 0 },
      { id: "bayonet", label: "Bayonet", anchor: "muzzle", pricePct: 0.18, weightPct: 0.06, accuracyMod: 0, hideMod: -1, damageDice: 0, note: "Grants a melee attack profile (Spear) without switching weapons." },
    ],

    // Real-world cartridge data: dimensions in mm, typical muzzle energy in J.
    // Round score & die size are COMPUTED by the engine — never stored here.
    cartridges: [
      // --- Pistol class ---
      { id: "22lr", label: ".22 LR", class: "pistol", bulletDiameterMm: 5.7, caseLengthMm: 15.6, overallLengthMm: 25.4, baseDiameterMm: 5.7, joules: 160, hideMod: 0, note: "Quiet, tiny, everywhere." },
      { id: "9x19", label: "9×19mm Parabellum", class: "pistol", bulletDiameterMm: 9.01, caseLengthMm: 19.15, overallLengthMm: 29.69, baseDiameterMm: 9.93, joules: 550, hideMod: 0 },
      { id: "45acp", label: ".45 ACP", class: "pistol", bulletDiameterMm: 11.5, caseLengthMm: 22.8, overallLengthMm: 32.4, baseDiameterMm: 12.09, joules: 600, hideMod: 0 },
      { id: "40sw", label: ".40 S&W", class: "pistol", bulletDiameterMm: 10.2, caseLengthMm: 21.6, overallLengthMm: 28.8, baseDiameterMm: 10.77, joules: 700, hideMod: 0 },
      { id: "10mm", label: "10mm Auto", class: "pistol", bulletDiameterMm: 10.17, caseLengthMm: 25.2, overallLengthMm: 32.0, baseDiameterMm: 10.85, joules: 950, hideMod: 0 },
      { id: "38special", label: ".38 Special", class: "pistol", bulletDiameterMm: 9.1, caseLengthMm: 29.3, overallLengthMm: 39.4, baseDiameterMm: 9.6, joules: 400, hideMod: 0 },
      { id: "357mag", label: ".357 Magnum", class: "pistol", bulletDiameterMm: 9.1, caseLengthMm: 33.0, overallLengthMm: 40.0, baseDiameterMm: 9.6, joules: 800, hideMod: 0 },
      { id: "44mag", label: ".44 Magnum", class: "pistol", bulletDiameterMm: 10.9, caseLengthMm: 32.6, overallLengthMm: 41.0, baseDiameterMm: 11.6, joules: 1600, hideMod: 0 },
      { id: "500linebaugh", label: ".500 Linebaugh", class: "pistol", bulletDiameterMm: 12.7, caseLengthMm: 35.6, overallLengthMm: 44.5, baseDiameterMm: 13.46, joules: 2700, hideMod: 0, note: "Hand cannon." },
      { id: "57x28", label: "5.7×28mm", class: "pistol", bulletDiameterMm: 5.7, caseLengthMm: 28.9, overallLengthMm: 40.5, baseDiameterMm: 7.95, joules: 700, hideMod: 0, note: "Armor-piercing PDW round." },
      { id: "46x30", label: "4.6×30mm", class: "pistol", bulletDiameterMm: 4.65, caseLengthMm: 30.5, overallLengthMm: 38.5, baseDiameterMm: 8.02, joules: 500, hideMod: 0, note: "Armor-piercing PDW round." },
      // --- Rifle class ---
      { id: "30carbine", label: ".30 Carbine", class: "rifle", bulletDiameterMm: 7.85, caseLengthMm: 32.77, overallLengthMm: 42.67, baseDiameterMm: 9.04, joules: 1300, hideMod: 0 },
      { id: "556x45", label: "5.56×45mm NATO", class: "rifle", bulletDiameterMm: 5.7, caseLengthMm: 44.7, overallLengthMm: 57.4, baseDiameterMm: 9.58, joules: 1800, hideMod: 0 },
      { id: "545x39", label: "5.45×39mm", class: "rifle", bulletDiameterMm: 5.6, caseLengthMm: 39.82, overallLengthMm: 57.0, baseDiameterMm: 10.0, joules: 1400, hideMod: 0 },
      { id: "300blk", label: ".300 Blackout", class: "rifle", bulletDiameterMm: 7.8, caseLengthMm: 34.7, overallLengthMm: 57.4, baseDiameterMm: 9.6, joules: 1850, hideMod: 0, note: "Purpose-built for suppressors." },
      { id: "762x39", label: "7.62×39mm", class: "rifle", bulletDiameterMm: 7.9, caseLengthMm: 38.7, overallLengthMm: 56.0, baseDiameterMm: 11.35, joules: 2100, hideMod: 0, note: "The V5 doc's worked example — scores 0.414 (Band C)." },
      { id: "762x51", label: "7.62×51mm NATO", class: "rifle", bulletDiameterMm: 7.85, caseLengthMm: 51.18, overallLengthMm: 69.85, baseDiameterMm: 11.94, joules: 3400, hideMod: 0 },
      { id: "762x54r", label: "7.62×54mmR", class: "rifle", bulletDiameterMm: 7.92, caseLengthMm: 53.72, overallLengthMm: 77.16, baseDiameterMm: 12.37, joules: 3600, hideMod: 0 },
      { id: "3006", label: ".30-06 Springfield", class: "rifle", bulletDiameterMm: 7.85, caseLengthMm: 63.35, overallLengthMm: 84.84, baseDiameterMm: 11.96, joules: 3900, hideMod: 0 },
      { id: "303brit", label: ".303 British", class: "rifle", bulletDiameterMm: 7.92, caseLengthMm: 56.44, overallLengthMm: 78.11, baseDiameterMm: 11.68, joules: 3100, hideMod: 0 },
      { id: "8mauser", label: "7.92×57mm Mauser", class: "rifle", bulletDiameterMm: 8.08, caseLengthMm: 57.0, overallLengthMm: 82.0, baseDiameterMm: 11.94, joules: 3700, hideMod: 0 },
      { id: "65creedmoor", label: "6.5mm Creedmoor", class: "rifle", bulletDiameterMm: 6.72, caseLengthMm: 48.8, overallLengthMm: 72.4, baseDiameterMm: 11.95, joules: 3300, hideMod: 0 },
      { id: "338lapua", label: ".338 Lapua Magnum", class: "rifle", bulletDiameterMm: 8.6, caseLengthMm: 69.2, overallLengthMm: 93.5, baseDiameterMm: 14.93, joules: 6500, hideMod: 0 },
      { id: "50bmg", label: ".50 BMG", class: "rifle", bulletDiameterMm: 12.95, caseLengthMm: 99.31, overallLengthMm: 138.43, baseDiameterMm: 20.42, joules: 17000, hideMod: 0 },
      { id: "127x108", label: "12.7×108mm", class: "rifle", bulletDiameterMm: 12.98, caseLengthMm: 108.0, overallLengthMm: 147.5, baseDiameterMm: 21.75, joules: 18000, hideMod: 0 },
      { id: "145x114", label: "14.5×114mm", class: "rifle", bulletDiameterMm: 14.88, caseLengthMm: 114.0, overallLengthMm: 155.8, baseDiameterMm: 26.95, joules: 31000, hideMod: 0, note: "The normalization ceiling — anti-tank rifle round, score 1.0." },
      { id: "musketball", label: "Musket Ball (.58)", class: "rifle", bulletDiameterMm: 14.7, caseLengthMm: 0, overallLengthMm: 14.7, baseDiameterMm: 14.7, joules: 2500, hideMod: 0, note: "Loose ball and powder — pair with a muzzle-loading action." },
    ],

    shellTypes: [
      { id: "birdshot", label: "Birdshot", dieSize: 6, slugLike: false, note: "Wide spray; weak against any armor." },
      { id: "buckshot", label: "Buckshot", dieSize: 10, slugLike: false },
      { id: "dragonsbreath", label: "Dragonsbreath", dieSize: 8, slugLike: false, note: "Incendiary — can ignite targets and terrain." },
      { id: "flechette", label: "Flechette", dieSize: 8, slugLike: false, note: "Armor-piercing darts." },
      { id: "beanbag", label: "Beanbag", dieSize: 4, slugLike: true, note: "Less-lethal. Damage is bruising, not ballistic." },
      { id: "slug", label: "Slug", dieSize: 12, slugLike: true, note: "Single projectile — no bystander scatter." },
    ],
    shellGauges: [
      { id: "10ga", label: "10 Gauge", diceMod: 3 },
      { id: "12ga", label: "12 Gauge", diceMod: 2 },
      { id: "16ga", label: "16 Gauge", diceMod: 1 },
      { id: "20ga", label: "20 Gauge", diceMod: 1 },
      { id: "28ga", label: "28 Gauge", diceMod: 1 },
      { id: "410", label: ".410 Bore", diceMod: 0 },
    ],

    bowTypes: [
      { id: "heavyWar", label: "Heavy War Bow", rangeMalus: [-4, 0, 0, -1], maxDrawWeightLbs: 150 },
      { id: "longbow", label: "Longbow", rangeMalus: [-4, -1, 0, -1], maxDrawWeightLbs: 130 },
      { id: "compound", label: "Compound Bow", rangeMalus: [-2, 0, 0, null], maxDrawWeightLbs: 80 },
      { id: "composite", label: "Composite Bow", rangeMalus: [-2, 0, 0, null], maxDrawWeightLbs: 110 },
      { id: "hunting", label: "Hunting Bow", rangeMalus: [-1, 0, -1, null], maxDrawWeightLbs: 60 },
      { id: "lightHunting", label: "Light Hunting Bow", rangeMalus: [-1, 0, -2, null], maxDrawWeightLbs: 45 },
      { id: "plastic", label: "Plastic Bow", rangeMalus: [0, -1, null, null], maxDrawWeightLbs: 30 },
      { id: "improvised", label: "Improvised Bow", rangeMalus: [-1, 0, null, null], maxDrawWeightLbs: 40 },
    ],
    bowMaterials: [
      { id: "nineRulers", label: "Nine Rulers Stuck Together", accuracyMod: -2, durabilityMod: 1, damageMod: -4, pricePct: 0.1, weightPct: 0.3 },
      { id: "wood", label: "Wood", accuracyMod: -1, durabilityMod: 0, damageMod: -2, pricePct: 0.05, weightPct: 0.15 },
      { id: "fiberglass", label: "Fiberglass", accuracyMod: 0, durabilityMod: 0, damageMod: 0, pricePct: 0.1, weightPct: 0 },
      { id: "carbonFiber", label: "Carbon Fiber", accuracyMod: 1, durabilityMod: 1, damageMod: 2, pricePct: 0.35, weightPct: -0.1 },
      { id: "composite", label: "Composite Laminate", accuracyMod: 2, durabilityMod: 2, damageMod: 3, pricePct: 0.5, weightPct: -0.05 },
    ],
    arrows: [
      { id: "bodkin", label: "Bodkin", armorPen: 2, damageMod: 0, note: "Narrow point — punches armor." },
      { id: "broadhead", label: "Broadhead", armorPen: -2, damageMod: 1, note: "Brutal against unarmored targets." },
      { id: "obsidianGlass", label: "Obsidian-Glass", armorPen: -1, damageMod: 1, note: "Wicked edge, brittle on impact." },
      { id: "improvised", label: "Improvised", armorPen: 0, damageMod: -1 },
      { id: "explosive", label: "Explosive Tip", armorPen: 0, damageMod: 2, note: "Chemist-made — loud, rare, spectacular." },
    ],

    crossbowTypes: [
      { id: "pistolXbow", label: "Pistol Crossbow", bandId: "E", damage: { terms: [{ count: 1, size: 8 }], bonus: 0 }, reload: "Half round", operatorReq: "None — any character", rangeMalus: [0, 1, -2, null], basePriceRats: 350, baseWeightKg: 1.6 },
      { id: "lightXbow", label: "Light Crossbow", bandId: "D", damage: { terms: [{ count: 1, size: 10 }], bonus: 0 }, reload: "Half round", operatorReq: "None — any character", rangeMalus: [-2, 0, 0, null], basePriceRats: 500, baseWeightKg: 2.5 },
      { id: "standardXbow", label: "Standard Crossbow", bandId: "C", damage: { terms: [{ count: 1, size: 10 }, { count: 1, size: 8 }], bonus: 0 }, reload: "Full round", operatorReq: "None — any character", rangeMalus: [-4, 0, 0, -1], basePriceRats: 700, baseWeightKg: 3.2 },
      { id: "heavyXbow", label: "Heavy Crossbow", bandId: "B", damage: { terms: [{ count: 2, size: 10 }], bonus: 0 }, reload: "Full round", operatorReq: "None — any character", rangeMalus: [-4, -1, 0, -1], basePriceRats: 950, baseWeightKg: 4.5 },
      { id: "siegeXbow", label: "Siege Crossbow", bandId: "A", damage: { terms: [{ count: 3, size: 10 }], bonus: 0 }, reload: "2 full rounds", operatorReq: "STR 16 or two-person crew", rangeMalus: [-6, -2, 0, 0], basePriceRats: 1600, baseWeightKg: 8.0, note: "Windlass cranequin. Braced/bipod bonuses apply as semi-auto (+2/+4)." },
    ],

    grenadePayloads: [
      { id: "stun", label: "Minimal Blast", rating: 0.3, example: "Stun / Flashbang", basePriceRats: 60, baseWeightKg: 0.25 },
      { id: "small", label: "Small Blast + Frag", rating: 0.5, example: "Jam Jar of Rocks", basePriceRats: 40, baseWeightKg: 0.5 },
      { id: "offensive", label: "Typical Offensive", rating: 0.7, example: "Frag Grenade", basePriceRats: 120, baseWeightKg: 0.45 },
      { id: "strong", label: "Strong / Specialised", rating: 0.85, example: "Thermobaric", basePriceRats: 250, baseWeightKg: 0.6 },
      { id: "demolition", label: "Demolition / Shaped", rating: 1.0, example: "Anti-Vehicle Grenade", basePriceRats: 400, baseWeightKg: 1.0 },
    ],
    grenadeQualities: [
      { id: "crude", label: "Crude / Improvised", rating: 0.3, priceMult: 0.5 },
      { id: "improper", label: "Improper Device", rating: 0.5, priceMult: 0.8 },
      { id: "surplus", label: "Military Surplus / Old-World", rating: 0.8, priceMult: 1.5 },
      { id: "specialized", label: "Specialized Device", rating: 1.0, priceMult: 2.5 },
    ],
    grenadeFocuses: [
      { id: "dispersed", label: "Highly Dispersed (Smoke/Gas)", rating: 0.2, radiusM: 20 },
      { id: "standard", label: "Standard Grenade", rating: 0.5, radiusM: 10 },
      { id: "breaching", label: "Breaching Charge", rating: 0.8, radiusM: 3 },
      { id: "shaped", label: "Shaped / Directional", rating: 1.0, radiusM: 1 },
    ],

    meleePresets: [
      { id: "unarmed", label: "Unarmed", kind: "unarmed", governing: "dex", dieSize: 4, baseWeightKg: 0, basePriceRats: 0, note: "To hit: DEX. To wound: 1d4 + STR." },
      { id: "knife", label: "Knife", kind: "weapon", governing: "dex", dieSize: 4, baseWeightKg: 0.3, basePriceRats: 40 },
      { id: "pushDagger", label: "Push Dagger", kind: "weapon", governing: "dex", dieSize: 4, baseWeightKg: 0.25, basePriceRats: 50 },
      { id: "machete", label: "Machete", kind: "weapon", governing: "dex", dieSize: 6, baseWeightKg: 0.8, basePriceRats: 90 },
      { id: "rapier", label: "Rapier", kind: "weapon", governing: "dex", dieSize: 8, baseWeightKg: 1.1, basePriceRats: 220 },
      { id: "club", label: "Club", kind: "weapon", governing: "str", dieSize: 6, baseWeightKg: 1.2, basePriceRats: 15 },
      { id: "roadSign", label: "Road Sign", kind: "weapon", governing: "str", dieSize: 8, baseWeightKg: 3.0, basePriceRats: 25, note: "STOP. In every sense." },
      { id: "spear", label: "Spear", kind: "weapon", governing: "str", dieSize: 8, baseWeightKg: 1.8, basePriceRats: 60 },
      { id: "fireAxe", label: "Fire Axe", kind: "weapon", governing: "str", dieSize: 10, baseWeightKg: 2.5, basePriceRats: 110 },
      { id: "sledgehammer", label: "Sledgehammer", kind: "weapon", governing: "str", dieSize: 12, baseWeightKg: 4.5, basePriceRats: 130 },
    ],
  },
};
