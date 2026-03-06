import { useState } from 'react'
import { CandlestickChart, Droplets, ShieldAlert, Sparkles } from 'lucide-react'
import OverviewTab from '../components/dashboard/OverviewTab'
import WalletTab from '../components/dashboard/WalletTab'

const USER_PROFILE = {
  name: 'Alex Tan',
  riskProfile: 'Moderate',
  location: 'Singapore',
}

const HERO_STATS = {
  netWorth: {
    value: 'S$85,700',
    delta: '+4.8% this month',
  },
  wellness: {
    score: 78,
    label: 'Moderate Health',
  },
  savings: {
    value: 'S$1,032',
    rate: 23,
  },
}

const PILLAR_SCORES = [
  {
    name: 'Liquidity',
    score: 42,
    colorClass: 'bg-red-500',
    textClass: 'text-red-500',
    icon: Droplets,
    description: 'Cash reserves are below target for short-term resilience.',
  },
  {
    name: 'Diversification',
    score: 68,
    colorClass: 'bg-amber-400',
    textClass: 'text-amber-500',
    icon: CandlestickChart,
    description: 'Allocation is balanced but still concentrated in key sectors.',
  },
  {
    name: 'Risk Match',
    score: 54,
    colorClass: 'bg-amber-400',
    textClass: 'text-amber-500',
    icon: ShieldAlert,
    description: 'Current volatility is slightly above your moderate profile.',
  },
  {
    name: 'Digital Assets',
    score: 60,
    colorClass: 'bg-amber-400',
    textClass: 'text-amber-500',
    icon: Sparkles,
    description: 'Exposure is meaningful and should be actively monitored.',
  },
]

const NET_WORTH_SERIES = [
  { month: 'Jan', value: 65000 },
  { month: 'Feb', value: 67200 },
  { month: 'Mar', value: 69800 },
  { month: 'Apr', value: 71500 },
  { month: 'May', value: 72900 },
  { month: 'Jun', value: 75100 },
  { month: 'Jul', value: 77300 },
  { month: 'Aug', value: 79000 },
  { month: 'Sep', value: 80200 },
  { month: 'Oct', value: 82100 },
  { month: 'Nov', value: 83900 },
  { month: 'Dec', value: 85700 },
]

const OVERVIEW_INSIGHTS = [
  {
    tone: 'red',
    text: 'Crypto is 32% of net worth — above moderate threshold',
  },
  {
    tone: 'amber',
    text: 'Cash buffer is 4.5 months — target is 6 months',
  },
  {
    tone: 'emerald',
    text: 'Net worth grew +4.8% this month — great progress',
  },
]

const WALLET_ALLOCATION = [
  { name: 'Cash', value: 15, color: '#3B82F6' },
  { name: 'Bonds', value: 14, color: '#10B981' },
  { name: 'Stocks', value: 32, color: '#6366F1' },
  { name: 'Crypto', value: 27, color: '#F59E0B' },
  { name: 'Property', value: 6, color: '#EF4444' },
  { name: 'Tokenised', value: 6, color: '#8B5CF6' },
]

const WALLET_ROWS = [
  {
    asset: 'DBS Savings',
    platform: 'DBS',
    value: 'S$8,500',
    portfolio: '10%',
    riskLabel: 'Core',
    regulated: '✅ MAS',
  },
  {
    asset: 'OCBC 360',
    platform: 'OCBC',
    value: 'S$4,200',
    portfolio: '5%',
    riskLabel: 'Core',
    regulated: '✅ MAS',
  },
  {
    asset: 'CPF (OA)',
    platform: 'CPF Board',
    value: 'S$12,000',
    portfolio: '14%',
    riskLabel: 'Stable',
    regulated: '✅ MAS',
  },
  {
    asset: 'StashAway',
    platform: 'StashAway',
    value: 'S$18,000',
    portfolio: '21%',
    riskLabel: 'Stable',
    regulated: '✅ MAS',
  },
  {
    asset: 'Tiger Brokers',
    platform: 'Tiger',
    value: 'S$9,500',
    portfolio: '11%',
    riskLabel: 'Growth',
    regulated: '✅ MAS',
  },
  {
    asset: 'Bitcoin (BTC)',
    platform: 'Coinbase',
    value: 'S$15,000',
    portfolio: '18%',
    riskLabel: 'Speculative',
    regulated: '⚠️ Unregulated',
  },
  {
    asset: 'Ethereum (ETH)',
    platform: 'MetaMask',
    value: 'S$8,000',
    portfolio: '9%',
    riskLabel: 'Speculative',
    regulated: '⚠️ Unregulated',
  },
  {
    asset: 'Schroders Token',
    platform: 'Schroders',
    value: 'S$5,000',
    portfolio: '6%',
    riskLabel: 'Stable',
    regulated: '✅ MAS',
  },
  {
    asset: 'HDB (partial)',
    platform: 'Manual',
    value: 'S$5,500',
    portfolio: '6%',
    riskLabel: 'Stable',
    regulated: '✅ MAS',
  },
]

const TABS = [
  { id: 'overview', label: '🏠 Overview' },
  { id: 'wallet', label: '💼 Wallet' },
]

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
      <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />

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
            overviewInsights={OVERVIEW_INSIGHTS}
            todayLabel={todayLabel}
          />
        ) : (
          <WalletTab walletAllocation={WALLET_ALLOCATION} walletRows={WALLET_ROWS} />
        )}
      </div>

      <footer className="mt-8 px-1 text-xs text-slate-500">
        <p>
          Profile: {USER_PROFILE.name} · {USER_PROFILE.riskProfile} · {USER_PROFILE.location}
        </p>
      </footer>
    </section>
  )
}