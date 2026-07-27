"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { BuilderWorkbench } from "@/components/builder/BuilderWorkbench";

export default function MeleeBuilderPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fabricator"
        title="Melee pattern"
        description="Pick an implement and optionally house-rule its die — to hit rides the governing stat, to wound adds STR."
      />
      <BuilderWorkbench family="melee" />
    </div>
  );
}
