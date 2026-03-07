import { Outlet } from 'react-router-dom'
import Header from './Header'
import NavbarOld from './Navbar-old.jsx'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <NavbarOld />
      <main className="max-w-6xl mx-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  )
}
