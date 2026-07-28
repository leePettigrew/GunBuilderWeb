# Architecture

## The two load-bearing rules

**1. Builds store inputs, stats are computed live.**
A persisted weapon (`Weapon` in `shared/types.ts`) contains only a `Build` —
part ids, a barrel length, a draw weight. Nothing derived is ever written to
storage. Every stat you see (`WeaponStats`) is recomputed at render time by
`computeStats(build, rules)` from `shared/engine.ts`. Consequences:

- Editing the damage model in the Rules Lab instantly re-stats every weapon in
  the armory — there is no migration, no cache invalidation, no stale data.
- Share links and JSON exports carry builds, not stats. The recipient's active
  ruleset decides what the weapon does at their table (exports include a small
  `computed` snapshot for reference only).
- A build referencing an id that no longer exists in the catalog degrades to a
  warning in `WeaponStats.warnings`, never a crash.

**2. Every tunable number lives in the `Ruleset`.**
`shared/engine.ts` contains no constants — it is pure functions of
`(build, ruleset)`. `shared/default-rules.ts` is the V5 system encoded as data
(`DEFAULT_RULESET`). The Rules Lab edits a runtime copy of that object; the
engine never reads the defaults directly.

## The data seam

The UI never touches `localStorage`. Persistence sits behind an interface in
`src/lib/data/persistence.ts`:

- `PersistenceAdapter` — `load` / `save` / `remove`.
- `LocalStoragePersistence` — browser implementation, key prefix
  `ashen-armoury:v1:`, quota failures fail soft (the in-memory copy stays
  authoritative).
- `MemoryPersistence` — SSR and tests.
- `createBrowserPersistence()` — picks the right one at runtime.

`src/lib/data/context.tsx` owns all client state: `DataProvider` loads once on
mount, and `useWeapons` / `useWeapon` / `useRuleset` expose it. Swapping
localStorage for a sync backend later means writing one adapter, not touching
the UI.

## Module map

| Area | Path | Responsibility |
| --- | --- | --- |
| Domain types | `shared/types.ts` | Every build, ruleset, catalog and stats type. |
| Engine | `shared/engine.ts` | Pure V5 computation + calculation traces. |
| Defaults | `shared/default-rules.ts` | `DEFAULT_RULESET` — V5 constants + parts catalog. |
| Factories | `shared/factories.ts` | Valid starter builds per family. |
| Codecs | `shared/share-codec.ts`, `shared/export.ts` | URL-fragment share payloads; versioned JSON envelopes. |
| Data layer | `src/lib/data/` | Persistence seam, providers, hooks, theme. |
| UI primitives | `src/components/ui/` | Panel, Button, Field, Modal, ConfirmDialog, icons… |
| Shell | `src/components/shell/`, `src/app/layout.tsx` | Nav, app chrome, theme toggle, dashboard. |
| Blueprints | `src/components/blueprint/` | Parametric SVG schematics, one per family, dispatched by `WeaponBlueprint`. |
| Builder | `src/components/builder/`, `src/app/builder/**` | Per-family controls, stat card, workbench, save/share/export actions. |
| Armory + share | `src/app/armory/**`, `src/app/share/` | Card grid, detail/edit view, share-link preview. |
| Rules Lab | `src/components/rules/`, `src/app/rules/` | Live ruleset editing, band tables, catalog tables, presets. |
| Ops | `Dockerfile`, `docker-compose.yml`, `.github/workflows/ci.yml` | Standalone Docker image, CI (typecheck, test, build). |

The `shared/` layer is framework-free — no React, no Next — which is why the
engine tests run in plain Node and why the export formats can be consumed by
any future app. Path aliases: `@/*` → `src/*`, `@shared/*` → `shared/*`.

## Extension recipes

### Add a cartridge (or any catalog part)

Two options:

- **Runtime** — Rules Lab → Catalogs → Cartridges → add row. Enter the four
  real-world dimensions (mm) and typical muzzle energy (J). The round score,
  band and die size are computed — never stored.
- **Default** — append a `CartridgeDef` to `catalog.cartridges` in
  `shared/default-rules.ts`. Same fields; every user of the default ruleset
  gets it.

Other part lists (frames, actions, stocks, attachments, shells, bows, arrows,
crossbows, grenade components, melee presets) work identically — they are all
plain arrays in `Ruleset.catalog`, all editable in the Rules Lab.

### Add a new kind of part

1. Define the `*Def` interface in `shared/types.ts` and add its list to
   `Catalog`.
2. Seed defaults in `shared/default-rules.ts`.
3. Add the id field to the relevant `Build` interface and consume the part in
   the family's `compute*` function in `shared/engine.ts` (push a `CalcStep`
   so the trace stays honest).
4. Add a picker to the family's controls in `src/components/builder/` and a
   column config to the Rules Lab `CatalogTable`.
5. Draw it in the family's blueprint component if it has a visual.

### Add a weapon family

1. `shared/types.ts`: extend the `WeaponFamily` union, add a `Build`
   interface, add it to `AnyBuild` and `WEAPON_FAMILIES`, add a rules group to
   `Ruleset` if it needs one.
2. `shared/default-rules.ts`: seed its catalog/rules.
3. `shared/engine.ts`: write `computeX(build, rules): WeaponStats` and add the
   case to the `computeStats` dispatcher.
4. `shared/factories.ts`: `newXBuild(rules)` + wire into `newBuildForFamily`.
5. `src/components/builder/`: `XControls` with the standard
   `{ build, rules, onChange }` shape.
6. `src/components/blueprint/`: `XBlueprint` + a case in the dispatcher.
7. `src/app/builder/x/page.tsx`: `<BuilderWorkbench family="x" />`.

The share codec, exports, armory and Rules Lab need no changes — they operate
on `AnyBuild` and `Ruleset` generically.

## The 3D Workshop

`/workshop` renders sourced GLB weapons with a Tarkov-style customization
loop. Key modules: `src/lib/workshop/manifests.ts` (weapon + piece catalogs)
and `src/components/workshop/WeaponViewer.tsx` (scene, sockets, drag/snap).

### Onboarding a new weapon GLB

1. Drop the file in `public/models/` (CC-BY / PD only; note the credit).
2. Add a `WeaponModelDef`: `url`, `credit`, `preRotation` (rotate so the
   muzzle faces +X — try `[0,0,0]`, then `[0,Math.PI,0]`; verify with a
   screenshot), and `parts` regexes mapping mesh/ancestor node names to
   `frame|slide|barrel|mag|trigger|misc`.
3. Everything else is automatic: showcase props scattered around the gun
   (spare mags, bullets) are removed by the frame-cluster filter, the model
   is normalized to length 1 with muzzle at +X, and the anchor sockets
   (muzzle / railTop / under / magwell) are MEASURED from the part bounding
   boxes — no hand-placed coordinates.
4. Verify interactions with `python scripts/cdp-workshop-test.py` (drives a
   real pointer through spawn → drag → snap → detach against
   `/workshop?wsdebug`, which exposes `window.__wsState` + `__wsScreens`).

### Pieces

A `PieceDef` is a GLB or a procedural build (lathe profiles, slotted rails)
with a socket type; `provides` lets a mounted piece offer new sockets (the
rail segment adds a raised `railTop`, so optics chain onto it). Loadouts
persist to `localStorage` under `ashen-armoury:v1:workshop`.
