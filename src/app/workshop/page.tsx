"use client";

/**
 * The 3D Workshop — Tarkov-style inspect bench for pistol-class weapons.
 * Real sourced models (CC/PD), unified armory-clay finish or original
 * textures, socketed attachments, part toggles and exploded view.
 */

import dynamic from "next/dynamic";
import { useState } from "react";
import { WEAPON_MODELS, ATTACHMENT_MODELS, type PartId } from "@/lib/workshop/manifests";
import type { WorkshopState } from "@/components/workshop/WeaponViewer";
import { PART_LABELS } from "@/components/workshop/WeaponViewer";
import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { SelectField, Toggle } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";

const WeaponViewer = dynamic(
  () => import("@/components/workshop/WeaponViewer").then((m) => m.WeaponViewer),
  { ssr: false, loading: () => <div className="surface-inset h-[520px] animate-pulse" /> },
);

export default function WorkshopPage() {
  const [state, setState] = useState<WorkshopState>({
    modelId: "glockModular",
    attachmentIds: ["suppressor", "redDot"],
    magMode: "standard",
    slideOn: true,
    clay: true,
    exploded: 0,
    spin: false,
  });
  const [hoveredPart, setHoveredPart] = useState<PartId | null>(null);
  const [selectedPart, setSelectedPart] = useState<PartId | null>(null);

  const patch = (p: Partial<WorkshopState>) => setState((s) => ({ ...s, ...p }));
  const toggleAttachment = (id: string) =>
    patch({
      attachmentIds: state.attachmentIds.includes(id)
        ? state.attachmentIds.filter((a) => a !== id)
        : [...state.attachmentIds, id],
    });

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        eyebrow="3D bench — experimental"
        title="Workshop"
        description="Inspect and customize on real sourced models. Drag to orbit, scroll to zoom, hover parts to identify them, click to select."
        actions={
          <div className="flex items-center gap-2">
            {hoveredPart !== null && <Badge tone="ember">{PART_LABELS[hoveredPart]}</Badge>}
            {selectedPart !== null && <Badge tone="hazard">Selected: {PART_LABELS[selectedPart]}</Badge>}
          </div>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <div className="surface-panel overflow-hidden">
          <WeaponViewer
            state={state}
            onHoverPart={setHoveredPart}
            onSelectPart={setSelectedPart}
            className="h-[560px] w-full"
          />
        </div>

        <div className="space-y-4">
          <Panel title="Platform" tone="raised">
            <SelectField
              label="Base model"
              value={state.modelId}
              onChange={(modelId) => patch({ modelId })}
              options={WEAPON_MODELS.map((m) => ({ value: m.id, label: m.label }))}
            />
          </Panel>

          <Panel title="Parts" tone="raised">
            <div className="space-y-3">
              <SelectField
                label="Magazine"
                value={state.magMode}
                onChange={(v) => patch({ magMode: v as WorkshopState["magMode"] })}
                options={[
                  { value: "standard", label: "Standard magazine" },
                  { value: "extended", label: "Extended magazine" },
                  { value: "removed", label: "Removed" },
                ]}
              />
              <Toggle label="Slide fitted" checked={state.slideOn} onChange={(slideOn) => patch({ slideOn })} />
            </div>
          </Panel>

          <Panel title="Attachments" tone="raised">
            <div className="space-y-2">
              {ATTACHMENT_MODELS.map((a) => (
                <Toggle
                  key={a.id}
                  label={`${a.label} (${a.socket})`}
                  checked={state.attachmentIds.includes(a.id)}
                  onChange={() => toggleAttachment(a.id)}
                />
              ))}
            </div>
          </Panel>

          <Panel title="Finish & view" tone="raised">
            <div className="space-y-3">
              <Toggle label="Armory clay finish" checked={state.clay} onChange={(clay) => patch({ clay })} hint="Off = the model's own materials" />
              <Toggle label="Turntable spin" checked={state.spin} onChange={(spin) => patch({ spin })} />
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-title text-bone-soft">
                  Exploded view
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={state.exploded}
                  onChange={(e) => patch({ exploded: Number(e.target.value) })}
                  className="w-full accent-[rgb(var(--c-ember))]"
                  aria-label="Exploded view"
                />
              </label>
            </div>
          </Panel>

          <Panel title="Model credits" tone="inset">
            <ul className="space-y-1 text-xs text-bone-faint">
              {[...WEAPON_MODELS.map((m) => m.credit), ...ATTACHMENT_MODELS.flatMap((a) => (a.credit ? [a.credit] : []))].map(
                (c) => (
                  <li key={c.source}>
                    <a href={c.source} target="_blank" rel="noreferrer" className="underline decoration-rivet hover:text-bone-soft">
                      {c.title}
                    </a>{" "}
                    — {c.author} ({c.license})
                  </li>
                ),
              )}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
