"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconChevronDown } from "./icons";

/** Shared chrome for raw inputs (exported for table editors and the like). */
export const fieldInputClasses =
  "w-full rounded-card border border-rivet/50 bg-steel-950/60 px-3 py-2 text-sm text-bone shadow-inset transition-colors placeholder:text-bone-faint hover:border-rivet focus:border-ember/60 disabled:pointer-events-none disabled:opacity-40";

const labelClasses =
  "font-display text-[11px] uppercase tracking-title text-bone-soft";

export interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, hint, htmlFor, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className={labelClasses}>
        {label}
      </label>
      {children}
      {hint !== undefined && <p className="text-xs text-bone-faint">{hint}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------

export interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  id,
  placeholder,
  disabled,
  autoFocus,
  className,
}: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <Field label={label} hint={hint} htmlFor={inputId} className={className}>
      <input
        id={inputId}
        type="text"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        className={fieldInputClasses}
      />
    </Field>
  );
}

// ---------------------------------------------------------------------------

export interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

function clampNumber(n: number, min?: number, max?: number): number {
  let out = n;
  if (min !== undefined && out < min) out = min;
  if (max !== undefined && out > max) out = max;
  return out;
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  hint,
  id,
  disabled,
  className,
}: NumberFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  // Draft keeps intermediate keystrokes ("", "-", "1.") typeable while the
  // emitted value is always a finite, clamped number — never NaN.
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? String(value);

  return (
    <Field label={label} hint={hint} htmlFor={inputId} className={className}>
      <input
        id={inputId}
        type="number"
        inputMode="decimal"
        value={shown}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(e) => {
          const raw = e.target.value;
          setDraft(raw);
          const parsed = Number(raw); // Number("") === 0 — empty coerces to 0
          onChange(clampNumber(Number.isFinite(parsed) ? parsed : 0, min, max));
        }}
        onBlur={() => setDraft(null)}
        className={cn(fieldInputClasses, "numerals")}
      />
    </Field>
  );
}

// ---------------------------------------------------------------------------

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  hint?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  hint,
  id,
  disabled,
  className,
}: SelectFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <Field label={label} hint={hint} htmlFor={inputId} className={className}>
      <div className="relative">
        <select
          id={inputId}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={cn(fieldInputClasses, "appearance-none pr-8")}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <IconChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-bone-faint" />
      </div>
    </Field>
  );
}

// ---------------------------------------------------------------------------

export interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  hint?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  hint,
  id,
  placeholder,
  disabled,
  className,
}: TextAreaProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <Field label={label} hint={hint} htmlFor={inputId} className={className}>
      <textarea
        id={inputId}
        value={value}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(fieldInputClasses, "resize-y")}
      />
    </Field>
  );
}

// ---------------------------------------------------------------------------

export interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
  disabled?: boolean;
  className?: string;
}

export function Toggle({
  label,
  checked,
  onChange,
  hint,
  disabled,
  className,
}: ToggleProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="group flex w-fit items-center gap-2.5 disabled:pointer-events-none disabled:opacity-40"
      >
        <span
          className={cn(
            "relative h-5 w-9 shrink-0 rounded-full border transition-colors",
            checked ? "border-ember bg-ember/30" : "border-rivet/60 bg-steel-950/60",
          )}
        >
          <span
            className={cn(
              "absolute left-0.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full transition",
              checked ? "translate-x-4 bg-ember" : "bg-bone-faint",
            )}
          />
        </span>
        <span className={cn(labelClasses, "transition-colors group-hover:text-bone")}>
          {label}
        </span>
      </button>
      {hint !== undefined && <p className="text-xs text-bone-faint">{hint}</p>}
    </div>
  );
}
