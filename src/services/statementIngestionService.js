/**
 * statementIngestionService.js
 *
 * Saves a parsed financial statement to Firestore using the upgraded schema:
 *
 *   /users/{uid}/statements/{statementId}          — summary doc
 *   /users/{uid}/statements/{statementId}/transactions/{txId}  — line items
 *
 * Every transaction keeps its `category` so the Budget page can group spending.
 *
 * Uses modular Firebase SDK only (collection, doc, setDoc, addDoc, serverTimestamp).
 */

import { db } from '../lib/firebase.js'
import {
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Derive a human-friendly merchant name from a raw description string.
 *
 * @param {string} description
 * @returns {string}
 */
export function deriveMerchant(description) {
  if (!description || typeof description !== 'string') return description ?? ''
  const lower = description.toLowerCase()
  if (lower.includes('grab'))     return 'Grab'
  if (lower.includes('ntuc'))     return 'NTUC'
  if (lower.includes('dbs'))      return 'DBS'
  if (lower.includes('binance'))  return 'Binance'
  if (lower.includes('singtel'))  return 'Singtel'
  if (lower.includes('shopee'))   return 'Shopee'
  if (lower.includes('lazada'))   return 'Lazada'
  if (lower.includes('spotify'))  return 'Spotify'
  if (lower.includes('netflix'))  return 'Netflix'
  if (lower.includes('apple'))    return 'Apple'
  if (lower.includes('google'))   return 'Google'
  return description
}

/**
 * Normalize a single parsed row into a flat Firestore-ready transaction object.
 *
 * Accepts the raw row shape produced by the Overlay's `toRows()` function
 * (with `normalizedPayload`, `rowConfidence`, etc.) **or** the raw backend
 * shape (with `normalized_payload`, `row_confidence`, etc.).
 *
 * @param {object} row
 * @param {string} [sourceType='bank']
 * @returns {object}
 */
export function normalizeParsedRow(row, sourceType = 'bank') {
  // Support both camelCase (Overlay local) and snake_case (raw backend) shapes
  const payload = row.normalizedPayload ?? row.normalized_payload ?? {}

  const description = payload.description ?? payload.desc ?? 'Unknown transaction'
  const amount      = Number(payload.amount) || 0
  const category    = (payload.category ?? 'uncategorised').toLowerCase()
  const direction   = (payload.direction ?? 'debit').toLowerCase()
  const currency    = payload.currency ?? 'SGD'
  const asset       = (payload.asset ?? 'cash').toLowerCase()
  const date        = payload.date ?? ''

  return {
    row_id:           row.id ?? row.row_id ?? row.rowId ?? '',
    date,
    description,
    amount,
    currency,
    category,
    direction,
    asset,
    merchant:         deriveMerchant(description),
    source_type:      sourceType,
    row_confidence:   Number(row.rowConfidence ?? row.row_confidence) || 0,
    validation_flags: row.validationFlags ?? row.validation_flags ?? [],
    state:            row.state ?? 'pending',
    created_at:       serverTimestamp(),
  }
}

/**
 * Compute aggregate totals from an array of parsed rows.
 *
 * @param {object[]} parsedRows  – Overlay-shaped rows (normalizedPayload etc.)
 * @returns {{ total_credits: number, total_debits: number, closing_balance: number, category_breakdown: object }}
 */
export function computeStatementSummaryFromRows(parsedRows) {
  let totalCredits = 0
  let totalDebits  = 0
  const categoryBreakdown = {}

  for (const row of parsedRows) {
    const payload   = row.normalizedPayload ?? row.normalized_payload ?? {}
    const amount    = Math.abs(Number(payload.amount) || 0)
    const direction = (payload.direction ?? 'debit').toLowerCase()
    const category  = (payload.category ?? 'uncategorised').toLowerCase()

    if (direction === 'credit' || direction === 'in') {
      totalCredits += amount
    } else {
      totalDebits += amount
      // Only count debits for category spending breakdown
      categoryBreakdown[category] = (categoryBreakdown[category] ?? 0) + amount
    }
  }

  return {
    total_credits:      totalCredits,
    total_debits:       totalDebits,
    closing_balance:    totalCredits - totalDebits,
    category_breakdown: categoryBreakdown,
  }
}

/**
 * Build the `asset_class_breakdown` object from parsed rows and source type.
 *
 * @param {object[]} parsedRows
 * @param {string}   sourceType
 * @returns {{ cash: number, bonds: number, stocks: number, crypto: number, property: number, tokenised: number }}
 */
export function inferAssetBreakdownFromRows(parsedRows, sourceType = 'bank') {
  const breakdown = { cash: 0, bonds: 0, stocks: 0, crypto: 0, property: 0, tokenised: 0 }

  for (const row of parsedRows) {
    const payload   = row.normalizedPayload ?? row.normalized_payload ?? {}
    const amount    = Math.abs(Number(payload.amount) || 0)
    const direction = (payload.direction ?? 'debit').toLowerCase()
    const asset     = (payload.asset ?? '').toLowerCase()

    // Only credit / inflow contributes to net position
    const sign = (direction === 'credit' || direction === 'in') ? 1 : -1

    if (asset === 'crypto')                    breakdown.crypto    += amount * sign
    else if (asset === 'stocks')               breakdown.stocks    += amount * sign
    else if (asset === 'bonds')                breakdown.bonds     += amount * sign
    else if (asset === 'property')             breakdown.property  += amount * sign
    else if (asset === 'tokenised')            breakdown.tokenised += amount * sign
    else                                       breakdown.cash      += amount * sign
  }

  // If no per-row asset tags, fall back to source-type heuristic
  const hasAnyPositive = Object.values(breakdown).some((v) => v > 0)
  if (!hasAnyPositive) {
    const { closing_balance } = computeStatementSummaryFromRows(parsedRows)
    const net = Math.max(closing_balance, 0)
    if (sourceType === 'bank')        breakdown.cash   = net
    else if (sourceType === 'broker') breakdown.stocks  = net
    else if (sourceType === 'crypto') breakdown.crypto  = net
    else                              breakdown.cash    = net
  }

  // Clamp negatives to 0
  for (const key of Object.keys(breakdown)) {
    if (breakdown[key] < 0) breakdown[key] = 0
  }

  return breakdown
}

// ─── Firestore writers ──────────────────────────────────────────────────────

/**
 * 1. Create the statement summary document.
 *
 * @param {string} uid
 * @param {File|null}  file
 * @param {object} metadata
 * @returns {Promise<{ statementId: string, statementData: object }>}
 */
export async function createStatementSummary(uid, file, metadata = {}) {
  const summary = computeStatementSummaryFromRows(metadata.parsedRows ?? [])
  const assetBreakdown = metadata.assetClassBreakdown
    ?? inferAssetBreakdownFromRows(metadata.parsedRows ?? [], metadata.sourceType)

  const closingBalance = summary.closing_balance
  const isBank = metadata.sourceType === 'bank'

  const statementData = {
    file_name:              file?.name ?? 'mock_statement.json',
    file_url:               metadata.fileUrl ?? '',
    storage_path:           metadata.storagePath ?? '',
    source_type:            metadata.sourceType ?? 'bank',
    platform:               metadata.platform ?? metadata.sourceType ?? 'Unknown',
    uploaded_at:            serverTimestamp(),
    status:                 metadata.status ?? 'parsed',
    parsed_data: {
      closing_balance:      closingBalance,
      total_credits:        summary.total_credits,
      total_debits:         summary.total_debits,
      statement_month:      metadata.statementMonth ?? new Date().toISOString().slice(0, 7),
      currency:             metadata.currency ?? 'SGD',
    },
    category_breakdown:     summary.category_breakdown,
    transactions_count:     (metadata.parsedRows ?? []).length,
    net_worth_contribution: metadata.netWorthContribution ?? Math.max(closingBalance, 0),
    liquidity_contribution: metadata.liquidityContribution ?? (isBank ? Math.max(closingBalance, 0) : 0),
    asset_class_breakdown:  assetBreakdown,
    regulated:              metadata.regulated ?? (metadata.sourceType !== 'crypto'),
  }

  const statementsCol = collection(db, 'users', uid, 'statements')
  const docRef = await addDoc(statementsCol, statementData)

  return { statementId: docRef.id, statementData }
}

/**
 * 2. Save individual transaction documents into the subcollection.
 *
 * @param {string}   uid
 * @param {string}   statementId
 * @param {object[]} parsedRows    – Overlay-shaped rows
 * @param {string}   [sourceType]
 * @returns {Promise<number>}      – count of transactions written
 */
export async function saveStatementTransactions(uid, statementId, parsedRows, sourceType = 'bank') {
  const txCol = collection(db, 'users', uid, 'statements', statementId, 'transactions')
  let count = 0

  for (const row of parsedRows) {
    const txData = normalizeParsedRow(row, sourceType)
    const txRef = doc(txCol)                       // auto-generated id
    txData.id = txRef.id                           // store the id inside the doc too
    await setDoc(txRef, txData)
    count += 1
  }

  return count
}

/**
 * 3. Full ingestion orchestrator — creates summary + transactions in one call.
 *
 * @param {string}   uid
 * @param {File|null} file
 * @param {object[]} parsedRows  – Overlay-shaped rows (normalizedPayload etc.)
 * @param {object}   [metadata]  – extra fields (sourceType, platform, …)
 * @returns {Promise<{ statementId: string, transactionCount: number, statementData: object }>}
 */
export async function ingestStatementToFirestore(uid, file, parsedRows, metadata = {}) {
  // Attach rows so summary helpers can compute totals
  const enrichedMeta = { ...metadata, parsedRows }

  // Step 1 — statement summary doc
  const { statementId, statementData } = await createStatementSummary(uid, file, enrichedMeta)

  // Step 2 — transaction subcollection
  const transactionCount = await saveStatementTransactions(
    uid,
    statementId,
    parsedRows,
    metadata.sourceType ?? 'bank',
  )

  // Step 3 — patch transactions_count (in case it drifted)
  if (transactionCount !== statementData.transactions_count) {
    const stmtRef = doc(db, 'users', uid, 'statements', statementId)
    await updateDoc(stmtRef, { transactions_count: transactionCount })
  }

  return { statementId, transactionCount, statementData }
}

// ─── Example usage ──────────────────────────────────────────────────────────
//
// import { ingestStatementToFirestore } from '../services/statementIngestionService.js'
//
// const { statementId, transactionCount } = await ingestStatementToFirestore(
//   user.uid,
//   selectedFile,          // File object or null for mock
//   rows,                  // Overlay-shaped parsed rows
//   { sourceType: 'bank', platform: 'DBS' },
// )
//
// console.log(`Created statement ${statementId} with ${transactionCount} transactions`)
