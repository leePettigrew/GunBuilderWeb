"use client";

import { useRef, useState } from "react";
import { exportRuleset, parseRulesetExport } from "@shared/export";
import type { Ruleset } from "@shared/types";
import { RulePreview } from "@/components/rules/RulePreview";
import { RulesLab } from "@/components/rules/RulesLab";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TextField } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useRuleset } from "@/lib/data/context";
import { downloadJson, slugify } from "@/lib/download";

export default function RulesPage() {
  const { ruleset, setRuleset, resetRuleset, isCustomized } = useRuleset();
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<Ruleset | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const tryImport = (json: string) => {
    const parsed = parseRulesetExport(json);
    if (parsed === null) {
      setImportError("That isn't a valid ashen-skies/ruleset@1 export.");
      return;
    }
    setImportError(null);
    setPendingImport(parsed);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        eyebrow="Every constant, live"
        title="Rules Lab"
        description="Rewrite the inner workings of the damage model. Changes apply instantly to every weapon in the armory — nothing is baked into saved builds."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isCustomized && <Badge tone="hazard">Customized</Badge>}
            <Button variant="secondary" onClick={() => downloadJson(`${slugify(ruleset.name)}-ruleset.json`, exportRuleset(ruleset))}>
              Export ruleset
            </Button>
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              Import
            </Button>
            <Button variant="danger" onClick={() => setResetOpen(true)}>
              Reset to V5 defaults
            </Button>
          </div>
        }
      />

      <div className="max-w-md">
        <TextField
          label="Ruleset name"
          value={ruleset.name}
          onChange={(name) => setRuleset({ ...ruleset, name })}
          hint="Stamped onto exports and shared-weapon field copies"
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_400px]">
        <RulesLab />
        <div className="lg:sticky lg:top-6">
          <RulePreview ruleset={ruleset} />
        </div>
      </div>

      <Modal
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          setImportError(null);
        }}
        title="Import ruleset"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => tryImport(importText)} disabled={importText.trim() === ""}>
              Parse & review
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-bone-soft">
            Paste an <code className="font-mono text-xs">ashen-skies/ruleset@1</code> export, or choose a file.
          </p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={8}
            className="w-full rounded-card border border-rivet/40 bg-steel-950/60 p-3 font-mono text-xs text-bone focus:border-ember/60 focus:outline-none"
            placeholder='{"schema":"ashen-skies/ruleset@1", …}'
          />
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="block w-full text-xs text-bone-faint file:mr-3 file:rounded-card file:border-0 file:bg-steel-700 file:px-3 file:py-1.5 file:text-xs file:text-bone"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                const text = typeof reader.result === "string" ? reader.result : "";
                setImportText(text);
                tryImport(text);
              };
              reader.readAsText(file);
            }}
          />
          {importError !== null && <p className="text-sm text-blood">{importError}</p>}
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingImport !== null}
        title="Overwrite active ruleset?"
        body={`This replaces "${ruleset.name}" with "${pendingImport?.name ?? ""}". Every weapon in the armory will re-stat under the imported model.`}
        confirmLabel="Import & overwrite"
        onConfirm={() => {
          if (pendingImport !== null) setRuleset(pendingImport);
          setPendingImport(null);
          setImportOpen(false);
          setImportText("");
        }}
        onCancel={() => setPendingImport(null)}
      />

      <ConfirmDialog
        open={resetOpen}
        title="Reset to V5 defaults?"
        body="All customizations are discarded and the stock Ashen Skies V5 ruleset returns. Saved weapons keep their builds and simply re-stat."
        confirmLabel="Reset"
        onConfirm={() => {
          resetRuleset();
          setResetOpen(false);
        }}
        onCancel={() => setResetOpen(false)}
      />
    </div>
  );
}
