import { AlertTriangle, Landmark } from 'lucide-react'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
} from 'recharts'

const CARD_CLASS = 'bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl shadow-xl'

function WalletTab({ walletAllocation, walletRows }) {
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
              <p className="text-2xl font-black text-brand-primary">S$85,700</p>
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
              {walletRows.map((row) => (
                <tr key={`${row.asset}-${row.platform}`} className="border-t border-white/60">
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
      </article>
    </div>
  )
}

export default WalletTab
