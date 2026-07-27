"use client";

import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export default function NotFound() {
  return (
    <div className="flex animate-fade-in flex-col items-center py-24 text-center">
      <span className="stamp-hazard">Recon report</span>
      <h1 className="heading-stencil mt-6 text-3xl text-bone sm:text-5xl">
        404 — Sector not on the map
      </h1>
      <p className="mt-4 max-w-md text-bone-soft">
        Whatever stood at this address has been scavenged, scorched, or was
        never charted. Fall back and try another route.
      </p>
      <Link href="/" className={cn(buttonClasses("primary", "md"), "mt-8")}>
        Return to base
      </Link>
    </div>
  );
}
