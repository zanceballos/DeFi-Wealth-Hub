/**
 * InfoTooltip — small ⓘ icon with a hover popover explaining how a metric is calculated.
 *
 * Props:
 *   text  (string | ReactNode) — explanation shown on hover
 */
import { Info } from 'lucide-react'

export default function InfoTooltip({ text }) {
  if (!text) return null

  return (
    <span className="group/tip relative inline-flex cursor-help">
      <Info className="h-3.5 w-3.5 text-slate-300 transition-colors group-hover/tip:text-brand-primary" />

      {/* Popover */}
      <span
        className={
          'pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 w-64 -translate-x-1/2 ' +
          'rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left ' +
          'shadow-[0_8px_24px_rgba(15,23,42,0.12)] ' +
          'opacity-0 invisible translate-y-1 ' +
          'transition-all duration-200 ease-out ' +
          'group-hover/tip:pointer-events-auto group-hover/tip:opacity-100 group-hover/tip:visible group-hover/tip:translate-y-0'
        }
      >
        {/* Arrow */}
        <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-slate-200 bg-white" />

        <span className="relative block text-xs leading-relaxed text-slate-600">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            How it's calculated
          </span>
          {text}
        </span>
      </span>
    </span>
  )
}
