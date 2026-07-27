/**
 * Structural validation for builds arriving from untrusted sources (share
 * links, imported JSON, tampered localStorage). A build that passes here can
 * be fed to the engine without crashing it; unknown catalog ids are fine —
 * the engine warns on those instead.
 */

import type { AnyBuild } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const str = (v: unknown): v is string => typeof v === "string";
const num = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const optStr = (v: unknown): boolean => v === undefined || typeof v === "string";
const strArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string");

/** Returns the build if structurally sound, else null. */
export function validateBuild(value: unknown): AnyBuild | null {
  if (!isRecord(value)) return null;
  if (!str(value.name)) return null;
  if (!optStr(value.notes)) return null;

  switch (value.family) {
    case "firearm":
      if (
        str(value.frameId) &&
        str(value.actionId) &&
        str(value.magazineId) &&
        optStr(value.cartridgeId) &&
        optStr(value.shellTypeId) &&
        optStr(value.shellGaugeId) &&
        num(value.barrelLengthMm) &&
        str(value.barrelTypeId) &&
        typeof value.rifled === "boolean" &&
        str(value.stockId) &&
        strArray(value.attachmentIds)
      ) {
        return value as unknown as AnyBuild;
      }
      return null;
    case "bow":
      if (
        str(value.bowTypeId) &&
        num(value.drawWeightLbs) &&
        num(value.drawLengthIn) &&
        num(value.efficiency) &&
        str(value.materialId) &&
        str(value.arrowId)
      ) {
        return value as unknown as AnyBuild;
      }
      return null;
    case "crossbow":
      if (str(value.crossbowTypeId) && strArray(value.attachmentIds)) {
        return value as unknown as AnyBuild;
      }
      return null;
    case "grenade":
      if (str(value.payloadId) && str(value.qualityId) && str(value.focusId)) {
        return value as unknown as AnyBuild;
      }
      return null;
    case "melee":
      if (str(value.presetId) && (value.dieSizeOverride === undefined || num(value.dieSizeOverride))) {
        return value as unknown as AnyBuild;
      }
      return null;
    default:
      return null;
  }
}
