/**
 * InfoTooltip — small ⓘ icon with a hover popover explaining how a metric is calculated.
 *
 * Props:
 *   text  (string | ReactNode) — explanation shown on hover
 */
import { useState } from 'react'
import { Info } from 'lucide-react'

export default function InfoTooltip({ text }) {
  if (!text) return null

  const [visible, setVisible] = useState(false)

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        className="inline-flex cursor-help p-1 min-h-[44px] min-w-[44px] items-center justify-center sm:p-0 sm:min-h-0 sm:min-w-0"
        onClick={() => setVisible((v) => !v)}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        aria-label="More info"
      >
        <Info className="h-3.5 w-3.5 text-slate-300 transition-colors hover:text-brand-primary" />
      </button>

      {/* Popover */}
      {visible && (
        <span
          className={
            'pointer-events-none absolute bottom-full left-1/2 mb-2 w-64 -translate-x-1/2 ' +
            'rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left ' +
            'shadow-xl z-[9999]'
          }
        >
          {/* Arrow */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />

          <span className="relative block text-xs leading-relaxed text-slate-600">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              How it's calculated
            </span>
            {text}
          </span>
        </span>
      )}
    </span>
  )
}
