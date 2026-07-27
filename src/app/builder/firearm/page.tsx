"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { BuilderWorkbench } from "@/components/builder/BuilderWorkbench";

export default function FirearmBuilderPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fabricator"
        title="Firearm pattern"
        description="Pick a frame, chamber a round, cut the barrel to length — the V5 damage model recomputes on every change."
      />
      <BuilderWorkbench family="firearm" />
    </div>
  );
}
