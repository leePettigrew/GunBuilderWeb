"use client";

/**
 * The Forge canvas: an interactive schematic bench.
 *
 * Parts arrive from the procedural M1911 model, so they're clean vector
 * geometry rather than traced bitmap outlines. Click a part to select it,
 * drag to move, grab a corner to stretch, use the ring to rotate. Anchors
 * glow when a dragged part is near a socket it can seat into. Pan on empty
 * space or the middle button, zoom with the wheel.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GeneratedPart } from "@/lib/forge/m1911-model";
import { EXPLODE_DIR, INK_OPTIONS, partPivot, placementTransform, type ForgeState, type Placement } from "@/lib/forge/types";
import { cn } from "@/lib/cn";

// The bare pistol occupies x -2..218, y -21..135 at true millimetre scale, but
// a fitted suppressor nearly doubles that, so the view is fitted to the parts
// rather than pinned. This is the fallback and the aspect the canvas keeps.
const VIEW = { x: -16, y: -32, w: 250, h: 186 };
const VIEW_PAD = 18;

/** Bounds that hold every generated part, padded, at the canvas aspect. */
function fitView(parts: GeneratedPart[]) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of parts) {
    const [x, y, w, h] = p.bbox;
    if (![x, y, w, h].every(Number.isFinite)) continue;
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x + w);
    y1 = Math.max(y1, y + h);
  }
  if (!Number.isFinite(x0)) return { ...VIEW };
  x0 -= VIEW_PAD; y0 -= VIEW_PAD; x1 += VIEW_PAD; y1 += VIEW_PAD;
  const aspect = VIEW.w / VIEW.h;
  let w = x1 - x0;
  let h = y1 - y0;
  if (w / h < aspect) {
    const nw = h * aspect;
    x0 -= (nw - w) / 2;
    w = nw;
  } else {
    const nh = w / aspect;
    y0 -= (nh - h) / 2;
    h = nh;
  }
  return { x: x0, y: y0, w, h };
}
const SNAP_RADIUS = 10;

type Handle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

interface DragState {
  kind: "move" | "scale" | "rotate" | "pan";
  key?: string;
  handle?: Handle;
  startCanvas: [number, number];
  startScreen: [number, number];
  origin: Placement;
  originView: { x: number; y: number };
}

export interface ForgeCanvasProps {
  parts: GeneratedPart[];
  state: ForgeState;
  onChange: (patch: Partial<ForgeState>) => void;
  onUpdatePlacement: (key: string, patch: Partial<Placement>) => void;
  className?: string;
}

