import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type PanelTone = "panel" | "raised" | "inset";

const toneClasses: Record<PanelTone, string> = {
  panel: "surface-panel",
  raised: "surface-raised",
  inset: "surface-inset",
};

export interface PanelProps {
  title?: ReactNode;
  eyebrow?: ReactNode;
  action?: ReactNode;
  tone?: PanelTone;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export function Panel({
  title,
  eyebrow,
  action,
  tone = "panel",
  className,
  bodyClassName,
  children,
}: PanelProps) {
  const hasHeader =
    title !== undefined || eyebrow !== undefined || action !== undefined;

  return (
    <section className={cn(toneClasses[tone], "overflow-hidden", className)}>
      {hasHeader && (
        <header className="flex items-center justify-between gap-4 border-b border-rivet/40 px-4 py-3">
          <div className="min-w-0">
            {eyebrow !== undefined && (
              <p className="font-display text-[10px] uppercase tracking-stamp text-bone-faint">
                {eyebrow}
              </p>
            )}
            {title !== undefined && (
              <h2 className="heading-stencil truncate text-sm text-bone">
                {title}
              </h2>
            )}
          </div>
          {action !== undefined && (
            <div className="flex shrink-0 items-center gap-2">{action}</div>
          )}
        </header>
      )}
      {/* p-4 (shorthand) so px-*/py-*/pt-* overrides from bodyClassName win */}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}
