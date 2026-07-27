# Module Contracts

This document is the integration contract between modules. Every exported
symbol named here MUST exist with exactly this shape — other modules are being
written against it concurrently. Add more exports freely; never rename or
reshape these.

## Project ground rules

- Next.js 15 App Router, React 19, TypeScript **strict** (`noUncheckedIndexedAccess` is on).
- Every `page.tsx` starts with `"use client"` and default-exports the page.
  Everything else uses **named exports**, `PascalCase.tsx` for components,
  `kebab-case.ts` for lib modules.
- Path aliases: `@/*` → `src/*`, `@shared/*` → `shared/*`.
- Styling: Tailwind with the Ashfall Gunmetal tokens only — **never** raw hex
  colors in components. Semantic classes available:
  - Surfaces: `bg-steel-950/900/850/800/700/600`, borders `border-rivet`
  - Text: `text-bone`, `text-bone-soft`, `text-bone-faint`
  - Accents: `ember` (+ `ember-deep`), `hazard`, `blood`, `olive`
  - Canvas: `text-blueprint` (line art), `grid` (grid lines)
  - Fonts: `font-display` (stencil, headings), `font-body`, `font-mono`
  - Component classes from globals.css: `surface-panel`, `surface-raised`,
    `surface-inset`, `heading-stencil`, `stamp-ember`, `stamp-hazard`,
    `blueprint-grid`, `numerals`, `hazard-stripe`
  - Motion: `animate-fade-in`, `animate-pulse-ember`; shadows `shadow-card`,
    `shadow-raised`, `shadow-ember`, `shadow-inset`; radius `rounded-card`;
    tracking `tracking-title`, `tracking-stamp`.
- Variant styling is a `Record<Variant, string>` lookup map, never string
  concatenation. Combine classes with `cn()` from `@/lib/cn`.
- Light theme works by token remap (`.light` on `<html>`); components never
  use `dark:` variants.
- Destructive actions go through `ConfirmDialog`.
- The doc references below ("V5") mean the Ashen Skies Weapon Mechanics system
  as encoded in `shared/default-rules.ts` — that file is the truth.

## Already written (import freely, do not modify)

### `@shared/types` — all domain types

Key ones: `Weapon`, `AnyBuild`, `FirearmBuild`, `BowBuild`, `CrossbowBuild`,
`GrenadeBuild`, `MeleeBuild`, `WeaponFamily`, `WEAPON_FAMILIES`, `Ruleset`,
`Catalog`, `WeaponStats`, `FireModeStats`, `RangeCell`, `CalcStep`, `DiceExpr`,
`WeaponExport`, `RulesetExport`, and per-part defs (`FrameDef`, `ActionDef`,
`MagazineDef`, `BarrelTypeDef`, `StockDef`, `AttachmentDef`, `CartridgeDef`,
`ShellTypeDef`, `ShellGaugeDef`, `BowTypeDef`, `BowMaterialDef`, `ArrowDef`,
`CrossbowTypeDef`, `GrenadePayloadDef`, `GrenadeQualityDef`,
`GrenadeFocusDef`, `MeleePresetDef`).

### `@shared/engine`

- `computeStats(build: AnyBuild, rules: Ruleset): WeaponStats` — the one call
  sites should use. Also exported: `computeFirearm/Bow/Crossbow/Grenade/Melee`,
  `computeRoundScore`, `formatDice(expr): string`, `averageDamage(expr): number`,
  `findById<T extends {id: string}>(list, id): T | undefined`.
- `WeaponStats` includes `damageLabel`, `priceRats`, `weightKg`, `hideMod`,
  `accuracyMod`, `rangeRow: RangeCell[]`, `fireModes`, `strengthReq?`,
  `reloadNote?`, `falloff?`, `notes: string[]`, `trace: CalcStep[]`,
  `warnings: string[]`.

### `@shared/default-rules` — `DEFAULT_RULESET: Ruleset`
### `@shared/factories` — `newFirearmBuild(rules, frameId?)`, `newBowBuild`, `newCrossbowBuild`, `newGrenadeBuild`, `newMeleeBuild`, `newBuildForFamily(family, rules)`
### `@shared/share-codec` — `encodeShare(build): string`, `decodeShare(payload): AnyBuild | null`
### `@shared/export` — `exportWeapon(build, rules): WeaponExport`, `exportRuleset(rules): RulesetExport`, `parseWeaponExport(json): AnyBuild | null`, `parseRulesetExport(json): Ruleset | null`
### `@shared/ids` — `newId(prefix?)`, `nowISO()`, type `ID`
### `@/lib/cn` — `cn(...classes)`
### `@/lib/download` — `downloadJson(filename, data)`, `copyText(text): Promise<boolean>`, `slugify(name)`

