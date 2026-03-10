/**
 * StatCard — reusable card for key metrics.
 *
 * Props:
 *   title        (string)  — label above the value
 *   value        (string)  — main large number / text
 *   valueColor   (string)  — Tailwind text class, default "text-teal-500"
 *   changeText   (string)  — small line below the value
 *   changeColor  (string)  — Tailwind text class for changeText
 *   tooltip      (string)  — optional hover explanation of how the metric is calculated
 *   children              — optional extra content below
 */
import InfoTooltip from './InfoTooltip'

export default function StatCard({
  title,
  value,
  valueColor = 'text-teal-500',
  changeText,
  changeColor = 'text-gray-400',
  tooltip,
  children,
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
      <p className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
        {title}
        {tooltip && <InfoTooltip text={tooltip} />}
      </p>
      {value !== undefined && (
        <p className={`text-2xl font-bold mt-2 sm:text-3xl ${valueColor}`}>{value}</p>
      )}
      {changeText && (
        <p className={`text-sm mt-1 ${changeColor}`}>{changeText}</p>
      )}
      {children}
    </div>
  )
}
