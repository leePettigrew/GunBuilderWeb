import { findById } from "@shared/engine";
import type { BowBuild, Ruleset } from "@shared/types";
import { NumberField, SelectField } from "@/components/ui/Field";

function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

export interface BowControlsProps {
  build: BowBuild;
  rules: Ruleset;
  onChange: (next: BowBuild) => void;
}

export function BowControls({ build, rules, onChange }: BowControlsProps) {
  const c = rules.catalog;
  const bowType = findById(c.bowTypes, build.bowTypeId);
  const material = findById(c.bowMaterials, build.materialId);
  const arrow = findById(c.arrows, build.arrowId);

  const typeHint = bowType
    ? [`Max draw ${bowType.maxDrawWeightLbs} lbs`, bowType.note]
        .filter((s): s is string => s !== undefined)
        .join(" — ")
    : undefined;

  const arrowHint = arrow
    ? [`Armor pen ${signed(arrow.armorPen)}, damage ${signed(arrow.damageMod)} flat`, arrow.note]
        .filter((s): s is string => s !== undefined)
        .join(" — ")
    : undefined;

  return (
    <div className="space-y-5">
      <SelectField
        label="Bow type"
        value={build.bowTypeId}
        onChange={(bowTypeId) => onChange({ ...build, bowTypeId })}
        options={c.bowTypes.map((b) => ({ value: b.id, label: b.label }))}
        hint={typeHint}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          label="Draw weight (lbs)"
          value={build.drawWeightLbs}
          onChange={(drawWeightLbs) => onChange({ ...build, drawWeightLbs })}
          min={5}
          max={200}
          step={5}
        />
        <NumberField
          label="Draw length (in)"
          value={build.drawLengthIn}
          onChange={(drawLengthIn) => onChange({ ...build, drawLengthIn })}
          min={10}
          max={40}
          step={1}
        />
      </div>

      <NumberField
        label="Efficiency (0–1)"
        value={build.efficiency}
        onChange={(efficiency) => onChange({ ...build, efficiency })}
        min={0}
        max={1}
        step={0.05}
        hint="How well the limbs turn stored draw into arrow speed."
      />

      <SelectField
        label="Material"
        value={build.materialId}
        onChange={(materialId) => onChange({ ...build, materialId })}
        options={c.bowMaterials.map((m) => ({ value: m.id, label: m.label }))}
        hint={
          material
            ? `Accuracy ${signed(material.accuracyMod)}, damage ${signed(material.damageMod)} flat, durability ${signed(material.durabilityMod)}.`
            : undefined
        }
      />

      <SelectField
        label="Arrow"
        value={build.arrowId}
        onChange={(arrowId) => onChange({ ...build, arrowId })}
        options={c.arrows.map((a) => ({ value: a.id, label: a.label }))}
        hint={arrowHint}
      />
    </div>
  );
}