---

## Module A — data layer (`src/lib/data/`)

Local-first persistence behind a provider seam (same philosophy as Dragon's
Ledger: UI never touches localStorage).

- `persistence.ts`:
  - `interface PersistenceAdapter { load<T>(key: string): T | null; save(key: string, value: unknown): void; remove(key: string): void }`
  - `class LocalStoragePersistence implements PersistenceAdapter` — key prefix
    `ashen-armoury:v1:`, quota errors fail soft (in-memory copy stays authoritative).
  - `class MemoryPersistence implements PersistenceAdapter` (SSR/tests).
  - `createBrowserPersistence(): PersistenceAdapter` — LocalStorage in the
    browser, Memory otherwise.
- `context.tsx` (`"use client"`):
  - `DataProvider({ children })` — top-level provider. Loads weapons + active
    ruleset from persistence once on mount; all hook state lives here.
  - `useWeapons(): { weapons: Weapon[]; ready: boolean; create(build: AnyBuild): Weapon; update(id: ID, build: AnyBuild): void; remove(id: ID): void }`
    — `create` assigns `newId("wpn")` + timestamps and persists.
  - `useWeapon(id: string): { weapon: Weapon | null; ready: boolean }`
  - `useRuleset(): { ruleset: Ruleset; setRuleset(next: Ruleset): void; resetRuleset(): void; isCustomized: boolean }`
    — defaults to `DEFAULT_RULESET`; persisted under its own key;
    `isCustomized` = deep-differs from default.
- `theme.tsx` (`"use client"`):
  - `ThemeProvider({ children })`, `useTheme(): { theme: "dark" | "light"; toggle(): void }`
    — stamps/removes `light` class on `document.documentElement`; persists to
    localStorage key `ashen-armoury:theme`.
  - `THEME_INIT_SCRIPT: string` — inline anti-FOUC script for layout `<head>`
    (reads the key before paint, adds `light` class if needed).

## Module B — UI primitives (`src/components/ui/`)

- `Panel.tsx`: `Panel({ title?, eyebrow?, action?: ReactNode, tone?: "panel" | "raised" | "inset", className?, bodyClassName?, children })`
- `Button.tsx`: `Button` (forwardRef) with `variant?: "primary" | "secondary" | "ghost" | "danger"` (default secondary), `size?: "sm" | "md" | "lg"`; also export `buttonClasses(variant?, size?): string` for `<Link>`s. Primary = ember fill; danger = blood.
- `Badge.tsx`: `Badge({ tone?: "neutral" | "ember" | "hazard" | "blood" | "olive", children, className? })`
- `Field.tsx`: `Field({ label, hint?, htmlFor?, children, className? })` plus
  `TextField`, `NumberField` (`value: number; onChange(n: number)`; never NaN),
  `SelectField` (`options: { value: string; label: string }[]`),
  `TextArea`, `Toggle({ label, checked, onChange })` — all labelled, all controlled.
- `Modal.tsx`: `Modal({ open, onClose, title, children, footer? })` — ESC + backdrop close.
- `ConfirmDialog.tsx`: `ConfirmDialog({ open, title, body?, confirmLabel?, onConfirm, onCancel })` — danger-styled confirm.
- `EmptyState.tsx`: `EmptyState({ icon?, title, body?, action? })`
- `PageHeader.tsx`: `PageHeader({ eyebrow?, title, description?, actions? })` — stencil title.
- `StatChip.tsx`: `StatChip({ label, value, tone? })` — small mono readout used on cards.
- `icons.tsx`: inline SVG components typed `ComponentType<SVGProps<SVGSVGElement>>`:
  `IconRifle, IconPistol, IconBow, IconCrossbow, IconGrenade, IconBlade,
  IconArmory, IconRules, IconShare, IconExport, IconTrash, IconEdit, IconCopy,
  IconPlus, IconSun, IconMoon, IconWrench, IconChevronDown, IconWarning` —
  1.5px stroke, `currentColor`.

