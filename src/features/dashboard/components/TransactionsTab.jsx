/**
 * TransactionsTab — unified transactions view pulling from
 * Source B (statements) + Source C (email transactions).
 *
 * Features:
 * - Segmented filter: All | Emails | Statements | Manual
 * - Unified <TransactionsTable /> with inline editing
 * - Gmail link/sync controls
 * - Summary stats
 */

import { useMemo, useCallback } from 'react'
import { Upload, RefreshCw, Mail, Unlink, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import TransactionsTable from '../../../components/TransactionsTable.jsx'
import StatCard from '../../../components/ui/StatCard.jsx'
import useGmailLink from '../../../hooks/useGmailLink.js'
import useEmailTransactions from '../../../hooks/useEmailTransactions.js'
import { useAuthContext } from '../../../hooks/useAuthContext.js'

const fmt = (n) =>
  Number(n).toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function TransactionsTab({ viewModel = {}, onUploadClick }) {
  const { transactions = [], emptyState } = viewModel
  const hasData = emptyState?.hasAnyData !== false

  const { user } = useAuthContext()
  const gmail = useGmailLink()
  const emailTx = useEmailTransactions({ enabled: gmail.gmailLinked })

  // Handle inline edit — update Firestore and trigger recalc
  const handleEdit = useCallback(async (tx, updates) => {
    if (!user?.uid) return
    if (tx.source === 'email' && tx.id) {
      await emailTx.edit(tx.id, {
        description: updates.description,
        category: updates.category,
        amount: updates.amount,
      })
    }
    // For statement transactions, just local — could be extended to Firestore writes
  }, [user?.uid, emailTx])

  const handleCategoryChange = useCallback((tx, newCategory) => {
    if (!user?.uid) return
    if (tx.source === 'email' && tx.id) {
      emailTx.edit(tx.id, { category: newCategory })
    }
  }, [user?.uid, emailTx])

  // Compute live summary from actual transactions
  const liveSummary = useMemo(() => {
    let inflow = 0
    let outflow = 0
    for (const tx of transactions) {
      if (tx.amount >= 0) inflow += tx.amount
      else outflow += Math.abs(tx.amount)
    }
    return {
      totalCount: transactions.length,
      totalInflow: `S$${fmt(inflow)}`,
      totalOutflow: `S$${fmt(outflow)}`,
    }
  }, [transactions])

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
          <div className="mx-auto max-w-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/10">
              <ArrowDownLeft className="h-7 w-7 text-brand-primary" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No transactions yet</h3>
            <p className="mt-2 text-sm text-slate-500">
              {emptyState?.message || 'Upload a statement or link Gmail to see your transaction history.'}
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              {onUploadClick && (
                <button
                  type="button"
                  onClick={onUploadClick}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
                >
                  <Upload className="h-4 w-4" />
                  Upload a statement
                </button>
              )}
              {!gmail.gmailLinked && (
                <button
                  type="button"
                  onClick={gmail.linkGmail}
                  disabled={gmail.linking}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
                >
                  <Mail className="h-4 w-4" />
                  {gmail.linking ? 'Linking…' : 'Link Gmail'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header + Gmail controls */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Transactions</h2>
          <span className="mt-1 text-sm text-slate-600">All transactions from statements and email imports</span>
        </div>
        <div className="flex items-center gap-2">
          {gmail.gmailLinked ? (
            <>
              <button
                onClick={emailTx.sync}
                disabled={emailTx.syncing}
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-teal-600 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${emailTx.syncing ? 'animate-spin' : ''}`} />
                {emailTx.syncing ? 'Syncing…' : 'Pull from inbox'}
              </button>
              <button
                onClick={gmail.unlinkGmail}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 transition"
                title={`Linked: ${gmail.gmailEmail || 'Gmail'}`}
              >
                <Unlink className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              onClick={gmail.linkGmail}
              disabled={gmail.linking}
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-teal-600 disabled:opacity-50"
            >
              <Mail className="h-4 w-4" />
              {gmail.linking ? 'Linking…' : 'Link Gmail'}
            </button>
          )}
        </div>
      </div>
      {gmail.gmailLinked && gmail.gmailEmail && (
        <p className="text-xs text-gray-400 px-1 -mt-4">Connected to {gmail.gmailEmail}</p>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Total Transactions"
          value={liveSummary.totalCount}
          valueColor="black"
          tooltip="Count of all transactions from statements and email imports."
        />
        <StatCard
          title="Total Inflow"
          value={liveSummary.totalInflow}
          valueColor="text-teal-500"
          tooltip="Sum of all credit transactions — salary, transfers in, refunds."
        />
        <StatCard
          title="Total Outflow"
          value={liveSummary.totalOutflow}
          valueColor="text-teal-500"
          tooltip="Sum of all debit transactions — purchases, bills, transfers out."
        />
      </div>

      {/* Unified table */}
      <TransactionsTable
        transactions={transactions}
        onEdit={handleEdit}
        onCategoryChange={handleCategoryChange}
      />
    </div>
  )
}
