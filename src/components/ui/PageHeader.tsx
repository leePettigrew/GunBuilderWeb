import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface PageHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("mb-8 animate-fade-in", className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow !== undefined && (
            <p className="mb-1 font-display text-[11px] uppercase tracking-stamp text-ember">
              {eyebrow}
            </p>
          )}
          <h1 className="heading-stencil text-2xl text-bone sm:text-3xl">
            {title}
          </h1>
          {description !== undefined && (
            <p className="mt-2 max-w-2xl text-sm text-bone-soft">
              {description}
            </p>
          )}
        </div>
        {actions !== undefined && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
      <div className="hazard-stripe mt-5 opacity-60" aria-hidden="true" />
    </header>
  );
}
