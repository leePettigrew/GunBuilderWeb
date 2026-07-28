# Changes from the WPF GunBuilder

An honest changelog against the original desktop app. The web app implements
Weapon Mechanics **V5**; the WPF app predated it and hardcoded a lot of what
is now computed or editable. All values quoted below are the defaults in
`shared/default-rules.ts` — every one of them is a Rules Lab knob.

## Damage model

### Round scores are computed, not hardcoded

The WPF app stored a fixed dice count per cartridge. The web app computes the
V5 round score from real cartridge dimensions, normalized against the biggest
round in the catalog (14.5×114mm — score 1.0):

- Normalization maxima: bullet diameter **14.88 mm**, case length **114 mm**,
  overall length **155.8 mm**, base diameter **26.95 mm**.
- Weights: **0.3 / 0.275 / 0.275 / 0.15** respectively.
- Each contribution is rounded to 3 decimals before summing, matching the
  doc's 7.62×39 worked example: 0.159 + 0.093 + 0.099 + 0.063 = **0.414**.
- Score bands → dice: below 0.1 → 0, A (0.1–0.1999) → 0,
  B (0.2–0.3999) → 1, C (0.4–0.5999) → 2, D (0.6–0.8499) → 3,
  E (0.85–0.9999) → 4, F (1+) → 5.

Adding a cartridge now means entering its dimensions and energy; its band is
derived.

### The joules step is new (revised band table)

The WPF app had no muzzle-energy step. V5 sets the die size from joules, and
the default here is the revised 8-band table (not the V5 PDF's original):

| Band | Joules | Die |
| --- | --- | --- |
| 1 | 1–450 | d4 |
| 2 | 451–700 | d6 |
| 3 | 701–1750 | d8 |
| 4 | 1751–2750 | d10 |
| 5 | 2751–6000 | d12 |
| 6 | 6001–12000 | d12 +2 flat |
| 7 | 12001–22000 | d12 +4 flat |
| 8 | 22001–35000 | d12 +6 flat |

Energies above band 8 clamp to band 8 (with a note on the stat card). The old
60 kJ+ d20 behavior is gone by default; add a ninth band in the Rules Lab if
you want it back.

### Firing-mechanism dice are new

Manual loaders now add a damage die per the V5 table: flintlock, matchlock,
pump, lever, bolt and break actions are **+1**; all self-loading actions
(single/double action, semi, burst, auto and combinations) are **0**. The WPF
app gave actions no damage role at all.

### The frame base die is dropped

The WPF app added a constant **1** die per platform. Every frame's `baseDice`
is now **0** — V5 sources all dice from the round, barrel and mechanism. The
per-frame knob still exists for house rules.

### Belt feed costs a die

Belt-fed magazines are **−1** die (sustained-fire tradeoff). All other feed
systems are 0. New in V5; the WPF app treated feeds as cosmetic.

### UBGL and bayonet no longer add damage dice

The WPF app gave the underbarrel grenade launcher and bayonet bonus damage
dice on the host weapon, which made no sense. Both are now `damageDice: 0`
with explanatory notes instead — the UBGL points you at the Grenade
fabricator for its projectile, the bayonet grants a Spear melee profile.

### Rifling is a knob, defaulting to 0

The WPF app hardcoded **+2** dice for a rifled barrel. V5 awards no rifling
dice, so `rifledBonusDice` defaults to **0** — set it back to 2 in the Rules
Lab (Firearm model) if you preferred the old behavior. Barrel length still
pays out: 0–200 mm +0, 201–550 mm +1, 551–700 mm +2, 701 mm+ +3, and the
final pool is divided by `diceHalveDivisor` (**2**) and rounded up.

## Economy

Currency changed from **Corium** to **rats** (Ration Tablets), anchored at
**1 L of clean water = 50 rats**. Prices were rescaled in the conversion,
roughly **×8** against the WPF numbers (e.g. a pistol frame is now 400 rats,
an LMG 2000). A global `priceScale` multiplier (default **1**) scales the
whole economy from the Rules Lab.

## Carried over

- The cartridge list (27 rounds, .22 LR through 14.5×114mm plus musket ball),
  shell types (6) and gauges (10ga +3 dice … .410 +0) came across from the
  WPF app, cleaned up and re-keyed to stable ids.
- Frames, actions, magazines, barrel types, stocks and attachments survive
  with their price/weight percentage model intact.
- Bow types, materials, arrows, crossbow tiers, grenade
  payload/quality/focus components and the melee presets all carried over.

## WPF bugs fixed

- **Ammo string mismatches** — the WPF app matched cartridges by display
  string, so renamed labels silently broke lookups. Everything is id-keyed
  now, and a missing id degrades to a stat-card warning, not a wrong number.
- **Dead code paths** — unreachable branches in the WPF damage calculation
  (leftovers from earlier mechanics versions) were dropped, not ported.
- **Bow draw length no-op** — the WPF UI accepted a draw length that the
  calculation ignored. `drawLengthIn` now carries **0.3** of the bow score
  (draw weight 0.5, efficiency 0.2, normalized against 32 in / 150 lbs / 1.0).
- **Bow materials displayed but unapplied** — the WPF app showed a material
  damage modifier and never added it. `BowMaterialDef.damageMod` is now a
  real flat bonus (e.g. carbon fiber +2, wood −2), applied alongside the
  arrow's modifier and traced on the stat card.

## The pistol program (traced schematics + realism constraints)

- Pistol-class platforms are now three frames: **Pistol** (M1911 pattern),
  **Revolver** (Colt M1917 pattern) and **Machine Pistol** (select-fire
  conversion of the M1911 pattern). The M1911 and M1917 profiles are traced
  from public-domain US Army manuals (FM 23-35, 1940 and 1946 editions) and
  drawn at ~2.8:1 / 2.6:1 scale with real grip rake, triggers, controls and
  in-grip magazine X-rays.
- Barrel length physically reshapes pistols: the slide stretches from
  commander (~108mm) through government (127mm) to longslide (178mm+), and
  revolver barrels run snub to hunting lengths.
- **Part compatibility** is now data (`FrameDef.actionIds/magazineIds/
  attachmentIds`, editable in the Rules Lab): pistols take red dots, lasers,
  lights, suppressors, comps, brakes, extended mags and snail drums — and the
  engine warns on physically absurd combos (belt-fed pistols, suppressed
  revolvers, pistol bipods). The builder filters its pickers accordingly.
