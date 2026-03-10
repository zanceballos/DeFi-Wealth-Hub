/**
 * advisoryPayloadBuilder.js
 *
 * Reads raw Firebase user data (profile, statements, wellness, net-worth
 * history) and produces a clean, safe JSON payload for the Groq advisory model.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

function safe(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function safeStr(value, fallback = '') {
  return typeof value === 'string' && value.length > 0 ? value : fallback
}

function activeStatements(statements) {
  if (!Array.isArray(statements)) return []
  return statements.filter(
    (s) => s && (s.status === 'parsed' || s.status === 'approved'),
  )
}

// ─── Builder ────────────────────────────────────────────────────────────────

/**
 * Build a clean payload object suitable for sending as the user_data block
 * in a Groq chat completion request.
 *
 * Every field has a safe default so missing data never causes a crash.
 *
 * @param {{ profile?: object, statements?: object[], wellness?: object, netWorthHistory?: object[], emailTransactions?: object[] }} data
 * @returns {object}
 */
export function buildAdvisoryPayload({
  profile,
  statements,
  wellness,
  netWorthHistory,
  emailTransactions,
} = {}) {
  const active = activeStatements(statements)

  // ── User ────────────────────────────────────────────────────────────
  const user = {
    name:             safeStr(profile?.name, 'User'),
    risk_profile:     safeStr(profile?.risk_profile ?? profile?.riskProfile, 'moderate'),
    monthly_income:   safe(profile?.monthly_income),
    monthly_expenses: safe(profile?.monthly_expenses),
  }

  // ── Manual accounts ─────────────────────────────────────────────────
  const manual = profile?.manual_accounts ?? {}
  const manualAccounts = Array.isArray(manual.accounts) ? manual.accounts : []
  const manualInvestments = Array.isArray(manual.investments) ? manual.investments : []

  const manualCashTotal = manualAccounts.reduce((s, a) => s + safe(a?.balance), 0)
  const manualInvestmentTotal = manualInvestments.reduce((s, inv) => {
    const lots = Array.isArray(inv?.lots) ? inv.lots : []
    return s + lots.reduce((ls, l) => ls + safe(l?.quantity) * safe(l?.averageCost), 0)
  }, 0)

  const manualAccountsSummary = {
    cash_total: manualCashTotal,
    investment_total: manualInvestmentTotal,
    accounts_count: manualAccounts.length,
    investments_count: manualInvestments.length,
    institutions: [...new Set(manualAccounts.map((a) => a?.institution).filter(Boolean))],
    investment_assets: manualInvestments.map((inv) => ({
      asset: inv?.asset ?? '',
      type: inv?.type ?? '',
    })),
  }

  // ── Wellness ────────────────────────────────────────────────────────
  const pillars = wellness?.pillars ?? {}
  const km = wellness?.key_metrics ?? {}

  const wellnessPayload = {
    overall_score: safe(wellness?.overall_score),
    status:        safeStr(wellness?.status, 'unknown'),
    pillars: {
      liquidity:       { score: safe(pillars.liquidity?.score),       status: safeStr(pillars.liquidity?.status, 'unknown') },
      diversification: { score: safe(pillars.diversification?.score), status: safeStr(pillars.diversification?.status, 'unknown') },
      risk_match:      { score: safe(pillars.risk_match?.score),      status: safeStr(pillars.risk_match?.status, 'unknown') },
      digital_health:  { score: safe(pillars.digital_health?.score),  status: safeStr(pillars.digital_health?.status, 'unknown') },
    },
    key_metrics: {
      net_worth:            safe(km.net_worth),
      cash_buffer_months:   safe(km.cash_buffer_months),
      crypto_pct:           safe(km.crypto_pct),
      digital_pct:          safe(km.digital_pct),
      unregulated_pct:      safe(km.unregulated_pct),
      savings_rate_pct:     safe(km.savings_rate_pct),
      largest_position_pct: safe(km.largest_position_pct),
    },
  }

  // ── Portfolio ───────────────────────────────────────────────────────
  const assetBreakdown = { cash: 0, bonds: 0, stocks: 0, crypto: 0, property: 0, tokenised: 0 }
  const platforms = []
  const regulatedPlatforms = []
  const unregulatedPlatforms = []

  for (const stmt of active) {
    const name = stmt.platform ?? stmt.source_type ?? 'Unknown'
    if (!platforms.includes(name)) platforms.push(name)

    if (stmt.regulated === true) {
      if (!regulatedPlatforms.includes(name)) regulatedPlatforms.push(name)
    } else if (stmt.regulated === false) {
      if (!unregulatedPlatforms.includes(name)) unregulatedPlatforms.push(name)
    } else {
      // Heuristic
      const bucket = (stmt.source_type ?? '').toLowerCase() === 'crypto'
        ? unregulatedPlatforms
        : regulatedPlatforms
      if (!bucket.includes(name)) bucket.push(name)
    }

    const bd = stmt.asset_class_breakdown ?? {}
    for (const key of Object.keys(assetBreakdown)) {
      assetBreakdown[key] += safe(bd[key])
    }
  }

  const portfolio = {
    total_statements: active.length,
    platforms,
    regulated_platforms: regulatedPlatforms,
    unregulated_platforms: unregulatedPlatforms,
    asset_breakdown: assetBreakdown,
    manual_accounts: manualAccountsSummary,
  }

  // ── Email transactions summary ──────────────────────────────────────
  const emailTxs = Array.isArray(emailTransactions) ? emailTransactions : []
  const approvedEmail = emailTxs.filter((tx) => tx.status === 'approved' && !tx.deleted)
  let emailInflow = 0
  let emailOutflow = 0
  const emailSources = new Set()
  const emailCategories = {}
  for (const tx of approvedEmail) {
    const amt = safe(tx.amount)
    if (amt >= 0) emailInflow += amt
    else emailOutflow += Math.abs(amt)
    if (tx.source) emailSources.add(tx.source)
    const cat = (tx.category ?? 'unknown').toLowerCase()
    emailCategories[cat] = (emailCategories[cat] ?? 0) + Math.abs(amt)
  }

  const emailSummary = {
    total_transactions: approvedEmail.length,
    total_inflow: emailInflow,
    total_outflow: emailOutflow,
    sources: [...emailSources],
    category_breakdown: emailCategories,
  }

  // ── Trends ──────────────────────────────────────────────────────────
  const history = Array.isArray(netWorthHistory)
    ? netWorthHistory.map((item) => ({
        month:     item.month ?? item.month_key ?? '',
        month_key: item.month_key ?? '',
        value:     safe(item.value),
      }))
    : []

  const trends = { net_worth_history: history }

  return { user, wellness: wellnessPayload, portfolio, email_transactions: emailSummary, trends }
}
