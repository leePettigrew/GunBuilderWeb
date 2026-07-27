import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type StatChipTone = "neutral" | "ember" | "hazard" | "blood" | "olive";

const valueToneClasses: Record<StatChipTone, string> = {
  neutral: "text-bone",
  ember: "text-ember",
  hazard: "text-hazard",
  blood: "text-blood",
  olive: "text-olive",
};

export interface StatChipProps {
  label: ReactNode;
  value: ReactNode;
  tone?: StatChipTone;
  className?: string;
}

export function StatChip({
  label,
  value,
  tone = "neutral",
  className,
}: StatChipProps) {
  return (
    <div
      className={cn(
        "surface-inset inline-flex items-baseline gap-2 px-2 py-1",
        className,
      )}
    >
      <span className="font-display text-[9px] uppercase tracking-stamp text-bone-faint">
        {label}
      </span>
      <span className={cn("numerals text-xs", valueToneClasses[tone])}>
        {value}
      </span>
    </div>
  );
}
