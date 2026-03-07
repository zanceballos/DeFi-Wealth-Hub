/**
 * StatCard — reusable card for key metrics.
 *
 * Props:
 *   title        (string)  — label above the value
 *   value        (string)  — main large number / text
 *   valueColor   (string)  — Tailwind text class, default "text-teal-500"
 *   changeText   (string)  — small line below the value
 *   changeColor  (string)  — Tailwind text class for changeText
 *   children              — optional extra content below
 */
export default function StatCard({
  title,
  value,
  valueColor = 'text-teal-500',
  changeText,
  changeColor = 'text-gray-400',
  children,
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      {value !== undefined && (
        <p className={`text-3xl font-bold mt-2 ${valueColor}`}>{value}</p>
      )}
      {changeText && (
        <p className={`text-sm mt-1 ${changeColor}`}>{changeText}</p>
      )}
      {children}
    </div>
  )
}