## Module C — shell + layout (`src/components/shell/` + `src/app/layout.tsx` + `src/app/page.tsx`)

- `nav-items.ts`: `interface NavItem { href: string; label: string; icon: ComponentType<SVGProps<SVGSVGElement>>; blurb: string }`;
  `NAV_ITEMS: NavItem[]` → `/builder` (Fabricator), `/armory` (Armory), `/rules` (Rules Lab).
- `AppShell.tsx` (`"use client"`): sidebar on desktop (logo wordmark "ASHEN
  ARMOURY" + stamp "WEAPON FABRICATOR", nav with active states, ThemeToggle at
  bottom), top bar + slide-over on mobile. Content area `max-w-7xl mx-auto px-4 py-8`.
- `ThemeToggle.tsx`: sun/moon icon button using `useTheme()`.
- `src/app/layout.tsx`: metadata (title "Ashen Armoury", description), Google
  Fonts `<link>` for **Allerta Stencil** (display), **Barlow** 400/500/600/700
  (body), **IBM Plex Mono** 400/500 (mono) with
  `<style>` fallback vars; `<script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}>`
  in head; body wraps `ThemeProvider > DataProvider > AppShell > children`.
  Set CSS vars `--font-display`, `--font-body`, `--font-mono` on `:root` via a
  `<style>` tag here (the families above with system fallbacks).
- `src/app/page.tsx`: dashboard — hero panel (wordmark, one-paragraph pitch,
  CTA buttons to Fabricator + Armory), tile grid from `NAV_ITEMS` + a family
  quick-start row (5 families → `/builder/<family>` links with icons), and a
  "current ruleset" strip showing `useRuleset().ruleset.name` + `isCustomized`
  badge linking to `/rules`. Also `src/app/icon.svg` (crosshair/gear mark,
  ember on steel) and `not-found.tsx` (stencil 404, "SECTOR NOT ON THE MAP").

## Module D — blueprint canvases (`src/components/blueprint/`)

The centerpiece. Code-drawn parametric SVG, blueprint-schematic style.

- `index.tsx`: `WeaponBlueprint({ build, rules, className? }: { build: AnyBuild; rules: Ruleset; className?: string })` — dispatcher on `build.family`.
- `FirearmBlueprint.tsx`, `BowBlueprint.tsx`, `CrossbowBlueprint.tsx`,
  `GrenadeBlueprint.tsx`, `MeleeBlueprint.tsx` — same prop shape with their
  narrow build type.
- Shared helpers in `common.tsx`: `BlueprintFrame` (the `<svg>` wrapper:
  `viewBox="0 0 900 420"`, `blueprint-grid` background, corner registration
  marks, "ASHEN SKIES — PATTERN SCHEMATIC" eyebrow, `TitleBlock` bottom-right
  with name / class line / damage / weight / price pulled from
  `computeStats`), `DimensionLine` (measurement arrows + mono label),
  `CalloutLabel` (leader line + small caps label).
- Style: line art only — `fill="none"`, `stroke` in `rgb(var(--c-blueprint))`
  at 1.5–2px for the weapon, `rgb(var(--c-ember))` for the currently relevant
  accents (selected attachment highlights), text in mono using token colors.
  Hatching (`<pattern>`) allowed for solid parts (grips, stocks).
- **Parametric requirements (firearm)** — the drawing must visibly change with
  the build: muzzle points right; receiver/grip silhouette per frame id
  (pistol, smg, carbine, assaultRifle, battleRifle, shotgun, dmr, sniper, lmg);
  barrel segment length scales with `barrelLengthMm` (~0.55 SVG units/mm,
  clamped sanely) and gets a `DimensionLine` labelled `<n> mm`; stock swaps
  shape per stock id (pistolGrip = none); magazine shape per magazine id (box,
  drum circle, belt dangle, tube under barrel, cylinder, en-bloc/clip top feed,
  integrated drum, muzzle/breach = none); attachments render at their
  `AttachmentDef.anchor`: muzzle devices extend the barrel tip (suppressor
  cylinder / brake ports / compensator slots / bayonet blade), rail = scope on
  top, underbarrel = ubgl tube / bipod legs / foregrip stub, side = small box
  with leader label; barrel type tweaks the barrel drawing (heavy = thicker,
  fluted = long flute lines, choked = tapered muzzle, light = thinner);
  `rifled` draws faint twist lines in the barrel. Unknown ids → fall back to a
  neutral shape, never crash.
