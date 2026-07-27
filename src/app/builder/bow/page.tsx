"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { BuilderWorkbench } from "@/components/builder/BuilderWorkbench";

export default function BowBuilderPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fabricator"
        title="Bow pattern"
        description="Draw weight, draw length and limb efficiency roll up into a scored damage band — mind the STR requirement."
      />
      <BuilderWorkbench family="bow" />
    </div>
  );
}
