import { useState } from 'react'
import { PiggyBank, Upload } from 'lucide-react'
import StatCard from '../../../components/ui/StatCard.jsx'
import CategoryBadge from '../../../components/ui/CategoryBadge.jsx'
import InfoTooltip from '../../../components/ui/InfoTooltip.jsx'

const CARD_CLASS = 'bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl shadow-xl p-5'

const fmtAmt = (amount) => {
  const abs = Math.abs(amount).toFixed(2)
  return amount >= 0 ? `+$${abs}` : `-$${abs}`
}

const fmt = (n) =>
  Number(n).toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const TX_FILTERS = ['All Time', 'Daily', 'Monthly', 'Yearly']

function filterTransactions(transactions, filter) {
  if (filter === 'All Time') return transactions

  const now = new Date()
  return transactions.filter((tx) => {
    const txDate = new Date(tx.date)
    if (isNaN(txDate)) return true // keep if date is unparseable

    if (filter === 'Daily') {
      return (
        txDate.getDate() === now.getDate() &&
        txDate.getMonth() === now.getMonth() &&
        txDate.getFullYear() === now.getFullYear()
      )
    }
    if (filter === 'Monthly') {
      return (
        txDate.getMonth() === now.getMonth() &&
        txDate.getFullYear() === now.getFullYear()
      )
    }
    if (filter === 'Yearly') {
      return txDate.getFullYear() === now.getFullYear()
    }
    return true
  })
}

