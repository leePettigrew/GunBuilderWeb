import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "ember" | "hazard" | "blood" | "olive";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "border-rivet/50 bg-steel-800 text-bone-soft",
  ember: "border-ember/40 bg-ember/15 text-ember",
  hazard: "border-hazard/40 bg-hazard/15 text-hazard",
  blood: "border-blood/40 bg-blood/15 text-blood",
  olive: "border-olive/40 bg-olive/15 text-olive",
};

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-display text-[10px] uppercase tracking-stamp",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
