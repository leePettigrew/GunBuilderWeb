"use client";

/**
 * Thin preset of CatalogTable for simple band tables (text/number columns
 * only) — kept as its own export per the module contract.
 */

import { CatalogTable, type ColumnDef } from "./CatalogTable";

export interface BandColumn<T> {
  key: Extract<keyof T, string>;
  label: string;
  kind: "text" | "number";
  width?: string;
}

export function BandTableEditor<T>({
  rows,
  columns,
  onChange,
  makeBlank,
  title,
  hint,
  addLabel,
}: {
  rows: T[];
  columns: BandColumn<T>[];
  onChange: (rows: T[]) => void;
  makeBlank?: () => T;
  title?: string;
  hint?: string;
  addLabel?: string;
}) {
  return (
    <CatalogTable
      items={rows}
      columns={columns as ColumnDef<T>[]}
      onChange={onChange}
      makeBlank={makeBlank}
      title={title}
      hint={hint}
      addLabel={addLabel ?? "Add band"}
    />
  );
}
