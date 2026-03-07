import { useState, useRef, useEffect } from 'react'
import { CATEGORIES } from '../../data/mockData'

const STYLES = {
  Transport:     'bg-green-100  text-green-800',
  Food:          'bg-red-100    text-red-700',
  Bills:         'bg-lime-100   text-lime-800',
  Unknown:       'bg-gray-100   text-gray-600',
  Paynow:        'bg-purple-100 text-purple-700',
  Groceries:     'bg-pink-100   text-pink-700',
  Entertainment: 'bg-blue-100   text-blue-700',
  Health:        'bg-cyan-100   text-cyan-700',
  Shopping:      'bg-orange-100 text-orange-700',
}

export default function CategoryBadge({ category, onCategoryChange }) {
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
          {CATEGORIES.map((cat) => (
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
