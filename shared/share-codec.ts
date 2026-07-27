/**
 * Share-link codec: a whole build encoded into a URL fragment, no server
 * involved. `/share#<payload>` — the fragment never hits access logs.
 *
 * Payload = base64url( UTF-8 JSON of { v: 1, build } ).
 */

import type { AnyBuild } from "./types";

interface ShareEnvelope {
  v: 1;
  build: AnyBuild;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const base64 = typeof btoa === "function" ? btoa(binary) : Buffer.from(bytes).toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(encoded: string): Uint8Array {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  if (typeof atob === "function") {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  return new Uint8Array(Buffer.from(padded, "base64"));
}

export function encodeShare(build: AnyBuild): string {
  const envelope: ShareEnvelope = { v: 1, build };
  return toBase64Url(new TextEncoder().encode(JSON.stringify(envelope)));
}

/** Returns the build, or null if the payload is malformed or unversioned. */
export function decodeShare(payload: string): AnyBuild | null {
  try {
    const json = new TextDecoder().decode(fromBase64Url(payload.trim()));
    const envelope = JSON.parse(json) as Partial<ShareEnvelope>;
    if (envelope.v !== 1 || typeof envelope.build !== "object" || envelope.build === null) return null;
    const build = envelope.build as AnyBuild;
    if (!["firearm", "bow", "crossbow", "grenade", "melee"].includes(build.family)) return null;
    if (typeof build.name !== "string") return null;
    return build;
  } catch {
    return null;
  }
}
