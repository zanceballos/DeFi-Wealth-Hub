import { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import StatCard from '../components/ui/StatCard'
import { spendingByCategory, upcomingBills } from '../data/mockData'

const SPENT = 1927.90

export default function Home() {
  const { setTimeFilters } = useAppContext()

  const [budgetInput, setBudgetInput] = useState('')
  const [budget, setBudget] = useState(3927.90)

  // No time filters on the Home page
  useEffect(() => {
    setTimeFilters([])
  }, [setTimeFilters])

  const handleSaveBudget = () => {
    const val = parseFloat(budgetInput)
    if (!isNaN(val) && val > 0) {
      setBudget(val)
      setBudgetInput('')
    }
  }

  const remaining = Math.max(0, budget - SPENT)
  const spentPct  = Math.min(100, (SPENT / budget) * 100)

  const fmt = (n) =>
    n.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="space-y-5">
      {/* ── Row 1: top stats ── */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Net Asset"
          value="$45,678.90"
          valueColor="text-teal-500"
          changeText="+20% this month"
          changeColor="text-green-500"
        />

        {/* Wellness Score */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Wellness Score</p>
          <p className="text-3xl font-bold mt-2 text-teal-500">85</p>
          <p className="text-sm text-gray-500 mt-1">Healthy financial health</p>
        </div>

        {/* Portfolio Diversity */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Portfolio Diversity</p>
          <p className="text-3xl font-bold mt-2 text-amber-500">Average</p>
          <p className="text-sm text-gray-400 mt-1">Low Liquidity&nbsp;|&nbsp;High crypto exposure</p>
        </div>
      </div>

      {/* ── Row 2: budget ── */}
      <div className="grid grid-cols-3 gap-4">
        {/* Budget progress (takes 2/3) */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Budget for the month</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">${fmt(budget)}</p>

          {/* Progress bar */}
          <div className="mt-3 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${spentPct > 85 ? 'bg-red-400' : 'bg-teal-500'}`}
              style={{ width: `${spentPct}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Remaining:&nbsp;
            <span className="font-semibold text-gray-700">${fmt(remaining)}</span>
            <span className="text-gray-400 ml-2">· ${fmt(SPENT)} spent</span>
          </p>
        </div>

        {/* Update budget (takes 1/3) */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col">
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

      {/* ── Row 3: emergency savings + upcoming bills ── */}
      <div className="grid grid-cols-3 gap-4">
        {/* 6-month Emergency Savings (2/3) */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">6-months Emergency Savings</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">$7,213.00</p>
          <p className="text-sm text-gray-400 mt-1">
            Amount is based on your spending over the past 6-months
          </p>

          {/* Progress toward goal */}
          <div className="mt-4 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div className="h-2 rounded-full bg-green-500" style={{ width: '62%' }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1.5">
            <span>$4,472 saved</span>
            <span>$2,741 to goal · 62%</span>
          </div>
        </div>

        {/* Upcoming Bills (1/3) */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm text-gray-500 font-medium mb-3">Upcoming Bills</p>
          <div className="space-y-3">
            {upcomingBills.map((bill) => (
              <div key={bill.name} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{bill.name}</p>
                  <p className="text-xs text-gray-400">
                    {bill.dueDate} ·&nbsp;
                    <span className={bill.daysLeft <= 5 ? 'text-red-500 font-semibold' : ''}>
                      {bill.daysLeft}d left
                    </span>
                  </p>
                </div>
                <span className={`text-xs font-semibold shrink-0 ${bill.daysLeft <= 5 ? 'text-red-500' : 'text-gray-700'}`}>
                  ${bill.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 4: spending by category ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <p className="text-sm text-gray-500 font-medium mb-4">Spending by Category — This Month</p>
        <div className="space-y-3">
          {spendingByCategory.map((item) => (
            <div key={item.category} className="flex items-center gap-3">
              <span className="text-xs text-gray-600 w-28 shrink-0">{item.category}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                />
              </div>
              <span className="text-xs font-medium text-gray-600 w-16 text-right shrink-0">
                ${item.amount.toFixed(2)}
              </span>
              <span className="text-xs text-gray-400 w-8 text-right shrink-0">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
