import { useState, useRef, useEffect } from 'react'
import { normalizeCategory } from '../../services/dashboardViewModel'

const VALID_CATEGORIES = [
  "Food", "Transport", "Shopping", "Entertainment", "Utilities",
  "Healthcare", "Housing", "Groceries", "Dining", "Travel",
  "Education", "Investment", "Income", "Transfer", "Fees",
  "Insurance", "Savings", "Cash", "CPF", "Tax",
  "Dividend", "Interest", "Other", "Unknown",
]

const STYLES = {
  Transport:     'bg-green-100  text-green-800',
  Food:          'bg-red-100    text-red-700',
  Utilities:     'bg-lime-100   text-lime-800',
  Unknown:       'bg-gray-100   text-gray-500',
  Transfer:      'bg-purple-100 text-purple-700',
  Groceries:     'bg-pink-100   text-pink-700',
  Entertainment: 'bg-blue-100   text-blue-700',
  Healthcare:    'bg-cyan-100   text-cyan-700',
  Shopping:      'bg-orange-100 text-orange-700',
  Housing:       'bg-indigo-100 text-indigo-700',
  Dining:        'bg-rose-100   text-rose-700',
  Travel:        'bg-sky-100    text-sky-700',
  Education:     'bg-violet-100 text-violet-700',
  Investment:    'bg-blue-100   text-blue-700',
  Income:        'bg-emerald-100 text-emerald-700',
  Fees:          'bg-amber-100  text-amber-700',
  Insurance:     'bg-teal-100   text-teal-700',
  Savings:       'bg-emerald-100 text-emerald-700',
  Cash:          'bg-slate-100  text-slate-700',
  CPF:           'bg-yellow-100 text-yellow-700',
  Tax:           'bg-red-100    text-red-700',
  Dividend:      'bg-green-100  text-green-700',
  Interest:      'bg-cyan-100   text-cyan-700',
  Other:         'bg-gray-100   text-gray-600',
}

export default function CategoryBadge({ category: rawCategory, onCategoryChange }) {
  const category = normalizeCategory(rawCategory)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const style = STYLES[category] ?? 'bg-gray-100 text-gray-600'

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-opacity hover:opacity-80 ${style}`}
      >
        {category}
        <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[130px]">
          {VALID_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                onCategoryChange?.(cat)
                setOpen(false)
              }}
              className={`flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${
                cat === category ? 'font-semibold text-gray-900' : 'text-gray-600'
              }`}
            >
              <span
                className={`inline-block w-2 h-2 rounded-full ${STYLES[cat] ?? 'bg-gray-300'}`}
                style={{ backgroundColor: undefined }}
              />
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
