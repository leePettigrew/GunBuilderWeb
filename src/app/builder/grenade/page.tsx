"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { BuilderWorkbench } from "@/components/builder/BuilderWorkbench";

export default function GrenadeBuilderPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fabricator"
        title="Grenade pattern"
        description="Payload, build quality and focus set the charge — the stat sheet shows damage falling off ring by ring."
      />
      <BuilderWorkbench family="grenade" />
    </div>
  );
}
