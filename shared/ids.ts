/**
 * ID + timestamp helpers. Dependency-free so both client code and any future
 * server can import them (same convention as the Dragon's Ledger `shared/`).
 */

export type ID = string;

/** Generate a unique id, optionally namespaced: `newId("wpn")` → `wpn_<uuid>`. */
export function newId(prefix?: string): ID {
  const uuid =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}_${uuid}` : uuid;
}

export function nowISO(): string {
  return new Date().toISOString();
}
