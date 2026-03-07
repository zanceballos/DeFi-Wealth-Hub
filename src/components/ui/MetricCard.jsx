/**
 * MetricCard — Digibank-style metric card with hover detail overlay.
 *
 * Props:
 *   title          (string)   — small muted label
 *   value          (string)   — large bold value
 *   caption        (string)   — secondary line below value
 *   captionColor   (string)   — Tailwind text class for caption, default "text-emerald-500"
 *   accentColor    (string)   — left accent bar colour class, default "bg-brand-primary"
 *   icon           (Component) — optional lucide icon
 *   children       (ReactNode) — hover detail panel content
 */
import {ChevronRight} from 'lucide-react'

export default function MetricCard({
  title,
  value,
  caption,
  captionColor = 'text-emerald-500',
  accentColor = 'bg-brand-primary',
  icon: Icon,
  children,
}) {
  return (
    <article className="group relative">
      {/* ── Main card ── */}
      <div
        className={
          'relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 ' +
          'shadow-[0_2px_12px_rgba(15,23,42,0.04)] ' +
          'transition-all duration-300 ease-out ' +
          'group-hover:-translate-y-1 group-hover:shadow-[0_8px_24px_rgba(15,23,42,0.10)] ' +
          'group-hover:border-sky-300/60'
        }
      >
        {/* Left accent bar */}
        <span
          className={`absolute inset-y-0 left-0 w-1 rounded-l-2xl ${accentColor}`}
        />

        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium tracking-wide text-slate-400 uppercase">
              {title}
            </p>
            <p className="mt-2 text-[28px] font-bold leading-tight tracking-tight text-slate-900">
              {value}
            </p>
            {caption && (
              <p className={`mt-1.5 text-sm font-semibold ${captionColor}`}>
                {caption}
              </p>
            )}
          </div>

          {/* Icon circle */}
          {Icon && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors group-hover:bg-sky-50 group-hover:text-brand-primary">
              <Icon className="h-5 w-5" />
            </span>
          )}
        </div>

        {/* "View details" affordance */}
        {children && (
          <span className="mt-3 flex items-center gap-1 text-xs font-medium text-slate-300 transition-colors group-hover:text-brand-primary">
            View details
            <ChevronRight className="h-3 w-3" />
          </span>
        )}
      </div>

      {/* ── Hover detail panel ── */}
      {children && (
        <div
          className={
            'pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-80 -translate-x-1/2 ' +
            'rounded-2xl border border-slate-200 bg-white p-5 ' +
            'shadow-[0_12px_40px_rgba(15,23,42,0.12)] ' +
            'opacity-0 invisible translate-y-2 ' +
            'transition-all duration-300 ease-out ' +
            'group-hover:pointer-events-auto group-hover:opacity-100 group-hover:visible group-hover:translate-y-0'
          }
        >
          {/* Arrow */}
          <span className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-l border-t border-slate-200 bg-white" />
          <div className="relative">{children}</div>
        </div>
      )}
    </article>
  )
}

/* ───────────────────────────────────────────────────
   Sub-components for hover panel rows
   ─────────────────────────────────────────────────── */

/**
 * A single breakdown row with colored dot, label, value and optional mini bar.
 */
export function BreakdownRow({ color = 'bg-slate-400', label, value, percent }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className={`h-2 w-2 shrink-0 rounded-full ${color}`} />
      <span className="flex-1 text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold text-slate-800">{value}</span>
      {percent != null && (
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${color}`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}

/**
 * A pillar row for the Wellness hover panel.
 */
export function PillarRow({ icon: Icon, name, score, description, colorClass = 'bg-brand-primary' }) {
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
          <Icon className="h-3.5 w-3.5" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">{name}</span>
          <span className="text-sm font-bold text-slate-800">{score}/100</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${colorClass}`}
            style={{ width: `${Math.min(score, 100)}%` }}
          />
        </div>
        {description && (
          <p className="mt-1 text-xs text-slate-400">{description}</p>
        )}
      </div>
    </div>
  )
}
