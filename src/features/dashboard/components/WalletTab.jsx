import { AlertTriangle, Landmark, Upload, Wallet } from 'lucide-react'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrencySGD } from '../../../services/dashboardViewModel.js'

const CARD_CLASS = 'bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl shadow-xl'

function WalletTab({ walletAllocation, walletRows, totalNetWorth = 0, emptyState, onUploadClick }) {
  const hasData = emptyState?.hasAnyData !== false

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
          <div className="mx-auto max-w-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/10">
              <Wallet className="h-7 w-7 text-brand-primary" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No portfolio data yet</h3>
            <p className="mt-2 text-sm text-slate-500">
              {emptyState?.message || 'Upload a bank, brokerage, or crypto statement to see your portfolio allocation.'}
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

  return (
    <div className="space-y-6">
      <article className={`${CARD_CLASS} p-5`}>
        <h2 className="mb-4 text-base font-semibold text-slate-900">Portfolio Allocation</h2>
        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[300px_1fr]">
          <div className="relative mx-auto h-65 w-65">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={walletAllocation}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={72}
                  outerRadius={104}
                  stroke="none"
                  paddingAngle={2}
                >
                  {walletAllocation.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className="text-xs font-medium text-slate-500">Total</p>
              <p className="text-2xl font-black text-brand-primary">{formatCurrencySGD(totalNetWorth)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {walletAllocation.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <p className="text-sm font-medium text-slate-700">{item.name}</p>
                </div>
                <p className="text-sm font-semibold text-slate-900">{item.value}%</p>
              </div>
            ))}
          </div>
        </div>
      </article>

      <article className={`${CARD_CLASS} overflow-hidden`}>
        <div className="border-b border-white/60 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Asset Breakdown</h2>
        </div>
        {walletRows.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-400">
            No individual asset rows to display.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/60 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Asset</th>
                  <th className="px-5 py-3">Platform</th>
                  <th className="px-5 py-3">Value</th>
                  <th className="px-5 py-3">% Portfolio</th>
                  <th className="px-5 py-3">Risk Label</th>
                  <th className="px-5 py-3">Regulated</th>
                </tr>
              </thead>
              <tbody>
                {walletRows.map((row, i) => (
                  <tr key={`${row.asset}-${row.platform}-${i}`} className="border-t border-white/60">
                    <td className="px-5 py-3 font-medium text-slate-800">{row.asset}</td>
                    <td className="px-5 py-3 text-slate-600">{row.platform}</td>
                    <td className="px-5 py-3 text-slate-800">{row.value}</td>
                    <td className="px-5 py-3 text-slate-800">{row.portfolio}</td>
                    <td className="px-5 py-3 text-slate-800">{row.riskLabel}</td>
                    <td className="px-5 py-3 text-slate-800">{row.regulated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </div>
  )
}

export default WalletTab
