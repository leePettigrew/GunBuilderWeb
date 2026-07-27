import { findById } from "@shared/engine";
import type { CrossbowBuild, Ruleset } from "@shared/types";
import { SelectField } from "@/components/ui/Field";
import { AttachmentGroups } from "./FirearmControls";

export interface CrossbowControlsProps {
  build: CrossbowBuild;
  rules: Ruleset;
  onChange: (next: CrossbowBuild) => void;
}

export function CrossbowControls({ build, rules, onChange }: CrossbowControlsProps) {
  const c = rules.catalog;
  const type = findById(c.crossbowTypes, build.crossbowTypeId);

  const typeHint = type
    ? [`${type.reload} reload — operator: ${type.operatorReq}`, type.note]
        .filter((s): s is string => s !== undefined)
        .join(" ")
    : undefined;

  return (
    <div className="space-y-5">
      <SelectField
        label="Crossbow type"
        value={build.crossbowTypeId}
        onChange={(crossbowTypeId) => onChange({ ...build, crossbowTypeId })}
        options={c.crossbowTypes.map((t) => ({ value: t.id, label: t.label }))}
        hint={typeHint}
      />

      <div className="border-t border-rivet/30 pt-4">
        <p className="mb-3 font-display text-[10px] uppercase tracking-stamp text-bone-faint">
          Attachments
        </p>
        <AttachmentGroups
          attachments={c.attachments}
          selectedIds={build.attachmentIds}
          onChange={(attachmentIds) => onChange({ ...build, attachmentIds })}
        />
      </div>
    </div>
  );
}
