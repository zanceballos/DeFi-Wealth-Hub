import {useState, useCallback} from 'react'
import OverviewTab from '../features/dashboard/components/OverviewTab.jsx'
import BudgetingTab from '../features/dashboard/components/BudgetingTab.jsx'
import WalletTab from '../features/dashboard/components/WalletTab.jsx'
import Overlay from '../features/dashboard/components/Overlay.jsx'
import {TABS} from "../features/dashboard/tabs.js";
import useDashboardData from "../hooks/useDashboardData.js";

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState('overview')
    const [overlayOpen, setOverlayOpen] = useState(false)
    const {
        loading,
        isEmpty,
        userProfile,
        heroStats,
        pillarScores,
        netWorthSeries,
        savingsDetail,
        netWorthBreakdown,
        walletViewModel,
        budgetViewModel,
        refresh,
    } = useDashboardData()

    const openOverlay = useCallback(() => setOverlayOpen(true), [])
    const closeOverlay = useCallback(() => setOverlayOpen(false), [])

    const todayLabel = new Intl.DateTimeFormat('en-SG', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date())

    return (
        <section className="relative isolate min-h-full w-full p-4 sm:p-6 lg:p-8">
            <div
                className="pointer-events-none fixed -top-20 -right-20 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl"/>
            <div
                className="pointer-events-none fixed bottom-0 left-0 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl"/>

            <div className="sticky top-0 z-20 mb-6 rounded-2xl border border-white/70 bg-white/70 p-2 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-2.5 text-sm font-semibold transition ${
                                activeTab === tab.id
                                    ? 'rounded-xl bg-brand-primary text-white'
                                    : 'rounded-xl text-gray-500 hover:text-brand-primary hover:bg-gray-100'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative z-10">
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
                        <span className="ml-3 text-sm text-slate-500">Loading dashboard…</span>
                    </div>
                ) : activeTab === 'overview' ? (
                    <OverviewTab
                        userProfile={userProfile}
                        heroStats={heroStats}
                        pillarScores={pillarScores}
                        netWorthSeries={netWorthSeries}
                        savingsDetail={savingsDetail}
                        netWorthBreakdown={netWorthBreakdown}
                        todayLabel={todayLabel}
                        isEmpty={isEmpty}
                        onUploadClick={openOverlay}
                    />
                ) : activeTab === 'budgeting' ? (
                    <BudgetingTab viewModel={budgetViewModel} onUploadClick={openOverlay} />
                ) : (
                    <WalletTab
                        walletAllocation={walletViewModel.allocation}
                        walletRows={walletViewModel.rows}
                        totalNetWorth={walletViewModel.totalNetWorth}
                        emptyState={walletViewModel.emptyState}
                        onUploadClick={openOverlay}
                    />
                )}
            </div>

            <footer className="mt-8 px-1 text-xs text-slate-500">
                <p>
                    Profile: {userProfile.name} · {userProfile.riskProfile} · {userProfile.location}
                </p>
            </footer>

            <Overlay onSaveSuccess={refresh} externalOpen={overlayOpen} onExternalClose={closeOverlay} />
        </section>
    )
}
