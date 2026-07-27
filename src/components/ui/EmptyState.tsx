import type { ComponentType, ReactNode, SVGProps } from "react";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  /** Accepts an icon component (from ./icons) or any pre-sized node. */
  icon?: ComponentType<SVGProps<SVGSVGElement>> | ReactNode;
  title: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: EmptyStateProps) {
  let iconNode: ReactNode = null;
  if (typeof icon === "function") {
    const IconComponent = icon;
    iconNode = <IconComponent className="h-10 w-10 text-bone-faint" />;
  } else if (icon !== undefined && icon !== null) {
    iconNode = <div className="text-bone-faint">{icon}</div>;
  }

  return (
    <div
      className={cn(
        "surface-inset flex flex-col items-center justify-center gap-3 border-dashed px-6 py-14 text-center",
        className,
      )}
    >
      {iconNode}
      <h3 className="heading-stencil text-base text-bone">{title}</h3>
      {body !== undefined && (
        <p className="max-w-md text-sm text-bone-soft">{body}</p>
      )}
      {action !== undefined && <div className="mt-2">{action}</div>}
    </div>
  );
}
