"use client";

/**
 * The 3D Workshop — Tarkov-style bench. Spawn pieces from the inventory,
 * drag them onto glowing anchor points to mount them, pull them off again,
 * rotate/scale with gizmos, blow the gun apart or lay every part out flat.
 */

import dynamic from "next/dynamic";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  PIECES,
  SLIDE_FINISHES,
  WEAPON_MODELS,
  type PieceDef,
  type PlacedPiece,
} from "@/lib/workshop/manifests";
import type { ViewerCallbacks, WorkshopState } from "@/components/workshop/WeaponViewer";
import { PART_LABELS } from "@/components/workshop/WeaponViewer";
import type { PartId } from "@/lib/workshop/manifests";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { SelectField, Toggle } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";

const WeaponViewer = dynamic(
  () => import("@/components/workshop/WeaponViewer").then((m) => m.WeaponViewer),
  { ssr: false, loading: () => <div className="surface-inset h-[560px] animate-pulse" /> },
);

const CATEGORY_ORDER: { key: PieceDef["category"]; label: string }[] = [
  { key: "suppressor", label: "Suppressors" },
  { key: "muzzle", label: "Muzzle devices" },
  { key: "rail", label: "Rails" },
  { key: "optic", label: "Optics" },
  { key: "magazine", label: "Magazines" },
  { key: "grip", label: "Grips" },
  { key: "laser", label: "Lasers" },
  { key: "light", label: "Lights" },
];

