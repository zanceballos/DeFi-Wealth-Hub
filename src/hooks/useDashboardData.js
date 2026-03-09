/**
 * useDashboardData — fetches Firestore data for the authenticated user and
 * transforms it into UI-ready shapes for every Dashboard tab.
 *
 * Returns:
 *   {
 *     loading, error, isEmpty,
 *
 *     // Overview tab (existing contract — unchanged)
 *     userProfile, heroStats, pillarScores, netWorthSeries,
 *     savingsDetail, netWorthBreakdown,
 *
 *     // Wallet & Budget tabs (new)
 *     walletViewModel, budgetViewModel,
 *
 *     // Raw data (for power / debug use)
 *     raw: { profile, statements, wellness, netWorthHistory },
 *
 *     refresh,
 *   }
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { db } from '../lib/firebase.js'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  limit,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { useAuthContext } from './useAuthContext.js'
import { CandlestickChart, Droplets, ShieldAlert, Sparkles } from 'lucide-react'

import {
  buildWalletViewModel,
  buildBudgetViewModel,
  safeNumber,
} from '../services/dashboardViewModel.js'
import { getYfPrice } from '../services/marketDataService.js'

// ── Mock fallback data (original static constants) ──
import { HERO_STATS as MOCK_HERO } from '../data/mockHero.js'
import { PILLAR_SCORES as MOCK_PILLARS } from '../data/mockPillar.js'
import { NET_WORTH_SERIES as MOCK_NET_WORTH } from '../data/mockNetworth.js'
import { USER_PROFILE as MOCK_USER_PROFILE } from '../data/mockUserData.js'

// ═══════════════════════════════════════════════════════════════════════════
// Overview-specific helpers (kept here because they reference lucide icons
// which belong to the UI layer, not the pure data-mapping service)
// ═══════════════════════════════════════════════════════════════════════════

const PILLAR_META = {
  liquidity:       {
    icon: Droplets,
    label: 'Liquidity',
    calculationTooltip: 'Score = (Cash buffer months ÷ 6) × 100, capped at 100. A 6-month cash buffer earns a perfect score.',
  },
  diversification: {
    icon: CandlestickChart,
    label: 'Diversification',
    calculationTooltip: 'Score = 100 − largest position % + min(number of accounts × 10, 30). Penalises heavy concentration in a single asset.',
  },
  risk_match:      {
    icon: ShieldAlert,
    label: 'Risk Match',
    calculationTooltip: 'Score = 100 − (crypto % × 0.5) − (unregulated % × 0.5). Lower crypto and unregulated exposure means better alignment with your risk profile.',
  },
  digital_health:  {
    icon: Sparkles,
    label: 'Digital Assets',
    calculationTooltip: 'If digital exposure ≤ 30%: Score = 70 + digital %. Above 30%: Score = 100 − (digital % − 30) × 2. Ideal range is 5–30%.',
  },
}

function pillarDescription(key, score) {
  const descriptions = {
    liquidity:
      score >= 70 ? 'Cash reserves comfortably cover short-term needs.'
        : score >= 40 ? 'Cash buffer is building but below the ideal range.'
          : 'Cash reserves are below target for short-term resilience.',
    diversification:
      score >= 70 ? 'Portfolio is well diversified across asset classes.'
        : score >= 40 ? 'Allocation is balanced but still concentrated in key sectors.'
          : 'Portfolio is heavily concentrated — consider diversifying.',
    risk_match:
      score >= 70 ? 'Portfolio risk is well aligned with your profile.'
        : score >= 40 ? 'Current volatility is slightly above your profile.'
          : 'Risk exposure significantly exceeds your comfort zone.',
    digital_health:
      score >= 70 ? 'Digital asset exposure is healthy and well-managed.'
        : score >= 40 ? 'Exposure is meaningful and should be actively monitored.'
          : 'Digital asset allocation needs attention.',
  }
  return descriptions[key] ?? ''
}

function scoreToColor(score) {
  if (score >= 70) return { colorClass: 'bg-emerald-500', textClass: 'text-emerald-500' }
  if (score >= 40) return { colorClass: 'bg-amber-400',   textClass: 'text-amber-500' }
  return { colorClass: 'bg-red-500', textClass: 'text-red-500' }
}

function wellnessLabel(score) {
  if (score >= 80) return 'Excellent Health'
  if (score >= 70) return 'Good Health'
  if (score >= 50) return 'Moderate Health'
  if (score >= 40) return 'Needs Attention'
  return 'Critical'
}

function fmtCurrency(value, currency = 'S$') {
  if (value == null) return `${currency}0`
  return `${currency}${Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const BREAKDOWN_COLORS = {
  cash:       'bg-emerald-400',
  stocks:     'bg-blue-500',
  crypto:     'bg-amber-400',
  property:   'bg-rose-400',
  tokenised:  'bg-violet-400',
  bonds:      'bg-sky-400',
}

const BREAKDOWN_LABELS = {
  cash:       'Cash & savings',
  stocks:     'Stocks & ETFs',
  crypto:     'Crypto',
  property:   'Property',
  tokenised:  'Tokenised assets',
  bonds:      'Bonds',
}

// ── Mock fallback values for overview card detail panels ──
const MOCK_SAVINGS_DETAIL = {
  income:   'S$4,490',
  expenses: 'S$3,458',
  net:      'S$1,032',
  target:   20,
}

const MOCK_NET_WORTH_BREAKDOWN = [
  { color: 'bg-emerald-400', label: 'Cash & savings',   value: 'S$32,100', percent: 37 },
  { color: 'bg-blue-500',    label: 'Stocks & ETFs',    value: 'S$28,400', percent: 33 },
  { color: 'bg-amber-400',   label: 'Crypto',           value: 'S$12,800', percent: 15 },
  { color: 'bg-rose-400',    label: 'Property',         value: 'S$8,200',  percent: 10 },
  { color: 'bg-violet-400',  label: 'Tokenised assets', value: 'S$4,200',  percent: 5 },
]

// ═══════════════════════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════════════════════

export default function useDashboardData() {
  const { user } = useAuthContext()
  const uid = user?.uid ?? ''

  // ── State ─────────────────────────────────────────────────────────────
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [isEmpty, setIsEmpty]       = useState(false)

  // Overview tab
  const [userProfile, setUserProfile]             = useState(MOCK_USER_PROFILE)
  const [heroStats, setHeroStats]                 = useState(MOCK_HERO)
  const [pillarScores, setPillarScores]           = useState(MOCK_PILLARS)
  const [netWorthSeries, setNetWorthSeries]       = useState(MOCK_NET_WORTH)
  const [savingsDetail, setSavingsDetail]         = useState(MOCK_SAVINGS_DETAIL)
  const [netWorthBreakdown, setNetWorthBreakdown] = useState(MOCK_NET_WORTH_BREAKDOWN)

  // Wallet + Budget tabs
  const [walletViewModel, setWalletViewModel] = useState(() => buildWalletViewModel())
  const [budgetViewModel, setBudgetViewModel] = useState(() => buildBudgetViewModel())

  // Raw data
  const [raw, setRaw] = useState({ profile: null, statements: [], wellness: null, netWorthHistory: [] })

  // ── Fetch ─────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!uid) {
      setIsEmpty(true)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    try {
      // 1. User profile
      const profileSnap = await getDoc(doc(db, 'users', uid))
      const profile = profileSnap.exists() ? profileSnap.data() : null

      if (profile) {
        setUserProfile({
          name:        profile.name ?? profile.displayName ?? MOCK_USER_PROFILE.name,
          riskProfile: profile.riskProfile ?? profile.risk_profile ?? MOCK_USER_PROFILE.riskProfile,
          location:    profile.location ?? MOCK_USER_PROFILE.location,
        })
      }

      // 2. Wellness snapshot
      const wellnessSnap = await getDoc(doc(db, 'users', uid, 'wellness', 'current'))
      const wellness = wellnessSnap.exists() ? wellnessSnap.data() : null

      // 3. Statements + their transaction subcollections
      const statementsSnap = await getDocs(collection(db, 'users', uid, 'statements'))
      const statements = []
      statementsSnap.forEach((d) => statements.push({ id: d.id, ...d.data() }))
      const activeStmts = statements.filter(
        (s) => s.status === 'parsed' || s.status === 'approved',
      )

      // Fetch transactions subcollection for each active statement (needed for Budget)
      for (const stmt of activeStmts) {
        try {
          const txCol = collection(db, 'users', uid, 'statements', stmt.id, 'transactions')
          const txSnap = await getDocs(query(txCol, orderBy('date', 'desc'), limit(200)))
          const txns = []
          txSnap.forEach((td) => txns.push({ id: td.id, ...td.data() }))
          stmt.transactions = txns
        } catch {
          stmt.transactions = []
        }
      }

      // 4. Net worth history
      const historyRef = collection(db, 'users', uid, 'history', 'net_worth', 'items')
      const historySnap = await getDocs(query(historyRef, orderBy('month_key', 'asc')))
      const historyItems = []
      historySnap.forEach((d) => historyItems.push(d.data()))

      // ── Save raw ──────────────────────────────────────────────────────
      setRaw({ profile, statements, wellness, netWorthHistory: historyItems })

      // ── Detect empty state ────────────────────────────────────────────
      // Also consider manual_accounts saved on the user document
      const manual = profile?.manual_accounts
      const hasManual = (
        (Array.isArray(manual?.accounts) && manual.accounts.length > 0) ||
        (Array.isArray(manual?.investments) && manual.investments.length > 0)
      )
      const hasData = hasManual || !!wellness || activeStmts.length > 0 || historyItems.length > 0
      setIsEmpty(!hasData)

      // ════════════════════════════════════════════════════════════════════
      // OVERVIEW TAB transformations
      // ════════════════════════════════════════════════════════════════════
      if (wellness) {
        const km             = wellness.key_metrics ?? {}
        const netWorth       = safeNumber(km.net_worth)
        const savingsRate    = safeNumber(km.savings_rate_pct)
        const monthlyIncome  = safeNumber(profile?.monthly_income)
        const monthlyExp     = safeNumber(profile?.monthly_expenses)
        const netSavings     = monthlyIncome - monthlyExp

        setHeroStats({
          netWorth: {
            value: fmtCurrency(netWorth),
            delta: wellness.status === 'green' ? 'Healthy'
              : wellness.status === 'amber' ? 'Moderate'
                : 'Needs attention',
          },
          wellness: {
            score: wellness.overall_score ?? 0,
            label: wellnessLabel(wellness.overall_score ?? 0),
          },
          savings: {
            value: fmtCurrency(Math.max(netSavings, 0)),
            rate: Math.round(savingsRate),
          },
        })

        setSavingsDetail({
          income:   fmtCurrency(monthlyIncome),
          expenses: fmtCurrency(monthlyExp),
          net:      fmtCurrency(netSavings),
          target:   20,
        })

        // Pillar scores
        const pillars = wellness.pillars ?? {}
        setPillarScores(
          Object.entries(PILLAR_META).map(([key, meta]) => {
            const p     = pillars[key] ?? {}
            const score = p.score ?? 0
            return {
              name: meta.label,
              score,
              ...scoreToColor(score),
              icon: meta.icon,
              description: pillarDescription(key, score),
              calculationTooltip: meta.calculationTooltip,
            }
          }),
        )
      }

      // Asset breakdown (overview card)
      if (activeStmts.length > 0) {
        const totals = { cash: 0, stocks: 0, crypto: 0, property: 0, tokenised: 0, bonds: 0 }
        let grandTotal = 0
        for (const stmt of activeStmts) {
          const bd = stmt.asset_class_breakdown ?? {}
          for (const key of Object.keys(totals)) {
            const v = safeNumber(bd[key])
            totals[key] += v
            grandTotal += v
          }
        }
        const breakdown = Object.entries(totals)
          .filter(([, v]) => v > 0)
          .map(([key, v]) => ({
            color:   BREAKDOWN_COLORS[key] ?? 'bg-slate-400',
            label:   BREAKDOWN_LABELS[key] ?? key,
            value:   fmtCurrency(v),
            percent: grandTotal > 0 ? Math.round((v / grandTotal) * 100) : 0,
          }))
        if (breakdown.length > 0) setNetWorthBreakdown(breakdown)
      }

      // ── Manual data asset breakdown (cash from user manual_accounts) ──
      // Start: line 322 onwards as requested
      const manualAccounts = profile?.manual_accounts?.accounts
      const manualInvestments = profile?.manual_accounts?.investments

      // Aggregate manual cash from accounts (if present)
      const manualCash = Array.isArray(manualAccounts)
        ? manualAccounts.reduce((sum, acc) => sum + safeNumber(acc?.balance), 0)
        : 0

      // Aggregate manual investments into stocks and crypto buckets (sum of lots: quantity * averageCost)
      let manualStocks = 0
      let manualCrypto = 0
      if (Array.isArray(manualInvestments) && manualInvestments.length > 0) {
        for (const inv of manualInvestments) {
          const lots = Array.isArray(inv?.lots) ? inv.lots : []
          const assetTotal = lots.reduce((sum, lot) => {
            const qty = safeNumber(lot?.quantity)
            const avg = safeNumber(lot?.averageCost)
            const val = qty * avg
            return sum + (Number.isFinite(val) ? val : 0)
          }, 0)

          // normalise type to buckets
          const t = (inv?.type || '').toLowerCase()
          if (t === 'crypto') {
            manualCrypto += assetTotal
          } else if (t === 'stocks_etfs' || t === 'stocks_etf' || t === 'stock_etf' || t === 'stocks' ) {
            manualStocks += assetTotal
          } else {
            // default unknown types to stocks bucket to avoid losing value
            manualStocks += assetTotal
          }
        }
      }

      // If we have any manual totals (cash/stocks/crypto), recalc totals including them and recompute percentages
      if (manualCash > 0 || manualStocks > 0 || manualCrypto > 0) {
        const totals2 = { cash: 0, stocks: 0, crypto: 0, property: 0, tokenised: 0, bonds: 0 }
        let grandTotal2 = 0

        // Include statement-based totals (same logic as above)
        for (const stmt of activeStmts) {
          const bd = stmt.asset_class_breakdown ?? {}
          for (const key of Object.keys(totals2)) {
            const v = safeNumber(bd[key])
            totals2[key] += v
            grandTotal2 += v
          }
        }

        // Add manual figures on top of statement totals
        if (manualCash > 0) {
          totals2.cash += manualCash
          grandTotal2 += manualCash
        }
        if (manualStocks > 0) {
          totals2.stocks += manualStocks
          grandTotal2 += manualStocks
        }
        if (manualCrypto > 0) {
          totals2.crypto += manualCrypto
          grandTotal2 += manualCrypto
        }

        const breakdown2 = Object.entries(totals2)
          .filter(([, v]) => v > 0)
          .map(([key, v]) => ({
            color:   BREAKDOWN_COLORS[key] ?? 'bg-slate-400',
            label:   BREAKDOWN_LABELS[key] ?? key,
            value:   fmtCurrency(v),
            percent: grandTotal2 > 0 ? Math.round((v / grandTotal2) * 100) : 0,
          }))

        setNetWorthBreakdown(breakdown2)
      }

      // Net worth time series
      if (historyItems.length > 0) {
        setNetWorthSeries(
          historyItems.map((item) => ({
            month: item.month ?? item.month_key,
            value: item.value ?? 0,
          })),
        )
      }

      // ════════════════════════════════════════════════════════════════════
      // WALLET + BUDGET TAB view models (delegated to dashboardViewModel)
      // ════════════════════════════════════════════════════════════════════
      setWalletViewModel(
        buildWalletViewModel({ profile, statements, wellness, netWorthHistory: historyItems }),
      )
      setBudgetViewModel(
        buildBudgetViewModel({ profile, statements, wellness }),
      )
    } catch (err) {
      console.error('useDashboardData: failed to fetch from Firestore', err)
      setError(err)
      // Keep mock / previous data as fallback
    } finally {
      setLoading(false)
    }
  }, [uid])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ═══════════════════════════════════════════════════════════════════════════
  // Manual holdings aggregation helpers (quantities per asset by type)
  // ═══════════════════════════════════════════════════════════════════════════
  const manualHoldings = useMemo(() => {
    const profile = raw.profile
    const investments = profile?.manual_accounts?.investments
    const accounts = profile?.manual_accounts?.accounts

    // Cash total from accounts
    const manualCash = Array.isArray(accounts)
      ? accounts.reduce((sum, acc) => sum + safeNumber(acc?.balance), 0)
      : 0

    const stocks = new Map() // symbol -> totalQty
    const crypto = new Map() // symbol -> totalQty

    if (Array.isArray(investments)) {
      for (const inv of investments) {
        const lots = Array.isArray(inv?.lots) ? inv.lots : []
        const qtyTotal = lots.reduce((s, l) => s + safeNumber(l?.quantity), 0)
        const symbolRaw = (inv?.asset ?? '').trim()
        if (!symbolRaw || qtyTotal <= 0) continue
        const symbol = symbolRaw.toUpperCase()
        const type = (inv?.type || '').toLowerCase()
        if (type === 'crypto') {
          crypto.set(symbol, (crypto.get(symbol) || 0) + qtyTotal)
        } else {
          // default and stocks_etfs bucket
          stocks.set(symbol, (stocks.get(symbol) || 0) + qtyTotal)
        }
      }
    }

    return { manualCash, stocks, crypto }
  }, [raw.profile])

  // Helper: rebuild net worth breakdown combining statements + manual cash + provided live valuations
  const rebuildBreakdown = useCallback(({ liveStocksValue = null, liveCryptoValue = null } = {}) => {
    const activeStmts = Array.isArray(raw.statements)
      ? raw.statements.filter((s) => s.status === 'parsed' || s.status === 'approved')
      : []

    const totals = { cash: 0, stocks: 0, crypto: 0, property: 0, tokenised: 0, bonds: 0 }
    let grand = 0
    for (const stmt of activeStmts) {
      const bd = stmt.asset_class_breakdown ?? {}
      for (const key of Object.keys(totals)) {
        const v = safeNumber(bd[key])
        totals[key] += v
        grand += v
      }
    }

    // Add manual cash
    if (manualHoldings.manualCash > 0) {
      totals.cash += manualHoldings.manualCash
      grand += manualHoldings.manualCash
    }

    // Stocks & crypto: prefer live valuations if provided, otherwise keep existing statement totals only
    if (liveStocksValue != null && liveStocksValue > 0) {
      // Replace or augment stocks bucket: we add live value on top of statements
      totals.stocks += liveStocksValue
      grand += liveStocksValue
    }
    if (liveCryptoValue != null && liveCryptoValue > 0) {
      totals.crypto += liveCryptoValue
      grand += liveCryptoValue
    }

    const breakdown = Object.entries(totals)
      .filter(([, v]) => v > 0)
      .map(([key, v]) => ({
        color:   BREAKDOWN_COLORS[key] ?? 'bg-slate-400',
        label:   BREAKDOWN_LABELS[key] ?? key,
        value:   fmtCurrency(v),
        percent: grand > 0 ? Math.round((v / grand) * 100) : 0,
      }))

    if (breakdown.length > 0) setNetWorthBreakdown(breakdown)
  }, [raw.statements, manualHoldings])

  // ═══════════════════════════════════════════════════════════════════════════
  // Periodic price updates via yfinance-defi
  //  - Stocks every 24 hours
  //  - Crypto every 1 hour
  // Writes to Firestore under users/{uid}/live_quotes/{SYMBOL}
  // Also updates local netWorthBreakdown so UI reflects changes without extra listeners.
  // ═══════════════════════════════════════════════════════════════════════════

  // Stocks (24h)
  useEffect(() => {
    if (!uid) return
    const symbols = Array.from(manualHoldings.stocks.keys())
    if (symbols.length === 0) return

    let cancelled = false

    async function runOnce() {
      // Fetch all stock symbols; daily cadence so burst should be acceptable if list is small
      const prices = await Promise.all(symbols.map((s) => getYfPrice(s, { ttlMs: 24 * 60 * 60 * 1000 })))
      if (cancelled) return

      // Persist and compute valuation
      let liveStocksValue = 0
      await Promise.all(symbols.map(async (s, i) => {
        const price = Number(prices[i])
        if (!Number.isFinite(price) || price <= 0) return
        const qty = manualHoldings.stocks.get(s) || 0
        liveStocksValue += qty * price
        try {
          await setDoc(doc(db, 'users', uid, 'live_quotes', s), {
            symbol: s,
            price,
            source: 'yfinance-defi',
            updatedAt: serverTimestamp(),
          }, { merge: true })
        } catch (e) {
          if (import.meta?.env?.DEV) console.warn('write live quote failed', s, e)
        }
      }))

      rebuildBreakdown({ liveStocksValue })
    }

    runOnce()
    const interval = setInterval(runOnce, 86_400_000) // 24h
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [uid, manualHoldings.stocks, rebuildBreakdown])

  // Crypto (1h)
  useEffect(() => {
    if (!uid) return
    const symbols = Array.from(manualHoldings.crypto.keys())
    if (symbols.length === 0) return

    let cancelled = false

    async function runOnce() {
      // yfinance-defi expects crypto pairs like BTC-USD; append "-USD" if not already present
      const pairSymbols = symbols.map((s) => (s.includes('-') ? s : `${s}-USD`))
      const prices = await Promise.all(pairSymbols.map((ps) => getYfPrice(ps, { ttlMs: 60 * 60 * 1000 })))
      if (cancelled) return
      let liveCryptoValue = 0
      await Promise.all(symbols.map(async (s, i) => {
        const price = Number(prices[i])
        if (!Number.isFinite(price) || price <= 0) return
        const qty = manualHoldings.crypto.get(s) || 0
        liveCryptoValue += qty * price
        try {
          await setDoc(doc(db, 'users', uid, 'live_quotes', s), {
            symbol: s,
            price,
            source: 'yfinance-defi',
            updatedAt: serverTimestamp(),
          }, { merge: true })
        } catch (e) {
          if (import.meta?.env?.DEV) console.warn('write live quote failed', s, e)
        }
      }))

      rebuildBreakdown({ liveCryptoValue })
    }

    runOnce()
    const interval = setInterval(runOnce, 3_600_000) // 1h
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [uid, manualHoldings.crypto, rebuildBreakdown])

  // ── Return ────────────────────────────────────────────────────────────
  return {
    loading,
    error,
    isEmpty,

    // Overview tab
    userProfile,
    heroStats,
    pillarScores,
    netWorthSeries,
    savingsDetail,
    netWorthBreakdown,

    // Wallet & Budget tabs
    walletViewModel,
    budgetViewModel,

    // Raw Firestore data
    raw,

    refresh: fetchData,
  }
}
