"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { computeStats } from "@shared/engine";
import { decodeShare } from "@shared/share-codec";
import type { AnyBuild } from "@shared/types";
import { WeaponBlueprint } from "@/components/blueprint";
import { StatCard } from "@/components/builder/StatCard";
import { Button, buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconArmory, IconShare } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { useRuleset, useWeapons } from "@/lib/data/context";

type ShareState =
  | { status: "loading" }
  | { status: "invalid" }
  | { status: "ready"; build: AnyBuild };

export default function SharePage() {
  const [state, setState] = useState<ShareState>({ status: "loading" });
  const { ruleset } = useRuleset();
  const { create } = useWeapons();
  const router = useRouter();

  // Fragment payloads never reach the server, so decode client-side on mount.
  useEffect(() => {
    const payload = window.location.hash.slice(1);
    if (!payload) {
      setState({ status: "invalid" });
      return;
    }
    const build = decodeShare(payload);
    setState(build ? { status: "ready", build } : { status: "invalid" });
  }, []);

  const stats = useMemo(() => {
    if (state.status !== "ready") return null;
    try {
      return computeStats(state.build, ruleset);
    } catch {
      return null; // decoded but incoherent — treat as a bad link
    }
  }, [state, ruleset]);

  if (state.status === "loading") {
    return (
      <div className="space-y-6">
        <div className="surface-panel h-24 animate-pulse" />
        <div className="surface-panel h-80 animate-pulse" />
      </div>
    );
  }

  if (state.status !== "ready" || !stats) {
    return (
      <EmptyState
        icon={<IconShare className="h-10 w-10" />}
        title="No pattern in this link"
        body="Share links carry the entire weapon in the fragment after the # mark — nothing lives on a server. This link is missing its payload or it got mangled in transit; ask the sender to copy the whole link again."
        action={
          <Link href="/builder" className={buttonClasses("primary")}>
            Fabricate your own
          </Link>
        }
      />
    );
  }

  const { build } = state;

  const saveToArmory = () => {
    const created = create(build);
    router.push(`/armory/${created.id}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Shared pattern"
        title={build.name || "Unnamed pattern"}
        description="Received by link. Save it to your armory to keep, edit, and re-stat it."
        actions={
          <Button variant="primary" onClick={saveToArmory}>
            <IconArmory className="h-4 w-4" />
            Save to armory
          </Button>
        }
      />

      <div>
        <span className="stamp-hazard">Field copy — computed under your active ruleset</span>
      </div>

      <div className="surface-panel overflow-hidden">
        <WeaponBlueprint build={build} rules={ruleset} className="w-full" />
      </div>

      <StatCard stats={stats} rules={ruleset} />
    </div>
  );
}
