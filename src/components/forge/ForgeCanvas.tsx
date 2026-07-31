"use client";

/**
 * The Forge canvas: an interactive schematic bench.
 *
 * Parts are real traced ink from the Browning patent. Click one to select it,
 * drag to move, grab a corner to stretch, grab the ring to rotate. Anchors
 * glow when a dragged part is near a socket it can snap into. Pan with the
 * middle button or empty space, zoom with the wheel.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EXPLODE_DIR,
  INK_OPTIONS,
  PART_BY_ID,
  partPivot,
  placementTransform,
  type ForgePart,
  type ForgeState,
  type Placement,
} from "@/lib/forge/types";
import { cn } from "@/lib/cn";

const VIEW = { x: -30, y: -34, w: 300, h: 200 };
const SNAP_RADIUS = 9; // canvas units

type Handle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "rot";

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
  state: ForgeState;
  onChange: (patch: Partial<ForgeState>) => void;
  onUpdatePlacement: (key: string, patch: Partial<Placement>) => void;
  className?: string;
}

export function ForgeCanvas({ state, onChange, onUpdatePlacement, className }: ForgeCanvasProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [view, setView] = useState({ x: VIEW.x, y: VIEW.y, zoom: 1 });
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [snapTarget, setSnapTarget] = useState<string | null>(null);

  const inkCss = INK_OPTIONS.find((i) => i.id === state.ink)?.css ?? INK_OPTIONS[0].css;

  /** screen px -> canvas units */
  const toCanvas = useCallback((clientX: number, clientY: number): [number, number] => {
    const svg = svgRef.current;
    if (!svg) return [0, 0];
    const r = svg.getBoundingClientRect();
    const w = VIEW.w / view.zoom;
    const h = VIEW.h / view.zoom;
    return [view.x + ((clientX - r.left) / r.width) * w, view.y + ((clientY - r.top) / r.height) * h];
  }, [view]);

  const selected = state.placements.find((p) => p.key === state.selectedKey) ?? null;
  const selectedPart = selected ? PART_BY_ID.get(selected.partId) ?? null : null;

  /** world-space bbox of a placement (post transform, ignoring rotation) */
  const boxOf = useCallback((p: Placement, part: ForgePart): { x: number; y: number; w: number; h: number } => {
    const [bx, by, bw, bh] = part.bbox;
    const [cx, cy] = partPivot(part);
    const dir = EXPLODE_DIR[part.id] ?? [0, 0];
    const w = bw * p.sx;
    const h = bh * p.sy;
    return {
      x: cx - w / 2 + p.x + dir[0] * state.explode,
      y: cy - h / 2 + p.y + dir[1] * state.explode,
      w,
      h,
    };
  }, [state.explode]);

  // sockets available on the frame, in world space
  const sockets = useMemo(() => {
    const frame = state.placements.find((p) => p.partId === "frame");
    const framePart = frame ? PART_BY_ID.get("frame") : undefined;
    if (!frame || !framePart) return [] as { id: string; x: number; y: number }[];
    const dir = EXPLODE_DIR.frame ?? [0, 0];
    return Object.entries(framePart.anchors).map(([id, [ax, ay]]) => ({
      id,
      x: ax + frame.x + dir[0] * state.explode,
      y: ay + frame.y + dir[1] * state.explode,
    }));
  }, [state.placements, state.explode]);

  // ---- pointer handling ----------------------------------------------------

  const beginDrag = (e: React.PointerEvent, kind: DragState["kind"], key?: string, handle?: Handle) => {
    const target = key ? state.placements.find((p) => p.key === key) : null;
    if (kind !== "pan" && (!target || target.locked)) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDrag({
      kind,
      key,
      handle,
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
        const scale = VIEW.w / view.zoom;
        const r = svgRef.current?.getBoundingClientRect();
        if (!r) return;
        setView((v) => ({
          ...v,
          x: drag.originView.x - ((e.clientX - drag.startScreen[0]) / r.width) * scale,
          y: drag.originView.y - ((e.clientY - drag.startScreen[1]) / r.height) * (VIEW.h / view.zoom),
        }));
        return;
      }
      if (!drag.key) return;
      const part = PART_BY_ID.get(drag.origin.partId);
      if (!part) return;

      if (drag.kind === "move") {
        let nx = drag.origin.x + dx;
        let ny = drag.origin.y + dy;
        if (state.gridSnap) {
          nx = Math.round(nx / 2) * 2;
          ny = Math.round(ny / 2) * 2;
        }
        // live snap preview: does this part's mount anchor land on a socket?
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
        onUpdatePlacement(drag.key, { x: nx, y: ny, slot: hit ? drag.origin.slot : null });
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
        if (h.includes("e")) sx = Math.max(0.15, drag.origin.sx + (dx * 2) / bw);
        if (h.includes("w")) sx = Math.max(0.15, drag.origin.sx - (dx * 2) / bw);
        if (h.includes("s")) sy = Math.max(0.15, drag.origin.sy + (dy * 2) / bh);
        if (h.includes("n")) sy = Math.max(0.15, drag.origin.sy - (dy * 2) / bh);
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
        const part = PART_BY_ID.get(drag.origin.partId);
        if (part) onUpdatePlacement(drag.key, { slot: snapTarget, x: 0, y: 0 });
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
  }, [drag, toCanvas, onUpdatePlacement, state.gridSnap, sockets, snapTarget, view.zoom]);

  const onWheel = (e: React.WheelEvent) => {
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    const [mx, my] = toCanvas(e.clientX, e.clientY);
    setView((v) => {
      const zoom = Math.min(6, Math.max(0.4, v.zoom * factor));
      // keep the cursor anchored while zooming
      const kx = mx - (mx - v.x) * (v.zoom / zoom);
      const ky = my - (my - v.y) * (v.zoom / zoom);
      return { x: kx, y: ky, zoom };
    });
  };

  const ordered = useMemo(
    () =>
      [...state.placements].sort(
        (a, b) => (PART_BY_ID.get(a.partId)?.z ?? 0) - (PART_BY_ID.get(b.partId)?.z ?? 0),
      ),
    [state.placements],
  );

  const vw = VIEW.w / view.zoom;
  const vh = VIEW.h / view.zoom;
  const selBox = selected && selectedPart ? boxOf(selected, selectedPart) : null;
  const handleSize = 3 / view.zoom;

  const HANDLES: { id: Handle; fx: number; fy: number }[] = [
    { id: "nw", fx: 0, fy: 0 }, { id: "n", fx: 0.5, fy: 0 }, { id: "ne", fx: 1, fy: 0 },
    { id: "e", fx: 1, fy: 0.5 }, { id: "se", fx: 1, fy: 1 }, { id: "s", fx: 0.5, fy: 1 },
    { id: "sw", fx: 0, fy: 1 }, { id: "w", fx: 0, fy: 0.5 },
  ];

  return (
    <svg
      ref={svgRef}
      viewBox={`${view.x} ${view.y} ${vw} ${vh}`}
      className={cn("blueprint-grid touch-none select-none", className)}
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
        <pattern id="forge-grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M10,0 L0,0 L0,10" fill="none" stroke="rgb(var(--c-grid))" strokeWidth={0.25} opacity={0.7} />
        </pattern>
      </defs>
      {state.showGrid && (
        <rect x={view.x} y={view.y} width={vw} height={vh} fill="url(#forge-grid)" />
      )}

      {/* baseline + scale bar */}
      <g opacity={0.5}>
        <line x1={0} y1={132} x2={216} y2={132} stroke="rgb(var(--c-bone-faint))" strokeWidth={0.3} />
        <line x1={0} y1={129} x2={0} y2={135} stroke="rgb(var(--c-bone-faint))" strokeWidth={0.3} />
        <line x1={216} y1={129} x2={216} y2={135} stroke="rgb(var(--c-bone-faint))" strokeWidth={0.3} />
        <text x={108} y={139} textAnchor="middle" fontSize={4} fontFamily="var(--font-mono)" fill="rgb(var(--c-bone-faint))">
          216 MM
        </text>
      </g>

      {/* parts */}
      {ordered.map((p) => {
        const part = PART_BY_ID.get(p.partId);
        if (!part || p.hidden) return null;
        const isSel = p.key === state.selectedKey;
        const isHover = p.key === hoverKey;
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
            {/* invisible hit pad so thin strokes are easy to grab */}
            <rect
              x={part.bbox[0]}
              y={part.bbox[1]}
              width={part.bbox[2]}
              height={part.bbox[3]}
              fill="transparent"
            />
            {part.paths.map((d, i) => (
              <path
                key={i}
                d={d}
                fill={isSel ? "rgb(var(--c-ember) / 0.10)" : isHover ? "rgb(var(--c-bone) / 0.05)" : "none"}
                stroke={isSel ? "rgb(var(--c-ember))" : inkCss}
                strokeWidth={0.35}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>
        );
      })}

      {/* anchors */}
      {(state.showAnchors || drag?.kind === "move") &&
        sockets.map((s) => {
          const active = snapTarget === s.id;
          return (
            <g key={s.id}>
              <circle
                cx={s.x}
                cy={s.y}
                r={active ? 3.4 : 2.2}
                fill="none"
                stroke={active ? "rgb(var(--c-ember))" : "rgb(var(--c-ember) / 0.45)"}
                strokeWidth={active ? 0.7 : 0.4}
              />
              <circle cx={s.x} cy={s.y} r={0.6} fill="rgb(var(--c-ember))" />
              {active && (
                <text x={s.x + 4} y={s.y - 3} fontSize={3.4} fontFamily="var(--font-mono)" fill="rgb(var(--c-ember))">
                  {s.id.toUpperCase()}
                </text>
              )}
            </g>
          );
        })}

      {/* selection frame + transform handles */}
      {selBox && selected && (
        <g>
          <rect
            x={selBox.x}
            y={selBox.y}
            width={selBox.w}
            height={selBox.h}
            fill="none"
            stroke="rgb(var(--c-ember) / 0.8)"
            strokeWidth={0.4}
            strokeDasharray="2 1.5"
            vectorEffect="non-scaling-stroke"
            transform={`rotate(${selected.rot} ${selBox.x + selBox.w / 2} ${selBox.y + selBox.h / 2})`}
          />
          <g transform={`rotate(${selected.rot} ${selBox.x + selBox.w / 2} ${selBox.y + selBox.h / 2})`}>
            {HANDLES.map((h) => (
              <rect
                key={h.id}
                x={selBox.x + selBox.w * h.fx - handleSize / 2}
                y={selBox.y + selBox.h * h.fy - handleSize / 2}
                width={handleSize}
                height={handleSize}
                fill="rgb(var(--c-steel-950))"
                stroke="rgb(var(--c-ember))"
                strokeWidth={0.35}
                style={{ cursor: "nwse-resize" }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  beginDrag(e, "scale", selected.key, h.id);
                }}
              />
            ))}
            {/* rotate handle above the box */}
            <line
              x1={selBox.x + selBox.w / 2}
              y1={selBox.y}
              x2={selBox.x + selBox.w / 2}
              y2={selBox.y - 7 / view.zoom}
              stroke="rgb(var(--c-ember) / 0.8)"
              strokeWidth={0.35}
            />
            <circle
              cx={selBox.x + selBox.w / 2}
              cy={selBox.y - 7 / view.zoom}
              r={handleSize * 0.7}
              fill="rgb(var(--c-steel-950))"
              stroke="rgb(var(--c-ember))"
              strokeWidth={0.4}
              style={{ cursor: "grab" }}
              onPointerDown={(e) => {
                e.stopPropagation();
                beginDrag(e, "rotate", selected.key);
              }}
            />
          </g>
        </g>
      )}
    </svg>
  );
}
