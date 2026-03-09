import {useState, useCallback, useEffect} from 'react'
import { Lock } from 'lucide-react'
import OverviewTab from '../features/dashboard/components/OverviewTab.jsx'
import BudgetingTab from '../features/dashboard/components/BudgetingTab.jsx'
import WalletTab from '../features/dashboard/components/WalletTab.jsx'
import Overlay from '../features/dashboard/components/Overlay.jsx'
import {TABS} from "../features/dashboard/tabs.js";
import useDashboardData from "../hooks/useDashboardData.js";

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState('overview')
    const [overlayOpen, setOverlayOpen] = useState(false)
    // Local override to immediately flip empty state after onboarding finish
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
        transactionsViewModel,
        excludedFingerprints,
        updateExcludedFingerprints,
        refresh,
    } = useDashboardData()

    // Gate: tabs that require accounts are locked while the dashboard is empty
    const hasAccounts = !isEmpty && !loading

    // Redirect to overview if user lands on a locked tab
    useEffect(() => {
        const current = TABS.find((t) => t.id === activeTab)
        if (current?.requiresAccounts && !hasAccounts) {
            setActiveTab('overview')
        }
    }, [hasAccounts, activeTab])

    const openOverlay = useCallback(() => setOverlayOpen(true), [])
    const closeOverlay = useCallback(() => setOverlayOpen(false), [])

    const handleOnboardingFinished = useCallback(() => {
        // Immediately allow rendering of the full Overview tab
        // Refresh from Firestore to persist the change in derived state
        try { refresh() } catch {}
    }, [refresh])

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
                <div className="flex overflow-x-auto gap-1 pb-1 scrollbar-none">
                    {TABS.map((tab) => {
                        const locked = tab.requiresAccounts && !hasAccounts
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                disabled={locked}
                                title={locked ? 'Complete onboarding to unlock' : undefined}
                                onClick={() => !locked && setActiveTab(tab.id)}
                                className={`px-5 py-2.5 text-sm font-semibold transition whitespace-nowrap min-h-[44px] ${
                                    locked
                                        ? 'rounded-xl text-gray-400 opacity-40 cursor-not-allowed'
                                        : activeTab === tab.id
                                            ? 'rounded-xl bg-brand-primary text-white'
                                            : 'rounded-xl text-gray-500 hover:text-brand-primary hover:bg-gray-100'
                                }`}
                            >
                                {locked && <Lock className="mr-1 inline h-3 w-3" />}
                                {tab.label}
                            </button>
                        )
                    })}
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
                        onFinished={handleOnboardingFinished}
                        onRefresh={refresh}
                    />
                ) : activeTab === 'budgeting' ? (
                    <BudgetingTab
                        viewModel={budgetViewModel}
                        transactionsViewModel={transactionsViewModel}
                        excludedFingerprints={excludedFingerprints}
                        updateExcludedFingerprints={updateExcludedFingerprints}
                        onUploadClick={openOverlay}
                    />
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
