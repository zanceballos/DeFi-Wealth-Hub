/**
 * TransactionsTable — unified transaction table with segmented filter,
 * source badges, inline editing, and pagination.
 *
 * Columns: Date | Description/Merchant | Category | Amount | Direction | Source | Actions
 * Filters: All | Emails | Statements | Manual
 */

import { useState, useMemo, useCallback } from 'react'
import { Pencil, Check, X, ChevronLeft, ChevronRight, EyeOff, Eye } from 'lucide-react'
import CategoryBadge from './ui/CategoryBadge.jsx'

const PAGE_SIZE = 50

const SOURCE_BADGE = {
  email:     { label: 'Email',     className: 'bg-blue-100 text-blue-700' },
  statement: { label: 'Statement', className: 'bg-teal-100 text-teal-700' },
}

const SOURCE_FILTERS = [
  { key: 'all',        label: 'All' },
  { key: 'email',      label: 'Emails' },
  { key: 'statement',  label: 'Statements' },
]

const TIME_FILTERS = ['All Time', 'Daily', 'Monthly', 'Yearly']

function filterByTime(transactions, timeFilter) {
  if (timeFilter === 'All Time') return transactions
  const now = new Date()
  return transactions.filter((tx) => {
    const txDate = new Date(tx.date)
    if (isNaN(txDate)) return true
    if (timeFilter === 'Daily') {
      return txDate.getDate() === now.getDate() &&
        txDate.getMonth() === now.getMonth() &&
        txDate.getFullYear() === now.getFullYear()
    }
    if (timeFilter === 'Monthly') {
      return txDate.getMonth() === now.getMonth() &&
        txDate.getFullYear() === now.getFullYear()
    }
    if (timeFilter === 'Yearly') {
      return txDate.getFullYear() === now.getFullYear()
    }
    return true
  })
}

const fmtAmt = (amount) => {
  const abs = Math.abs(amount).toFixed(2)
  return amount >= 0 ? `+$${abs}` : `-$${abs}`
}