export default function BudgetingTab({ viewModel = {}, onUploadClick }) {
  const {
    monthlyBudget: vmBudget = 0,
    spentThisMonth = 0,
    remainingBudget: vmRemaining,
    emergencySavingsTarget = 0,
    emergencySavingsCurrent = 0,
    emergencySavingsPct = 0,
    transactionSummary = {},
    recentTransactions: vmTransactions = [],
    emptyState,
  } = viewModel

  const hasData = emptyState?.hasAnyData !== false

  const [budgetInput, setBudgetInput] = useState('')
  const [budget, setBudget] = useState(vmBudget || 0)
  const [transactions, setTransactions] = useState(vmTransactions)
  const [txFilter, setTxFilter] = useState('All Time')

  // Sync when viewModel refreshes
  const spent = spentThisMonth
  const remaining = vmRemaining ?? Math.max(0, budget - spent)
  const spentPct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0

  const handleSaveBudget = () => {
    const val = parseFloat(budgetInput)
    if (!isNaN(val) && val > 0) {
      setBudget(val)
      setBudgetInput('')
    }
  }

  const handleCategoryChange = (id, newCategory) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, category: newCategory } : tx)),
    )
  }

  const emergencyGap = Math.max(0, emergencySavingsTarget - emergencySavingsCurrent)
  const filteredTransactions = filterTransactions(transactions, txFilter)

  // Derive category spending from filtered transactions (outflows only)
  const CATEGORY_COLORS = {
    Transport:     '#22c55e',
    Food:          '#ef4444',
    Bills:         '#84cc16',
    Unknown:       '#9ca3af',
    Paynow:        '#a855f7',
    Groceries:     '#ec4899',
    Entertainment: '#3b82f6',
    Health:        '#06b6d4',
    Shopping:      '#f97316',
    Housing:       '#6366f1',
    Investment:    '#3b82f6',
    Utilities:     '#94a3b8',
  }

  const derivedCategorySpending = (() => {
    const totals = {}
    filteredTransactions.forEach((tx) => {
      if (tx.amount < 0) {
        const cat = tx.category || 'Unknown'
        totals[cat] = (totals[cat] || 0) + Math.abs(tx.amount)
      }
    })
    const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0)
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0,
        color: CATEGORY_COLORS[category] ?? '#9ca3af',
      }))
  })()

  /* ── Empty state ─────────────────────────────────── */
  if (!hasData) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
          <div className="mx-auto max-w-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/10">
              <PiggyBank className="h-7 w-7 text-brand-primary" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No budget data yet</h3>
            <p className="mt-2 text-sm text-slate-500">
              {emptyState?.message || 'Upload a bank statement to see your spending, budget, and emergency savings.'}
            </p>
            {onUploadClick && (
              <button
                type="button"
                onClick={onUploadClick}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
              >
                <Upload className="h-4 w-4" />
                Upload a statement
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ── Main content ────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* ── Budget header ─────────────────────────── */}
      <div className="px-1">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Budget</h2>
        <span className="mt-1 text-sm text-slate-600">Current Budget and emergency savings</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Budget progress */}
        <div className={`${CARD_CLASS} col-span-2`}>
          <p className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
            Budget for the month
            <InfoTooltip text="Your self-set monthly spending limit. The progress bar shows (Total outflows ÷ Budget) × 100. Remaining = Budget − Total outflows for the current month." />
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-2">${fmt(budget)}</p>
          <div className="mt-3 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${spentPct > 85 ? 'bg-red-400' : 'bg-teal-500'}`}
              style={{ width: `${spentPct}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Remaining:&nbsp;
            <span className="font-semibold text-gray-700">${fmt(remaining)}</span>
            <span className="text-gray-400 ml-2">· ${fmt(spent)} spent</span>
          </p>
        </div>

        {/* Budget input */}
        <div className={`${CARD_CLASS} col-span-1`}>
          <p className="text-sm text-gray-500 font-medium">Update budget for the month</p>
          <div className="mt-3 flex gap-2">
            <input
              type="number"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveBudget()}
              placeholder="Enter amount"
              className="flex-1 min-w-0 bg-gray-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400/30 focus:bg-white transition-all"
            />
            <button
              onClick={handleSaveBudget}
              className="bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white px-3 py-2.5 rounded-lg text-sm font-medium transition-colors shrink-0"
            >
              Save
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Current: ${fmt(budget)}/month</p>
        </div>
      </div>

      {/* ── Emergency savings ─────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`${CARD_CLASS} col-span-2`}>
          <p className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
            6-months Emergency Savings
            <InfoTooltip text="Target = Average monthly expenses × 6. Progress = (Current liquid savings ÷ Target) × 100. We recommend keeping 6 months of expenses in easily accessible accounts for emergencies." />
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-2">${fmt(emergencySavingsTarget)}</p>
          <p className="text-sm text-gray-400 mt-1">
            Amount is based on your spending over the past 6-months
          </p>
          <div className="mt-4 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div className="h-2 rounded-full bg-green-500" style={{ width: `${emergencySavingsPct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1.5">
            <span>${fmt(emergencySavingsCurrent)} saved</span>
            <span>${fmt(emergencyGap)} to goal · {Math.round(emergencySavingsPct)}%</span>
          </div>
        </div>
      </div>

      {/* ── Transactions header ───────────────────── */}
      <div className="px-1 mt-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Transactions</h2>
          <span className="mt-1 text-sm text-slate-600">Transaction history and current spending</span>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {TX_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setTxFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                txFilter === f
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Total Transactions"
          value={transactionSummary.totalCount ?? '—'}
          valueColor="text-teal-500"
          changeText={transactionSummary.totalCountChange ?? ''}
          changeColor="text-green-500"
          tooltip="Count of all debit and credit entries from your uploaded statements within the selected time filter."
        />
        <StatCard
          title="Total Inflow"
          value={transactionSummary.totalInflow ?? '—'}
          valueColor="text-teal-500"
          changeText={transactionSummary.totalInflowChange ?? ''}
          changeColor="text-green-500"
          tooltip="Sum of all positive (credit) transactions — salary, transfers in, refunds, and other deposits within the selected period."
        />
        <StatCard
          title="Total Outflow"
          value={transactionSummary.totalOutflow ?? '—'}
          valueColor="text-teal-500"
          changeText={transactionSummary.totalOutflowChange ?? ''}
          changeColor="text-green-500"
          tooltip="Sum of all negative (debit) transactions — purchases, bills, transfers out, and withdrawals within the selected period."
        />
      </div>

      {/* ── Transaction table ─────────────────────── */}
      <div className={CARD_CLASS}>
        <div className="overflow-hidden">
          <div className="overflow-auto" style={filteredTransactions.length > 0 ? { maxHeight: '520px' } : undefined}>
            <table className="w-full">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-2 text-xs text-gray-400 font-medium w-[30%]">Source</th>
                  <th className="text-left px-4 py-2 text-xs text-gray-400 font-medium">Merchant</th>
                  <th className="text-left px-4 py-2 text-xs text-gray-400 font-medium">Date</th>
                  <th className="text-left px-4 py-2 text-xs text-gray-400 font-medium">Time</th>
                  <th className="text-left px-4 py-2 text-xs text-gray-400 font-medium">Category</th>
                  <th className="text-right px-4 py-2 text-xs text-gray-400 font-medium">Posted</th>
                  <th className="text-right px-5 py-2 text-xs text-gray-400 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-400">
                      No transactions to display.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx, i) => (
                    <tr key={tx.id ?? i} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3 text-sm text-gray-900 font-medium truncate max-w-0 w-[30%]">
                        {tx.source}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{tx.merchant}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{tx.date}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{tx.time}</td>
                      <td className="px-4 py-3">
                        <CategoryBadge
                          category={tx.category}
                          onCategoryChange={(cat) => handleCategoryChange(tx.id ?? i, cat)}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400 text-right whitespace-nowrap">{tx.posted}</td>
                      <td
                        className={`px-5 py-3 text-sm font-semibold text-right whitespace-nowrap ${
                          tx.amount >= 0 ? 'text-teal-500' : 'text-red-500'
                        }`}
                      >
                        {fmtAmt(tx.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Category spending ─────────────────────── */}
      {derivedCategorySpending.length > 0 && (
        <div className={`${CARD_CLASS} col-span-1`}>
          <p className="text-sm text-gray-500 font-medium mb-4 flex items-center gap-1.5">
            Spending by Category — This Month
            <InfoTooltip text="Each category total = sum of outflow transactions tagged with that category. Percentages show each category's share of total outflows." />
          </p>
          <div className="space-y-3">
            {derivedCategorySpending.map((item) => (
              <div key={item.category} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-28 shrink-0">{item.category}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-600 w-16 text-right shrink-0">
                  ${Number(item.amount).toFixed(2)}
                </span>
                <span className="text-xs text-gray-400 w-8 text-right shrink-0">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
