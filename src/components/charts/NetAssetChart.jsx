import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { netAssetHistory } from '../../data/mockData'

const fmt = (v) => `$${(v / 1000).toFixed(0)}k`

export default function NetAssetChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Net Asset</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={netAssetHistory} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmt}
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            formatter={(v) => [`$${v.toLocaleString()}`, 'Net Asset']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#0EA5E9"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: '#0EA5E9', stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
