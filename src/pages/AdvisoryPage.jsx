/**
 * AdvisoryPage.jsx
 *
 * AI-powered financial advisory page. Fetches the user's Firebase data,
 * builds a payload, calls Groq, and displays structured advisory insights
 * in a polished DBS-digibank-inspired UI.
 */

import { useCallback, useEffect, useState } from 'react'
import { db } from '../lib/firebase.js'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore'
import { useAuthContext } from '../hooks/useAuthContext.js'
import { buildAdvisoryPayload } from '../services/advisoryPayloadBuilder.js'
import { fetchAdvisory, fallbackAdvisory } from '../services/groqAdvisoryService.js'
import FinancialHealthPillarsCard from '../components/FinancialHealthPillarsCard.jsx'

import {
  Brain,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  BookOpen,
  Lightbulb,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Zap,
  Sparkles,
  Activity,
  Target,
  Droplets,
} from 'lucide-react'

// ─── Constants ──────────────────────────────────────────────────────────────

const RISK_COLORS = {
  low:      'bg-emerald-100 text-emerald-700',
  moderate: 'bg-sky-100 text-sky-700',
  elevated: 'bg-amber-100 text-amber-700',
  high:     'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

const SEVERITY_STYLES = {
  positive: { border: 'border-emerald-200', bg: 'bg-emerald-50', icon: ShieldCheck,   iconColor: 'text-emerald-500', label: 'Great ✓' },
  neutral:  { border: 'border-sky-200',     bg: 'bg-sky-50',     icon: Lightbulb,     iconColor: 'text-sky-500',     label: 'Watch out ⚠' },
  warning:  { border: 'border-amber-200',   bg: 'bg-amber-50',   icon: AlertTriangle, iconColor: 'text-amber-500',   label: 'Action needed 🔴' },
  critical: { border: 'border-red-200',     bg: 'bg-red-50',     icon: AlertTriangle, iconColor: 'text-red-500',     label: 'Action needed 🔴' },
}

const PRIORITY_STYLES = {
  high:   'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low:    'bg-slate-100 text-slate-600',
}

const CATEGORY_ICONS = {
  liquidity:       Droplets,
  diversification: Activity,
  risk:            ShieldCheck,
  growth:          TrendingUp,
  savings:         Target,
  digital_health:  Sparkles,
}

// ─── Skeleton loader ────────────────────────────────────────────────────────

function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/60 ${className}`} />
}

function AdvisorySkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonBlock className="h-40 w-full" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SkeletonBlock className="h-24" />
        <SkeletonBlock className="h-24" />
        <SkeletonBlock className="h-24" />
      </div>
      <SkeletonBlock className="h-56 w-full" />
      <SkeletonBlock className="h-44 w-full" />
    </div>
  )
}

// ─── No data empty state ────────────────────────────────────────────────────

function NoDataAdvisory({ onRefresh, loading }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-20 text-center backdrop-blur-sm">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50">
        <Brain className="h-8 w-8 text-sky-300" />
      </div>
      <h2 className="text-lg font-semibold text-slate-700">No Insights Yet</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        Upload at least one financial statement from the Dashboard so the AI can analyse your portfolio and generate personalised insights.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary/90 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Generating…' : 'Generate Advisory'}
        </button>
      </div>

      {/* Preview of what they'll unlock */}
      <div className="mt-10 grid grid-cols-1 gap-3 text-left sm:grid-cols-3 max-w-2xl w-full">
        {[
          { icon: Lightbulb, color: 'bg-amber-50 text-amber-500',    title: 'Key Insights',        desc: 'Colour-coded findings across liquidity, risk, and diversification.' },
          { icon: Zap,       color: 'bg-sky-50 text-sky-500',        title: 'Recommended Actions', desc: 'Prioritised steps to improve your financial health score.' },
          { icon: BookOpen,  color: 'bg-emerald-50 text-emerald-500', title: 'Learn More',          desc: 'Expandable education topics tailored to your portfolio.' },
        ].map(({ icon: Icon, color, title, desc }) => (
          <div key={title} className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur-xl">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">{title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function HeroCard({ advisory, payload }) {
  const riskClass = RISK_COLORS[advisory.risk_level] ?? RISK_COLORS.moderate
  const score = payload?.wellness?.overall_score ?? 0

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur-xl sm:p-8">
      <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-sky-100/50 blur-3xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-sky-500" />
            <h1 className="text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
              AI Wealth Advisory
            </h1>
          </div>
          <h2 className="text-lg font-semibold text-sky-600">{advisory.headline}</h2>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600">{advisory.summary}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${riskClass}`}>
            Risk: {advisory.risk_level}
          </span>
          {score > 0 && (
            <div className="text-right">
              <p className="text-xs text-slate-400">Wellness Score</p>
              <p className="text-2xl font-bold text-sky-600">
                {score}<span className="text-sm font-normal text-slate-400">/100</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SnapshotCards({ payload }) {
  const w  = payload?.wellness ?? {}
  const p  = payload?.portfolio ?? {}
  const km = w.key_metrics ?? {}

  const cards = [
    {
      label: 'Net Worth',
      value: km.net_worth ? `S$${km.net_worth.toLocaleString('en-SG', { minimumFractionDigits: 2 })}` : '—',
      icon:  TrendingUp,
      color: 'text-emerald-500',
    },
    {
      label: 'Cash Buffer',
      value: km.cash_buffer_months ? `${km.cash_buffer_months.toFixed(1)} months` : '—',
      icon:  Droplets,
      color: 'text-sky-500',
    },
    {
      label: 'Platforms',
      value: p.total_statements ?? 0,
      icon:  Activity,
      color: 'text-sky-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <div
            key={c.label}
            className="flex items-center gap-4 rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur-xl"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 ${c.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">{c.label}</p>
              <p className="text-lg font-bold text-slate-800">{c.value}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function InsightsSection({ insights }) {
  if (!insights?.length) return null

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-base font-semibold text-slate-700">
        <Lightbulb className="h-5 w-5 text-amber-500" />
        Key Insights
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {insights.map((ins, idx) => {
          const style        = SEVERITY_STYLES[ins.severity] ?? SEVERITY_STYLES.neutral
          const CategoryIcon = CATEGORY_ICONS[ins.category] ?? Lightbulb
          const SeverityIcon = style.icon
          const isLastOdd    = insights.length % 2 === 1 && idx === insights.length - 1

          return (
            <div
              key={idx}
              className={`rounded-2xl border ${style.border} ${style.bg} p-5 transition hover:shadow-sm ${isLastOdd ? 'sm:col-span-2' : ''}`}
            >
              <div className="mb-2 flex items-center gap-2">
                <CategoryIcon className={`h-4 w-4 ${style.iconColor}`} />
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {ins.category?.replace('_', ' ')}
                </span>
                <span className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.bg} ${style.iconColor}`}>
                  <SeverityIcon className="h-3 w-3" />
                  {style.label}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-slate-800">{ins.title}</h4>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{ins.description}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ActionsSection({ actions }) {
  if (!actions?.length) return null

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-base font-semibold text-slate-700">
        <Zap className="h-5 w-5 text-sky-500" />
        Recommended Actions
      </h3>
      <div className="space-y-3">
        {actions.map((act, idx) => {
          const badge = PRIORITY_STYLES[act.priority] ?? PRIORITY_STYLES.medium
          return (
            <div
              key={idx}
              className="flex items-start gap-4 rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur-xl"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-600">
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">{act.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${badge}`}>
                    {act.priority}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-slate-600">{act.detail}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EducationSection({ education }) {
  const [openIdx, setOpenIdx] = useState(null)
  if (!education?.length) return null

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-base font-semibold text-slate-700">
        <BookOpen className="h-5 w-5 text-emerald-500" />
        Learn More
      </h3>
      <div className="space-y-2">
        {education.map((edu, idx) => {
          const isOpen = openIdx === idx
          return (
            <div key={idx} className="rounded-2xl border border-white/70 bg-white/80 shadow-sm backdrop-blur-xl">
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="flex w-full items-center justify-between p-5 text-left"
              >
                <span className="text-sm font-semibold text-slate-700">{edu.topic}</span>
                {isOpen
                  ? <ChevronUp className="h-4 w-4 text-slate-400" />
                  : <ChevronDown className="h-4 w-4 text-slate-400" />
                }
              </button>
              {isOpen && (
                <div className="border-t border-slate-100 px-5 pb-5 pt-3">
                  <p className="text-sm leading-relaxed text-slate-600">{edu.content}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DataUsedSection({ payload }) {
  if (!payload) return null
  const p = payload.portfolio

  return (
    <div className="rounded-2xl border border-white/70 bg-white/60 p-5 backdrop-blur-sm">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Data used for this advisory
      </h3>
      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        <span className="rounded-full bg-slate-100 px-3 py-1">
          {p?.total_statements ?? 0} statement(s)
        </span>
        {(p?.platforms ?? []).map((pl) => (
          <span key={pl} className="rounded-full bg-slate-100 px-3 py-1">{pl}</span>
        ))}
        {(payload.email_transactions?.total_transactions ?? 0) > 0 && (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-600">
            {payload.email_transactions.total_transactions} email transaction(s)
          </span>
        )}
        {(p?.manual_accounts_summary?.cash_total ?? 0) > 0 && (
          <span className="rounded-full bg-violet-50 px-3 py-1 text-violet-600">
            Manual accounts linked
          </span>
        )}
        <span className="rounded-full bg-slate-100 px-3 py-1">
          {payload.trends?.net_worth_history?.length ?? 0} months history
        </span>
      </div>
    </div>
  )
}

// ─── Session cache helpers ───────────────────────────────────────────────────

const SS_ADVISORY = 'dwh_advisory'
const SS_PAYLOAD  = 'dwh_advisory_payload'
const SS_UID      = 'dwh_advisory_uid'

function readSessionCache(uid) {
  try {
    if (sessionStorage.getItem(SS_UID) !== uid) return null
    const a = sessionStorage.getItem(SS_ADVISORY)
    const p = sessionStorage.getItem(SS_PAYLOAD)
    if (a && p) return { advisory: JSON.parse(a), payload: JSON.parse(p) }
  } catch { /* corrupted — ignore */ }
  return null
}

function writeSessionCache(uid, advisory, payload) {
  try {
    sessionStorage.setItem(SS_UID, uid)
    sessionStorage.setItem(SS_ADVISORY, JSON.stringify(advisory))
    sessionStorage.setItem(SS_PAYLOAD, JSON.stringify(payload))
  } catch { /* quota exceeded — ignore */ }
}

function clearSessionCache() {
  sessionStorage.removeItem(SS_ADVISORY)
  sessionStorage.removeItem(SS_PAYLOAD)
  sessionStorage.removeItem(SS_UID)
}

// ─── Main page component ────────────────────────────────────────────────────

export default function AdvisoryPage() {
  const { user } = useAuthContext()

  const [loading,  setLoading]  = useState(true)
  const [advisory, setAdvisory] = useState(null)
  const [payload,  setPayload]  = useState(null)
  const [error,    setError]    = useState(null)

  const fetchFirebaseData = useCallback(async () => {
    if (!user?.uid) return null
    const uid = user.uid

    const [profileSnap, statementsSnap, wellnessSnap, historySnap, emailTxSnap] =
      await Promise.all([
        getDoc(doc(db, 'users', uid)),
        getDocs(query(collection(db, 'users', uid, 'statements'), orderBy('uploaded_at', 'desc'))),
        getDoc(doc(db, 'users', uid, 'wellness', 'current')),
        getDocs(query(collection(db, 'users', uid, 'history', 'net_worth', 'items'), orderBy('month_key', 'asc'))),
        getDocs(collection(db, 'users', uid, 'emailTransactions')),
      ])

    const profile   = profileSnap.exists()  ? profileSnap.data()  : null
    const wellness  = wellnessSnap.exists()  ? wellnessSnap.data() : null
    const statements        = statementsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
    const netWorthHistory   = historySnap.docs.map((d) => ({ id: d.id, ...d.data() }))
    const emailTransactions = emailTxSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((tx) => !tx.deleted)

    return { profile, statements, wellness, netWorthHistory, emailTransactions }
  }, [user?.uid])

  const runAdvisoryPipeline = useCallback(async (force = false) => {
    if (!user?.uid) { setLoading(false); return }

    if (!force) {
      const cached = readSessionCache(user.uid)
      if (cached) {
        setAdvisory(cached.advisory)
        setPayload(cached.payload)
        setLoading(false)
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      const raw          = await fetchFirebaseData()
      const builtPayload = buildAdvisoryPayload(raw ?? {})
      setPayload(builtPayload)

      const result = await fetchAdvisory(builtPayload)
      setAdvisory(result)
      writeSessionCache(user.uid, result, builtPayload)
    } catch (err) {
      console.error('[AdvisoryPage] Error:', err)
      setError(err.message ?? 'Something went wrong')
      setAdvisory(fallbackAdvisory())
    } finally {
      setLoading(false)
    }
  }, [user?.uid, fetchFirebaseData])

  useEffect(() => {
    runAdvisoryPipeline(false)
  }, [runAdvisoryPipeline])

  const handleRefresh = useCallback(() => {
    clearSessionCache()
    runAdvisoryPipeline(true)
  }, [runAdvisoryPipeline])

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <section className="relative isolate min-h-full w-full p-4 sm:p-6 lg:p-8">
      {/* Decorative blurs */}
      <div className="pointer-events-none fixed -top-20 -right-20 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Wealth Advisory</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Personalised AI insights powered by your financial data
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary/90 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 space-y-6">
        {loading ? (
          <AdvisorySkeleton />
        ) : !advisory || advisory.headline === 'Unable to generate advisory right now' ? (
          <NoDataAdvisory onRefresh={handleRefresh} loading={loading} />
        ) : (
          <>
            <HeroCard advisory={advisory} payload={payload} />
            <FinancialHealthPillarsCard
              overallScore={payload?.wellness?.overall_score ?? 0}
              pillars={payload?.wellness?.pillars ?? {}}
            />
            <SnapshotCards payload={payload} />
            <InsightsSection insights={advisory.insights} />
            <ActionsSection actions={advisory.actions} />
            <EducationSection education={advisory.education} />
            <DataUsedSection payload={payload} />
          </>
        )}

        {error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <strong>Note:</strong> {error}. Showing fallback advisory.
          </div>
        )}
      </div>

      <footer className="mt-8 px-1 text-xs text-slate-400">
        <p>Advisory generated by AI · Not financial advice · Review with a licensed professional</p>
      </footer>
    </section>
  )
}
