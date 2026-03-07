import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts'
import { assetAllocation } from '../../data/mockData'

export default function AssetAllocationChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">Asset Allocation</h3>

      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={assetAllocation}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            strokeWidth={2}
            stroke="#fff"
          >
            {assetAllocation.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v, name) => [`${v}%`, name]}
            contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Custom legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
        {assetAllocation.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-600">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