export function ForgeCanvas({ parts, state, onChange, onUpdatePlacement, className }: ForgeCanvasProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const fit = useMemo(() => fitView(parts), [parts]);
  const [view, setView] = useState({ x: fit.x, y: fit.y, zoom: 1 });
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [snapTarget, setSnapTarget] = useState<string | null>(null);

  const byId = useMemo(() => new Map(parts.map((p) => [p.id, p])), [parts]);
  const inkCss = INK_OPTIONS.find((i) => i.id === state.ink)?.css ?? INK_OPTIONS[0].css;

  const toCanvas = useCallback(
    (clientX: number, clientY: number): [number, number] => {
      const svg = svgRef.current;
      if (!svg) return [0, 0];
      const r = svg.getBoundingClientRect();
      return [
        view.x + ((clientX - r.left) / r.width) * (fit.w / view.zoom),
        view.y + ((clientY - r.top) / r.height) * (fit.h / view.zoom),
      ];
    },
    [view, fit],
  );

  // Fitting or pulling an attachment changes the extent, so recentre on it.
  useEffect(() => {
    setView((v) => ({ ...v, x: fit.x, y: fit.y }));
  }, [fit]);

  const selected = state.placements.find((p) => p.key === state.selectedKey) ?? null;
  const selectedPart = selected ? byId.get(selected.partId) ?? null : null;

  const boxOf = useCallback(
    (p: Placement, part: GeneratedPart) => {
      const [bx, by, bw, bh] = part.bbox;
      const [cx, cy] = partPivot(part);
      const dir = EXPLODE_DIR[part.id] ?? [0, 0];
      const w = bw * p.sx;
      const h = bh * p.sy;
      void bx;
      void by;
      return {
        x: cx - w / 2 + p.x + dir[0] * state.explode,
        y: cy - h / 2 + p.y + dir[1] * state.explode,
        w,
        h,
      };
    },
    [state.explode],
  );

  // frame sockets in world space
  const sockets = useMemo(() => {
    const frame = state.placements.find((p) => p.partId === "frame");
    const framePart = byId.get("frame");
    if (!frame || !framePart) return [] as { id: string; x: number; y: number }[];
    const dir = EXPLODE_DIR.frame ?? [0, 0];
    return Object.entries(framePart.anchors).map(([id, [ax, ay]]) => ({
      id,
      x: ax + frame.x + dir[0] * state.explode,
      y: ay + frame.y + dir[1] * state.explode,
    }));
  }, [state.placements, state.explode, byId]);

  const beginDrag = (e: React.PointerEvent, kind: DragState["kind"], key?: string, handle?: Handle) => {
    const target = key ? state.placements.find((p) => p.key === key) : null;
    if (kind !== "pan" && (!target || target.locked)) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDrag({
      kind, key, handle,
      startCanvas: toCanvas(e.clientX, e.clientY),
      startScreen: [e.clientX, e.clientY],
      origin: target ?? ({} as Placement),
      originView: { x: view.x, y: view.y },
    });
  };

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      const [cx, cy] = toCanvas(e.clientX, e.clientY);
      const dx = cx - drag.startCanvas[0];
      const dy = cy - drag.startCanvas[1];

      if (drag.kind === "pan") {
        const r = svgRef.current?.getBoundingClientRect();
        if (!r) return;
        setView((v) => ({
          ...v,
          x: drag.originView.x - ((e.clientX - drag.startScreen[0]) / r.width) * (fit.w / v.zoom),
          y: drag.originView.y - ((e.clientY - drag.startScreen[1]) / r.height) * (fit.h / v.zoom),
        }));
        return;
      }
      if (!drag.key) return;
      const part = byId.get(drag.origin.partId);
      if (!part) return;

      if (drag.kind === "move") {
        let nx = drag.origin.x + dx;
        let ny = drag.origin.y + dy;
        if (state.gridSnap) {
          nx = Math.round(nx / 2) * 2;
          ny = Math.round(ny / 2) * 2;
        }
        const anchorName = Object.keys(part.anchors)[0];
        const anchor = anchorName ? part.anchors[anchorName] : undefined;
        let hit: string | null = null;
        if (anchor) {
          const ax = anchor[0] + nx;
          const ay = anchor[1] + ny;
          for (const s of sockets) {
            if (s.id === part.slot && Math.hypot(s.x - ax, s.y - ay) < SNAP_RADIUS) {
              hit = s.id;
              break;
            }
          }
        }
        setSnapTarget(hit);
        onUpdatePlacement(drag.key, { x: nx, y: ny, slot: null });
        return;
      }

      if (drag.kind === "rotate") {
        const [pcx, pcy] = partPivot(part);
        const ox = pcx + drag.origin.x;
        const oy = pcy + drag.origin.y;
        const a0 = Math.atan2(drag.startCanvas[1] - oy, drag.startCanvas[0] - ox);
        const a1 = Math.atan2(cy - oy, cx - ox);
        let deg = drag.origin.rot + ((a1 - a0) * 180) / Math.PI;
        if (state.gridSnap) deg = Math.round(deg / 15) * 15;
        onUpdatePlacement(drag.key, { rot: deg });
        return;
      }

      if (drag.kind === "scale" && drag.handle) {
        const [, , bw, bh] = part.bbox;
        const h = drag.handle;
        let sx = drag.origin.sx;
        let sy = drag.origin.sy;
        if (h.includes("e")) sx = Math.max(0.2, drag.origin.sx + (dx * 2) / bw);
        if (h.includes("w")) sx = Math.max(0.2, drag.origin.sx - (dx * 2) / bw);
        if (h.includes("s")) sy = Math.max(0.2, drag.origin.sy + (dy * 2) / bh);
        if (h.includes("n")) sy = Math.max(0.2, drag.origin.sy - (dy * 2) / bh);
        if (e.shiftKey) {
          const u = (sx + sy) / 2;
          sx = u;
          sy = u;
        }
        onUpdatePlacement(drag.key, { sx, sy });
      }
    };
    const up = () => {
      if (drag.kind === "move" && drag.key && snapTarget) {
        onUpdatePlacement(drag.key, { slot: snapTarget, x: 0, y: 0 });
      }
      setSnapTarget(null);
      setDrag(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [drag, toCanvas, onUpdatePlacement, state.gridSnap, sockets, snapTarget, byId, fit.w, fit.h]);

  const onWheel = (e: React.WheelEvent) => {
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    const [mx, my] = toCanvas(e.clientX, e.clientY);
    setView((v) => {
      const zoom = Math.min(8, Math.max(0.35, v.zoom * factor));
      return {
        x: mx - (mx - v.x) * (v.zoom / zoom),
        y: my - (my - v.y) * (v.zoom / zoom),
        zoom,
      };
    });
  };

  const ordered = useMemo(
    () => [...state.placements].sort((a, b) => (byId.get(a.partId)?.z ?? 0) - (byId.get(b.partId)?.z ?? 0)),
    [state.placements, byId],
  );

  const vw = fit.w / view.zoom;
  const vh = fit.h / view.zoom;
  const selBox = selected && selectedPart ? boxOf(selected, selectedPart) : null;
  const hs = 3 / view.zoom;

  const HANDLES: { id: Handle; fx: number; fy: number }[] = [
    { id: "nw", fx: 0, fy: 0 }, { id: "n", fx: 0.5, fy: 0 }, { id: "ne", fx: 1, fy: 0 },
    { id: "e", fx: 1, fy: 0.5 }, { id: "se", fx: 1, fy: 1 }, { id: "s", fx: 0.5, fy: 1 },
    { id: "sw", fx: 0, fy: 1 }, { id: "w", fx: 0, fy: 0.5 },
  ];

  return (
    <svg
      ref={svgRef}
      viewBox={`${view.x} ${view.y} ${vw} ${vh}`}
      className={cn("touch-none select-none bg-steel-950", className)}
      onWheel={onWheel}
      onPointerDown={(e) => {
        if (e.button === 1 || e.target === svgRef.current) {
          if (e.target === svgRef.current) onChange({ selectedKey: null });
          beginDrag(e, "pan");
        }
      }}
      role="application"
      aria-label="Forge canvas"
    >
      <defs>
        <pattern id="forge-fine" width="5" height="5" patternUnits="userSpaceOnUse">
          <path d="M5,0 L0,0 L0,5" fill="none" stroke="rgb(var(--c-grid))" strokeWidth={0.15} opacity={0.55} />
        </pattern>
        <pattern id="forge-coarse" width="25" height="25" patternUnits="userSpaceOnUse">
          <rect width="25" height="25" fill="url(#forge-fine)" />
          <path d="M25,0 L0,0 L0,25" fill="none" stroke="rgb(var(--c-grid))" strokeWidth={0.35} opacity={0.9} />
        </pattern>
      </defs>
      {state.showGrid && <rect x={view.x} y={view.y} width={vw} height={vh} fill="url(#forge-coarse)" />}

      {/* datum line + overall dimension */}
      <g opacity={0.45} fontFamily="var(--font-mono)">
        <line x1={0} y1={-14} x2={0} y2={-6} stroke="rgb(var(--c-bone-faint))" strokeWidth={0.25} />
        <line x1={216} y1={-14} x2={216} y2={-6} stroke="rgb(var(--c-bone-faint))" strokeWidth={0.25} />
        <line x1={0} y1={-10} x2={216} y2={-10} stroke="rgb(var(--c-bone-faint))" strokeWidth={0.25} />
        <text x={108} y={-12} textAnchor="middle" fontSize={4} fill="rgb(var(--c-bone-faint))">
          216 MM
        </text>
      </g>

      {ordered.map((p) => {
        const part = byId.get(p.partId);
        if (!part || p.hidden) return null;
        const isSel = p.key === state.selectedKey;
        const isHover = p.key === hoverKey;
        const stroke = isSel ? "rgb(var(--c-ember))" : inkCss;
        return (
          <g
            key={p.key}
            transform={placementTransform(p, part, state.explode)}
            onPointerDown={(e) => {
              e.stopPropagation();
              onChange({ selectedKey: p.key });
              beginDrag(e, "move", p.key);
            }}
            onPointerEnter={() => setHoverKey(p.key)}
            onPointerLeave={() => setHoverKey((k) => (k === p.key ? null : k))}
            style={{ cursor: p.locked ? "not-allowed" : "grab" }}
          >
            {/* silhouette: filled so parts read as solid objects and are easy to grab */}
            {part.outline.map((d, i) => (
              <path
                key={`o${i}`}
                d={d}
                fill={isSel ? "rgb(var(--c-ember) / 0.14)" : isHover ? "rgb(var(--c-bone) / 0.07)" : "rgb(var(--c-steel-900) / 0.55)"}
                stroke={stroke}
                strokeWidth={0.9}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {part.paths.map((d, i) => (
              <path
                key={`d${i}`}
                d={d}
                fill="none"
                stroke={stroke}
                strokeWidth={0.45}
                strokeLinecap="round"
                opacity={0.85}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>
        );
      })}

      {(state.showAnchors || drag?.kind === "move") &&
        sockets.map((s) => {
          const active = snapTarget === s.id;
          return (
            <g key={s.id}>
              <circle cx={s.x} cy={s.y} r={active ? 3.6 : 2.2} fill="none"
                stroke={active ? "rgb(var(--c-ember))" : "rgb(var(--c-ember) / 0.5)"}
                strokeWidth={active ? 0.7 : 0.35} vectorEffect="non-scaling-stroke" />
              <circle cx={s.x} cy={s.y} r={0.7} fill="rgb(var(--c-ember))" />
              {active && (
                <text x={s.x + 4.5} y={s.y - 3.5} fontSize={3.6} fontFamily="var(--font-mono)" fill="rgb(var(--c-ember))">
                  {s.id.toUpperCase()}
                </text>
              )}
            </g>
          );
        })}

      {selBox && selected && (
        <g transform={`rotate(${selected.rot} ${selBox.x + selBox.w / 2} ${selBox.y + selBox.h / 2})`}>
          <rect x={selBox.x} y={selBox.y} width={selBox.w} height={selBox.h} fill="none"
            stroke="rgb(var(--c-ember) / 0.75)" strokeWidth={0.4} strokeDasharray="2 1.5"
            vectorEffect="non-scaling-stroke" />
          {HANDLES.map((h) => (
            <rect key={h.id}
              x={selBox.x + selBox.w * h.fx - hs / 2}
              y={selBox.y + selBox.h * h.fy - hs / 2}
              width={hs} height={hs}
              fill="rgb(var(--c-steel-950))" stroke="rgb(var(--c-ember))" strokeWidth={0.35}
              vectorEffect="non-scaling-stroke"
              style={{ cursor: "nwse-resize" }}
              onPointerDown={(e) => { e.stopPropagation(); beginDrag(e, "scale", selected.key, h.id); }}
            />
          ))}
          <line x1={selBox.x + selBox.w / 2} y1={selBox.y} x2={selBox.x + selBox.w / 2} y2={selBox.y - 8 / view.zoom}
            stroke="rgb(var(--c-ember) / 0.75)" strokeWidth={0.35} vectorEffect="non-scaling-stroke" />
          <circle cx={selBox.x + selBox.w / 2} cy={selBox.y - 8 / view.zoom} r={hs * 0.7}
            fill="rgb(var(--c-steel-950))" stroke="rgb(var(--c-ember))" strokeWidth={0.4}
            vectorEffect="non-scaling-stroke" style={{ cursor: "grab" }}
            onPointerDown={(e) => { e.stopPropagation(); beginDrag(e, "rotate", selected.key); }}
          />
        </g>
      )}
    </svg>
  );
}