- **Bow**: riser + limbs + string, limb span scales with `drawLengthIn`, limb
  thickness with `drawWeightLbs`, silhouette per type (longbow D-curve,
  compound cams + cables, improvised lashings…), nocked arrow drawn from the
  selected `ArrowDef` (head shape per type), draw-weight `DimensionLine`.
- **Crossbow**: stock + prod + string + stirrup, size per type (pistol tiny →
  siege with windlass crank + second grip).
- **Grenade**: casing per focus/payload combo (frag sphere with crosshatch,
  cylinder, cone shaped-charge, smoke canister), fuse/pin details, plus a
  blast-radius diagram: concentric quarter rings labelled from
  `computeStats(...).falloff` (radius + damage fraction each ring).
- **Melee**: one silhouette per preset id (all 10 presets in the default
  catalog get a real shape: knife, push dagger, machete, rapier, club, road
  sign, spear, fire axe, sledgehammer, unarmed = fist) + overall-length
  `DimensionLine`; unknown ids → generic implement, never crash.

## Module E — builder feature (`src/components/builder/` + `src/app/builder/**`)

- Controls are **controlled components**, one per family, identical shape:
  `FirearmControls({ build, rules, onChange }: { build: FirearmBuild; rules: Ruleset; onChange(next: FirearmBuild): void })`
  and likewise `BowControls`, `CrossbowControls`, `GrenadeControls`,
  `MeleeControls`. They render the part pickers from `rules.catalog` (selects,
  number fields, attachment multi-select checkboxes grouped by anchor) and
  emit a complete new build on every change. Firearm rules: frame change
  resets cartridge/shell to a valid default for that frame's `ammoClasses`
  (use `newFirearmBuild(rules, frameId)` to derive, keeping name/attachments
  where still valid); cartridge pickers filter by the frame's classes; shotgun
  frames show shell type + gauge instead of cartridge.
- `StatCard.tsx`: `StatCard({ stats, rules, className? }: { stats: WeaponStats; rules: Ruleset; className?: string })`
  — damage headline (`damageLabel` + average via `averageDamage`), chips for
  price (`rules.economy.currencyAbbr`), weight, hide, accuracy, STR req;
  range-malus table (em-dash for `null` malus); fire-mode table (label, ammo,
  stacking penalty, all-hit damage); grenade falloff table; notes list;
  warnings styled `blood`; collapsible "Show the working" section rendering
  `trace` as label/detail/value rows in mono.
- `BuilderWorkbench.tsx`: the composition used by all builder pages:
  `BuilderWorkbench({ family }: { family: WeaponFamily })` — owns build state
  (init from `newBuildForFamily`), lays out blueprint canvas (top, full
  width), controls (left) + StatCard (right) below on desktop, stacked on
  mobile; name text field; actions bar: **Save to armory** (then link/button
  "View in armory"), **Copy share link** (`/share#` + `encodeShare`, absolute
  URL via `window.location.origin`, confirm feedback), **Download JSON** /
  **Copy JSON** (`exportWeapon`, `slugify(name)-pattern.json`). Also accepts
  optional `{ weaponId?: string }` — when set, loads that weapon, saves update
  in place instead of creating (used by armory edit).
- Pages (all `"use client"`, thin): `src/app/builder/page.tsx` — family picker
  grid (5 big tiles with icons/blurbs); `src/app/builder/firearm/page.tsx`
  etc. (5 folders) — `<BuilderWorkbench family="firearm" />` + `PageHeader`.

## Module F — armory + share (`src/app/armory/**`, `src/app/share/page.tsx`)

- `src/app/armory/page.tsx`: grid of weapon cards (`WeaponCard` in
  `src/components/armory/WeaponCard.tsx`: name, family badge, mini stat chips
  from `computeStats` under the **active** ruleset, small blueprint thumbnail
  by rendering `WeaponBlueprint` scaled down); actions per card: open, copy
  share link, delete (ConfirmDialog). Header actions: **Import JSON** (Modal
  with textarea + file input → `parseWeaponExport` → create), links to
  fabricator. EmptyState when no weapons. Note: when the Rules Lab changes,
  these cards re-stat automatically because stats are computed at render.
- `src/app/armory/[id]/page.tsx`: full view — big blueprint, StatCard,
  metadata (created/updated), actions (edit toggle via `?edit=1` → renders
  `BuilderWorkbench weaponId=…`, share link, export JSON, delete w/ confirm).
