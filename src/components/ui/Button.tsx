"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const baseClasses =
  "inline-flex select-none items-center justify-center rounded-card border font-display uppercase tracking-title transition-colors active:translate-y-px disabled:pointer-events-none disabled:opacity-40 disabled:saturate-50";

// text-steel-950 tracks the theme's background extreme, so filled buttons keep
// contrast when the light remap flips every token.
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-ember bg-ember text-steel-950 shadow-card hover:border-ember-deep hover:bg-ember-deep active:bg-ember-deep/90",
  secondary:
    "border-rivet/60 bg-steel-800 text-bone shadow-card hover:border-rivet hover:bg-steel-700 active:bg-steel-700/80",
  ghost:
    "border-transparent bg-transparent text-bone-soft hover:bg-steel-800/70 hover:text-bone active:bg-steel-800",
  danger:
    "border-blood bg-blood text-steel-950 shadow-card hover:border-blood/85 hover:bg-blood/85 active:bg-blood/75",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "gap-1.5 px-2.5 py-1.5 text-[11px]",
  md: "gap-2 px-4 py-2 text-xs",
  lg: "gap-2.5 px-5 py-2.5 text-sm",
};

/** Class string for button-shaped non-buttons (`<Link>`, `<a>`, labels). */
export function buttonClasses(
  variant: ButtonVariant = "secondary",
  size: ButtonSize = "md",
): string {
  return cn(baseClasses, variantClasses[variant], sizeClasses[size]);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "secondary", size = "md", className, type = "button", ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonClasses(variant, size), className)}
        {...rest}
      />
    );
  },
);
