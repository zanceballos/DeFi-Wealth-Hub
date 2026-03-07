import {useMemo, useState} from 'react'
import OverviewTab from '../features/dashboard/components/OverviewTab.jsx'
import BudgetingTab from '../features/dashboard/components/BudgetingTab.jsx'
import WalletTab from '../features/dashboard/components/WalletTab.jsx'
import Overlay from '../features/dashboard/components/Overlay.jsx'
import {USER_PROFILE} from "../data/mockUserData.js";
import {NET_WORTH_SERIES} from "../data/mockNetworth.js";
import {WALLET_DATA, WALLET_ALLOCATION} from "../data/mockWalletData.js";
import {HERO_STATS} from "../data/mockHero.js";
import {PILLAR_SCORES} from "../data/mockPillar.js";
import {TABS} from "../features/dashboard/tabs.js";

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState('overview')

    const todayLabel = new Intl.DateTimeFormat('en-SG', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date())

    return (
        <section className="relative isolate min-h-full w-full overflow-hidden p-4 sm:p-6 lg:p-8">
            <div
                className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl"/>
            <div
                className="pointer-events-none absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl"/>

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
                {activeTab === 'overview' ? (
                    <OverviewTab
                        userProfile={USER_PROFILE}
                        heroStats={HERO_STATS}
                        pillarScores={PILLAR_SCORES}
                        netWorthSeries={NET_WORTH_SERIES}
                        todayLabel={todayLabel}
                    />
                ) : activeTab === 'budgeting' ? <BudgetingTab/> :
                (
                    <WalletTab walletAllocation={WALLET_ALLOCATION} walletRows={WALLET_DATA}/>
                )}
            </div>

            <footer className="mt-8 px-1 text-xs text-slate-500">
                <p>
                    Profile: {USER_PROFILE.name} · {USER_PROFILE.riskProfile} · {USER_PROFILE.location}
                </p>
            </footer>

            <Overlay />
        </section>
    )
}