export default function TransactionsTable({
  transactions = [],
  onEdit,
  onCategoryChange,
  onExclude,
  onRestore,
}) {
  const [sourceFilter, setSourceFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('All Time')
  const [showExcluded, setShowExcluded] = useState(false)
  const [page, setPage] = useState(0)
  const [editingId, setEditingId] = useState(null)
  const [editValues, setEditValues] = useState({})

  // Filter transactions by source then time, then handle excluded visibility
  const filtered = useMemo(() => {
    let result = transactions
    if (sourceFilter !== 'all') {
      result = result.filter((tx) => tx.source === sourceFilter)
    }
    result = filterByTime(result, timeFilter)
    if (!showExcluded) {
      result = result.filter((tx) => !tx.excluded)
    }
    return result
  }, [transactions, sourceFilter, timeFilter, showExcluded])

  const excludedCount = useMemo(
    () => transactions.filter((tx) => tx.excluded).length,
    [transactions],
  )

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(
    () => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [filtered, page],
  )

  // Reset page when filter changes
  const handleSourceFilterChange = useCallback((f) => {
    setSourceFilter(f)
    setPage(0)
  }, [])

  const handleTimeFilterChange = useCallback((f) => {
    setTimeFilter(f)
    setPage(0)
  }, [])

  // Inline edit
  const startEdit = (tx) => {
    setEditingId(tx.id)
    setEditValues({
      description: tx.description || '',
      category: tx.category || '',
      amount: tx.amount ?? 0,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValues({})
  }

  const saveEdit = (tx) => {
    if (onEdit) {
      onEdit(tx, {
        description: editValues.description,
        category: editValues.category,
        amount: parseFloat(editValues.amount) || 0,
      })
    }
    setEditingId(null)
    setEditValues({})
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Source filter */}
        <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1 w-fit">
          {SOURCE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => handleSourceFilterChange(f.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                sourceFilter === f.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Time filter */}
        <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1 w-fit">
          {TIME_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => handleTimeFilterChange(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                timeFilter === f
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Show excluded toggle */}
        {excludedCount > 0 && (
          <button
            onClick={() => { setShowExcluded((v) => !v); setPage(0) }}
            className={`ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              showExcluded
                ? 'bg-amber-100 text-amber-700'
                : 'bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            {showExcluded ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {showExcluded ? 'Hide' : 'Show'} {excludedCount} excluded
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto" style={paginated.length > 0 ? { maxHeight: '600px' } : undefined}>
          <table className="min-w-[600px] w-full">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Date</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Description / Merchant</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Category</th>
                <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium">Amount</th>
                <th className="hidden sm:table-cell text-center px-4 py-3 text-xs text-gray-400 font-medium">Direction</th>
                <th className="hidden md:table-cell text-center px-4 py-3 text-xs text-gray-400 font-medium">Source</th>
                <th className="text-center px-3 py-3 text-xs text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">
                    No transactions to display.
                  </td>
                </tr>
              ) : (
                paginated.map((tx, i) => {
                  const key = tx.id ?? `${tx.date}-${i}`
                  const isEditing = editingId === tx.id
                  const badge = SOURCE_BADGE[tx.source] ?? SOURCE_BADGE.statement

                  if (isEditing) {
                    return (
                      <tr key={key} className="border-b border-blue-100 bg-blue-50/40">
                        <td className="px-5 py-2 text-sm text-gray-500 whitespace-nowrap">{tx.date}</td>
                        <td className="px-4 py-2">
                          <input
                            value={editValues.description}
                            onChange={(e) => setEditValues((v) => ({ ...v, description: e.target.value }))}
                            className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-teal-400/30"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <CategoryBadge
                            category={editValues.category}
                            onCategoryChange={(cat) => setEditValues((v) => ({ ...v, category: cat }))}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            step="0.01"
                            value={editValues.amount}
                            onChange={(e) => setEditValues((v) => ({ ...v, amount: e.target.value }))}
                            className="w-24 bg-white border border-gray-200 rounded px-2 py-1.5 text-sm text-right outline-none focus:ring-2 focus:ring-teal-400/30"
                          />
                        </td>
                        <td className="hidden sm:table-cell px-4 py-2 text-center text-xs text-gray-500">
                          {tx.direction}
                        </td>
                        <td className="hidden md:table-cell px-4 py-2 text-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${badge.className}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => saveEdit(tx)} className="p-1 rounded hover:bg-green-100 text-green-600" title="Save">
                              <Check className="h-4 w-4" />
                            </button>
                            <button onClick={cancelEdit} className="p-1 rounded hover:bg-red-100 text-red-500" title="Cancel">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr key={key} className={`border-b border-gray-50 transition-colors ${
                      tx.excluded ? 'opacity-40 bg-gray-50' : 'hover:bg-gray-50/60'
                    }`}>
                      <td className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap">{tx.date}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        <div>{tx.description}</div>
                        {tx.merchant && tx.merchant !== '—' && (
                          <div className="text-xs text-gray-400">{tx.merchant}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <CategoryBadge
                          category={tx.category}
                          onCategoryChange={onCategoryChange ? (cat) => onCategoryChange(tx, cat) : undefined}
                        />
                      </td>
                      <td className={`px-4 py-3 text-sm font-semibold text-right whitespace-nowrap ${
                        tx.amount >= 0 ? 'text-teal-500' : 'text-red-500'
                      }`}>
                        {fmtAmt(tx.amount)}
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3 text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          tx.direction === 'credit'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {tx.direction}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {tx.excluded ? (
                            onRestore && (
                              <button
                                onClick={() => onRestore(tx)}
                                className="p-1.5 rounded-lg hover:bg-emerald-100 text-gray-400 hover:text-emerald-600 transition-colors"
                                title="Restore to analytics"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                            )
                          ) : (
                            <>
                              {tx.id && (
                                <button
                                  onClick={() => startEdit(tx)}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                  title="Edit"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {onExclude && (
                                <button
                                  onClick={() => onExclude(tx)}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                  title="Exclude from analytics"
                                >
                                  <EyeOff className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
            <span className="text-xs text-gray-400">
              {filtered.length} transaction{filtered.length !== 1 ? 's' : ''} · Page {page + 1} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
