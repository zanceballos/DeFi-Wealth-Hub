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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

// Live market data (Alpha Vantage)
import { getStockPrice, makeSymbolRotator } from '../services/marketDataService.js'

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
  // Live stock price updates (Alpha Vantage) — every ~30 seconds
  // - Computes live market value for manual stock investments (sum(lots.quantity) × latestPrice)
  // - Rebuilds Overview breakdown combining statement totals + manual cash + manual crypto (cost basis) + live stocks
  // - Skips if no API key or no stock investments; cleans up interval on unmount.
  // ═══════════════════════════════════════════════════════════════════════════
  const symbolRotatorRef = useRef(null)
  const priceCacheRef = useRef(new Map()) // symbol -> last price number

  // Precompute manual figures and base statement totals whenever raw changes
  const liveInputs = useMemo(() => {
    const profile = raw.profile || {}
    const manualAccounts = profile?.manual_accounts?.accounts
    const manualInvestments = profile?.manual_accounts?.investments

    const manualCash = Array.isArray(manualAccounts)
      ? manualAccounts.reduce((sum, acc) => sum + safeNumber(acc?.balance), 0)
      : 0

    // Statement totals baseline
    const totalsBase = { cash: 0, stocks: 0, crypto: 0, property: 0, tokenised: 0, bonds: 0 }
    let grandBase = 0
    const activeStmts = (raw.statements || []).filter(
      (s) => s.status === 'parsed' || s.status === 'approved',
    )
    for (const stmt of activeStmts) {
      const bd = stmt.asset_class_breakdown ?? {}
      for (const key of Object.keys(totalsBase)) {
        const v = safeNumber(bd[key])
        totalsBase[key] += v
        grandBase += v
      }
    }

    // Build stocks aggregation + symbols list, and crypto total (cost basis)
    let manualStocksByAsset = new Map() // asset -> totalQuantity across lots
    let manualCrypto = 0
    let stockSymbols = []
    if (Array.isArray(manualInvestments) && manualInvestments.length > 0) {
      for (const inv of manualInvestments) {
        const lots = Array.isArray(inv?.lots) ? inv.lots : []
        const t = (inv?.type || '').toLowerCase()
        const qtySum = lots.reduce((sum, lot) => sum + safeNumber(lot?.quantity), 0)
        if (!qtySum) continue

        if (t === 'crypto') {
          // For crypto we keep cost basis only (no API provided here)
          const cost = lots.reduce((sum, lot) => sum + safeNumber(lot?.quantity) * safeNumber(lot?.averageCost), 0)
          manualCrypto += cost
        } else {
          const asset = (inv?.asset || '').trim().toUpperCase()
          if (asset) {
            manualStocksByAsset.set(asset, (manualStocksByAsset.get(asset) || 0) + qtySum)
            stockSymbols.push(asset)
          }
        }
      }
    }

    // Unique symbols
    stockSymbols = Array.from(new Set(stockSymbols))

    return { totalsBase, manualCash, manualCrypto, manualStocksByAsset, stockSymbols }
  }, [raw])

  useEffect(() => {
    const { stockSymbols } = liveInputs
    // If no stocks to update, do nothing
    if (!stockSymbols || stockSymbols.length === 0) return

    // Initialize or refresh rotator with current symbols
    symbolRotatorRef.current = makeSymbolRotator(stockSymbols)

    let isCancelled = false

    const tick = async () => {
      if (isCancelled) return
      const nextSymbol = symbolRotatorRef.current ? symbolRotatorRef.current() : null
      if (!nextSymbol) return
      const price = await getStockPrice(nextSymbol, { ttlMs: 60_000 })
      if (Number.isFinite(price)) {
        priceCacheRef.current.set(nextSymbol, price)

        // Persist latest quote to Firestore for auditing/other consumers
        // Do not block UI on failures
        if (uid) {
          try {
            const quoteRef = doc(db, 'users', uid, 'live_quotes', nextSymbol)
            await setDoc(
              quoteRef,
              {
                price,
                updatedAt: serverTimestamp?.() || new Date(),
                source: 'alphavantage',
                symbol: nextSymbol,
              },
              { merge: true },
            )
          } catch (e) {
            if (import.meta?.env?.MODE !== 'production') {
              console.warn('Failed to persist live quote for', nextSymbol, e)
            }
          }
        }
        // Rebuild breakdown with latest prices
        const { totalsBase, manualCash, manualCrypto, manualStocksByAsset } = liveInputs

        // Compute live stocks market value
        let liveStocksTotal = 0
        for (const [asset, qty] of manualStocksByAsset.entries()) {
          const p = priceCacheRef.current.get(asset)
          if (Number.isFinite(p)) {
            liveStocksTotal += qty * p
          }
        }

        // If we have at least one priced stock or any manual values, update breakdown
        const hasManualValues = manualCash > 0 || manualCrypto > 0 || manualStocksByAsset.size > 0
        if (!hasManualValues) return

        const totals = { ...totalsBase }
        if (manualCash > 0) totals.cash += manualCash
        if (manualCrypto > 0) totals.crypto += manualCrypto

        // For stocks, prefer live value if available; else leave base statement value
        if (liveStocksTotal > 0) {
          // Replace statement-based stocks share with live manual stocks on top of it
          totals.stocks += liveStocksTotal
        } else {
          // If no prices yet, approximate using cost basis of manual stocks (handled earlier in fetchData)
          // Do nothing here to avoid double-counting; initial breakdown already includes cost basis.
        }

        const grand = Object.values(totals).reduce((a, b) => a + b, 0)
        const nextBreakdown = Object.entries(totals)
          .filter(([, v]) => v > 0)
          .map(([key, v]) => ({
            color:   BREAKDOWN_COLORS[key] ?? 'bg-slate-400',
            label:   BREAKDOWN_LABELS[key] ?? key,
            value:   fmtCurrency(v),
            percent: grand > 0 ? Math.round((v / grand) * 100) : 0,
          }))

        // Update state
        setNetWorthBreakdown(nextBreakdown)
      }
    }

    // Run every 30 seconds; also trigger an immediate tick to seed first symbol soon
    const id = setInterval(tick, 30_000)
    // Kick off immediately (non-blocking)
    tick()

    return () => {
      isCancelled = true
      clearInterval(id)
    }
  }, [liveInputs])

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
