import { findById } from "@shared/engine";
import type { GrenadeBuild, Ruleset } from "@shared/types";
import { SelectField } from "@/components/ui/Field";

export interface GrenadeControlsProps {
  build: GrenadeBuild;
  rules: Ruleset;
  onChange: (next: GrenadeBuild) => void;
}

export function GrenadeControls({ build, rules, onChange }: GrenadeControlsProps) {
  const c = rules.catalog;
  const payload = findById(c.grenadePayloads, build.payloadId);
  const quality = findById(c.grenadeQualities, build.qualityId);
  const focus = findById(c.grenadeFocuses, build.focusId);

  return (
    <div className="space-y-5">
      <SelectField
        label="Payload"
        value={build.payloadId}
        onChange={(payloadId) => onChange({ ...build, payloadId })}
        options={c.grenadePayloads.map((p) => ({ value: p.id, label: p.label }))}
        hint={payload ? `Rating ${payload.rating} — e.g. ${payload.example}.` : undefined}
      />

      <SelectField
        label="Quality"
        value={build.qualityId}
        onChange={(qualityId) => onChange({ ...build, qualityId })}
        options={c.grenadeQualities.map((q) => ({ value: q.id, label: q.label }))}
        hint={quality ? `Rating ${quality.rating} — price ×${quality.priceMult}.` : undefined}
      />

      <SelectField
        label="Focus"
        value={build.focusId}
        onChange={(focusId) => onChange({ ...build, focusId })}
        options={c.grenadeFocuses.map((f) => ({ value: f.id, label: f.label }))}
        hint={focus ? `Rating ${focus.rating} — blast radius ${focus.radiusM} m.` : undefined}
      />
    </div>
  );
}
