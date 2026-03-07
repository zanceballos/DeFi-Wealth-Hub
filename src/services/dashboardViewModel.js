/**
 * dashboardViewModel.js
 *
 * Pure data-mapping layer that reads raw Firebase user financial data
 * and transforms it into safe, UI-ready prop objects for the
 * Wallet page, Budget page, and empty-state screens.
 *
 * Every function is null-safe — missing / empty data never crashes the UI.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convert any value to a finite number, defaulting to 0. */
export function safeNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

/** Safe percentage: part / total × 100, capped between 0-cap (default 100). */
export function safePercent(part, total, cap = 100) {
  if (!total || total === 0) return 0
  return Math.min(Math.round((safeNumber(part) / safeNumber(total)) * 100), cap)
}

/** Format a number as SGD currency string: S$1,234 */
export function formatCurrencySGD(value) {
  const n = safeNumber(value)
  const abs = Math.abs(n)
  const formatted = abs.toLocaleString('en-SG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  return n < 0 ? `-S$${formatted}` : `S$${formatted}`
}

/** Format a number as SGD with 2 decimal places for amounts: S$1,234.50 */
function formatCurrencySGD2(value) {
  const n = safeNumber(value)
  const abs = Math.abs(n)
  const formatted = abs.toLocaleString('en-SG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return n < 0 ? `-S$${formatted}` : `S$${formatted}`
}

// ─── Asset-class constants ──────────────────────────────────────────────────

const ASSET_CLASSES = ['cash', 'bonds', 'stocks', 'crypto', 'property', 'tokenised']

const ASSET_CLASS_META = {
  cash:       { name: 'Cash',       color: '#3B82F6' },
  bonds:      { name: 'Bonds',      color: '#10B981' },
  stocks:     { name: 'Stocks',     color: '#6366F1' },
  crypto:     { name: 'Crypto',     color: '#F59E0B' },
  property:   { name: 'Property',   color: '#EF4444' },
  tokenised:  { name: 'Tokenised',  color: '#8B5CF6' },
}

// ─── Category colours ───────────────────────────────────────────────────────

const CATEGORY_COLORS = {
  food:           '#F97316',
  groceries:      '#EC4899',
  transport:      '#22C55E',
  bills:          '#84CC16',
  entertainment:  '#A855F7',
  health:         '#0EA5E9',
  housing:        '#6366F1',
  shopping:       '#F43F5E',
  income:         '#10B981',
  investment:     '#3B82F6',
  interest:       '#14B8A6',
  transfer:       '#64748B',
  paynow:         '#8B5CF6',
  unknown:        '#94A3B8',
  uncategorised:  '#CBD5E1',
}

/** Return a hex colour for a spending category (case-insensitive). */
export function getCategoryColor(category) {
  if (!category) return CATEGORY_COLORS.uncategorised
  return CATEGORY_COLORS[category.toLowerCase()] ?? CATEGORY_COLORS.uncategorised
}

// ─── Statement helpers ──────────────────────────────────────────────────────

/** Filter statements to only approved / parsed ones. */
function activeStatements(statements) {
  if (!Array.isArray(statements)) return []
  return statements.filter(
    (s) => s && (s.status === 'parsed' || s.status === 'approved'),
  )
}

/** Sum asset_class_breakdown across an array of statements. */
export function sumAssetBreakdown(statements) {
  const totals = {}
  for (const key of ASSET_CLASSES) totals[key] = 0

  const active = activeStatements(statements)
  for (const stmt of active) {
    const bd = stmt.asset_class_breakdown ?? {}
    for (const key of ASSET_CLASSES) {
      totals[key] += safeNumber(bd[key])
    }
  }
  return totals
}

/** Derive a risk label from statement source_type. */
export function deriveRiskLabel(statement) {
  const src = (statement?.source_type ?? '').toLowerCase()
  if (src === 'bank') return 'Core'
  if (src === 'crypto') return 'Speculative'
  if (src === 'investment' || src === 'broker') {
    // Heuristic: if net worth contribution is large relative to total, it's Growth
    const nwc = safeNumber(statement?.net_worth_contribution)
    return nwc > 10000 ? 'Growth' : 'Stable'
  }
  return 'Stable'
}

/** Derive a regulated label from statement. */
export function deriveRegulatedLabel(statement) {
  if (statement?.regulated === true) return '✅ MAS'
  if (statement?.regulated === false) return '⚠️ Unregulated'
  // Default heuristic based on source type
  const src = (statement?.source_type ?? '').toLowerCase()
  if (src === 'crypto') return '⚠️ Unregulated'
  return '✅ MAS'
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. WALLET VIEW MODEL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * buildWalletViewModel({ profile, statements, wellness, netWorthHistory })
 *
 * Returns a UI-ready object for the Wallet page:
 *   { allocation, totalNetWorth, rows, emptyState }
 */
export function buildWalletViewModel({ statements, wellness } = {}) {
  const active = activeStatements(statements)
  const hasAnyData = active.length > 0

  // ── Asset totals ──────────────────────────────────────────────────────
  const totals = sumAssetBreakdown(statements)
  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0)

  // Use wellness net_worth if available, otherwise sum from breakdowns
  const totalNetWorth = safeNumber(wellness?.key_metrics?.net_worth) || grandTotal

  // ── Allocation array ──────────────────────────────────────────────────
  const allocation = ASSET_CLASSES.map((key) => {
    const meta = ASSET_CLASS_META[key]
    const amount = totals[key]
    return {
      name: meta.name,
      value: totalNetWorth > 0 ? Math.round((amount / totalNetWorth) * 100) : 0,
      color: meta.color,
      amount,
    }
  })

  // ── Wallet rows (one per active statement) ────────────────────────────
  const rows = active.map((stmt) => {
    const nwc = safeNumber(stmt.net_worth_contribution)
    const pctOfTotal = totalNetWorth > 0 ? Math.round((nwc / totalNetWorth) * 100) : 0

    return {
      asset: stmt.file_name ?? stmt.platform ?? 'Unknown',
      platform: stmt.platform ?? stmt.source_type ?? '—',
      value: formatCurrencySGD(nwc),
      portfolio: `${pctOfTotal}%`,
      riskLabel: deriveRiskLabel(stmt),
      regulated: deriveRegulatedLabel(stmt),
    }
  })

  // ── Empty state ───────────────────────────────────────────────────────
  const emptyState = {
    hasAnyData,
    message: hasAnyData
      ? ''
      : 'No wallet data yet. Upload a bank, brokerage, or crypto statement to see your portfolio allocation.',
  }

  return { allocation, totalNetWorth, rows, emptyState }
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. BUDGET VIEW MODEL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * buildBudgetViewModel({ profile, statements, wellness })
 *
 * Returns a UI-ready object for the Budget page:
 *   { monthlyBudget, remainingBudget, spentThisMonth,
 *     emergencySavingsTarget, emergencySavingsCurrent, emergencySavingsPct,
 *     categorySpending, transactionSummary, recentTransactions, emptyState }
 */
export function buildBudgetViewModel({ profile, statements, wellness } = {}) {
  const active = activeStatements(statements)

  const _monthlyIncome  = safeNumber(profile?.monthly_income)
  const monthlyExpenses = safeNumber(profile?.monthly_expenses)

  // ── Budget ────────────────────────────────────────────────────────────
  const monthlyBudget = monthlyExpenses || 0

  // Spent this month: sum total_debits from current-month statements,
  // falling back to profile.monthly_expenses
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  let spentThisMonth = 0
  let hasCurrentMonthData = false
  for (const stmt of active) {
    const pd = stmt.parsed_data ?? {}
    const stmtMonth = pd.statement_month ?? ''
    if (stmtMonth === currentMonth || !stmtMonth) {
      spentThisMonth += safeNumber(pd.total_debits)
      if (stmtMonth === currentMonth) hasCurrentMonthData = true
    }
  }
  // If no current-month statement data found, fall back to profile expenses
  if (spentThisMonth === 0 && !hasCurrentMonthData) {
    spentThisMonth = monthlyExpenses
  }

  const remainingBudget = Math.max(monthlyBudget - spentThisMonth, 0)

  // ── Emergency savings ─────────────────────────────────────────────────
  const emergencySavingsTarget = monthlyExpenses * 6

  // Current emergency savings = total liquidity (cash-like balances)
  const totals = sumAssetBreakdown(statements)
  const cashLike = totals.cash + totals.bonds // conservative: cash + bonds
  const emergencySavingsCurrent = safeNumber(wellness?.key_metrics?.net_worth)
    ? Math.min(cashLike || safeNumber(wellness?.key_metrics?.net_worth) * 0.3, emergencySavingsTarget * 1.5)
    : cashLike

  const emergencySavingsPct = emergencySavingsTarget > 0
    ? Math.min(Math.round((emergencySavingsCurrent / emergencySavingsTarget) * 100), 100)
    : 0

  // ── Category spending ─────────────────────────────────────────────────
  // Attempt to build from statement-level transaction categories if available
  const categoryMap = {}
  let hasCategoryData = false

  for (const stmt of active) {
    // Check if statement has transaction-level category breakdowns
    const txCategories = stmt.category_breakdown ?? stmt.parsed_data?.category_breakdown
    if (txCategories && typeof txCategories === 'object') {
      hasCategoryData = true
      for (const [cat, amount] of Object.entries(txCategories)) {
        const key = cat.toLowerCase()
        categoryMap[key] = (categoryMap[key] ?? 0) + safeNumber(amount)
      }
    }
  }

  let categorySpending
  if (hasCategoryData) {
    const totalCatSpending = Object.values(categoryMap).reduce((a, b) => a + b, 0)
    categorySpending = Object.entries(categoryMap)
      .sort(([, a], [, b]) => b - a)
      .map(([category, amount]) => ({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        amount,
        pct: safePercent(amount, totalCatSpending),
        color: getCategoryColor(category),
      }))
  } else {
    // Fallback: single uncategorised bucket
    categorySpending = spentThisMonth > 0
      ? [{ category: 'Uncategorised', amount: spentThisMonth, pct: 100, color: getCategoryColor('uncategorised') }]
      : []
  }

  // ── Transaction summary ───────────────────────────────────────────────
  let totalTransactions = 0
  let totalInflow = 0
  let totalOutflow = 0

  for (const stmt of active) {
    totalTransactions += safeNumber(stmt.transactions_count)
    const pd = stmt.parsed_data ?? {}
    totalInflow += safeNumber(pd.total_credits)
    totalOutflow += safeNumber(pd.total_debits)
  }

  const transactionSummary = {
    totalTransactions,
    totalInflow,
    totalOutflow,
  }

  // ── Recent transactions ───────────────────────────────────────────────
  // Collect from statements that have embedded transaction rows
  const recentTransactions = []
  for (const stmt of active) {
    const txRows = stmt.transactions ?? stmt.parsed_data?.transactions ?? []
    if (!Array.isArray(txRows)) continue

    for (const tx of txRows) {
      recentTransactions.push({
        source: tx.description ?? tx.source ?? 'Unknown',
        merchant: stmt.platform ?? tx.merchant ?? '—',
        date: tx.date ?? '—',
        time: tx.time ?? '—',
        category: tx.category ?? 'Unknown',
        posted: tx.posted ?? formatRelativeDate(tx.date),
        amount: formatCurrencySGD2(tx.amount ?? 0),
      })
    }
  }

  // Sort recent by date descending, limit to 50
  recentTransactions.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0))
  recentTransactions.splice(50)

  // ── Empty state ───────────────────────────────────────────────────────
  const hasBudgetData = monthlyBudget > 0 || spentThisMonth > 0
  const hasTransactions = totalTransactions > 0 || recentTransactions.length > 0

  let message = ''
  if (!hasBudgetData && !hasTransactions) {
    message = 'No budget or transaction data yet. Upload a financial statement to get started.'
  } else if (!hasBudgetData) {
    message = 'Set your monthly budget to start tracking spending.'
  } else if (!hasTransactions) {
    message = 'No transactions found yet. Upload a statement with transaction data.'
  }

  const emptyState = { hasBudgetData, hasTransactions, message }

  return {
    monthlyBudget,
    remainingBudget,
    spentThisMonth,
    emergencySavingsTarget,
    emergencySavingsCurrent: Math.round(emergencySavingsCurrent),
    emergencySavingsPct,
    categorySpending,
    transactionSummary,
    recentTransactions,
    emptyState,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. EMPTY-STATE DETECTOR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * createDashboardEmptyStates({ profile, statements, wellness })
 *
 * Returns booleans and messages about what data is missing.
 */
export function createDashboardEmptyStates({ profile, statements, wellness } = {}) {
  const active = activeStatements(statements)
  const totals = sumAssetBreakdown(statements)
  const hasAllocation = Object.values(totals).some((v) => v > 0)

  return {
    noStatementsUploaded: {
      empty: active.length === 0,
      message: active.length === 0
        ? 'You haven\'t uploaded any financial statements yet. Upload one to get started.'
        : '',
    },
    noBudgetData: {
      empty: !safeNumber(profile?.monthly_expenses) && !safeNumber(profile?.monthly_income),
      message: 'No income or expense data found. Set your monthly budget or upload a statement.',
    },
    noWalletAllocation: {
      empty: !hasAllocation,
      message: !hasAllocation
        ? 'No asset allocation data yet. Upload statements from different platforms to build your portfolio view.'
        : '',
    },
    noWellnessSnapshot: {
      empty: !wellness,
      message: !wellness
        ? 'No wellness score computed yet. Upload a statement — we\'ll compute your financial health automatically.'
        : '',
    },
  }
}

// ─── Internal helpers ───────────────────────────────────────────────────────

/** Best-effort relative date label. */
function formatRelativeDate(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '—'
    const diffMs = Date.now() - d.getTime()
    const diffMin = Math.round(diffMs / 60000)
    if (diffMin < 1) return 'just now'
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHr = Math.round(diffMin / 60)
    if (diffHr < 24) return `${diffHr}h ago`
    const diffDay = Math.round(diffHr / 24)
    if (diffDay < 7) return `${diffDay}d ago`
    if (diffDay < 30) return `${Math.round(diffDay / 7)}w ago`
    if (diffDay < 365) return `${Math.round(diffDay / 30)}mth ago`
    return `${Math.round(diffDay / 365)}y ago`
  } catch {
    return '—'
  }
}
