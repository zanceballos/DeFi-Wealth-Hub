import { NavLink, Outlet } from 'react-router-dom'

function App() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-10">
        <header className="mb-10 flex items-center justify-between">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700">
            DeFi Wealth Hub
          </span>
          <nav className="flex gap-2 text-sm font-semibold">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 transition ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-200'
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 transition ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-200'
                }`
              }
            >
              About
            </NavLink>
          </nav>
        </header>
        <Outlet />
      </div>
    </main>
  )
}

export function HomePage() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Home Page</h1>
      <p className="mt-4 max-w-xl text-slate-600">
        Your routing is set up. Start building your dashboard sections from this route.
      </p>
    </section>
  )
}

export function AboutPage() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">About Page</h1>
      <p className="mt-4 max-w-xl text-slate-600">
        This is a simple second route to confirm navigation is working.
      </p>
    </section>
  )
}

export function NotFoundPage() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">404</h1>
      <p className="mt-4 text-slate-600">Page not found.</p>
    </section>
  )
}

export default App
