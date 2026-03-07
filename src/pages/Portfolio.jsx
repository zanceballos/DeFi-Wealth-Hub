import { useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import StatCard from '../components/ui/StatCard'
import NetAssetChart from '../components/charts/NetAssetChart'
import AssetAllocationChart from '../components/charts/AssetAllocationChart'
import NetAssetChangeChart from '../components/charts/NetAssetChangeChart'
import { recentTransactions } from '../data/mockData'

const fmtAmt = (amount) => {
  const abs = Math.abs(amount).toFixed(2)
  return amount >= 0 ? `+$${abs}` : `-$${abs}`
}

export default function Portfolio() {
  const { setTimeFilters, setActiveFilter } = useAppContext()

  useEffect(() => {
    setTimeFilters(['All Time', 'Monthly', 'Yearly'])
    setActiveFilter('All Time')
    return () => setTimeFilters([])
  }, [setTimeFilters, setActiveFilter])

  return (
    <div className="space-y-5">
      {/* ── Row 1: top stats ── */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Net Asset"
          value="$45,678.90"
          valueColor="text-teal-500"
          changeText="+20% This month"
          changeColor="text-green-500"
        />
        <StatCard
          title="Liquid Cash"
          value="$20,129.23"
          valueColor="text-teal-500"
          changeText="-15% This month"
          changeColor="text-red-500"
        />
        <StatCard
          title="Investments"
          value="$15,000.92"
          valueColor="text-teal-500"
          changeText="+12% This month"
          changeColor="text-green-500"
        />
      </div>

      {/* ── Row 2: charts ── */}
      <div className="grid grid-cols-2 gap-4">
        <NetAssetChart />
        <AssetAllocationChart />
      </div>

      {/* ── Row 3: mini-transactions + bar chart ── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Recent Transactions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Transactions</h3>

          {/* Column headers */}
          <div className="grid grid-cols-[1fr_80px_72px] text-xs text-gray-400 font-medium pb-2 border-b border-gray-100">
            <span>Source</span>
            <span className="text-right">Posted</span>
            <span className="text-right">Amount</span>
          </div>

          {/* Rows */}
          {recentTransactions.map((tx) => (
            <div
              key={tx.id}
              className="grid grid-cols-[1fr_80px_72px] py-2.5 border-b border-gray-50 last:border-0"
            >
              <span className="text-xs text-gray-900 font-medium truncate pr-2">{tx.source}</span>
              <span className="text-xs text-gray-400 text-right">{tx.posted}</span>
              <span
                className={`text-xs font-semibold text-right ${
                  tx.amount >= 0 ? 'text-teal-500' : 'text-red-500'
                }`}
              >
                {fmtAmt(tx.amount)}
              </span>
            </div>
          ))}
        </div>

        <NetAssetChangeChart />
      </div>
    </div>
  )
}
