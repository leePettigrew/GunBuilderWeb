"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { computeStats } from "@shared/engine";
import { newBuildForFamily } from "@shared/factories";
import { encodeShare } from "@shared/share-codec";
import { exportWeapon } from "@shared/export";
import type { AnyBuild, WeaponFamily } from "@shared/types";
import { useRuleset, useWeapon, useWeapons } from "@/lib/data/context";
import { WeaponBlueprint } from "@/components/blueprint";
import { Panel } from "@/components/ui/Panel";
import { Button, buttonClasses } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { copyText, downloadJson, slugify } from "@/lib/download";
import { StatCard } from "./StatCard";
import { FirearmControls } from "./FirearmControls";
import { BowControls } from "./BowControls";
import { CrossbowControls } from "./CrossbowControls";
import { GrenadeControls } from "./GrenadeControls";
import { MeleeControls } from "./MeleeControls";

type Flash = "saved" | "link" | "json";

export interface BuilderWorkbenchProps {
  family: WeaponFamily;
  /** When set: load this armory weapon and save updates in place. */
  weaponId?: string;
}

export function BuilderWorkbench({ family, weaponId }: BuilderWorkbenchProps) {
  const { ruleset } = useRuleset();
  const { create, update } = useWeapons();
  const { weapon, ready } = useWeapon(weaponId ?? "");

  const [build, setBuild] = useState<AnyBuild | null>(() =>
    weaponId === undefined ? newBuildForFamily(family, ruleset) : null,
  );
  const [savedId, setSavedId] = useState<string | null>(weaponId ?? null);
  const [flash, setFlash] = useState<Flash | null>(null);
  const flashTimer = useRef<number | null>(null);

  // Edit mode: seed local state from the armory once the store is ready.
  useEffect(() => {
    if (weaponId !== undefined && ready && weapon !== null && build === null) {
      setBuild(weapon.build);
    }
  }, [weaponId, ready, weapon, build]);

  useEffect(() => {
    return () => {
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    };
  }, []);

  const stats = useMemo(
    () => (build === null ? null : computeStats(build, ruleset)),
    [build, ruleset],
  );

  function showFlash(kind: Flash) {
    if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    setFlash(kind);
    flashTimer.current = window.setTimeout(() => setFlash(null), 2000);
  }

  function handleSave() {
    if (build === null) return;
    if (savedId !== null) {
      update(savedId, build);
    } else {
      const created = create(build);
      setSavedId(created.id);
    }
    showFlash("saved");
  }

  async function handleShareLink() {
    if (build === null) return;
    const url = `${window.location.origin}/share#${encodeShare(build)}`;
    if (await copyText(url)) showFlash("link");
  }

  function handleDownloadJson() {
    if (build === null) return;
    downloadJson(`${slugify(build.name)}-pattern.json`, exportWeapon(build, ruleset));
  }

  async function handleCopyJson() {
    if (build === null) return;
    const json = JSON.stringify(exportWeapon(build, ruleset), null, 2);
    if (await copyText(json)) showFlash("json");
  }

  if (weaponId !== undefined && ready && weapon === null) {
    return (
      <EmptyState
        title="Pattern not found"
        body="This armory entry does not exist — it may have been scrapped."
        action={
          <Link href="/armory" className={buttonClasses("secondary", "md")}>
            Back to armory
          </Link>
        }
      />
    );
  }

  if (build === null || stats === null) {
    return (
      <div className="surface-panel p-10 text-center text-sm text-bone-faint">
        Loading pattern…
      </div>
    );
  }

  const controls = (() => {
    switch (build.family) {
      case "firearm":
        return <FirearmControls build={build} rules={ruleset} onChange={setBuild} />;
      case "bow":
        return <BowControls build={build} rules={ruleset} onChange={setBuild} />;
      case "crossbow":
        return <CrossbowControls build={build} rules={ruleset} onChange={setBuild} />;
      case "grenade":
        return <GrenadeControls build={build} rules={ruleset} onChange={setBuild} />;
      case "melee":
        return <MeleeControls build={build} rules={ruleset} onChange={setBuild} />;
    }
  })();

  return (
    <div className="animate-fade-in space-y-6">
      <WeaponBlueprint build={build} rules={ruleset} className="w-full" />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" onClick={handleSave}>
          {flash === "saved" ? "Saved" : weaponId !== undefined ? "Save changes" : "Save to armory"}
        </Button>
        {savedId !== null && (
          <Link href={`/armory/${savedId}`} className={buttonClasses("ghost", "md")}>
            View in armory
          </Link>
        )}
        <span className="grow" />
        <Button onClick={handleShareLink}>
          {flash === "link" ? "Link copied" : "Copy share link"}
        </Button>
        <Button onClick={handleDownloadJson}>Download JSON</Button>
        <Button onClick={handleCopyJson}>{flash === "json" ? "JSON copied" : "Copy JSON"}</Button>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_420px]">
        <Panel eyebrow="Fabrication" title="Configuration">
          <div className="space-y-5">
            <TextField
              label="Pattern name"
              value={build.name}
              onChange={(name) => setBuild({ ...build, name })}
            />
            {controls}
          </div>
        </Panel>

        <StatCard stats={stats} rules={ruleset} className="lg:sticky lg:top-6" />
      </div>
    </div>
  );
}
