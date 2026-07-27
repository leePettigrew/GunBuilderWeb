import { useState, type ReactNode } from "react";
import { averageDamage, formatDice } from "@shared/engine";
import type { Ruleset, WeaponStats } from "@shared/types";
import { StatChip } from "@/components/ui/StatChip";
import { IconChevronDown, IconWarning } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

function CardLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 font-display text-[10px] uppercase tracking-stamp text-bone-faint">
      {children}
    </p>
  );
}

export function StatCard({
  stats,
  rules,
  className,
}: {
  stats: WeaponStats;
  rules: Ruleset;
  className?: string;
}) {
  const [traceOpen, setTraceOpen] = useState(false);

  return (
    <section className={cn("surface-panel space-y-5 p-5", className)}>
      {stats.warnings.length > 0 && (
        <ul className="space-y-1.5">
          {stats.warnings.map((warning, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-blood">
              <IconWarning className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{warning}</span>
            </li>
          ))}
        </ul>
      )}

      <div>
        <CardLabel>Damage</CardLabel>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="heading-stencil text-4xl leading-none text-ember sm:text-5xl">
            {stats.damageLabel}
          </span>
          <span className="numerals text-sm text-bone-faint">
            avg {averageDamage(stats.damage)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatChip label="Price" value={`${stats.priceRats} ${rules.economy.currencyAbbr}`} />
        <StatChip label="Weight" value={`${stats.weightKg} kg`} />
        <StatChip label="Hide" value={signed(stats.hideMod)} />
        <StatChip label="Accuracy" value={signed(stats.accuracyMod)} />
        {stats.strengthReq !== undefined && (
          <StatChip label="STR req" value={`${stats.strengthReq}`} />
        )}
        {stats.reloadNote !== undefined && <StatChip label="Reload" value={stats.reloadNote} />}
      </div>

      {stats.rangeRow.length > 0 && (
        <div>
          <CardLabel>Range modifiers</CardLabel>
          <div className="surface-inset overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  {stats.rangeRow.map((cell) => (
                    <th
                      key={cell.bandId}
                      className="px-2.5 py-1.5 text-left font-display text-[10px] font-normal uppercase tracking-title text-bone-faint"
                    >
                      {cell.bandLabel}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="numerals">
                <tr>
                  {stats.rangeRow.map((cell) => (
                    <td key={cell.bandId} className="whitespace-nowrap px-2.5 py-1 text-bone-faint">
                      {cell.distance}
                    </td>
                  ))}
                </tr>
                <tr>
                  {stats.rangeRow.map((cell) => (
                    <td
                      key={cell.bandId}
                      className={cn(
                        "px-2.5 pb-1.5 text-sm",
                        cell.malus === null && "text-bone-faint",
                        cell.malus !== null && cell.malus > 0 && "text-olive",
                        cell.malus !== null && cell.malus <= 0 && "text-bone",
                      )}
                    >
                      {cell.malus === null ? "—" : signed(cell.malus)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats.fireModes.length > 0 && (
        <div>
          <CardLabel>Fire modes</CardLabel>
          <div className="surface-inset overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  {["Mode", "Ammo", "Penalty", "All-hit dmg"].map((heading) => (
                    <th
                      key={heading}
                      className="px-2.5 py-1.5 text-left font-display text-[10px] font-normal uppercase tracking-title text-bone-faint"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.fireModes.map((mode) => (
                  <tr key={mode.modeId} className="border-t border-rivet/30" title={mode.note}>
                    <td className="px-2.5 py-1.5 text-bone">{mode.label}</td>
                    <td className="numerals px-2.5 py-1.5 text-bone-soft">{mode.ammoCost}</td>
                    <td className="numerals px-2.5 py-1.5 text-bone-soft">
                      {mode.stackPenalty === 0 ? "0" : signed(mode.stackPenalty)}
                    </td>
                    <td className="numerals px-2.5 py-1.5 text-bone">{formatDice(mode.damage)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats.falloff !== undefined && stats.falloff.length > 0 && (
        <div>
          <CardLabel>Blast falloff</CardLabel>
          <div className="surface-inset overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  {["Ring", "Effect", "Roll"].map((heading) => (
                    <th
                      key={heading}
                      className="px-2.5 py-1.5 text-left font-display text-[10px] font-normal uppercase tracking-title text-bone-faint"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.falloff.map((ring, i) => (
                  <tr key={i} className="border-t border-rivet/30">
                    <td className="numerals whitespace-nowrap px-2.5 py-1.5 text-bone">
                      {ring.fromM}–{ring.toM}m
                    </td>
                    <td className="px-2.5 py-1.5 text-bone-soft">{ring.label}</td>
                    <td className="numerals px-2.5 py-1.5 text-bone">{formatDice(ring.damage)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats.notes.length > 0 && (
        <div>
          <CardLabel>Field notes</CardLabel>
          <ul className="list-disc space-y-1 pl-4 text-xs text-bone-soft">
            {stats.notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t border-rivet/30 pt-3">
        <button
          type="button"
          onClick={() => setTraceOpen((open) => !open)}
          aria-expanded={traceOpen}
          className="flex w-full items-center gap-2 text-left font-display text-[10px] uppercase tracking-stamp text-bone-faint transition-colors hover:text-bone-soft"
        >
          <IconChevronDown
            className={cn("h-3.5 w-3.5 transition-transform", traceOpen && "rotate-180")}
          />
          Show the working
        </button>
        {traceOpen && (
          <dl className="mt-3 space-y-1.5 font-mono text-xs">
            {stats.trace.map((step, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto] items-start gap-x-3">
                <dt className="text-bone-soft">
                  {step.label}
                  {step.detail !== undefined && (
                    <span className="block text-bone-faint">{step.detail}</span>
                  )}
                </dt>
                <dd className="numerals text-right text-bone">{step.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
