"use client";

import Link from "next/link";
import { useState, type ChangeEvent } from "react";
import { parseWeaponExport } from "@shared/export";
import type { Weapon } from "@shared/types";
import { WeaponCard } from "@/components/armory/WeaponCard";
import { Button, buttonClasses } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { IconArmory, IconExport, IconPlus } from "@/components/ui/icons";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useRuleset, useWeapons } from "@/lib/data/context";

export default function ArmoryPage() {
  const { weapons, ready, create, remove } = useWeapons();
  const { ruleset } = useRuleset();

  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Weapon | null>(null);

  const closeImport = () => {
    setImportOpen(false);
    setImportText("");
    setImportError(null);
  };

  const handleImport = () => {
    const build = parseWeaponExport(importText);
    if (!build) {
      setImportError('Not a valid weapon export — expected an "ashen-skies/weapon@1" JSON document.');
      return;
    }
    create(build);
    closeImport();
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImportText(typeof reader.result === "string" ? reader.result : "");
      setImportError(null);
    };
    reader.readAsText(file);
    event.target.value = ""; // allow re-picking the same file
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ashen Armoury"
        title="Armory"
        description={
          ready && weapons.length > 0
            ? `${weapons.length} pattern${weapons.length === 1 ? "" : "s"} on the racks, statted live under “${ruleset.name}”.`
            : "Saved patterns live here and re-stat automatically whenever the rules change."
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <IconExport className="h-4 w-4" />
              Import JSON
            </Button>
            <Link href="/builder" className={buttonClasses("primary")}>
              <IconPlus className="h-4 w-4" />
              New weapon
            </Link>
          </>
        }
      />

      {!ready ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="surface-panel h-72 animate-pulse" />
          ))}
        </div>
      ) : weapons.length === 0 ? (
        <EmptyState
          icon={<IconArmory className="h-10 w-10" />}
          title="Racks are empty"
          body="Nothing fabricated yet. Build a pattern in the Fabricator, or import one from a JSON export."
          action={
            <Link href="/builder" className={buttonClasses("primary")}>
              Open the Fabricator
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {weapons.map((weapon) => (
            <WeaponCard
              key={weapon.id}
              weapon={weapon}
              rules={ruleset}
              onDelete={() => setPendingDelete(weapon)}
            />
          ))}
        </div>
      )}

      <Modal
        open={importOpen}
        onClose={closeImport}
        title="Import weapon JSON"
        footer={
          <>
            <Button variant="ghost" onClick={closeImport}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleImport} disabled={!importText.trim()}>
              Import
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field
            label="Weapon JSON"
            hint='Paste an "ashen-skies/weapon@1" export.'
            htmlFor="armory-import-json"
          >
            <textarea
              id="armory-import-json"
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value);
                setImportError(null);
              }}
              rows={8}
              spellCheck={false}
              placeholder='{ "schema": "ashen-skies/weapon@1", … }'
              className="w-full resize-y surface-inset px-3 py-2 font-mono text-xs text-bone placeholder:text-bone-faint"
            />
          </Field>
          <Field label="…or choose a file" htmlFor="armory-import-file">
            <input
              id="armory-import-file"
              type="file"
              accept=".json,application/json"
              onChange={handleFile}
              className="block w-full text-sm text-bone-soft file:mr-3 file:cursor-pointer file:rounded-card file:border file:border-solid file:border-rivet/50 file:bg-steel-800 file:px-3 file:py-1.5 file:text-sm file:text-bone hover:file:bg-steel-700"
            />
          </Field>
          {importError && <p className="text-sm text-blood">{importError}</p>}
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Scrap “${pendingDelete?.build.name || "Unnamed pattern"}”?`}
        body="This removes the pattern from your armory for good. Copied share links keep working — they carry the whole weapon."
        confirmLabel="Scrap it"
        onConfirm={() => {
          if (pendingDelete) remove(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
