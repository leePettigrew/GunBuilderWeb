"use client";

import { IconMoon, IconSun } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { useTheme } from "@/lib/data/theme";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const Icon = theme === "dark" ? IconSun : IconMoon;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-card border border-rivet/50 bg-steel-850 px-3 py-2 text-bone-soft transition-colors hover:border-ember/60 hover:text-bone",
        className,
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="font-display text-[11px] uppercase tracking-stamp">
        {theme === "dark" ? "Daylight" : "Bunker"}
      </span>
    </button>
  );
}
