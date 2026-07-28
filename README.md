# Ashen Armoury

**The weapon fabricator for the Ashen Skies TTRPG.** Assemble a firearm, bow,
crossbow, grenade or melee weapon from real parts, watch a parametric blueprint
redraw itself as you build, and get table-ready stats computed live by the
Ashen Skies Weapon Mechanics V5 engine — an engine whose every constant you can
rewrite in the Rules Lab and see every saved weapon re-stat instantly.

> Screenshots
>
> _Placeholder — blueprint workbench, armory grid, and Rules Lab captures go
> here once the UI settles._

## Features

| Feature | What it does |
| --- | --- |
| **Blueprint builder** | Code-drawn SVG schematics that visibly change with the build: barrel length is measured with dimension lines, stocks/magazines/attachments swap shapes, grenades get a blast-radius falloff diagram. |
| **V5 damage engine** | Pure functions of `(build, ruleset)` implementing Weapon Mechanics V5 — round score, joules band, barrel band, firing mechanism, halve-and-round-up. Every result ships with a full "show the working" trace. |
| **Rules Lab** | Every constant in the system — normalization maxima, band tables, fire modes, the entire parts catalog, the economy — is editable at runtime. No save button; the armory re-stats as you type. |
| **Armory** | Local-first weapon storage. Weapons persist as inputs only, so a rules change retroactively re-stats your whole arsenal. |
| **Share links** | A whole build encoded into the URL fragment (`/share#<payload>`). No server, no database, nothing in access logs. |
| **JSON export** | Versioned interchange formats: `ashen-skies/weapon@1` and `ashen-skies/ruleset@1`. |

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Or with Docker:

```bash
docker compose up --build    # http://localhost:3000
```

Verification:

```bash
npm run typecheck  # tsc --noEmit (strict, noUncheckedIndexedAccess)
npm test           # vitest run
npm run build      # next build (standalone output)
```

## How the damage model works

Firearm damage in V5 is computed, not looked up. The pipeline:

1. **Round score** — each cartridge dimension is normalized against the
   catalog's biggest round and weighted:
   `score = Σ (dimension / max) × weight`. The score picks a band, the band
   sets the **number of damage dice**.
2. **Muzzle energy** — the cartridge's joules pick a band that sets the
   **die size** (and a flat bonus at very high energies).
3. **Bonus dice** — barrel length band, firing mechanism (+1 for manual
   loaders), feed system (belt-fed −1), plus any rules-knob extras.
4. **Halve** — the total dice pool is divided by 2 and rounded up.

Worked example, an SKS-pattern carbine in 7.62×39mm with a 521 mm barrel and a
semi-automatic action:

| Step | Result |
| --- | --- |
| Round score | 0.159 + 0.093 + 0.099 + 0.063 = **0.414** → band C → **2 dice** |
| Energy | 2100 J → **d10** |
| Barrel length | 521 mm → **+1 die** |
| Firing mechanism | Semi-automatic → **+0** |
| Final | ceil(3 / 2) = **2 → 2d10** |

Bows score draw weight/length/efficiency against their own band table,
crossbows use pre-computed bands, grenades score payload × quality × focus and
produce a quarter-radius falloff table, and melee weapons are die presets. The
engine annotates every step, and the stat card renders the whole trace.

## Tuning the rules

Open **Rules Lab** (`/rules`). Everything the engine reads is there: firearm
normalization maxima and weights, the round-score / joules / barrel-length
band tables, range bands and the per-platform malus matrix, fire modes, all
seventeen parts catalogs, the bow/grenade/melee models, and the economy
(currency, water-price anchor, global price scale). Changes apply on input and
are persisted locally; **Reset to V5 defaults** brings back the stock ruleset.
Rulesets export and import as `ashen-skies/ruleset@1`, so a table can share one
preset file and everyone computes identical stats.

## Export formats

Weapons export as `ashen-skies/weapon@1` — inputs plus a reference snapshot of
the stats under the exporter's ruleset:

```json
{
  "schema": "ashen-skies/weapon@1",
  "exportedAt": "2026-07-27T12:00:00.000Z",
  "rulesetName": "Ashen Skies V5 (default)",
  "build": {
    "family": "firearm",
    "name": "Scavenged SKS",
    "frameId": "carbine",
    "actionId": "semi",
    "magazineId": "clip",
    "cartridgeId": "762x39",
    "barrelLengthMm": 521,
    "barrelTypeId": "normal",
    "rifled": true,
    "stockId": "standard",
    "attachmentIds": []
  },
  "computed": { "damageLabel": "2d10", "priceRats": 1380, "weightKg": 4.03 }
}
```

