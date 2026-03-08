/**
 * FinancialHealthPillarsCard.jsx
 *
 * Premium dark fintech card showing a radar chart of financial health pillars
 * with individual pillar progress cards beneath it.
 */

import { useState } from 'react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'
import { Info } from 'lucide-react'

// ─── Helpers ────────────────────────────────────────────────────────────────

const PILLAR_LABELS = {
  liquidity:       'Liquidity',
  diversification: 'Diversification',
  risk_match:      'Risk Match',
  digital_health:  'Digital Health',
}

const PILLAR_TOOLTIPS = {
  liquidity:
    'Measures how many months of expenses you can cover with available cash.',
  diversification:
    'Measures how well your assets are spread across different asset classes.',
  risk_match:
    'Measures whether your current portfolio matches your selected risk profile.',
  digital_health:
    'Measures your exposure to crypto/tokenised assets and unregulated platforms.',
}

/**
 * Return Tailwind utility classes for the given colour key (light theme).
 */
function getStatusColorClasses(color) {
  switch (color) {
    case 'green':
      return {
        text:     'text-emerald-600',
        bg:       'bg-emerald-500',
        bgMuted:  'bg-emerald-100',
        border:   'border-emerald-200',
        glow:     'shadow-emerald-200/40',
      }
    case 'amber':
      return {
        text:     'text-amber-600',
        bg:       'bg-amber-500',
        bgMuted:  'bg-amber-100',
        border:   'border-amber-200',
        glow:     'shadow-amber-200/40',
      }
    case 'red':
      return {
        text:     'text-red-600',
        bg:       'bg-red-500',
        bgMuted:  'bg-red-100',
        border:   'border-red-200',
        glow:     'shadow-red-200/40',
      }
    default:
      return {
        text:     'text-sky-600',
        bg:       'bg-sky-500',
        bgMuted:  'bg-sky-100',
        border:   'border-sky-200',
        glow:     'shadow-sky-200/40',
      }
  }
}

/**
 * Transform the pillars object into the array shape Recharts expects.
 */
function buildRadarData(pillars) {
  if (!pillars) return []
  return Object.entries(PILLAR_LABELS).map(([key, label]) => ({
    subject: label,
    value:   pillars[key]?.score ?? 0,
    fullMark: 100,
  }))
}

// ─── Custom radar label ─────────────────────────────────────────────────────

function renderPolarAngleLabel({ payload, x, y, cx, cy, ...rest }) {
  // Nudge the label away from centre
  const dx = x - cx
  const dy = y - cy
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const nudge = 14
  const nx = x + (dx / len) * nudge
  const ny = y + (dy / len) * nudge

  return (
    <text
      {...rest}
      x={nx}
      y={ny}
      textAnchor="middle"
      dominantBaseline="central"
      className="fill-slate-500 text-[11px] font-medium tracking-wide"
    >
      {payload.value}
    </text>
  )
}

// ─── Pillar card ────────────────────────────────────────────────────────────

function PillarCard({ pillarKey, pillar }) {
  const [hovered, setHovered] = useState(false)
  const label   = PILLAR_LABELS[pillarKey] ?? pillarKey
  const tooltip = PILLAR_TOOLTIPS[pillarKey] ?? ''
  const c       = getStatusColorClasses(pillar?.color)
  const score   = pillar?.score ?? 0
  const status  = pillar?.status ?? '—'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        group relative flex flex-col gap-3 rounded-2xl border
        bg-white/70 p-5 backdrop-blur-sm transition-all duration-300
        ${hovered
          ? `border-sky-300 shadow-lg shadow-sky-200/30 -translate-y-0.5`
          : 'border-white/70 shadow-sm'}
      `}
    >
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium text-slate-500">{label}</p>
          <p className={`mt-0.5 text-2xl font-bold tabular-nums ${c.text}`}>
            {score}
          </p>
        </div>
        <button
          type="button"
          className="mt-0.5 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label={`Info about ${label}`}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Status + progress */}
      <div className="space-y-2">
        <span className={`text-xs font-semibold ${c.text}`}>{status}</span>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full ${c.bg} transition-all duration-500`}
            style={{ width: `${Math.min(score, 100)}%` }}
          />
        </div>
      </div>

      {/* Tooltip on hover */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          hovered ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="pt-1 text-[11px] leading-relaxed text-slate-500">
          {tooltip}
        </p>
      </div>
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function FinancialHealthPillarsCard({
  overallScore = 0,
  pillars = {},
}) {
  const radarData = buildRadarData(pillars)

  return (
    <div
      className={`
        relative overflow-hidden rounded-3xl border border-white/70
        bg-white/80 p-6 shadow-sm backdrop-blur-xl sm:p-8
      `}
    >
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-sky-200/40 blur-3xl" />

      {/* ── Title row ──────────────────────────────────────────────── */}
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold tracking-tight text-slate-800">
            Financial Health Pillars
          </h2>
          <Info className="h-4 w-4 text-slate-400" />
        </div>
        <p className="text-sm font-semibold text-sky-600">
          Overall Score:{' '}
          <span className="text-base tabular-nums">{overallScore}</span>
        </p>
      </div>

      {/* ── Radar chart ────────────────────────────────────────────── */}
      <div className="relative mx-auto mt-4 h-64 w-full max-w-md sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
            <PolarGrid
              stroke="rgba(14,165,233,0.15)"
              strokeDasharray="3 3"
            />
            <PolarAngleAxis
              dataKey="subject"
              tick={renderPolarAngleLabel}
              tickLine={false}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />
            <Radar
              name="Score"
              dataKey="value"
              stroke="rgba(14,165,233,0.8)"
              strokeWidth={2}
              fill="rgba(14,165,233,0.12)"
              dot={{ r: 3, fill: '#0ea5e9', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#0ea5e9', stroke: '#0284c7', strokeWidth: 2 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Pillar cards grid ──────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Object.keys(PILLAR_LABELS).map((key) => (
          <PillarCard
            key={key}
            pillarKey={key}
            pillar={pillars[key]}
          />
        ))}
      </div>
    </div>
  )
}
