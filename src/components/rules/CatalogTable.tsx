"use client";

/**
 * Generic editable table powering every Rules Lab list — catalogs, band
 * tables, fire modes. Column kinds cover the whole Ruleset surface:
 *
 *  text        plain string
 *  number      finite number (draft-tolerant while typing)
 *  nullnumber  number or blank → null ("Varies" cells, open-ended maxima)
 *  percent     stored as fraction, edited as percentage
 *  select      one of a fixed option list
 *  toggle      boolean checkbox
 *  csv         string[] edited as comma-separated text
 *  malusCsv    (number|null)[] — blanks/x/– mean null
 *  dice        DiceExpr edited as "2d10+1d8+3" text
 */

import { useState, type ReactNode } from "react";
import { formatDice } from "@shared/engine";
import type { DiceExpr } from "@shared/types";
import { Button } from "@/components/ui/Button";
import { IconPlus, IconTrash } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export type ColumnKind =
  | "text"
  | "number"
  | "nullnumber"
  | "percent"
  | "select"
  | "toggle"
  | "csv"
  | "malusCsv"
  | "dice";

export interface ColumnDef<T> {
  key: Extract<keyof T, string>;
  label: string;
  kind: ColumnKind;
  options?: { value: string; label: string }[];
  /** Tailwind width class for the cell, e.g. "w-24". */
  width?: string;
  readOnly?: boolean;
}

export function parseDiceExpr(text: string): DiceExpr | null {
  const cleaned = text.replace(/\s+/g, "").toLowerCase();
  if (cleaned === "" || cleaned === "0") return { terms: [], bonus: 0 };
  const parts = cleaned.split("+");
  const expr: DiceExpr = { terms: [], bonus: 0 };
  for (const part of parts) {
    const dice = /^(\d+)d(\d+)$/.exec(part);
    if (dice) {
      expr.terms.push({ count: Number(dice[1]), size: Number(dice[2]) });
      continue;
    }
    if (/^\d+$/.test(part)) {
      expr.bonus += Number(part);
      continue;
    }
    return null;
  }
  return expr;
}

const cellClasses =
  "w-full rounded-sm border border-rivet/40 bg-steel-950/60 px-1.5 py-1 font-mono text-xs text-bone focus:border-ember/60 focus:outline-none";

function DraftInput({
  shown,
  commit,
  align = "right",
  title,
}: {
  shown: string;
  commit: (text: string) => void;
  align?: "left" | "right";
  title?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input
      type="text"
      value={draft ?? shown}
      title={title}
      onChange={(e) => {
        setDraft(e.target.value);
        commit(e.target.value);
      }}
      onBlur={() => setDraft(null)}
      className={cn(cellClasses, align === "right" && "text-right")}
    />
  );
}

