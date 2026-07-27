/**
 * Server-safe theme constants. NO "use client" here — the root layout (a
 * server component) inlines THEME_INIT_SCRIPT into <head>, which would break
 * if this lived in the client-marked theme.tsx.
 */

// Deliberately unversioned and outside the persistence adapter: the anti-FOUC
// script must read it synchronously before React exists.
export const THEME_STORAGE_KEY = "ashen-armoury:theme";

/**
 * Inline into layout `<head>` via dangerouslySetInnerHTML so the light class
 * lands before first paint (no flash of the wrong theme).
 */
export const THEME_INIT_SCRIPT = `(function(){try{if(localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)})==="light"){document.documentElement.classList.add("light");}}catch(e){}})();`;
