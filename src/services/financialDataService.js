/**
 * Financial Data Service
 *
 * Firebase service module that saves parsed financial statements and
 * recomputes user wellness data.
 *
 * Firestore paths:
 *   /users/{uid}
 *   /users/{uid}/statements/{statementId}
 *   /users/{uid}/wellness/current
 *   /users/{uid}/history/net_worth/items/{monthKey}
 */

import { db, storage } from '../lib/firebase.js'
import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Safe percentage – returns 0 when total is zero or falsy.
 * @param {number} part
 * @param {number} total
 * @returns {number}
 */
export function safePercent(part, total) {
  if (!total || total === 0) return 0
  return (part / total) * 100
}

/**
 * Derive traffic-light status from a numeric score.
 * @param {number} score
 * @returns {'red'|'amber'|'green'}
 */
export function deriveStatus(score) {
  if (score < 40) return 'red'
  if (score < 70) return 'amber'
  return 'green'
}

/**
 * Clamp a value between 0 and 100 (inclusive) and round to nearest integer.
 * @param {number} value
 * @returns {number}
 */
export function clampScore(value) {
  return Math.round(Math.min(100, Math.max(0, value ?? 0)))
}

/**
 * Return a month key like '2026-03' from a Date.
 * @param {Date} date
 * @returns {string}
 */
