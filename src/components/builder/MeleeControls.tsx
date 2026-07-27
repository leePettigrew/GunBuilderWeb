import { findById } from "@shared/engine";
import type { MeleeBuild, Ruleset } from "@shared/types";
import { SelectField } from "@/components/ui/Field";

const DIE_SIZES = [4, 6, 8, 10, 12, 20];

export interface MeleeControlsProps {
  build: MeleeBuild;
  rules: Ruleset;
  onChange: (next: MeleeBuild) => void;
}

export function MeleeControls({ build, rules, onChange }: MeleeControlsProps) {
  const c = rules.catalog;
  const preset = findById(c.meleePresets, build.presetId);

  const presetHint = preset
    ? [`${preset.governing.toUpperCase()}-based, 1d${preset.dieSize}`, preset.note]
        .filter((s): s is string => s !== undefined)
        .join(" — ")
    : undefined;

  function changeOverride(value: string) {
    if (value === "") {
      const next: MeleeBuild = { ...build };
      delete next.dieSizeOverride;
      onChange(next);
    } else {
      onChange({ ...build, dieSizeOverride: Number(value) });
    }
  }

  return (
    <div className="space-y-5">
      <SelectField
        label="Implement"
        value={build.presetId}
        onChange={(presetId) => onChange({ ...build, presetId })}
        options={c.meleePresets.map((p) => ({ value: p.id, label: p.label }))}
        hint={presetHint}
      />

      <SelectField
        label="Die size override"
        value={build.dieSizeOverride === undefined ? "" : String(build.dieSizeOverride)}
        onChange={changeOverride}
        options={[
          { value: "", label: `Preset default (d${preset?.dieSize ?? 4})` },
          ...DIE_SIZES.map((size) => ({ value: String(size), label: `d${size}` })),
        ]}
        hint="House-rule a sharper or duller edge without touching the Rules Lab catalog."
      />
    </div>
  );
}
