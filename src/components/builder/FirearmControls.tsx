import { findById } from "@shared/engine";
import { newFirearmBuild } from "@shared/factories";
import type {
  AttachmentAnchor,
  AttachmentDef,
  FirearmBuild,
  Ruleset,
} from "@shared/types";
import { NumberField, SelectField, Toggle } from "@/components/ui/Field";

const ANCHOR_ORDER: AttachmentAnchor[] = ["muzzle", "rail", "underbarrel", "side", "stock"];

const ANCHOR_LABEL: Record<AttachmentAnchor, string> = {
  muzzle: "Muzzle",
  rail: "Rail",
  underbarrel: "Underbarrel",
  side: "Side",
  stock: "Stock",
};

export interface AttachmentGroupsProps {
  attachments: AttachmentDef[];
  selectedIds: string[];
  onChange: (next: string[]) => void;
}

/** Checkbox multi-select grouped by anchor; shared with CrossbowControls. */
export function AttachmentGroups({ attachments, selectedIds, onChange }: AttachmentGroupsProps) {
  const groups = ANCHOR_ORDER.map((anchor) => ({
    anchor,
    items: attachments.filter((a) => a.anchor === anchor),
  })).filter((g) => g.items.length > 0);

  function toggle(id: string, checked: boolean) {
    onChange(checked ? [...selectedIds, id] : selectedIds.filter((x) => x !== id));
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <fieldset key={group.anchor}>
          <legend className="mb-2 font-display text-[10px] uppercase tracking-stamp text-bone-faint">
            {ANCHOR_LABEL[group.anchor]}
          </legend>
          <div className="space-y-2">
            {group.items.map((att) => (
              <label key={att.id} className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 accent-ember"
                  checked={selectedIds.includes(att.id)}
                  onChange={(e) => toggle(att.id, e.target.checked)}
                />
                <span className="min-w-0">
                  <span className="block text-sm text-bone">{att.label}</span>
                  {att.note !== undefined && (
                    <span className="block text-xs text-bone-faint">{att.note}</span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

export interface FirearmControlsProps {
  build: FirearmBuild;
  rules: Ruleset;
  onChange: (next: FirearmBuild) => void;
}

export function FirearmControls({ build, rules, onChange }: FirearmControlsProps) {
  const c = rules.catalog;
  const frame = findById(c.frames, build.frameId);
  const action = findById(c.actions, build.actionId);
  const barrelType = findById(c.barrelTypes, build.barrelTypeId);
  const stock = findById(c.stocks, build.stockId);
  const cartridge = findById(c.cartridges, build.cartridgeId);
  const isShellFed = frame?.ammoClasses.includes("shell") ?? false;

  // Frame swap reseeds every dependent part; name, notes and still-valid
  // attachments survive the swap.
  function changeFrame(frameId: string) {
    const seed = newFirearmBuild(rules, frameId);
    onChange({
      ...seed,
      name: build.name,
      attachmentIds: build.attachmentIds.filter((id) => c.attachments.some((a) => a.id === id)),
      ...(build.notes !== undefined ? { notes: build.notes } : {}),
    });
  }

  const grantedModes = (action?.fireModeIds ?? [])
    .map((id) => findById(rules.firearms.fireModes, id)?.label)
    .filter((label): label is string => label !== undefined);
  const actionHint =
    grantedModes.length > 0 ? `Fire modes: ${grantedModes.join(", ")}` : "Grants no fire modes.";

  const cartridgeOptions = c.cartridges
    .filter((cart) => (frame ? frame.ammoClasses.includes(cart.class) : true))
    .map((cart) => ({ value: cart.id, label: cart.label }));

  return (
    <div className="space-y-5">
      <SelectField
        label="Frame"
        value={build.frameId}
        onChange={changeFrame}
        options={c.frames.map((f) => ({ value: f.id, label: `${f.label} — ${f.example}` }))}
        hint={frame ? `Accepts ${frame.ammoClasses.join(" / ")}-class ammunition.` : undefined}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          label="Action"
          value={build.actionId}
          onChange={(actionId) => onChange({ ...build, actionId })}
          options={c.actions.map((a) => ({ value: a.id, label: a.label }))}
          hint={actionHint}
        />
        <SelectField
          label="Feed system"
          value={build.magazineId}
          onChange={(magazineId) => onChange({ ...build, magazineId })}
          options={c.magazines.map((m) => ({ value: m.id, label: m.label }))}
          hint={findById(c.magazines, build.magazineId)?.reloadNote}
        />
      </div>

      {isShellFed ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label="Shell type"
            value={build.shellTypeId ?? ""}
            onChange={(shellTypeId) => onChange({ ...build, shellTypeId })}
            options={c.shellTypes.map((s) => ({ value: s.id, label: s.label }))}
            hint={findById(c.shellTypes, build.shellTypeId)?.note}
          />
          <SelectField
            label="Gauge"
            value={build.shellGaugeId ?? ""}
            onChange={(shellGaugeId) => onChange({ ...build, shellGaugeId })}
            options={c.shellGauges.map((g) => ({ value: g.id, label: g.label }))}
          />
        </div>
      ) : (
        <SelectField
          label="Cartridge"
          value={build.cartridgeId ?? ""}
          onChange={(cartridgeId) => onChange({ ...build, cartridgeId })}
          options={cartridgeOptions}
          hint={
            cartridge
              ? `${cartridge.class}-class — ${cartridge.joules} J muzzle energy.`
              : "Pick a round this frame can chamber."
          }
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          label="Barrel length (mm)"
          value={build.barrelLengthMm}
          onChange={(barrelLengthMm) => onChange({ ...build, barrelLengthMm })}
          min={50}
          max={1500}
          step={5}
        />
        <SelectField
          label="Barrel type"
          value={build.barrelTypeId}
          onChange={(barrelTypeId) => onChange({ ...build, barrelTypeId })}
          options={c.barrelTypes.map((b) => ({ value: b.id, label: b.label }))}
          hint={barrelType?.note}
        />
      </div>

      <Toggle
        label="Rifled barrel"
        checked={build.rifled}
        onChange={(rifled) => onChange({ ...build, rifled })}
      />

      <SelectField
        label="Stock"
        value={build.stockId}
        onChange={(stockId) => onChange({ ...build, stockId })}
        options={c.stocks.map((s) => ({ value: s.id, label: s.label }))}
        hint={stock?.note}
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
