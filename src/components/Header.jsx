export default function Header() {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <span className="font-semibold text-gray-900 text-sm">Dashboard app</span>

      {/* Avatar + chevron */}
      <div className="flex items-center gap-1.5 cursor-pointer group">
        <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center text-xs font-bold text-gray-600">
          U
        </div>
        <svg
          className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}
