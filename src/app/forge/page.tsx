"use client";

/**
 * The Forge — a full-screen parts bench for a procedurally generated M1911.
 *
 * The pistol is built from parameters, not pictures: change the slide
 * profile, barrel length, grip rake or checker pitch and every affected part
 * is redrawn from scratch. Parts can still be pulled off the frame, moved,
 * rotated, stretched and snapped back onto their anchors.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ForgeCanvas } from "@/components/forge/ForgeCanvas";
import {
  DEFAULT_PARAMS,
  FORGE_STORAGE_KEY,
  INK_OPTIONS,
  generateM1911,
  newForgeState,
  reconcilePlacements,
  type ForgeExport,
  type ForgeState,
  type M1911Params,
  type Placement,
} from "@/lib/forge/types";
import { PARAM_SPECS, PROFILE_BARREL, type ParamSpec } from "@/lib/forge/m1911-model";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { PageHeader } from "@/components/ui/PageHeader";
import { NumberField, SelectField, Toggle } from "@/components/ui/Field";
import { downloadJson } from "@/lib/download";
import { cn } from "@/lib/cn";

const GROUPS = ["Slide", "Frame", "Grip", "Controls", "Attachments"] as const;

export default function ForgePage() {
  const [state, setState] = useState<ForgeState>(() => newForgeState());
  const [full, setFull] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"design" | "parts">("design");
  const shellRef = useRef<HTMLDivElement | null>(null);

  const parts = useMemo(() => generateM1911(state.params), [state.params]);
  const byId = useMemo(() => new Map(parts.map((p) => [p.id, p])), [parts]);

  // Fitting or pulling an attachment changes which parts exist, so the bench
  // has to follow. reconcilePlacements keeps the user's transforms for parts
  // that survive and returns the same array when nothing moved.
  useEffect(() => {
    setState((s) => {
      const next = reconcilePlacements(s.placements, parts);
      return next === s.placements ? s : { ...s, placements: next };
    });
  }, [parts]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FORGE_STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw) as { params?: M1911Params; placements?: Placement[] };
        setState((s) => ({
          ...s,
          params: parsed.params ? { ...DEFAULT_PARAMS, ...parsed.params } : s.params,
          placements: Array.isArray(parsed.placements) && parsed.placements.length > 0 ? parsed.placements : s.placements,
        }));
      }
    } catch {
      /* corrupt save: keep the fresh bench */
    }
  }, []);

  useEffect(() => {
    const onFs = () => setFull(document.fullscreenElement !== null);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const patch = useCallback((p: Partial<ForgeState>) => setState((s) => ({ ...s, ...p })), []);
  const setParam = useCallback(
    <K extends keyof M1911Params>(key: K, value: M1911Params[K]) =>
      setState((s) => {
        const params = { ...s.params, [key]: value };
        if (key === "slideProfile") params.barrelLength = PROFILE_BARREL[value as keyof typeof PROFILE_BARREL];
        return { ...s, params };
      }),
    [],
  );
  const updatePlacement = useCallback(
    (key: string, p: Partial<Placement>) =>
      setState((s) => ({ ...s, placements: s.placements.map((pl) => (pl.key === key ? { ...pl, ...p } : pl)) })),
    [],
  );

  const selected = state.placements.find((p) => p.key === state.selectedKey) ?? null;
  const selectedPart = selected ? byId.get(selected.partId) ?? null : null;

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void shellRef.current?.requestFullscreen();
  };

  const saveBench = () => {
    try {
      localStorage.setItem(FORGE_STORAGE_KEY, JSON.stringify({ params: state.params, placements: state.placements }));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1600);
    } catch {
      /* quota */
    }
  };

  const exportSvg = () => {
    const body = [...state.placements]
      .filter((p) => !p.hidden)
      .sort((a, b) => (byId.get(a.partId)?.z ?? 0) - (byId.get(b.partId)?.z ?? 0))
      .map((p) => {
        const part = byId.get(p.partId);
        if (!part) return "";
        const outline = part.outline
          .map((d) => `<path d="${d}" fill="none" stroke="#c8d6e0" stroke-width="0.9"/>`)
          .join("");
        const det = part.paths
          .map((d) => `<path d="${d}" fill="none" stroke="#c8d6e0" stroke-width="0.45" opacity="0.85"/>`)
          .join("");
        return `<g transform="translate(${p.x} ${p.y})">${outline}${det}</g>`;
      })
      .join("\n");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 -30 270 190">\n<rect x="-20" y="-30" width="270" height="190" fill="#0d1116"/>\n${body}\n</svg>`;
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
      schema: "ashen-skies/forge@2",
      exportedAt: new Date().toISOString(),
      params: state.params,
      placements: state.placements,
    };
    downloadJson("m1911-forge.json", doc);
  };

  const renderParam = (spec: ParamSpec) => {
    const value = state.params[spec.key];
    if (spec.kind === "toggle") {
      return (
        <Toggle
          key={spec.key}
          label={spec.label}
          checked={value === true}
          onChange={(v) => setParam(spec.key, v as M1911Params[typeof spec.key])}
        />
      );
    }
    if (spec.kind === "select") {
      return (
        <SelectField
          key={spec.key}
          label={spec.label}
          value={String(value)}
          options={spec.options ?? []}
          onChange={(v) => setParam(spec.key, v as M1911Params[typeof spec.key])}
        />
      );
    }
    return (
      <div key={spec.key} className="space-y-1">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium uppercase tracking-title text-bone-soft">{spec.label}</span>
          <span className="numerals text-xs text-ember">
            {typeof value === "number" ? Math.round(value * 10) / 10 : ""}
            {spec.unit ?? ""}
          </span>
        </div>
        <input
          type="range"
          min={spec.min}
          max={spec.max}
          step={spec.step}
          value={typeof value === "number" ? value : 0}
          onChange={(e) => setParam(spec.key, Number(e.target.value) as M1911Params[typeof spec.key])}
          className="w-full accent-[rgb(var(--c-ember))]"
          aria-label={spec.label}
        />
      </div>
    );
  };

  const designPanel = (
    <div className="space-y-3">
      {GROUPS.map((g) => {
        const specs = PARAM_SPECS.filter((s) => s.group === g);
        if (specs.length === 0) return null;
        return (
          <Panel key={g} title={g} tone="raised" bodyClassName="p-3">
            <div className="space-y-3">{specs.map(renderParam)}</div>
          </Panel>
        );
      })}
      <Button variant="ghost" size="sm" onClick={() => patch({ params: { ...DEFAULT_PARAMS } })}>
        Reset to GI spec
      </Button>
    </div>
  );

  const partsPanel = (
    <div className="space-y-3">
      <Panel title="Part inspector" tone="raised">
        {selected === null || selectedPart === null ? (
          <p className="text-sm text-bone-faint">Select a part on the bench to move, rotate, stretch or flip it.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="heading-stencil text-sm text-bone">{selectedPart.label}</span>
              <Badge tone={selected.slot === null ? "hazard" : "olive"}>
                {selected.slot === null ? "Free" : "Seated"}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="X (mm)" value={Math.round(selected.x * 10) / 10} step={0.5} onChange={(x) => updatePlacement(selected.key, { x, slot: null })} />
              <NumberField label="Y (mm)" value={Math.round(selected.y * 10) / 10} step={0.5} onChange={(y) => updatePlacement(selected.key, { y, slot: null })} />
              <NumberField label="Rotation°" value={Math.round(selected.rot * 10) / 10} step={1} onChange={(rot) => updatePlacement(selected.key, { rot })} />
              <NumberField label="Stretch X" value={Math.round(selected.sx * 100) / 100} step={0.05} min={0.2} onChange={(sx) => updatePlacement(selected.key, { sx })} />
              <NumberField label="Stretch Y" value={Math.round(selected.sy * 100) / 100} step={0.05} min={0.2} onChange={(sy) => updatePlacement(selected.key, { sy })} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" onClick={() => updatePlacement(selected.key, { flipX: !selected.flipX })}>Flip X</Button>
              <Button size="sm" variant="ghost" onClick={() => updatePlacement(selected.key, { flipY: !selected.flipY })}>Flip Y</Button>
              <Button size="sm" variant="ghost" onClick={() => updatePlacement(selected.key, { rot: 0, sx: 1, sy: 1, flipX: false, flipY: false })}>Reset shape</Button>
              <Button size="sm" variant="secondary" onClick={() => updatePlacement(selected.key, { slot: selected.slot === null ? selectedPart.slot : null, x: 0, y: 0 })}>
                {selected.slot === null ? "Seat" : "Detach"}
              </Button>
            </div>
          </div>
        )}
      </Panel>

      <Panel title="Parts" tone="raised" bodyClassName="p-2">
        <ul className="space-y-1">
          {[...state.placements]
            .sort((a, b) => (byId.get(b.partId)?.z ?? 0) - (byId.get(a.partId)?.z ?? 0))
            .map((p) => {
              const part = byId.get(p.partId);
              if (!part) return null;
              const isSel = p.key === state.selectedKey;
              return (
                <li key={p.key}>
                  <div className={cn("flex items-center gap-2 rounded-card border px-2 py-1.5 transition-colors",
                    isSel ? "border-ember/60 bg-steel-800" : "border-rivet/30 bg-steel-900/60 hover:border-rivet/60")}>
                    <button type="button" onClick={() => patch({ selectedKey: p.key })} className="flex-1 text-left text-xs text-bone-soft">
                      {part.label}
                      {p.slot === null && <span className="ml-1 text-[10px] text-hazard">free</span>}
                    </button>
                    <button type="button" onClick={() => updatePlacement(p.key, { hidden: !p.hidden })}
                      aria-label={p.hidden ? `Show ${part.label}` : `Hide ${part.label}`}
                      className="rounded px-1 text-[10px] uppercase text-bone-faint hover:text-bone">
                      {p.hidden ? "show" : "hide"}
                    </button>
                    <button type="button" onClick={() => updatePlacement(p.key, { locked: !p.locked })}
                      aria-label={p.locked ? `Unlock ${part.label}` : `Lock ${part.label}`}
                      className={cn("rounded px-1 text-[10px] uppercase hover:text-bone", p.locked ? "text-ember" : "text-bone-faint")}>
                      {p.locked ? "locked" : "lock"}
                    </button>
                  </div>
                </li>
              );
            })}
        </ul>
      </Panel>

      <Panel title="Ink" tone="raised">
        <SelectField label="Line colour" value={state.ink} onChange={(ink) => patch({ ink })}
          options={INK_OPTIONS.map((i) => ({ value: i.id, label: i.label }))} />
      </Panel>
    </div>
  );

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2 border-t border-rivet/40 bg-steel-900/80 px-3 py-2">
      <label className="flex items-center gap-2 text-[11px] uppercase tracking-title text-bone-soft">
        Explode
        <input type="range" min={0} max={1} step={0.01} value={state.explode}
          onChange={(e) => patch({ explode: Number(e.target.value) })}
          className="w-28 accent-[rgb(var(--c-ember))]" aria-label="Exploded view" />
      </label>
      <span className="h-5 w-px bg-rivet/50" />
      <Button size="sm" variant={state.showAnchors ? "primary" : "ghost"} onClick={() => patch({ showAnchors: !state.showAnchors })}>Anchors</Button>
      <Button size="sm" variant={state.showGrid ? "primary" : "ghost"} onClick={() => patch({ showGrid: !state.showGrid })}>Grid</Button>
      <Button size="sm" variant={state.gridSnap ? "primary" : "ghost"} onClick={() => patch({ gridSnap: !state.gridSnap })}>Snap</Button>
      <span className="h-5 w-px bg-rivet/50" />
      <Button size="sm" variant="ghost" onClick={() => patch({ placements: newForgeState().placements, selectedKey: null, explode: 0 })}>Reassemble</Button>
      <Button size="sm" variant="secondary" onClick={saveBench}>{saved ? "Saved" : "Save"}</Button>
      <Button size="sm" variant="secondary" onClick={exportSvg}>SVG</Button>
      <Button size="sm" variant="secondary" onClick={exportJson}>JSON</Button>
      <span className="grow" />
      <Button size="sm" variant="primary" onClick={toggleFullscreen}>{full ? "Exit full screen" : "Full screen"}</Button>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-6">
      {!full && (
        <PageHeader
          eyebrow="Procedural schematic bench"
          title="The Forge"
          description="A 1911 built from parameters, not pictures. Retune the design and every part redraws itself; pull parts off the frame to move, rotate and stretch them."
          actions={<Badge tone="ember">{parts.length} parts</Badge>}
        />
      )}

      <div ref={shellRef} className={cn("grid items-start gap-4", full ? "h-screen grid-cols-[1fr_320px] bg-steel-950 p-3" : "xl:grid-cols-[1fr_340px]")}>
        <div className="surface-panel flex min-h-0 flex-col overflow-hidden">
          <ForgeCanvas
            parts={parts}
            state={state}
            onChange={patch}
            onUpdatePlacement={updatePlacement}
            className={cn("w-full", full ? "min-h-0 flex-1" : "h-[600px]")}
          />
          {toolbar}
        </div>

        <div className={cn("space-y-3", full && "overflow-y-auto")}>
          <div className="flex gap-1 rounded-card border border-rivet/40 bg-steel-900/60 p-1">
            {(["design", "parts"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 rounded-sm px-3 py-1.5 font-display text-xs uppercase tracking-title transition-colors",
                  tab === t ? "bg-ember text-steel-950" : "text-bone-soft hover:text-bone",
                )}
              >
                {t === "design" ? "Design" : "Parts"}
              </button>
            ))}
          </div>
          {tab === "design" ? designPanel : partsPanel}
        </div>
      </div>
    </div>
  );
}
