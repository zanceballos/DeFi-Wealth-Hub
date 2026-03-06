import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'

function Navbar() {
  const { user, profile, logout } = useAuthContext()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const menuRef = useRef(null)

  // Derive initials from profile name or user email
  const initials = (() => {
    if (profile?.name) {
      const parts = profile.name.trim().split(/\s+/)
      return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
    }
    if (user?.displayName) {
      const parts = user.displayName.trim().split(/\s+/)
      return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
    }
    if (user?.email) return user.email[0]
    return '?'
  })().toUpperCase()

  async function handleLogout() {
    setIsMenuOpen(false)
    await logout()
    navigate('/login')
  }

  function closeMobileNav() {
    setIsMobileNavOpen(false)
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
        setIsMobileNavOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  useEffect(() => {
    if (!isMobileNavOpen) {
      document.body.style.overflow = ''
      return
    }

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileNavOpen])

  return (
    <header className="relative z-50 mb-8 sm:mb-10">
      <div className="flex items-center justify-between gap-3 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <span className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 sm:justify-self-start sm:text-sm">
          DeFi Wealth Hub
        </span>

        <nav className="hidden gap-2 text-sm font-semibold sm:flex sm:justify-self-center">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `rounded-md px-3 py-1.5 transition ${
                isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-200'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/advisory"
            className={({ isActive }) =>
              `rounded-md px-3 py-1.5 transition ${
                isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-200'
              }`
            }
          >
            Advisory
          </NavLink>
          <NavLink
            to="/privacy"
            className={({ isActive }) =>
              `rounded-md px-3 py-1.5 transition ${
                isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-200'
              }`
            }
          >
            Privacy
          </NavLink>
        </nav>

        <div className="flex items-center gap-2 sm:justify-self-end">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen((open) => !open)}
            aria-label="Toggle navigation"
            aria-expanded={isMobileNavOpen}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-lg font-semibold text-slate-700 transition hover:bg-slate-100 sm:hidden"
          >
            {isMobileNavOpen ? '✕' : '☰'}
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-700 transition hover:bg-slate-100 sm:h-10 sm:w-10 sm:text-sm"
            >
              {initials}
            </button>

            {isMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-11 z-50 w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:top-12 sm:w-44"
              >
                <button
                  type="button"
                  role="menuitem"
                  className="w-full rounded-lg px-3 py-2 text-left text-slate-700 transition hover:bg-slate-100"
                >
                  Settings
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="w-full rounded-lg px-3 py-2 text-left text-slate-700 transition hover:bg-slate-100"
                >
                  Help Center
                </button>
                <div className="my-1 h-px bg-slate-200" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="w-full rounded-lg px-3 py-2 text-left text-red-600 transition hover:bg-red-50"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-50 sm:hidden transition-opacity duration-300 ${
          isMobileNavOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!isMobileNavOpen}
      >
        <button
          type="button"
          aria-label="Close mobile navigation"
          onClick={closeMobileNav}
          className="absolute inset-0 bg-slate-900/40"
        />

        <div
          role="dialog"
          aria-modal="true"
          className={`absolute inset-x-4 top-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg transition-transform duration-300 ${
            isMobileNavOpen ? 'translate-y-0' : '-translate-y-4'
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
              DeFi Wealth Hub
            </span>
            <button
              type="button"
              onClick={closeMobileNav}
              aria-label="Close navigation menu"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-lg font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              ✕
            </button>
          </div>

          <nav className="flex flex-col gap-2 text-base font-semibold">
            <NavLink
              to="/"
              onClick={closeMobileNav}
              className={({ isActive }) =>
                `rounded-lg px-4 py-3 transition ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/advisory"
              onClick={closeMobileNav}
              className={({ isActive }) =>
                `rounded-lg px-4 py-3 transition ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              Advisory
            </NavLink>
            <NavLink
              to="/privacy"
              onClick={closeMobileNav}
              className={({ isActive }) =>
                `rounded-lg px-4 py-3 transition ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              Privacy
            </NavLink>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Navbar