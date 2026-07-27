"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { BuilderWorkbench } from "@/components/builder/BuilderWorkbench";

export default function CrossbowBuilderPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fabricator"
        title="Crossbow pattern"
        description="Five prods from pistol to siege — pre-loaded mechanics, single fire, and bolted-on extras."
      />
      <BuilderWorkbench family="crossbow" />
    </div>
  );
}
