import {Outlet} from 'react-router-dom'
import NavbarOld from './components/Navbar-old.jsx'
import Navbar from "./components/Navbar.jsx";


function App() {
    return (
        <main className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 text-slate-900">
            {/*<NavbarOld/>*/}
            <Navbar />
            <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-none flex-col px-3 sm:px-6 lg:px-24">
                <div className="mt-4">
                    <Outlet />
                </div>
            </div>
        </main>
    )
}

export function HomePage() {
    return (
        <section className="flex flex-1 flex-col items-center justify-center px-2 text-center sm:px-0">
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">DeFi Wealth Hub Dashboard</h1>
            <p className="mt-4 max-w-xl text-sm text-slate-600 sm:text-base">
                Welcome to DeFi Wealth Hub. Track balances, performance snapshots, and portfolio trends in one place.
            </p>
        </section>
    )
}

// AdvisoryPage moved to src/pages/AdvisoryPage.jsx

export function PrivacyPage() {
    return (
        <section className="flex flex-1 flex-col items-center justify-center px-2 text-center sm:px-0">
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Privacy</h1>
            <p className="mt-4 max-w-xl text-sm text-slate-600 sm:text-base">
                Review how your account data, wallet information, and activity history are protected.
            </p>
        </section>
    )
}

export function NotFoundPage() {
    return (
        <section className="flex flex-1 flex-col items-center justify-center px-2 text-center sm:px-0">
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">404</h1>
            <p className="mt-4 text-sm text-slate-600 sm:text-base">Page not found.</p>
        </section>
    )
}

export default App