export function formatMonthKey(date) {
  const d = date instanceof Date ? date : new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Return a human-readable label like 'Mar 2026' from a Date.
 * @param {Date} date
 * @returns {string}
 */
export function formatMonthLabel(date) {
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// ---------------------------------------------------------------------------
// 1. uploadStatementFile
// ---------------------------------------------------------------------------

/**
 * Upload a file to Firebase Storage and create a statement document in
 * Firestore under /users/{uid}/statements.
 *
 * @param {string} uid          – Firebase Auth user id
 * @param {File}   file         – browser File object
 * @param {object} metadata
 * @param {string} metadata.sourceType           – 'bank'|'crypto'|'investment'|'broker'|'other'
 * @param {string} metadata.platform             – e.g. 'DBS', 'Binance'
 * @param {string} [metadata.status='uploaded']  – initial status
 * @param {object} [metadata.parsedData]
 * @param {number} [metadata.transactionsCount]
 * @param {number} [metadata.netWorthContribution]
 * @param {number} [metadata.liquidityContribution]
 * @param {object} [metadata.assetClassBreakdown]
 * @param {boolean} [metadata.skipStorageUpload]  – skip Firebase Storage, Firestore only
 * @returns {Promise<object>} the created statement object (including id)
 */
export async function uploadStatementFile(uid, file, metadata = {}) {
  const timestamp = Date.now()
  const storagePath = `users/${uid}/statements/${timestamp}-${file.name}`

  let fileUrl = ''

  // Only upload to Firebase Storage if not explicitly skipped
  if (!metadata.skipStorageUpload) {
    const storageRef = ref(storage, storagePath)
    await uploadBytes(storageRef, file)
    fileUrl = await getDownloadURL(storageRef)
  }

  const statementData = {
    file_name: file.name,
    file_url: fileUrl,
    storage_path: metadata.skipStorageUpload ? '' : storagePath,
    source_type: metadata.sourceType ?? 'other',
    platform: metadata.platform ?? '',
    uploaded_at: serverTimestamp(),
    status: metadata.status ?? 'uploaded',
    parsed_data: metadata.parsedData ?? {},
    transactions_count: metadata.transactionsCount ?? 0,
    net_worth_contribution: metadata.netWorthContribution ?? 0,
    liquidity_contribution: metadata.liquidityContribution ?? 0,
    asset_class_breakdown: metadata.assetClassBreakdown ?? {},
  }

  const statementsCol = collection(db, 'users', uid, 'statements')
  const docRef = await addDoc(statementsCol, statementData)

  return { id: docRef.id, ...statementData }
}

// ---------------------------------------------------------------------------
// 2. saveParsedStatement
// ---------------------------------------------------------------------------

/**
 * Update a statement document after backend parsing finishes.
 *
 * @param {string} uid
 * @param {string} statementId
 * @param {object} parsedStatement
 * @param {object} [parsedStatement.parsedData]
 * @param {number} [parsedStatement.transactionsCount]
 * @param {number} [parsedStatement.netWorthContribution]
 * @param {number} [parsedStatement.liquidityContribution]
 * @param {object} [parsedStatement.assetClassBreakdown]
 * @returns {Promise<object>} the fields that were written
 */
export async function saveParsedStatement(uid, statementId, parsedStatement = {}) {
  const statementRef = doc(db, 'users', uid, 'statements', statementId)

  const updates = {
    status: 'parsed',
    parsed_data: parsedStatement.parsedData ?? {},
    transactions_count: parsedStatement.transactionsCount ?? 0,
    net_worth_contribution: parsedStatement.netWorthContribution ?? 0,
    liquidity_contribution: parsedStatement.liquidityContribution ?? 0,
    asset_class_breakdown: parsedStatement.assetClassBreakdown ?? {},
    updated_at: serverTimestamp(),
  }

  await updateDoc(statementRef, updates)
  return { id: statementId, ...updates }
}

// ---------------------------------------------------------------------------
// 3. recomputeWellness
// ---------------------------------------------------------------------------

/**
 * Recompute the wellness snapshot for a user by reading all their statement
 * documents, email transactions, manual accounts, and the user profile.
 * Saves the result at /users/{uid}/wellness/current and returns it.
 *
 * Data sources aggregated:
 *   A — manual_accounts (cash balances, investments on user doc)
 *   B — /statements (PDF/CSV uploads)
 *   C — /emailTransactions (auto-parsed Gmail emails)
 *
 * @param {string} uid
 * @param {object} [options]          – reserved for future flags
 * @returns {Promise<object>}         – the saved wellness snapshot
 */
// eslint-disable-next-line no-unused-vars
export async function recomputeWellness(uid, _options = {}) {
  if (!uid) return null

  // ---- Read user profile ----
  const userSnap = await getDoc(doc(db, 'users', uid))
  const userProfile = userSnap.exists() ? userSnap.data() : {}
  const monthlyIncome = Number(userProfile.monthly_income) || 0
  const monthlyExpenses = Number(userProfile.monthly_expenses) || 0

  // ---- Read all statements (Source B) ----
  const statementsSnap = await getDocs(collection(db, 'users', uid, 'statements'))
  const statements = []
  statementsSnap.forEach((d) => statements.push({ id: d.id, ...d.data() }))

  // Only consider parsed or approved statements
  const active = statements.filter((s) => s.status === 'parsed' || s.status === 'approved')

  // ---- Read email transactions (Source C) ----
  const emailTxSnap = await getDocs(collection(db, 'users', uid, 'emailTransactions'))
  const emailTransactions = []
  emailTxSnap.forEach((d) => emailTransactions.push({ id: d.id, ...d.data() }))
  const approvedEmailTx = emailTransactions.filter(
    (tx) => tx.status !== 'rejected' && !tx.deleted,
  )

  // ---- Manual accounts (Source A) ----
  const manual = userProfile.manual_accounts ?? {}
  const manualAccounts = Array.isArray(manual.accounts) ? manual.accounts : []
  const manualInvestments = Array.isArray(manual.investments) ? manual.investments : []

  // ---- Aggregate key metrics across all 3 sources ----
  let totalNetWorth = 0
  let totalCash = 0
  let totalCrypto = 0
  let totalStocks = 0
  let totalTokenised = 0
  let totalUnregulated = 0
  let largestContribution = 0

  // Track manual subtotals for wealth_summary
  let manualCash = 0
  let manualCrypto = 0
  let manualStocks = 0
  let manualOther = 0

  const UNREGULATED_SOURCES = new Set(['crypto', 'other'])
  const CASH_TYPES = new Set(['cash', 'savings', 'checking'])

  // Source B: statements
  let statementsNetWorth = 0
  for (const stmt of active) {
    const contribution = Number(stmt.net_worth_contribution) || 0
    statementsNetWorth += contribution
    totalNetWorth += contribution
    if (contribution > largestContribution) largestContribution = contribution

    const breakdown = stmt.asset_class_breakdown ?? {}
    totalCash += Number(breakdown.cash) || 0
    totalCrypto += Number(breakdown.crypto) || 0
    totalStocks += Number(breakdown.stocks) || 0
    totalTokenised += Number(breakdown.tokenised) || 0

    if (UNREGULATED_SOURCES.has(stmt.source_type)) {
      totalUnregulated += contribution
    }
  }

  // Source A: manual cash accounts
  for (const acc of manualAccounts) {
    const bal = Number(acc.balance) || 0
    const accType = (acc.type || '').toLowerCase()

    if (CASH_TYPES.has(accType)) {
      manualCash += bal
      totalCash += bal
    } else if (accType === 'crypto') {
      manualCrypto += bal
      totalCrypto += bal
      totalUnregulated += bal
    } else if (accType === 'stocks') {
      manualStocks += bal
      totalStocks += bal
    } else {
      manualOther += bal
    }

    totalNetWorth += bal
    if (bal > largestContribution) largestContribution = bal
  }

  // Source A: manual investments (lot-based positions)
  for (const inv of manualInvestments) {
    const lots = Array.isArray(inv?.lots) ? inv.lots : []
    const assetTotal = lots.reduce((sum, lot) => {
      const qty = Number(lot?.quantity) || 0
      const avg = Number(lot?.averageCost) || 0
      return sum + qty * avg
    }, 0)
    if (assetTotal <= 0) continue

    totalNetWorth += assetTotal
    if (assetTotal > largestContribution) largestContribution = assetTotal

    const t = (inv?.type || '').toLowerCase()
    if (t === 'crypto') {
      manualCrypto += assetTotal
      totalCrypto += assetTotal
      totalUnregulated += assetTotal
    } else {
      manualStocks += assetTotal
      totalStocks += assetTotal
    }
  }

  const manualTotal = manualCash + manualCrypto + manualStocks + manualOther

  // Source C: non-rejected email transactions (net inflow/outflow affects cash position)
  let emailNetCash = 0
  for (const tx of approvedEmailTx) {
    const amt = Number(tx.amount) || 0
    emailNetCash += amt // positive = credit, negative = debit
  }
  // Email net cash flow adjusts total cash (can be negative)
  totalCash += emailNetCash
  totalNetWorth += emailNetCash

  // Clamp net worth to 0 — never negative
  totalNetWorth = Math.max(0, totalNetWorth)

  const cashBufferMonths =
    monthlyExpenses > 0 ? parseFloat((totalCash / monthlyExpenses).toFixed(2)) : 0

  const cryptoPct = parseFloat(safePercent(totalCrypto, totalNetWorth).toFixed(2))
  const digitalPct = parseFloat(
    safePercent(totalCrypto + totalTokenised, totalNetWorth).toFixed(2),
  )
  const unregulatedPct = parseFloat(safePercent(totalUnregulated, totalNetWorth).toFixed(2))
  const largestPositionPct = parseFloat(
    safePercent(largestContribution, totalNetWorth).toFixed(2),
  )

  // Count total distinct sources for diversification
  const totalSourceCount = active.length + manualAccounts.length + manualInvestments.length

  const savingsRatePct =
    monthlyIncome > 0
      ? parseFloat(
          safePercent(monthlyIncome - monthlyExpenses, monthlyIncome).toFixed(2),
        )
      : 0

  // ---- Compute pillar scores (0-100) ----

  // Liquidity: target 3-6 months cash buffer → 100; 0 months → 0
  const liquidityScore = clampScore(
    cashBufferMonths >= 6 ? 100 : (cashBufferMonths / 6) * 100,
  )

  // Diversification: penalise if largest position > 50% or < 3 sources
  const diversificationScore = clampScore(
    100 - largestPositionPct + Math.min(totalSourceCount * 10, 30),
  )

  // Risk match: lower crypto & unregulated exposure → higher score
  const riskMatchScore = clampScore(100 - cryptoPct * 0.5 - unregulatedPct * 0.5)

  // Digital health: digital exposure between 5-30% is ideal
  const digitalHealthScore = clampScore(
    digitalPct <= 30 ? 70 + digitalPct : 100 - (digitalPct - 30) * 2,
  )

  const overallScore = clampScore(
    Math.round(
      (liquidityScore + diversificationScore + riskMatchScore + digitalHealthScore) / 4,
    ),
  )
  const status = deriveStatus(overallScore)

  const pillars = {
    liquidity: { score: liquidityScore, status: deriveStatus(liquidityScore) },
    diversification: {
      score: diversificationScore,
      status: deriveStatus(diversificationScore),
    },
    risk_match: { score: riskMatchScore, status: deriveStatus(riskMatchScore) },
    digital_health: {
      score: digitalHealthScore,
      status: deriveStatus(digitalHealthScore),
    },
  }

  const keyMetrics = {
    net_worth: totalNetWorth,
    cash_buffer_months: cashBufferMonths,
    crypto_pct: cryptoPct,
    digital_pct: digitalPct,
    unregulated_pct: unregulatedPct,
    savings_rate_pct: savingsRatePct,
    largest_position_pct: largestPositionPct,
  }

  const wellnessDoc = {
    overall_score: overallScore,
    status,
    computed_at: serverTimestamp(),
    pillars,
    key_metrics: keyMetrics,
  }

  // Save to /users/{uid}/wellness/current
  await setDoc(doc(db, 'users', uid, 'wellness', 'current'), wellnessDoc)

  // Save wealth summary for wallet tab and other consumers
  await setDoc(
    doc(db, 'users', uid, 'wealth_summary', 'current'),
    {
      total_net_worth: totalNetWorth,
      total_cash: totalCash,
      total_crypto: totalCrypto,
      total_stocks: totalStocks,
      manual_total: manualTotal,
      statements_total: statementsNetWorth,
      updated_at: serverTimestamp(),
    },
    { merge: true },
  )

  return wellnessDoc
}

// ---------------------------------------------------------------------------
// 4. upsertNetWorthHistory
// ---------------------------------------------------------------------------

/**
 * Create or overwrite a net-worth history entry for a given month.
 *
 * @param {string}       uid
 * @param {Date|string}  date           – any value parseable by `new Date()`
 * @param {number}       netWorthValue
 * @returns {Promise<object>}           – the written history entry
 */
export async function upsertNetWorthHistory(uid, date, netWorthValue) {
  if (!uid) return null
  const d = date instanceof Date ? date : new Date(date)
  const monthKey = formatMonthKey(d)
  const monthLabel = formatMonthLabel(d)

  const entry = {
    month: monthLabel,
    month_key: monthKey,
    value: netWorthValue ?? 0,
    updated_at: serverTimestamp(),
  }

  const entryRef = doc(db, 'users', uid, 'history', 'net_worth', 'items', monthKey)
  await setDoc(entryRef, entry)

  return entry
}

// ---------------------------------------------------------------------------
// 4b. recomputeAll — single entry-point for every data-mutation event
// ---------------------------------------------------------------------------

/**
 * Recompute wellness and upsert net-worth history for the current month.
 * Idempotent — safe to call after any data mutation.
 *
 * @param {string} uid
 * @returns {Promise<{wellness: object, historyEntry: object}>}
 */
export async function recomputeAll(uid) {
  if (!uid) return { wellness: null, historyEntry: null }
  const wellness = await recomputeWellness(uid)
  const historyEntry = await upsertNetWorthHistory(
    uid,
    new Date(),
    wellness?.key_metrics?.net_worth ?? 0,
  )
  return { wellness, historyEntry }
}

/** @deprecated Use recomputeAll instead */
export const recalculateNetWorth = recomputeAll

// ---------------------------------------------------------------------------
// 4c. resetUserToEmpty — clear wellness + history when all data is deleted
// ---------------------------------------------------------------------------

/**
 * Reset a user to an empty/default state by deleting wellness and net-worth
 * history documents. Called when all data sources are removed.
 *
 * @param {string} uid
 * @returns {Promise<void>}
 */
export async function resetUserToEmpty(uid) {
  if (!uid) return

  // Delete /wellness/current
  try {
    await deleteDoc(doc(db, 'users', uid, 'wellness', 'current'))
  } catch { /* may not exist */ }

  // Delete all /history/net_worth/items/*
  try {
    const historyRef = collection(db, 'users', uid, 'history', 'net_worth', 'items')
    const historySnap = await getDocs(historyRef)
    const deletes = []
    historySnap.forEach((d) => deletes.push(deleteDoc(d.ref)))
    await Promise.all(deletes)
  } catch { /* may not exist */ }
}

// ---------------------------------------------------------------------------
// 5. processStatementAndRefreshMetrics (orchestrator)
// ---------------------------------------------------------------------------

/**
 * Convenience function that uploads a statement, recomputes wellness, and
 * upserts net-worth history in one call.
 *
 * @param {string} uid
 * @param {File}   file
 * @param {object} metadata   – same shape accepted by uploadStatementFile
 * @returns {Promise<{statement: object, wellness: object, historyEntry: object}>}
 */
export async function processStatementAndRefreshMetrics(uid, file, metadata = {}) {
  const statement = await uploadStatementFile(uid, file, metadata)
  const wellness = await recomputeWellness(uid)
  const historyEntry = await upsertNetWorthHistory(
    uid,
    new Date(),
    wellness.key_metrics.net_worth,
  )

  return { statement, wellness, historyEntry }
}

// ---------------------------------------------------------------------------
// Example usage from Overlay.jsx (copy into your component as needed)
// ---------------------------------------------------------------------------
//
// import { processStatementAndRefreshMetrics } from '../../../services/financialDataService.js'
//
// // Inside handleUploadAndParse, after a successful parse:
//
// const uid = 'u1' // replace with actual authenticated user id
//
// const result = await processStatementAndRefreshMetrics(uid, selectedFile, {
//   sourceType: source,                   // e.g. 'bank', 'crypto', 'broker'
//   platform: 'DBS',                      // name of the institution / exchange
//   status: 'parsed',
//   parsedData: {
//     closing_balance: 12500,
//     total_credits: 3400,
//     total_debits: 2100,
//     statement_month: '2026-03',
//     currency: 'SGD',
//   },
//   transactionsCount: rows.length,
//   netWorthContribution: 12500,
//   liquidityContribution: 12500,
//   assetClassBreakdown: {
//     cash: 12500,
//     stocks: 0,
//     crypto: 0,
//     bonds: 0,
//     property: 0,
//     tokenised: 0,
//   },
// })
//
// console.log('Statement saved:', result.statement)
// console.log('Wellness recomputed:', result.wellness)
// console.log('History entry:', result.historyEntry)
