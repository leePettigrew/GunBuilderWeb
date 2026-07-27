"use client";

/**
 * The Rules Lab — every constant of the Ashen Skies damage model, editable
 * live. Each input commits immediately through `patch`, which clones the
 * active ruleset, applies the change and stores it; every open StatCard in
 * the app re-computes on the spot.
 */

import { useState, type ReactNode } from "react";
import type { Ruleset } from "@shared/types";
import { NumberField, TextField } from "@/components/ui/Field";
import { IconChevronDown } from "@/components/ui/icons";
import { useRuleset } from "@/lib/data/context";
import { cn } from "@/lib/cn";
import { BandTableEditor } from "./BandTableEditor";
import { CatalogTable, type ColumnDef } from "./CatalogTable";

function Section({
  title,
  hint,
  defaultOpen = false,
  children,
}: {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="surface-panel overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-steel-850/60"
      >
        <span>
          <span className="heading-stencil block text-sm text-bone">{title}</span>
          {hint !== undefined && <span className="text-xs text-bone-faint">{hint}</span>}
        </span>
        <IconChevronDown className={cn("h-4 w-4 shrink-0 text-bone-faint transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="space-y-6 border-t border-rivet/30 p-4">{children}</div>}
    </section>
  );
}

const pct = (key: string, label: string): ColumnDef<never> =>
  ({ key, label: `${label} %`, kind: "percent", width: "w-20" }) as ColumnDef<never>;

export function RulesLab() {
  const { ruleset, setRuleset } = useRuleset();

  const patch = (mutate: (draft: Ruleset) => void) => {
    const next = structuredClone(ruleset);
    mutate(next);
    setRuleset(next);
  };

  const f = ruleset.firearms;
  const c = ruleset.catalog;
  const malusKeyOptions = Object.keys(f.platformRangeMalus).map((k) => ({ value: k, label: k }));
  const malusRows = Object.entries(f.platformRangeMalus).map(([id, malus]) => ({ id, malus }));

  return (
    <div className="space-y-4">
      <Section title="Firearm damage model" hint="Normalization maxima, stat weightings and the halving step" defaultOpen>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <NumberField label="Max bullet Ø (mm)" value={f.normalization.bulletDiameterMm} onChange={(v) => patch((d) => void (d.firearms.normalization.bulletDiameterMm = v))} />
          <NumberField label="Max case length (mm)" value={f.normalization.caseLengthMm} onChange={(v) => patch((d) => void (d.firearms.normalization.caseLengthMm = v))} />
          <NumberField label="Max overall length (mm)" value={f.normalization.overallLengthMm} onChange={(v) => patch((d) => void (d.firearms.normalization.overallLengthMm = v))} />
          <NumberField label="Max base Ø (mm)" value={f.normalization.baseDiameterMm} onChange={(v) => patch((d) => void (d.firearms.normalization.baseDiameterMm = v))} />
          <NumberField label="Weight: bullet Ø" value={f.weights.bulletDiameter} step={0.005} onChange={(v) => patch((d) => void (d.firearms.weights.bulletDiameter = v))} />
          <NumberField label="Weight: case length" value={f.weights.caseLength} step={0.005} onChange={(v) => patch((d) => void (d.firearms.weights.caseLength = v))} />
          <NumberField label="Weight: overall length" value={f.weights.overallLength} step={0.005} onChange={(v) => patch((d) => void (d.firearms.weights.overallLength = v))} />
          <NumberField label="Weight: base Ø" value={f.weights.baseDiameter} step={0.005} onChange={(v) => patch((d) => void (d.firearms.weights.baseDiameter = v))} />
          <NumberField label="Dice halve divisor" value={f.diceHalveDivisor} min={1} hint="Final pool = ceil(dice ÷ this)" onChange={(v) => patch((d) => void (d.firearms.diceHalveDivisor = v))} />
          <NumberField label="Rifled bonus dice" value={f.rifledBonusDice} hint="V5 default 0; the old desktop app used +2" onChange={(v) => patch((d) => void (d.firearms.rifledBonusDice = v))} />
        </div>
      </Section>

      <Section title="Band tables" hint="Round score → dice · joules → die size · barrel length → bonus dice">
        <BandTableEditor
          title="Round score bands"
          rows={f.roundScoreBands}
          columns={[
            { key: "id", label: "Band", kind: "text", width: "w-14" },
            { key: "min", label: "Min", kind: "number" },
            { key: "max", label: "Max", kind: "number" },
            { key: "dice", label: "Dice", kind: "number", width: "w-16" },
          ]}
          onChange={(rows) => patch((d) => void (d.firearms.roundScoreBands = rows))}
          makeBlank={() => ({ id: "?", min: 0, max: 0, dice: 0 })}
        />
        <BandTableEditor
          title="Joules bands"
          hint="Energies above the last band clamp to it"
          rows={f.joulesBands}
          columns={[
            { key: "band", label: "Band", kind: "number", width: "w-14" },
            { key: "minJ", label: "Min J", kind: "number" },
            { key: "maxJ", label: "Max J", kind: "number" },
            { key: "dieSize", label: "Die", kind: "number", width: "w-16" },
            { key: "bonusDamage", label: "Bonus", kind: "number", width: "w-16" },
          ]}
          onChange={(rows) => patch((d) => void (d.firearms.joulesBands = rows))}
          makeBlank={() => ({ band: f.joulesBands.length + 1, minJ: 0, maxJ: 0, dieSize: 4, bonusDamage: 0 })}
        />
        <BandTableEditor
          title="Barrel length bands"
          rows={f.barrelLengthBands}
          columns={[
            { key: "minMm", label: "Min mm", kind: "number" },
            { key: "maxMm", label: "Max mm", kind: "number" },
            { key: "dice", label: "Dice", kind: "number", width: "w-16" },
          ]}
          onChange={(rows) => patch((d) => void (d.firearms.barrelLengthBands = rows))}
          makeBlank={() => ({ minMm: 0, maxMm: 0, dice: 0 })}
        />
      </Section>

      <Section title="Ranges & fire modes" hint="Range bands, per-platform maluses, fire mode economics">
        <CatalogTable
          title="Range bands"
          items={f.rangeBands}
          columns={[
            { key: "id", label: "Id", kind: "text", width: "w-20" },
            { key: "label", label: "Label", kind: "text" },
            { key: "minM", label: "From m", kind: "number" },
            { key: "maxM", label: "To m", kind: "nullnumber" },
          ]}
          onChange={(rows) => patch((d) => void (d.firearms.rangeBands = rows))}
          makeBlank={() => ({ id: "band", label: "New band", minM: 0, maxM: null })}
        />
        <CatalogTable
          title="Platform range malus"
          hint={`One value per range band, in order (${f.rangeBands.map((b) => b.label).join(" / ")}); x = varies`}
          items={malusRows}
          columns={[
            { key: "id", label: "Platform row", kind: "text", width: "w-32" },
            { key: "malus", label: "Malus per band", kind: "malusCsv", width: "min-w-64" },
          ]}
          onChange={(rows) =>
            patch((d) => {
              // Suffix colliding ids instead of silently dropping rows.
              const record: Record<string, (number | null)[]> = {};
              for (const row of rows) {
                let key = row.id;
                let n = 2;
                while (key in record) key = `${row.id}-${n++}`;
                record[key] = row.malus;
              }
              d.firearms.platformRangeMalus = record;
            })
          }
          makeBlank={() => ({ id: "newPlatform", malus: f.rangeBands.map(() => 0) })}
          addLabel="Add platform row"
        />
        <CatalogTable
          title="Fire modes"
          items={f.fireModes}
          columns={[
            { key: "id", label: "Id", kind: "text", width: "w-24" },
            { key: "label", label: "Label", kind: "text", width: "min-w-32" },
            { key: "ammoCost", label: "Ammo", kind: "number", width: "w-16" },
            { key: "recoil", label: "Recoil", kind: "text", width: "w-24" },
            { key: "stackPenalty", label: "Stack", kind: "number", width: "w-16" },
            { key: "smgStackPenalty", label: "SMG stack", kind: "number", width: "w-16" },
            {
              key: "damageReduction",
              label: "Reduction",
              kind: "select",
              options: [
                { value: "none", label: "none" },
                { value: "halveDice", label: "halve dice" },
              ],
              width: "w-28",
            },
          ]}
          onChange={(rows) => patch((d) => void (d.firearms.fireModes = rows))}
          makeBlank={() => ({ id: "mode", label: "New mode", ammoCost: 1, recoil: "Low", stackPenalty: 0, smgStackPenalty: 0, damageReduction: "none" as const })}
        />
      </Section>

      <Section title="Firearm parts catalog" hint="Frames, actions, feeds, barrels, stocks, attachments">
        <CatalogTable
          title="Frames"
          items={c.frames}
          columns={[
            { key: "id", label: "Id", kind: "text", width: "w-24" },
            { key: "label", label: "Label", kind: "text", width: "min-w-28" },
            { key: "example", label: "Example", kind: "text", width: "min-w-24" },
            { key: "ammoClasses", label: "Ammo classes", kind: "csv", width: "w-28" },
            { key: "rangeMalusId", label: "Malus row", kind: "select", options: malusKeyOptions, width: "w-32" },
            { key: "baseDice", label: "Base dice", kind: "number", width: "w-16" },
            { key: "baseWeightKg", label: "Kg", kind: "number", width: "w-16" },
            { key: "basePriceRats", label: "Price", kind: "number", width: "w-20" },
            { key: "defaultBarrelMm", label: "Barrel mm", kind: "number", width: "w-20" },
            { key: "smgHandling", label: "SMG", kind: "toggle", width: "w-12" },
            { key: "lmgHandling", label: "LMG", kind: "toggle", width: "w-12" },
          ]}
          onChange={(rows) => patch((d) => void (d.catalog.frames = rows))}
          makeBlank={() => ({ id: "frame", label: "New frame", example: "", ammoClasses: ["rifle" as const], rangeMalusId: malusKeyOptions[0]?.value ?? "carbine", baseDice: 0, baseWeightKg: 3, basePriceRats: 1000, defaultBarrelMm: 400 })}
        />
        <CatalogTable
          title="Actions (firing mechanisms)"
          hint="Damage dice per the V5 mechanism table; fire modes reference the ids above"
          items={c.actions}
          columns={[
            { key: "id", label: "Id", kind: "text", width: "w-28" },
            { key: "label", label: "Label", kind: "text", width: "min-w-32" },
            { key: "damageDice", label: "Dice", kind: "number", width: "w-14" },
            pct("pricePct", "Price") as ColumnDef<(typeof c.actions)[number]>,
            pct("weightPct", "Weight") as ColumnDef<(typeof c.actions)[number]>,
            { key: "fireModeIds", label: "Fire modes", kind: "csv", width: "min-w-40" },
          ]}
          onChange={(rows) => patch((d) => void (d.catalog.actions = rows))}
          makeBlank={() => ({ id: "action", label: "New action", damageDice: 0, pricePct: 0, weightPct: 0, fireModeIds: ["single"] })}
        />
        <CatalogTable
          title="Magazines / feeds"
          items={c.magazines}
          columns={[
            { key: "id", label: "Id", kind: "text", width: "w-28" },
            { key: "label", label: "Label", kind: "text", width: "min-w-32" },
            { key: "damageDice", label: "Dice", kind: "number", width: "w-14" },
            pct("pricePct", "Price") as ColumnDef<(typeof c.magazines)[number]>,
            pct("weightPct", "Weight") as ColumnDef<(typeof c.magazines)[number]>,
            { key: "reloadNote", label: "Reload note", kind: "text", width: "min-w-44" },
          ]}
          onChange={(rows) => patch((d) => void (d.catalog.magazines = rows))}
          makeBlank={() => ({ id: "feed", label: "New feed", damageDice: 0, pricePct: 0, weightPct: 0 })}
        />
        <CatalogTable
          title="Barrel types"
          items={c.barrelTypes}
          columns={[
            { key: "id", label: "Id", kind: "text", width: "w-24" },
            { key: "label", label: "Label", kind: "text", width: "min-w-28" },
            pct("pricePct", "Price") as ColumnDef<(typeof c.barrelTypes)[number]>,
            pct("weightPct", "Weight") as ColumnDef<(typeof c.barrelTypes)[number]>,
            { key: "note", label: "Note", kind: "text", width: "min-w-44" },
          ]}
          onChange={(rows) => patch((d) => void (d.catalog.barrelTypes = rows))}
          makeBlank={() => ({ id: "barrel", label: "New barrel", pricePct: 0, weightPct: 0 })}
        />
        <CatalogTable
          title="Stocks"
          items={c.stocks}
          columns={[
            { key: "id", label: "Id", kind: "text", width: "w-24" },
            { key: "label", label: "Label", kind: "text", width: "min-w-32" },
            pct("pricePct", "Price") as ColumnDef<(typeof c.stocks)[number]>,
            pct("weightPct", "Weight") as ColumnDef<(typeof c.stocks)[number]>,
            { key: "hideMod", label: "Hide", kind: "number", width: "w-14" },
          ]}
          onChange={(rows) => patch((d) => void (d.catalog.stocks = rows))}
          makeBlank={() => ({ id: "stock", label: "New stock", pricePct: 0, weightPct: 0, hideMod: 0 })}
        />
        <CatalogTable
          title="Attachments"
          items={c.attachments}
          columns={[
            { key: "id", label: "Id", kind: "text", width: "w-24" },
            { key: "label", label: "Label", kind: "text", width: "min-w-36" },
            {
              key: "anchor",
              label: "Anchor",
              kind: "select",
              options: ["muzzle", "rail", "underbarrel", "side", "stock"].map((a) => ({ value: a, label: a })),
              width: "w-28",
            },
            pct("pricePct", "Price") as ColumnDef<(typeof c.attachments)[number]>,
            pct("weightPct", "Weight") as ColumnDef<(typeof c.attachments)[number]>,
            { key: "accuracyMod", label: "Acc", kind: "number", width: "w-14" },
            { key: "hideMod", label: "Hide", kind: "number", width: "w-14" },
            { key: "damageDice", label: "Dice", kind: "number", width: "w-14" },
          ]}
          onChange={(rows) => patch((d) => void (d.catalog.attachments = rows))}
          makeBlank={() => ({ id: "attachment", label: "New attachment", anchor: "rail" as const, pricePct: 0, weightPct: 0, accuracyMod: 0, hideMod: 0, damageDice: 0 })}
        />
      </Section>

      <Section title="Ammunition" hint="Cartridge dimensions drive the round score; joules drive the die size">
        <CatalogTable
          title="Cartridges"
          items={c.cartridges}
          columns={[
            { key: "id", label: "Id", kind: "text", width: "w-24" },
            { key: "label", label: "Label", kind: "text", width: "min-w-40" },
            {
              key: "class",
              label: "Class",
              kind: "select",
              options: [
                { value: "pistol", label: "pistol" },
                { value: "rifle", label: "rifle" },
              ],
              width: "w-20",
            },
            { key: "bulletDiameterMm", label: "Bullet Ø", kind: "number", width: "w-20" },
            { key: "caseLengthMm", label: "Case", kind: "number", width: "w-20" },
            { key: "overallLengthMm", label: "OAL", kind: "number", width: "w-20" },
            { key: "baseDiameterMm", label: "Base Ø", kind: "number", width: "w-20" },
            { key: "joules", label: "Joules", kind: "number", width: "w-20" },
            { key: "hideMod", label: "Hide", kind: "number", width: "w-14" },
          ]}
          onChange={(rows) => patch((d) => void (d.catalog.cartridges = rows))}
          makeBlank={() => ({ id: "cartridge", label: "New cartridge", class: "rifle" as const, bulletDiameterMm: 7.62, caseLengthMm: 39, overallLengthMm: 56, baseDiameterMm: 11.3, joules: 2000, hideMod: 0 })}
        />
        <CatalogTable
          title="Shotgun shells"
          items={c.shellTypes}
          columns={[
            { key: "id", label: "Id", kind: "text", width: "w-28" },
            { key: "label", label: "Label", kind: "text", width: "min-w-28" },
            { key: "dieSize", label: "Die", kind: "number", width: "w-14" },
            { key: "slugLike", label: "Slug-like", kind: "toggle", width: "w-16" },
            { key: "note", label: "Note", kind: "text", width: "min-w-44" },
          ]}
          onChange={(rows) => patch((d) => void (d.catalog.shellTypes = rows))}
          makeBlank={() => ({ id: "shell", label: "New shell", dieSize: 8, slugLike: false, note: "" })}
        />
        <CatalogTable
          title="Gauges"
          items={c.shellGauges}
          columns={[
            { key: "id", label: "Id", kind: "text", width: "w-20" },
            { key: "label", label: "Label", kind: "text", width: "min-w-24" },
            { key: "diceMod", label: "Dice mod", kind: "number", width: "w-20" },
          ]}
          onChange={(rows) => patch((d) => void (d.catalog.shellGauges = rows))}
          makeBlank={() => ({ id: "gauge", label: "New gauge", diceMod: 0 })}
        />
      </Section>

      <Section title="Bows & crossbows" hint="Bow score model, strength gates, crossbow presets">
        <div className="grid gap-3 sm:grid-cols-3">
          <NumberField label="Max draw weight (lbs)" value={ruleset.bows.normalization.drawWeightLbs} onChange={(v) => patch((d) => void (d.bows.normalization.drawWeightLbs = v))} />
          <NumberField label="Max draw length (in)" value={ruleset.bows.normalization.drawLengthIn} onChange={(v) => patch((d) => void (d.bows.normalization.drawLengthIn = v))} />
          <NumberField label="Max efficiency" value={ruleset.bows.normalization.efficiency} step={0.05} onChange={(v) => patch((d) => void (d.bows.normalization.efficiency = v))} />
          <NumberField label="Weight: draw weight" value={ruleset.bows.weights.drawWeight} step={0.05} onChange={(v) => patch((d) => void (d.bows.weights.drawWeight = v))} />
          <NumberField label="Weight: draw length" value={ruleset.bows.weights.drawLength} step={0.05} onChange={(v) => patch((d) => void (d.bows.weights.drawLength = v))} />
          <NumberField label="Weight: efficiency" value={ruleset.bows.weights.efficiency} step={0.05} onChange={(v) => patch((d) => void (d.bows.weights.efficiency = v))} />
          <NumberField label="Base bow price" value={ruleset.bows.basePriceRats} onChange={(v) => patch((d) => void (d.bows.basePriceRats = v))} />
          <NumberField label="Base bow weight (kg)" value={ruleset.bows.baseWeightKg} step={0.1} onChange={(v) => patch((d) => void (d.bows.baseWeightKg = v))} />
        </div>
        <CatalogTable
          title="Bow score bands"
          items={ruleset.bows.scoreBands}
          columns={[
            { key: "id", label: "Band", kind: "text", width: "w-14" },
            { key: "min", label: "Min", kind: "number" },
            { key: "max", label: "Max", kind: "number" },
            { key: "damage", label: "Damage", kind: "dice", width: "w-32" },
          ]}
          onChange={(rows) => patch((d) => void (d.bows.scoreBands = rows))}
          makeBlank={() => ({ id: "?", min: 0, max: 0, damage: { terms: [], bonus: 0 } })}
        />
        <BandTableEditor
          title="Strength requirements"
          rows={ruleset.bows.strengthBands}
          columns={[
            { key: "maxDrawLbs", label: "Up to lbs", kind: "number" },
            { key: "strength", label: "STR", kind: "number", width: "w-16" },
          ]}
          onChange={(rows) => patch((d) => void (d.bows.strengthBands = rows))}
          makeBlank={() => ({ maxDrawLbs: 0, strength: 8 })}
        />
        <CatalogTable
          title="Bow types"
          hint={`Range malus order: CQC / Short / Medium / Long; x = can't reach`}
          items={c.bowTypes}
          columns={[
            { key: "id", label: "Id", kind: "text", width: "w-28" },
            { key: "label", label: "Label", kind: "text", width: "min-w-36" },
            { key: "rangeMalus", label: "Range malus", kind: "malusCsv", width: "min-w-40" },
            { key: "maxDrawWeightLbs", label: "Max lbs", kind: "number", width: "w-20" },
          ]}
          onChange={(rows) => patch((d) => void (d.catalog.bowTypes = rows))}
          makeBlank={() => ({ id: "bow", label: "New bow", rangeMalus: [0, 0, null, null], maxDrawWeightLbs: 50 })}
        />
        <CatalogTable
          title="Bow materials"
          items={c.bowMaterials}
          columns={[
            { key: "id", label: "Id", kind: "text", width: "w-28" },
            { key: "label", label: "Label", kind: "text", width: "min-w-40" },
            { key: "accuracyMod", label: "Acc", kind: "number", width: "w-14" },
            { key: "durabilityMod", label: "Dur", kind: "number", width: "w-14" },
            { key: "damageMod", label: "Dmg", kind: "number", width: "w-14" },
            pct("pricePct", "Price") as ColumnDef<(typeof c.bowMaterials)[number]>,
            pct("weightPct", "Weight") as ColumnDef<(typeof c.bowMaterials)[number]>,
          ]}
          onChange={(rows) => patch((d) => void (d.catalog.bowMaterials = rows))}
          makeBlank={() => ({ id: "material", label: "New material", accuracyMod: 0, durabilityMod: 0, damageMod: 0, pricePct: 0, weightPct: 0 })}
        />
        <CatalogTable
          title="Arrows"
          items={c.arrows}
          columns={[
            { key: "id", label: "Id", kind: "text", width: "w-28" },
            { key: "label", label: "Label", kind: "text", width: "min-w-32" },
            { key: "armorPen", label: "AP", kind: "number", width: "w-14" },
            { key: "damageMod", label: "Dmg", kind: "number", width: "w-14" },
            { key: "note", label: "Note", kind: "text", width: "min-w-44" },
          ]}
          onChange={(rows) => patch((d) => void (d.catalog.arrows = rows))}
          makeBlank={() => ({ id: "arrow", label: "New arrow", armorPen: 0, damageMod: 0, note: "" })}
        />
        <CatalogTable
          title="Crossbow presets"
          items={c.crossbowTypes}
          columns={[
            { key: "id", label: "Id", kind: "text", width: "w-28" },
            { key: "label", label: "Label", kind: "text", width: "min-w-36" },
            { key: "bandId", label: "Band", kind: "text", width: "w-14" },
            { key: "damage", label: "Damage", kind: "dice", width: "w-28" },
            { key: "reload", label: "Reload", kind: "text", width: "w-28" },
            { key: "operatorReq", label: "Operator", kind: "text", width: "min-w-40" },
            { key: "rangeMalus", label: "Range malus", kind: "malusCsv", width: "min-w-36" },
            { key: "basePriceRats", label: "Price", kind: "number", width: "w-20" },
            { key: "baseWeightKg", label: "Kg", kind: "number", width: "w-16" },
          ]}
          onChange={(rows) => patch((d) => void (d.catalog.crossbowTypes = rows))}
          makeBlank={() => ({ id: "xbow", label: "New crossbow", bandId: "D", damage: { terms: [{ count: 1, size: 10 }], bonus: 0 }, reload: "Full round", operatorReq: "None — any character", rangeMalus: [-2, 0, 0, null], basePriceRats: 500, baseWeightKg: 3 })}
        />
      </Section>

      <Section title="Grenades & melee" hint="Explosive score model, falloff, melee presets">
        <div className="grid gap-3 sm:grid-cols-3">
          <NumberField label="Weight: payload" value={ruleset.grenades.weights.payload} step={0.05} onChange={(v) => patch((d) => void (d.grenades.weights.payload = v))} />
          <NumberField label="Weight: quality" value={ruleset.grenades.weights.quality} step={0.05} onChange={(v) => patch((d) => void (d.grenades.weights.quality = v))} />
          <NumberField label="Weight: focus" value={ruleset.grenades.weights.focus} step={0.05} onChange={(v) => patch((d) => void (d.grenades.weights.focus = v))} />
        </div>
        <TextField
          label="Falloff quarters"
          value={ruleset.grenades.falloffQuarters.join(", ")}
          hint="Damage multiplier per quarter of the radius, centre outward"
          onChange={(text) =>
            patch((d) => {
              const values = text
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s !== "")
                .map(Number)
                .filter((n) => Number.isFinite(n));
              if (values.length > 0) d.grenades.falloffQuarters = values;
            })
          }
        />
        <CatalogTable
          title="Explosive score bands"
          items={ruleset.grenades.scoreBands}
          columns={[
            { key: "id", label: "Band", kind: "text", width: "w-14" },
            { key: "min", label: "Min", kind: "number" },
            { key: "max", label: "Max", kind: "number" },
            { key: "damage", label: "Damage", kind: "dice", width: "w-28" },
          ]}
          onChange={(rows) => patch((d) => void (d.grenades.scoreBands = rows))}
          makeBlank={() => ({ id: "?", min: 0, max: 0, damage: { terms: [], bonus: 0 } })}
        />
        <CatalogTable
          title="Payloads"
          items={c.grenadePayloads}
          columns={[
            { key: "id", label: "Id", kind: "text", width: "w-28" },
            { key: "label", label: "Label", kind: "text", width: "min-w-36" },
            { key: "rating", label: "P", kind: "number", width: "w-16" },
            { key: "example", label: "Example", kind: "text", width: "min-w-32" },
            { key: "basePriceRats", label: "Price", kind: "number", width: "w-20" },
            { key: "baseWeightKg", label: "Kg", kind: "number", width: "w-16" },
          ]}
          onChange={(rows) => patch((d) => void (d.catalog.grenadePayloads = rows))}
          makeBlank={() => ({ id: "payload", label: "New payload", rating: 0.5, example: "", basePriceRats: 100, baseWeightKg: 0.5 })}
        />
        <CatalogTable
          title="Qualities"
          items={c.grenadeQualities}
          columns={[
            { key: "id", label: "Id", kind: "text", width: "w-28" },
            { key: "label", label: "Label", kind: "text", width: "min-w-40" },
            { key: "rating", label: "Q", kind: "number", width: "w-16" },
            { key: "priceMult", label: "Price ×", kind: "number", width: "w-16" },
          ]}
          onChange={(rows) => patch((d) => void (d.catalog.grenadeQualities = rows))}
          makeBlank={() => ({ id: "quality", label: "New quality", rating: 0.5, priceMult: 1 })}
        />
        <CatalogTable
          title="Focuses"
          items={c.grenadeFocuses}
          columns={[
            { key: "id", label: "Id", kind: "text", width: "w-28" },
            { key: "label", label: "Label", kind: "text", width: "min-w-44" },
            { key: "rating", label: "F", kind: "number", width: "w-16" },
            { key: "radiusM", label: "Radius m", kind: "number", width: "w-20" },
          ]}
          onChange={(rows) => patch((d) => void (d.catalog.grenadeFocuses = rows))}
          makeBlank={() => ({ id: "focus", label: "New focus", rating: 0.5, radiusM: 10 })}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField label="Brawl DR penalty" value={ruleset.melee.brawlDrPenalty} onChange={(v) => patch((d) => void (d.melee.brawlDrPenalty = v))} />
          <TextField label="Unarmed rule text" value={ruleset.melee.unarmedNote} onChange={(v) => patch((d) => void (d.melee.unarmedNote = v))} />
        </div>
        <CatalogTable
          title="Melee presets"
          items={c.meleePresets}
          columns={[
            { key: "id", label: "Id", kind: "text", width: "w-28" },
            { key: "label", label: "Label", kind: "text", width: "min-w-32" },
            {
              key: "kind",
              label: "Kind",
              kind: "select",
              options: [
                { value: "weapon", label: "weapon" },
                { value: "unarmed", label: "unarmed" },
              ],
              width: "w-24",
            },
            {
              key: "governing",
              label: "Stat",
              kind: "select",
              options: [
                { value: "str", label: "STR" },
                { value: "dex", label: "DEX" },
              ],
              width: "w-20",
            },
            { key: "dieSize", label: "Die", kind: "number", width: "w-14" },
            { key: "baseWeightKg", label: "Kg", kind: "number", width: "w-16" },
            { key: "basePriceRats", label: "Price", kind: "number", width: "w-20" },
          ]}
          onChange={(rows) => patch((d) => void (d.catalog.meleePresets = rows))}
          makeBlank={() => ({ id: "melee", label: "New implement", kind: "weapon" as const, governing: "str" as const, dieSize: 6, baseWeightKg: 1, basePriceRats: 50 })}
        />
      </Section>

      <Section title="Economy" hint="Rats — ration tablets. 1L of clean water anchors the scale.">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Currency name" value={ruleset.economy.currencyName} onChange={(v) => patch((d) => void (d.economy.currencyName = v))} />
          <TextField label="Abbreviation" value={ruleset.economy.currencyAbbr} onChange={(v) => patch((d) => void (d.economy.currencyAbbr = v))} />
          <TextField label="Anchor note" value={ruleset.economy.anchorNote} onChange={(v) => patch((d) => void (d.economy.anchorNote = v))} className="sm:col-span-2" />
          <NumberField label="1L water price" value={ruleset.economy.waterLitrePriceRats} onChange={(v) => patch((d) => void (d.economy.waterLitrePriceRats = v))} />
          <NumberField label="Global price scale" value={ruleset.economy.priceScale} min={0.25} max={4} step={0.05} hint="Multiplies every computed price" onChange={(v) => patch((d) => void (d.economy.priceScale = v))} />
        </div>
        <input
          type="range"
          min={0.25}
          max={4}
          step={0.05}
          value={ruleset.economy.priceScale}
          onChange={(e) => patch((d) => void (d.economy.priceScale = Number(e.target.value)))}
          className="w-full accent-[rgb(var(--c-ember))]"
          aria-label="Global price scale"
        />
      </Section>
    </div>
  );
}
