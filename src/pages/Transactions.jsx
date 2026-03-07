import { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import CategoryBadge from '../components/ui/CategoryBadge'
import StatCard from '../components/ui/StatCard'
import { allTransactions } from '../data/mockData'

const fmtAmt = (amount) => {
  const abs = Math.abs(amount).toFixed(2)
  return amount >= 0 ? `+$${abs}` : `-$${abs}`
}

export default function Transactions() {
  const { setTimeFilters, setActiveFilter } = useAppContext()
  const [transactions, setTransactions] = useState(allTransactions)

  useEffect(() => {
    setTimeFilters(['All Time', 'Daily', 'Monthly', 'Yearly'])
    setActiveFilter('All Time')
    return () => setTimeFilters([])
  }, [setTimeFilters, setActiveFilter])

  const handleCategoryChange = (id, newCategory) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, category: newCategory } : tx))
    )
  }

  return (
    <div className="space-y-5">
      {/* ── Transactions table ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-sm font-semibold text-gray-900">Transactions</h3>
        </div>

        <div className="overflow-auto" style={{ maxHeight: '520px' }}>
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
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3 text-sm text-gray-900 font-medium truncate max-w-0 w-[30%]">
                    {tx.source}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{tx.merchant}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{tx.date}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{tx.time}</td>
                  <td className="px-4 py-3">
                    <CategoryBadge
                      category={tx.category}
                      onCategoryChange={(cat) => handleCategoryChange(tx.id, cat)}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 text-right whitespace-nowrap">
                    {tx.posted}
                  </td>
                  <td
                    className={`px-5 py-3 text-sm font-semibold text-right whitespace-nowrap ${
                      tx.amount >= 0 ? 'text-teal-500' : 'text-red-500'
                    }`}
                  >
                    {fmtAmt(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Summary stats ── */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Total Transactions"
          value="132,322"
          valueColor="text-teal-500"
          changeText="+20% All Time"
          changeColor="text-green-500"
        />
        <StatCard
          title="Total Inflow"
          value="$123,234"
          valueColor="text-teal-500"
          changeText="+12% All Time"
          changeColor="text-green-500"
        />
        <StatCard
          title="Total Outflow"
          value="$50,232"
          valueColor="text-teal-500"
          changeText="+124% All Time"
          changeColor="text-green-500"
        />
      </div>
    </div>
  )
}
