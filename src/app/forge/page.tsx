"use client";

/**
 * The Forge — full-screen 2D parts bench for the M1911, built from ink traced
 * out of Browning's original patent. Move parts, snap them to anchors, and
 * mold them: rotate, stretch each axis, flip, lock, hide.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ForgeCanvas } from "@/components/forge/ForgeCanvas";
import {
  FORGE_STORAGE_KEY,
  INK_OPTIONS,
  M1911_PARTS,
  PART_BY_ID,
  newForgeState,
  type ForgeExport,
  type ForgeState,
  type Placement,
} from "@/lib/forge/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { PageHeader } from "@/components/ui/PageHeader";
import { NumberField, SelectField, Toggle } from "@/components/ui/Field";
import { downloadJson } from "@/lib/download";
import { cn } from "@/lib/cn";

export default function ForgePage() {
  const [state, setState] = useState<ForgeState>(() => newForgeState());
  const [full, setFull] = useState(false);
  const [saved, setSaved] = useState(false);
  const shellRef = useRef<HTMLDivElement | null>(null);

  // restore a saved bench
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FORGE_STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw) as { placements?: Placement[] };
        if (Array.isArray(parsed.placements) && parsed.placements.length > 0) {
          setState((s) => ({
            ...s,
            placements: parsed.placements!.filter((p) => PART_BY_ID.has(p.partId)),
          }));
        }
      }
    } catch {
      /* corrupt save: keep the fresh build */
    }
  }, []);

  useEffect(() => {
    const onFs = () => setFull(document.fullscreenElement !== null);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const patch = useCallback((p: Partial<ForgeState>) => setState((s) => ({ ...s, ...p })), []);
  const updatePlacement = useCallback(
    (key: string, p: Partial<Placement>) =>
      setState((s) => ({
        ...s,
        placements: s.placements.map((pl) => (pl.key === key ? { ...pl, ...p } : pl)),
      })),
    [],
  );

  const selected = state.placements.find((p) => p.key === state.selectedKey) ?? null;
  const selectedPart = selected ? PART_BY_ID.get(selected.partId) ?? null : null;

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void shellRef.current?.requestFullscreen();
  };

  const saveBench = () => {
    try {
      localStorage.setItem(FORGE_STORAGE_KEY, JSON.stringify({ placements: state.placements }));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1600);
    } catch {
      /* quota */
    }
  };

  const exportSvg = () => {
    const parts = [...state.placements]
      .filter((p) => !p.hidden)
      .sort((a, b) => (PART_BY_ID.get(a.partId)?.z ?? 0) - (PART_BY_ID.get(b.partId)?.z ?? 0));
    const body = parts
      .map((p) => {
        const part = PART_BY_ID.get(p.partId);
        if (!part) return "";
        const t = `translate(${p.x} ${p.y})`;
        const paths = part.paths
          .map((d) => `<path d="${d}" fill="none" stroke="#c8d6e0" stroke-width="0.35"/>`)
          .join("");
        return `<g transform="${t}">${paths}</g>`;
      })
      .join("\n");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 -20 280 190">\n<rect x="-20" y="-20" width="280" height="190" fill="#0d1116"/>\n${body}\n</svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "m1911-forge.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJson = () => {
    const doc: ForgeExport = {
      schema: "ashen-skies/forge@1",
      exportedAt: new Date().toISOString(),
      placements: state.placements,
    };
    downloadJson("m1911-forge.json", doc);
  };

  const partRows = useMemo(
    () =>
      [...state.placements].sort(
        (a, b) => (PART_BY_ID.get(b.partId)?.z ?? 0) - (PART_BY_ID.get(a.partId)?.z ?? 0),
      ),
    [state.placements],
  );

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2 border-t border-rivet/40 bg-steel-900/80 px-3 py-2">
      <label className="flex items-center gap-2 text-[11px] uppercase tracking-title text-bone-soft">
        Explode
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={state.explode}
          onChange={(e) => patch({ explode: Number(e.target.value) })}
          className="w-32 accent-[rgb(var(--c-ember))]"
          aria-label="Exploded view"
        />
      </label>
      <span className="h-5 w-px bg-rivet/50" />
      <Button size="sm" variant={state.showAnchors ? "primary" : "ghost"} onClick={() => patch({ showAnchors: !state.showAnchors })}>
        Anchors
      </Button>
      <Button size="sm" variant={state.showGrid ? "primary" : "ghost"} onClick={() => patch({ showGrid: !state.showGrid })}>
        Grid
      </Button>
      <Button size="sm" variant={state.gridSnap ? "primary" : "ghost"} onClick={() => patch({ gridSnap: !state.gridSnap })}>
        Snap
      </Button>
      <span className="h-5 w-px bg-rivet/50" />
      <Button size="sm" variant="ghost" onClick={() => patch({ placements: newForgeState().placements, selectedKey: null })}>
        Reassemble
      </Button>
      <Button size="sm" variant="secondary" onClick={saveBench}>
        {saved ? "Saved" : "Save bench"}
      </Button>
      <Button size="sm" variant="secondary" onClick={exportSvg}>
        Export SVG
      </Button>
      <Button size="sm" variant="secondary" onClick={exportJson}>
        Export JSON
      </Button>
      <span className="grow" />
      <Button size="sm" variant="primary" onClick={toggleFullscreen}>
        {full ? "Exit full screen" : "Full screen"}
      </Button>
    </div>
  );

  const inspector = (
    <Panel title="Part inspector" tone="raised">
      {selected === null || selectedPart === null ? (
        <p className="text-sm text-bone-faint">
          Select a part on the bench to move, rotate, stretch or flip it.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="heading-stencil text-sm text-bone">{selectedPart.label}</span>
            <Badge tone={selected.slot === null ? "hazard" : "olive"}>
              {selected.slot === null ? "Free" : `Anchored: ${selected.slot}`}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="X (mm)" value={Math.round(selected.x * 10) / 10} step={0.5} onChange={(x) => updatePlacement(selected.key, { x, slot: null })} />
            <NumberField label="Y (mm)" value={Math.round(selected.y * 10) / 10} step={0.5} onChange={(y) => updatePlacement(selected.key, { y, slot: null })} />
            <NumberField label="Rotation°" value={Math.round(selected.rot * 10) / 10} step={1} onChange={(rot) => updatePlacement(selected.key, { rot })} />
            <NumberField label="Stretch X" value={Math.round(selected.sx * 100) / 100} step={0.05} min={0.15} onChange={(sx) => updatePlacement(selected.key, { sx })} />
            <NumberField label="Stretch Y" value={Math.round(selected.sy * 100) / 100} step={0.05} min={0.15} onChange={(sy) => updatePlacement(selected.key, { sy })} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={() => updatePlacement(selected.key, { flipX: !selected.flipX })}>
              Flip X
            </Button>
            <Button size="sm" variant="ghost" onClick={() => updatePlacement(selected.key, { flipY: !selected.flipY })}>
              Flip Y
            </Button>
            <Button size="sm" variant="ghost" onClick={() => updatePlacement(selected.key, { rot: 0, sx: 1, sy: 1, flipX: false, flipY: false })}>
              Reset shape
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                updatePlacement(selected.key, {
                  slot: selected.slot === null ? selectedPart.slot : null,
                  x: 0,
                  y: 0,
                })
              }
            >
              {selected.slot === null ? "Re-anchor" : "Detach"}
            </Button>
          </div>
        </div>
      )}
    </Panel>
  );

  const partsList = (
    <Panel title="Parts" tone="raised" bodyClassName="p-2">
      <ul className="max-h-[320px] space-y-1 overflow-y-auto pr-1">
        {partRows.map((p) => {
          const part = PART_BY_ID.get(p.partId);
          if (!part) return null;
          const isSel = p.key === state.selectedKey;
          return (
            <li key={p.key}>
              <div
                className={cn(
                  "flex items-center gap-2 rounded-card border px-2 py-1.5 transition-colors",
                  isSel ? "border-ember/60 bg-steel-800" : "border-rivet/30 bg-steel-900/60 hover:border-rivet/60",
                )}
              >
                <button
                  type="button"
                  onClick={() => patch({ selectedKey: p.key })}
                  className="flex-1 text-left text-xs text-bone-soft"
                >
                  {part.label}
                  {p.slot === null && <span className="ml-1 text-[10px] text-hazard">free</span>}
                </button>
                <button
                  type="button"
                  onClick={() => updatePlacement(p.key, { hidden: !p.hidden })}
                  aria-label={p.hidden ? `Show ${part.label}` : `Hide ${part.label}`}
                  className="rounded px-1 text-[10px] uppercase text-bone-faint hover:text-bone"
                >
                  {p.hidden ? "show" : "hide"}
                </button>
                <button
                  type="button"
                  onClick={() => updatePlacement(p.key, { locked: !p.locked })}
                  aria-label={p.locked ? `Unlock ${part.label}` : `Lock ${part.label}`}
                  className={cn("rounded px-1 text-[10px] uppercase hover:text-bone", p.locked ? "text-ember" : "text-bone-faint")}
                >
                  {p.locked ? "locked" : "lock"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );

  return (
    <div className="animate-fade-in space-y-6">
      {!full && (
        <PageHeader
          eyebrow="2D schematic bench"
          title="The Forge"
          description="Every part traced from Browning's 1911 patent. Drag to move, grab a corner to stretch, use the ring to rotate — anchors glow when a part can snap home."
          actions={<Badge tone="ember">{M1911_PARTS.length} parts</Badge>}
        />
      )}

      <div
        ref={shellRef}
        className={cn(
          "grid gap-4",
          full ? "h-screen grid-cols-[1fr_300px] bg-steel-950 p-3" : "xl:grid-cols-[1fr_320px]",
        )}
      >
        <div className="surface-panel flex min-h-0 flex-col overflow-hidden">
          <ForgeCanvas
            state={state}
            onChange={patch}
            onUpdatePlacement={updatePlacement}
            className={cn("w-full flex-1", full ? "min-h-0" : "h-[620px]")}
          />
          {toolbar}
        </div>

        <div className={cn("space-y-4", full && "overflow-y-auto")}>
          {inspector}
          {partsList}
          <Panel title="Ink" tone="raised">
            <SelectField
              label="Line colour"
              value={state.ink}
              onChange={(ink) => patch({ ink })}
              options={INK_OPTIONS.map((i) => ({ value: i.id, label: i.label }))}
            />
          </Panel>
          {!full && (
            <Panel title="Source" tone="inset">
              <p className="text-xs text-bone-faint">
                Traced from{" "}
                <a
                  href="https://patents.google.com/patent/US984519A/en"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-rivet hover:text-bone-soft"
                >
                  US Patent 984,519
                </a>{" "}
                — J. M. Browning, &ldquo;Firearm&rdquo;, granted 14 Feb 1911. Public domain.
              </p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
