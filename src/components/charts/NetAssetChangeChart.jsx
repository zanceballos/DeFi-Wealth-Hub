import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { netAssetChange } from '../../data/mockData'

const fmt = (v) => `$${(v / 1000).toFixed(0)}k`

export default function NetAssetChangeChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Net Asset Change</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={netAssetChange} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmt}
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            formatter={(v) => [`$${v.toLocaleString()}`, 'Net Asset']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: 12 }}
          />
          <Bar dataKey="value" fill="#EF4444" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
