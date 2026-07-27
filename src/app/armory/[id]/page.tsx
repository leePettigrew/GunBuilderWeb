"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { computeStats } from "@shared/engine";
import { exportWeapon } from "@shared/export";
import {
  FAMILY_BADGE_TONE,
  buildShareUrl,
  compactDate,
  familyLabel,
} from "@/components/armory/WeaponCard";
import { WeaponBlueprint } from "@/components/blueprint";
import { BuilderWorkbench } from "@/components/builder/BuilderWorkbench";
import { StatCard } from "@/components/builder/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconArmory, IconEdit, IconExport, IconShare, IconTrash } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { useRuleset, useWeapon, useWeapons } from "@/lib/data/context";
import { copyText, downloadJson, slugify } from "@/lib/download";

// useSearchParams needs a Suspense boundary to satisfy next build prerendering.
export default function ArmoryWeaponPage() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ArmoryWeaponView />
    </Suspense>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="surface-panel h-24 animate-pulse" />
      <div className="surface-panel h-80 animate-pulse" />
    </div>
  );
}

function ArmoryWeaponView() {
  // Next 15: client components read route params via the hook, not props.
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : "";

  const router = useRouter();
  const searchParams = useSearchParams();
  const editing = searchParams.get("edit") === "1";

  const { weapon, ready } = useWeapon(id);
  const { remove } = useWeapons();
  const { ruleset } = useRuleset();

  const [copied, setCopied] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  if (!ready) return <DetailSkeleton />;

  if (!weapon) {
    return (
      <EmptyState
        icon={<IconArmory className="h-10 w-10" />}
        title="Pattern not found"
        body="No weapon with this id on the racks — it may have been scrapped, or the record lives in another browser's armory."
        action={
          <Link href="/armory" className={buttonClasses("secondary")}>
            Back to the armory
          </Link>
        }
      />
    );
  }

  const name = weapon.build.name || "Unnamed pattern";

  if (editing) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Fabricator"
          title={name}
          description="Editing in place — saves update this armory record."
          actions={
            <Link href={`/armory/${weapon.id}`} className={buttonClasses("secondary")}>
              Done
            </Link>
          }
        />
        <BuilderWorkbench family={weapon.build.family} weaponId={weapon.id} />
      </div>
    );
  }

  const stats = computeStats(weapon.build, ruleset);

  const handleShare = async () => {
    if (await copyText(buildShareUrl(weapon.build))) setCopied(true);
  };

  const handleDownload = () => {
    downloadJson(`${slugify(weapon.build.name)}-pattern.json`, exportWeapon(weapon.build, ruleset));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Armory record"
        title={name}
        description={`${familyLabel(weapon.build.family)} pattern, statted live under “${ruleset.name}”.`}
        actions={
          <>
            <Button variant="primary" onClick={() => router.push(`/armory/${weapon.id}?edit=1`)}>
              <IconEdit className="h-4 w-4" />
              Edit
            </Button>
            <Button variant="secondary" onClick={handleShare}>
              <IconShare className="h-4 w-4" />
              {copied ? "Copied" : "Copy share link"}
            </Button>
            <Button variant="secondary" onClick={handleDownload}>
              <IconExport className="h-4 w-4" />
              Download JSON
            </Button>
            <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
              <IconTrash className="h-4 w-4" />
              Delete
            </Button>
          </>
        }
      />

      <div className="surface-panel overflow-hidden">
        <WeaponBlueprint build={weapon.build} rules={ruleset} className="w-full" />
      </div>

      <p className="numerals text-xs text-bone-faint">
        Created {compactDate(weapon.createdAt)} · Updated {compactDate(weapon.updatedAt)} · {weapon.id}
      </p>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <StatCard stats={stats} rules={ruleset} />
        <Panel eyebrow="Dossier" title="Record">
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-bone-faint">Family</dt>
              <dd>
                <Badge tone={FAMILY_BADGE_TONE[weapon.build.family]}>
                  {familyLabel(weapon.build.family)}
                </Badge>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-bone-faint">Created</dt>
              <dd className="numerals">{compactDate(weapon.createdAt)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-bone-faint">Updated</dt>
              <dd className="numerals">{compactDate(weapon.updatedAt)}</dd>
            </div>
            {weapon.build.notes && (
              <div className="space-y-1 border-t border-rivet/30 pt-3">
                <dt className="text-bone-faint">Notes</dt>
                <dd className="whitespace-pre-wrap text-bone-soft">{weapon.build.notes}</dd>
              </div>
            )}
          </dl>
        </Panel>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title={`Scrap “${name}”?`}
        body="This removes the pattern from your armory for good. Copied share links keep working — they carry the whole weapon."
        confirmLabel="Scrap it"
        onConfirm={() => {
          setConfirmingDelete(false);
          remove(weapon.id);
          router.push("/armory");
        }}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
