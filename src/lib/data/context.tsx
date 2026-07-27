"use client";

/**
 * App data store. Weapons store INPUTS ONLY (builds); stats are recomputed at
 * render, so Rules Lab edits instantly re-stat every saved weapon. State lives
 * here; every mutation is immutable and persisted immediately.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AnyBuild, Ruleset, Weapon } from "@shared/types";
import { DEFAULT_RULESET } from "@shared/default-rules";
import { validateBuild } from "@shared/validate-build";
import { newId, nowISO, type ID } from "@shared/ids";
import { createBrowserPersistence, type PersistenceAdapter } from "./persistence";

const WEAPONS_KEY = "weapons";
const RULESET_KEY = "ruleset";

interface DataContextValue {
  weapons: Weapon[];
  ready: boolean;
  createWeapon(build: AnyBuild): Weapon;
  updateWeapon(id: ID, build: AnyBuild): void;
  removeWeapon(id: ID): void;
  ruleset: Ruleset;
  setRuleset(next: Ruleset): void;
  resetRuleset(): void;
  isCustomized: boolean;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const persistenceRef = useRef<PersistenceAdapter | null>(null);
  // Mirrors the latest weapons array so mutators can be stable callbacks and
  // still compute the next array (create must return the new Weapon sync).
  const weaponsRef = useRef<Weapon[]>([]);

  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [ruleset, setRulesetState] = useState<Ruleset>(DEFAULT_RULESET);
  const [ready, setReady] = useState(false);

  const persistence = useCallback((): PersistenceAdapter => {
    persistenceRef.current ??= createBrowserPersistence();
    return persistenceRef.current;
  }, []);

  useEffect(() => {
    const p = persistence();
    const storedWeapons = p.load<Weapon[]>(WEAPONS_KEY);
    if (Array.isArray(storedWeapons)) {
      // Drop structurally corrupt entries (tampered storage, bad old imports)
      // rather than letting one poisoned build crash every armory render.
      const sound = storedWeapons.filter(
        (w) => w !== null && typeof w === "object" && typeof w.id === "string" && validateBuild(w.build) !== null,
      );
      weaponsRef.current = sound;
      setWeapons(sound);
      if (sound.length !== storedWeapons.length) p.save(WEAPONS_KEY, sound);
    }
    const storedRuleset = p.load<Ruleset>(RULESET_KEY);
    if (
      storedRuleset !== null &&
      typeof storedRuleset === "object" &&
      !Array.isArray(storedRuleset) &&
      storedRuleset.schemaVersion === 1
    ) {
      setRulesetState(storedRuleset);
    }
    setReady(true);
  }, [persistence]);

  const applyWeapons = useCallback(
    (next: Weapon[]) => {
      weaponsRef.current = next;
      setWeapons(next);
      persistence().save(WEAPONS_KEY, next);
    },
    [persistence],
  );

  const createWeapon = useCallback(
    (build: AnyBuild): Weapon => {
      const stamp = nowISO();
      const weapon: Weapon = {
        id: newId("wpn"),
        createdAt: stamp,
        updatedAt: stamp,
        build,
      };
      applyWeapons([...weaponsRef.current, weapon]);
      return weapon;
    },
    [applyWeapons],
  );

  const updateWeapon = useCallback(
    (id: ID, build: AnyBuild): void => {
      applyWeapons(
        weaponsRef.current.map((w) =>
          w.id === id ? { ...w, build, updatedAt: nowISO() } : w,
        ),
      );
    },
    [applyWeapons],
  );

  const removeWeapon = useCallback(
    (id: ID): void => {
      applyWeapons(weaponsRef.current.filter((w) => w.id !== id));
    },
    [applyWeapons],
  );

  const setRuleset = useCallback(
    (next: Ruleset): void => {
      setRulesetState(next);
      persistence().save(RULESET_KEY, next);
    },
    [persistence],
  );

  const resetRuleset = useCallback((): void => {
    setRulesetState(DEFAULT_RULESET);
    // Remove rather than save so future default tweaks apply on next load.
    persistence().remove(RULESET_KEY);
  }, [persistence]);

  const isCustomized = useMemo(
    () => JSON.stringify(ruleset) !== JSON.stringify(DEFAULT_RULESET),
    [ruleset],
  );

  const value = useMemo<DataContextValue>(
    () => ({
      weapons,
      ready,
      createWeapon,
      updateWeapon,
      removeWeapon,
      ruleset,
      setRuleset,
      resetRuleset,
      isCustomized,
    }),
    [
      weapons,
      ready,
      createWeapon,
      updateWeapon,
      removeWeapon,
      ruleset,
      setRuleset,
      resetRuleset,
      isCustomized,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

function useDataContext(hookName: string): DataContextValue {
  const ctx = useContext(DataContext);
  if (ctx === null) {
    throw new Error(
      `${hookName}() must be used inside <DataProvider> — wrap your app in it (see src/app/layout.tsx).`,
    );
  }
  return ctx;
}

export function useWeapons(): {
  weapons: Weapon[];
  ready: boolean;
  create(build: AnyBuild): Weapon;
  update(id: ID, build: AnyBuild): void;
  remove(id: ID): void;
} {
  const ctx = useDataContext("useWeapons");
  return {
    weapons: ctx.weapons,
    ready: ctx.ready,
    create: ctx.createWeapon,
    update: ctx.updateWeapon,
    remove: ctx.removeWeapon,
  };
}

export function useWeapon(id: string): { weapon: Weapon | null; ready: boolean } {
  const ctx = useDataContext("useWeapon");
  const weapon = useMemo(
    () => ctx.weapons.find((w) => w.id === id) ?? null,
    [ctx.weapons, id],
  );
  return { weapon, ready: ctx.ready };
}

export function useRuleset(): {
  ruleset: Ruleset;
  setRuleset(next: Ruleset): void;
  resetRuleset(): void;
  isCustomized: boolean;
} {
  const ctx = useDataContext("useRuleset");
  return {
    ruleset: ctx.ruleset,
    setRuleset: ctx.setRuleset,
    resetRuleset: ctx.resetRuleset,
    isCustomized: ctx.isCustomized,
  };
}