function Cell<T>({ item, col, onEdit }: { item: T; col: ColumnDef<T>; onEdit: (value: unknown) => void }) {
  const raw = item[col.key] as unknown;
  switch (col.kind) {
    case "text":
      return (
        <DraftInput
          shown={typeof raw === "string" ? raw : ""}
          align="left"
          commit={(text) => onEdit(text)}
        />
      );
    case "number":
      return (
        <DraftInput
          shown={typeof raw === "number" ? String(raw) : "0"}
          commit={(text) => {
            const n = Number(text);
            if (Number.isFinite(n)) onEdit(n);
          }}
        />
      );
    case "nullnumber":
      return (
        <DraftInput
          shown={typeof raw === "number" ? String(raw) : ""}
          title="Blank = varies / open-ended"
          commit={(text) => {
            const trimmed = text.trim();
            if (trimmed === "" || trimmed === "-" || trimmed === "x" || trimmed === "–") {
              onEdit(null);
              return;
            }
            const n = Number(trimmed);
            if (Number.isFinite(n)) onEdit(n);
          }}
        />
      );
    case "percent":
      return (
        <DraftInput
          shown={typeof raw === "number" ? String(Math.round(raw * 1000) / 10) : "0"}
          title="Percent"
          commit={(text) => {
            const n = Number(text);
            if (Number.isFinite(n)) onEdit(n / 100);
          }}
        />
      );
    case "select":
      return (
        <select
          value={typeof raw === "string" ? raw : ""}
          onChange={(e) => onEdit(e.target.value)}
          className={cellClasses}
        >
          {(col.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case "toggle":
      return (
        <input
          type="checkbox"
          checked={raw === true}
          onChange={(e) => onEdit(e.target.checked)}
          className="h-4 w-4 accent-[rgb(var(--c-ember))]"
          aria-label={col.label}
        />
      );
    case "csv":
      return (
        <DraftInput
          shown={Array.isArray(raw) ? (raw as string[]).join(", ") : ""}
          align="left"
          title="Comma-separated"
          commit={(text) =>
            onEdit(
              text
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s.length > 0),
            )
          }
        />
      );
    case "malusCsv":
      return (
        <DraftInput
          shown={Array.isArray(raw) ? (raw as (number | null)[]).map((v) => (v === null ? "x" : String(v))).join(", ") : ""}
          align="left"
          title="Comma-separated; x = varies / not possible"
          commit={(text) => {
            const values = text.split(",").map((s) => {
              const t = s.trim().toLowerCase();
              if (t === "" || t === "x" || t === "-" || t === "–") return null;
              const n = Number(t);
              return Number.isFinite(n) ? n : null;
            });
            onEdit(values);
          }}
        />
      );
    case "dice":
      return (
        <DraftInput
          shown={raw !== null && typeof raw === "object" ? formatDice(raw as DiceExpr) : "0"}
          align="left"
          title='Dice expression, e.g. "2d10+1d8+3"'
          commit={(text) => {
            const parsed = parseDiceExpr(text);
            if (parsed !== null) onEdit(parsed);
          }}
        />
      );
  }
}

export interface CatalogTableProps<T> {
  items: T[];
  columns: ColumnDef<T>[];
  onChange: (items: T[]) => void;
  makeBlank?: () => T;
  title?: string;
  hint?: string;
  addLabel?: string;
}

export function CatalogTable<T>({
  items,
  columns,
  onChange,
  makeBlank,
  title,
  hint,
  addLabel = "Add row",
}: CatalogTableProps<T>): ReactNode {
  const edit = (index: number, key: string, value: unknown) => {
    onChange(items.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };
  const removeAt = (index: number) => onChange(items.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      {title !== undefined && (
        <div className="flex items-baseline justify-between gap-3">
          <h4 className="font-display text-xs uppercase tracking-title text-bone-soft">{title}</h4>
          {hint !== undefined && <p className="text-[11px] text-bone-faint">{hint}</p>}
        </div>
      )}
      <div className="overflow-x-auto rounded-card border border-rivet/30">
        <table className="w-full min-w-max border-collapse text-left">
          <thead>
            <tr className="bg-steel-850/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="whitespace-nowrap px-2 py-1.5 font-mono text-[10px] font-medium uppercase tracking-title text-bone-faint"
                >
                  {col.label}
                </th>
              ))}
              <th className="w-8" aria-label="Row actions" />
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-t border-rivet/20 odd:bg-steel-900/40">
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-1.5 py-1 align-middle", col.width ?? "min-w-20")}>
                    {col.readOnly === true ? (
                      <span className="px-1 font-mono text-xs text-bone-faint">{String(item[col.key] ?? "")}</span>
                    ) : (
                      <Cell item={item} col={col} onEdit={(value) => edit(i, col.key, value)} />
                    )}
                  </td>
                ))}
                <td className="px-1 text-center">
                  <button
                    type="button"
                    onClick={() => removeAt(i)}
                    className="rounded p-1 text-bone-faint transition-colors hover:text-blood"
                    aria-label={`Delete row ${i + 1}`}
                  >
                    <IconTrash className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-3 py-4 text-center text-xs text-bone-faint">
                  No rows — the engine treats this table as empty.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {makeBlank !== undefined && (
        <Button size="sm" variant="ghost" onClick={() => onChange([...items, makeBlank()])}>
          <IconPlus className="mr-1 h-3.5 w-3.5" />
          {addLabel}
        </Button>
      )}
    </div>
  );
}