- `src/app/share/page.tsx`: reads `window.location.hash` payload on mount
  (fragment, not query), `decodeShare` → preview (blueprint + StatCard,
  stamped "FIELD COPY — computed under your active ruleset") + **Save to
  armory** button; invalid/missing payload → EmptyState explaining share
  links. Wrap the hash-reading part in `<Suspense>`-safe client-only logic
  (it's a client page; just read in `useEffect`).

## Module G — Rules Lab (`src/components/rules/` + `src/app/rules/page.tsx`)

The "instant ability to change the inner workings" feature. Everything edits
the live ruleset via `useRuleset()` — no save button, changes apply on input
(immutably: always `setRuleset({ ...structuredClone-ish next })`).

- `src/app/rules/page.tsx`: PageHeader (stamp: ruleset name + CUSTOMIZED badge
  when `isCustomized`) with actions: **Export ruleset** (downloadJson of
  `exportRuleset`), **Import** (modal, `parseRulesetExport`, confirm
  overwrite), **Reset to V5 defaults** (ConfirmDialog → `resetRuleset`).
  Below: `RulesLab`.
- `RulesLab.tsx`: sectioned accordion (collapsible `Panel`s):
  1. *Firearm model*: normalization maxima, stat weightings, halve divisor,
     rifled bonus dice — NumberFields.
  2. *Band tables*: round-score bands, joules bands, barrel-length bands —
     editable tables with add/remove row (`BandTableEditor` generic component).
  3. *Ranges & fire*: range bands, per-platform malus matrix (number inputs,
     blank = "varies"/null), fire-mode table.
  4. *Catalogs*: one editable table per part list (frames, actions, magazines,
     barrel types, stocks, attachments, cartridges, shells + gauges, bow
     types, materials, arrows, crossbows, grenade payload/quality/focus, melee
     presets) — build a generic `CatalogTable<T>` driven by column configs
     (key, label, kind: text|number|select|percent), with add-row (sensible
     blank + `newId`-less string id from the label) and delete-row.
  5. *Bows / Grenades / Melee models*: their normalization/weights/bands.
  6. *Economy*: currency name/abbr, anchor note, water price, global
     `priceScale` slider (0.25–4) + number field.
  A sticky "live preview" panel on the right: pick-a-weapon select (from
  armory, else a default AK-pattern factory build) rendering its StatCard so
  edits visibly re-stat in real time.

## Module H — Docker, CI, docs (root + `.github/` + `docs/`)

- `Dockerfile`: multi-stage on `node:24-alpine` — deps (npm ci) → build (next
  build) → runtime copying `.next/standalone`, `.next/static`, `public/`;
  non-root user; `EXPOSE 3000`; `CMD ["node", "server.js"]`. `public/` exists.
- `.dockerignore`: node_modules, .next, .git, docs, *.md, .env*.
- `docker-compose.yml`: single `web` service, build ., port `3000:3000`,
  restart unless-stopped.
- `.github/workflows/ci.yml`: on push/PR to main — npm ci, `npm run
  typecheck`, `npm test`, `npm run build` (Node 24).
- `README.md`: what it is (Ashen Skies weapon fabricator), screenshots
  placeholder, feature list (blueprint builder, V5 engine, Rules Lab, armory,
  share links, JSON export), quick start (dev + Docker), how the damage model
  works (short, with the SKS example), how to tune rules, export formats
  (`ashen-skies/weapon@1`, `ashen-skies/ruleset@1`), relationship to the
  future Ashen Skies companion app (standalone by design; exports are the
  interface), license note "personal project".
- `docs/ARCHITECTURE.md`: builds-store-inputs/stats-computed-live principle,
  data seam, module map, how to add a part/cartridge/family.
- `docs/CHANGES-FROM-WPF.md`: honest changelog vs the desktop app — computed
  round scores replace hardcoded ones; V5 joules step added (revised band
  table); firing-mechanism dice added; frame base die dropped (0, was
  constant 1); UBGL/bayonet no longer add damage dice (notes instead); rifling
  dice now a rules knob defaulting 0 (was +2); currency Corium → rats
  (1L water = 50 rats anchor, prices ≈ ×8); ammo/gauge lists carried over;
  known WPF bugs fixed (ammo string mismatches, dead code paths, bow length
  no-op, materials displayed-but-unapplied).