Rulesets export as `ashen-skies/ruleset@1` (the full `Ruleset` object in an
envelope). Both formats are versioned via the `schema` string; parsers reject
anything they do not recognize.

## Architecture

Two rules govern the whole codebase:

1. **Builds store inputs only.** A saved weapon is a `Build` — part ids and
   numbers. Stats are recomputed on every render from the active ruleset,
   which is what makes the Rules Lab's live re-statting free.
2. **Every tunable number lives in the `Ruleset`, never in code.** The engine
   (`shared/engine.ts`) is pure functions; `shared/default-rules.ts` is data.

The UI never touches `localStorage` directly — persistence sits behind a
`PersistenceAdapter` seam with browser and in-memory implementations. See
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the module map and extension
recipes, and [docs/CHANGES-FROM-WPF.md](docs/CHANGES-FROM-WPF.md) for the
honest changelog against the original desktop GunBuilder.

```
GunBuilderWeb/
├─ shared/                 # framework-free domain layer
│  ├─ types.ts             # every domain type
│  ├─ engine.ts            # pure (build, ruleset) → WeaponStats
│  ├─ default-rules.ts     # V5 constants + parts catalog, as data
│  ├─ factories.ts         # sensible default builds per family
│  ├─ share-codec.ts       # URL-fragment share payloads
│  └─ export.ts            # versioned JSON envelopes
├─ src/
│  ├─ app/                 # App Router: /, /builder/**, /armory/**, /rules, /share
│  ├─ components/
│  │  ├─ blueprint/        # parametric SVG schematics per family
│  │  ├─ builder/          # controls, stat card, workbench
│  │  ├─ armory/           # weapon cards
│  │  ├─ rules/            # Rules Lab editors
│  │  ├─ shell/            # app chrome, nav, theme toggle
│  │  └─ ui/               # primitives (Panel, Button, Field, Modal…)
│  └─ lib/                 # cn, download helpers, data layer (persistence + context)
├─ docs/                   # architecture + WPF changelog
├─ Dockerfile              # node:24-alpine multi-stage, standalone output
└─ docker-compose.yml
```

## Standalone by design

Ashen Armoury deliberately has no coupling to any other application. A future
Ashen Skies companion app will consume the `ashen-skies/weapon@1` and
`ashen-skies/ruleset@1` export formats — those versioned JSON envelopes are the
entire interface. Nothing here imports from, links to, or assumes the
existence of that app.

## License

Personal project — no license granted for redistribution. Ashen Skies and its
weapon mechanics belong to their author.

## The pistol bench

Pistol-class weapons get the deepest treatment in the fabricator. Three
platforms share one interchangeable parts pool:

| Platform | Source profile | What swaps |
|---|---|---|
| **Pistol** | M1911 traced from FM 23-35 (1940, public domain) | Barrel length reshapes the slide (commander → government → longslide), red dot, laser, light, suppressor, comp, brake, extended mag, snail drum |
| **Revolver** | Colt M1917 traced from FM 23-35 (1946) | Snub-to-hunting barrels, top-strap optics, laser, light, comp, brake — never a suppressor (the cylinder gap vents gas) |
| **Machine Pistol** | Select-fire M1911 conversion | Everything the pistol takes, plus a holster-stock socket, foregrip, and burst/full trigger groups |

Compatibility is data, not code: each frame lists the actions, feeds and
attachments it physically accepts (editable in the Rules Lab). The builder
filters its pickers to legal parts and the engine warns loudly if a saved or
imported build breaks the laws of gunsmithing — no belt-fed pistols in this
wasteland.

## The 3D Workshop (experimental)

`/workshop` is a Tarkov-style bench: real sourced models (CC/PD, credited
in-app) rendered in a unified armory-clay finish, with glowing anchor
points measured from each model's geometry. Spawn pieces from the inventory
— suppressors, brakes, a chaining rail, optics, magazines, grips, lasers,
lights, a bayonet — drag them onto anchors to mount, drag them off to
strip, rotate/stretch them with gizmos, blow the weapon apart with the
exploded slider or lay every part flat on the bench. Loadouts save locally,
and a CDP-driven pointer test (`scripts/cdp-workshop-test.py`) regression-
tests the drag-snap loop headlessly.