export default function WorkshopPage() {
  const keyCounter = useRef(0);
  const [state, setState] = useState<WorkshopState>({
    modelId: "glockModular",
    view: "assembled",
    explode: 0,
    clay: true,
    spin: false,
    finish: "gunmetal",
    placed: [
      { key: "seed-1", pieceId: "suppressorSlim", attachedTo: "muzzle", pos: [0.7, 0.3, 0], rot: [0, 0, 0], scale: [1, 1, 1] },
      { key: "seed-2", pieceId: "redDot", attachedTo: "railTop", pos: [0, 0.5, 0], rot: [0, 0, 0], scale: [1, 1, 1] },
    ],
    selectedKey: null,
    gizmo: "off",
  });
  const [hoveredPart, setHoveredPart] = useState<PartId | null>(null);

  const patch = (p: Partial<WorkshopState>) => setState((s) => ({ ...s, ...p }));

  const spawnPiece = (pieceId: string) => {
    keyCounter.current += 1;
    const key = `p${keyCounter.current}`;
    setState((s) => ({
      ...s,
      selectedKey: key,
      placed: [
        ...s.placed,
        {
          key,
          pieceId,
          attachedTo: null,
          // spawn loose on the bench in front of the gun
          pos: [-0.25 + (s.placed.length % 4) * 0.22, -0.28, 0.4],
          rot: [0, 0, 0],
          scale: [1, 1, 1],
        },
      ],
    }));
  };

  const cb = useMemo<ViewerCallbacks>(
    () => ({
      updatePiece: (key, piecePatch) =>
        setState((s) => ({
          ...s,
          placed: s.placed.map((p) => (p.key === key ? { ...p, ...piecePatch } : p)),
        })),
      selectPiece: (key) => setState((s) => ({ ...s, selectedKey: key })),
      onHoverPart: setHoveredPart,
    }),
    [],
  );

  const removeSelected = useCallback(() => {
    setState((s) => ({
      ...s,
      placed: s.placed.filter((p) => p.key !== s.selectedKey),
      selectedKey: null,
    }));
  }, []);

  const selected = state.placed.find((p) => p.key === state.selectedKey) ?? null;
  const selectedDef = selected ? PIECES.find((p) => p.id === selected.pieceId) : null;
  const credits = useMemo(() => {
    const list = [...WEAPON_MODELS.map((m) => m.credit)];
    for (const p of PIECES) if (p.credit) list.push(p.credit);
    return list;
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        eyebrow="3D bench — experimental"
        title="Workshop"
        description="Spawn pieces, drag them onto the glowing anchors to mount them, drag them off to strip the gun. Select a piece and use the gizmos to rotate or stretch it."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {hoveredPart !== null && <Badge tone="ember">{PART_LABELS[hoveredPart]}</Badge>}
            {selectedDef != null && <Badge tone="hazard">{selectedDef.label}</Badge>}
          </div>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_330px]">
        <div className="space-y-3">
          <div className="surface-panel overflow-hidden">
            <WeaponViewer state={state} cb={cb} className="h-[600px] w-full" />
          </div>
          {/* view + manipulation toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={state.view === "assembled" ? "primary" : "secondary"}
              size="sm"
              onClick={() => patch({ view: "assembled" })}
            >
              Assembled
            </Button>
            <Button
              variant={state.view === "bench" ? "primary" : "secondary"}
              size="sm"
              onClick={() => patch({ view: "bench", explode: 0 })}
            >
              Lay out all parts
            </Button>
            <span className="mx-1 h-5 w-px bg-rivet/50" />
            <label className="flex items-center gap-2 text-xs uppercase tracking-title text-bone-soft">
              Explode
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={state.explode}
                disabled={state.view === "bench"}
                onChange={(e) => patch({ explode: Number(e.target.value), view: "assembled" })}
                className="w-36 accent-[rgb(var(--c-ember))]"
                aria-label="Exploded view"
              />
            </label>
            <span className="mx-1 h-5 w-px bg-rivet/50" />
            {(["off", "rotate", "scale"] as const).map((mode) => (
              <Button
                key={mode}
                variant={state.gizmo === mode ? "primary" : "ghost"}
                size="sm"
                onClick={() => patch({ gizmo: mode })}
              >
                {mode === "off" ? "Drag" : mode === "rotate" ? "Rotate" : "Stretch"}
              </Button>
            ))}
            {selected !== null && (
              <Button variant="danger" size="sm" onClick={removeSelected}>
                Scrap selected
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Panel title="Platform" tone="raised">
            <div className="space-y-3">
              <SelectField
                label="Base model"
                value={state.modelId}
                onChange={(modelId) => patch({ modelId })}
                options={WEAPON_MODELS.map((m) => ({ value: m.id, label: m.label }))}
              />
              <SelectField
                label="Slide finish"
                value={state.finish}
                onChange={(finish) => patch({ finish })}
                options={SLIDE_FINISHES.map((f) => ({ value: f.id, label: f.label }))}
              />
              <Toggle label="Armory clay finish" checked={state.clay} onChange={(clay) => patch({ clay })} hint="Off = the model's own materials" />
              <Toggle label="Turntable spin" checked={state.spin} onChange={(spin) => patch({ spin })} />
            </div>
          </Panel>

          <Panel title="Inventory" tone="raised" bodyClassName="p-3">
            <div className="max-h-[380px] space-y-3 overflow-y-auto pr-1">
              {CATEGORY_ORDER.map(({ key, label }) => {
                const items = PIECES.filter((p) => p.category === key);
                if (items.length === 0) return null;
                return (
                  <div key={key}>
                    <p className="mb-1 font-display text-[10px] uppercase tracking-stamp text-bone-faint">{label}</p>
                    <div className="space-y-1">
                      {items.map((p) => (
                        <div key={p.id} className="flex items-center justify-between gap-2 rounded-card border border-rivet/30 bg-steel-900/60 px-2 py-1.5">
                          <span className="text-xs text-bone-soft">{p.label}</span>
                          <Button size="sm" variant="ghost" onClick={() => spawnPiece(p.id)}>
                            Spawn
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Model credits" tone="inset">
            <ul className="space-y-1 text-xs text-bone-faint">
              {credits.map((c) => (
                <li key={c.source}>
                  <a href={c.source} target="_blank" rel="noreferrer" className="underline decoration-rivet hover:text-bone-soft">
                    {c.title}
                  </a>{" "}
                  — {c.author} ({c.license})
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
