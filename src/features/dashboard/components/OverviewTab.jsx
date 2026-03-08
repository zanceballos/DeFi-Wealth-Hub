import {Sparkles, Wallet, Activity, PiggyBank, Droplets, CandlestickChart, ShieldAlert, ChevronRight, Upload, FileText, TrendingUp, Shield} from 'lucide-react'
import InfoTooltip from '../../../components/ui/InfoTooltip.jsx'
import {
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
} from 'recharts'
import MetricCard, {BreakdownRow, PillarRow} from '../../../components/ui/MetricCard.jsx'


const SPENT = 1927.90
const CARD_CLASS =
    'rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.04)] p-5'


function CurrencyTooltip({active, payload, label}) {
    if (!active || !payload?.length) {
        return null
    }

    const point = payload[0]

    return (
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="text-sm font-semibold text-brand-primary">S${point.value.toLocaleString()}</p>
        </div>
    )
}


function WellnessRing({score}) {
    const radius = 44
    const circumference = 2 * Math.PI * radius
    const progress = (score / 100) * circumference

    return (
        <svg className="h-28 w-28" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={radius} stroke="#E5E7EB" strokeWidth="6" fill="none"/>
            <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="#2081C3"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${progress} ${circumference}`}
                transform="rotate(-90 60 60)"
            />
        </svg>
    )
}


const ONBOARDING_STEPS = [
    {
        icon: Upload,
        title: 'Upload a statement',
        description: 'Import a bank, brokerage, or crypto statement to get started.',
        color: 'bg-brand-primary/10 text-brand-primary',
    },
    {
        icon: FileText,
        title: 'Review parsed data',
        description: 'We\'ll extract transactions automatically — approve, edit, or reject each row.',
        color: 'bg-emerald-50 text-emerald-600',
    },
    {
        icon: TrendingUp,
        title: 'See your dashboard',
        description: 'Your net worth, wellness score, and savings rate will populate instantly.',
        color: 'bg-amber-50 text-amber-600',
    },
    {
        icon: Shield,
        title: 'Track over time',
        description: 'Upload more statements each month to build your financial trend history.',
        color: 'bg-violet-50 text-violet-600',
    },
]


function EmptyState({ userName, todayLabel, onUploadClick }) {
    return (
        <div className="space-y-8">
            <header className="px-1">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Welcome, {userName} 👋
                </h1>
                <p className="mt-1 text-sm text-slate-500">{todayLabel}</p>
            </header>

            <div className="relative rounded-2xl border border-dashed border-slate-300 bg-linear-to-br from-white to-slate-50 p-8 text-center shadow-sm sm:p-12">
                <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-brand-primary/5 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-brand-accent/5 blur-2xl" />

                <div className="relative mx-auto max-w-md">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary/10">
                        <Wallet className="h-8 w-8 text-brand-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                        Your dashboard is ready
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                        Upload your first financial statement to unlock your personalised net worth,
                        wellness score, and savings insights.
                    </p>
                    <button
                        type="button"
                        onClick={onUploadClick}
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60 focus-visible:ring-offset-2"
                    >
                        <Upload className="h-4 w-4" />
                        Upload your first statement
                    </button>
                </div>
            </div>

            <div>
                <h3 className="mb-4 px-1 text-sm font-semibold uppercase tracking-wide text-slate-400">
                    How it works
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {ONBOARDING_STEPS.map((step, i) => {
                        const Icon = step.icon
                        return (
                            <article
                                key={step.title}
                                className="group relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <span className="absolute top-3 right-4 text-xs font-bold text-slate-200">
                                    {i + 1}
                                </span>
                                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${step.color}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <h4 className="text-sm font-semibold text-slate-800">{step.title}</h4>
                                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                                    {step.description}
                                </p>
                            </article>
                        )
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {[
                    { title: 'Net worth', icon: Wallet, accent: 'bg-emerald-400' },
                    { title: 'Wellness score', icon: Activity, accent: 'bg-brand-primary' },
                    { title: 'Monthly savings', icon: PiggyBank, accent: 'bg-brand-accent' },
                ].map((card) => {
                    const Icon = card.icon
                    return (
                        <div
                            key={card.title}
                            className="relative rounded-2xl border border-slate-200/60 bg-slate-50/60 p-5"
                        >
                            <span className={`absolute inset-y-0 left-0 w-1 rounded-l-2xl ${card.accent} opacity-30`} />
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-300">
                                    <Icon className="h-4 w-4" />
                                </div>
                                <span className="text-sm font-semibold text-slate-400">{card.title}</span>
                            </div>
                            <div className="mt-4 space-y-2">
                                <div className="h-6 w-28 animate-pulse rounded-lg bg-slate-200/60" />
                                <div className="h-3 w-20 animate-pulse rounded bg-slate-200/40" />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}


function OverviewTab({
    userProfile,
    heroStats,
    pillarScores,
    netWorthSeries,
    savingsDetail,
    netWorthBreakdown,
    todayLabel,
    isEmpty = false,
    onUploadClick,
}) {

    if (isEmpty) {
        return (
            <EmptyState
                userName={userProfile.name?.split(' ')[0] ?? 'there'}
                todayLabel={todayLabel}
                onUploadClick={onUploadClick}
            />
        )
    }

    const wellnessStatusColor =
        heroStats.wellness.score >= 70
            ? 'bg-emerald-100 text-emerald-700'
            : heroStats.wellness.score >= 40
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700'

    return (
        <div className="space-y-6">
            {/* ── Greeting header ── */}
            <header className="px-1">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Good morning, {userProfile.name.split(' ')[0]} 👋
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    {todayLabel} · {userProfile.location} · {userProfile.riskProfile} risk profile
                </p>
            </header>

            {/* ── Hero metric cards ── */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <MetricCard
                    title="Net worth"
                    value={heroStats.netWorth.value}
                    caption={heroStats.netWorth.delta}
                    captionColor="text-emerald-500"
                    accentColor="bg-emerald-400"
                    icon={Wallet}
                >
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Asset Breakdown
                    </p>
                    {netWorthBreakdown.map((item) => (
                        <BreakdownRow key={item.label} {...item} />
                    ))}
                    <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-500">How it's calculated:</span>{' '}
                        Total Assets (cash + investments + crypto + property) minus Total Liabilities (loans + credit), across all linked and uploaded statements.
                    </p>
                </MetricCard>

                <MetricCard
                    title="Wellness score"
                    value={`${heroStats.wellness.score}/100`}
                    caption={heroStats.wellness.label}
                    captionColor="text-slate-600"
                    accentColor="bg-brand-primary"
                    icon={Activity}
                >
                    <div className="mb-3 flex items-center gap-2">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${wellnessStatusColor}`}>
                            {heroStats.wellness.label}
                        </span>
                    </div>
                    {pillarScores.map((p) => (
                        <PillarRow
                            key={p.name}
                            icon={p.icon}
                            name={p.name}
                            score={p.score}
                            description={p.description}
                            colorClass={p.colorClass}
                        />
                    ))}
                    <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-500">How it's calculated:</span>{' '}
                        Weighted average of 4 pillars — Liquidity (25%), Diversification (25%), Risk Alignment (25%), and Digital Exposure (25%). Each pillar is scored 0–100.
                    </p>
                </MetricCard>

                <MetricCard
                    title="Monthly savings"
                    value={heroStats.savings.value}
                    caption={`${heroStats.savings.rate}% savings rate`}
                    captionColor="text-brand-primary"
                    accentColor="bg-brand-accent"
                    icon={PiggyBank}
                >
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Breakdown
                    </p>
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Monthly income</span>
                            <span className="font-semibold text-slate-800">{savingsDetail.income}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Monthly expenses</span>
                            <span className="font-semibold text-slate-800">{savingsDetail.expenses}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Net savings</span>
                            <span className="font-bold text-emerald-600">{savingsDetail.net}</span>
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                            <span>Savings rate</span>
                            <span className="font-semibold text-slate-600">{heroStats.savings.rate}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-brand-accent transition-all duration-500"
                                style={{width: `${heroStats.savings.rate}%`}}
                            />
                        </div>
                        <p className="mt-2 text-[11px] text-slate-400">
                            Target savings rate: {savingsDetail.target}%
                        </p>
                    </div>
                </MetricCard>
            </div>

            {/* ── Pillar score cards ── */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {pillarScores.map((pillar) => {
                    const Icon = pillar.icon || Sparkles

                    return (
                        <article
                            key={pillar.name}
                            // ✅ FIXED: removed overflow-hidden, added relative + isolate
                            // overflow-hidden was clipping the InfoTooltip popup
                            className={
                                'group relative isolate rounded-2xl border border-slate-200/80 bg-white p-5 ' +
                                'shadow-[0_2px_12px_rgba(15,23,42,0.04)] ' +
                                'transition-all duration-300 ease-out ' +
                                'hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:border-sky-200/60'
                            }
                        >
                            {/* Left accent bar — use pseudo via before or a positioned div instead */}
                            <span className={`absolute inset-y-0 left-0 w-1 rounded-l-2xl ${pillar.colorClass}`} />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors group-hover:bg-sky-50 group-hover:text-brand-primary">
                                        <Icon className="h-4 w-4"/>
                                    </span>
                                    {/* ✅ FIXED: tooltip wrapper uses relative + z-50 so it escapes card stacking context */}
                                    <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                                        {pillar.name}
                                        {pillar.calculationTooltip && (
                                            <span className="relative z-50">
                                                <InfoTooltip text={pillar.calculationTooltip} />
                                            </span>
                                        )}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-bold ${pillar.textClass}`}>
                                        {pillar.score}/100
                                    </span>
                                    <ChevronRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-brand-primary" />
                                </div>
                            </div>

                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${pillar.colorClass}`}
                                    style={{width: `${pillar.score}%`}}
                                />
                            </div>
                            <p className="mt-3 text-sm leading-relaxed text-slate-500">{pillar.description}</p>
                        </article>
                    )
                })}
            </div>

            {/* ── Net Worth Trend chart ── */}
            <article className={`${CARD_CLASS}`}>
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-slate-900">Net Worth Trend</h2>
                    <span className="text-sm text-slate-400">Jan — Dec</span>
                </div>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={netWorthSeries} margin={{top: 10, right: 12, left: 6, bottom: 0}}>
                            <Tooltip content={<CurrencyTooltip/>} cursor={{stroke: '#78D5D7', strokeWidth: 1.5}}/>
                            <Line type="monotone" dataKey="value" stroke="#2081C3" strokeWidth={3} dot={false}/>
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </article>
        </div>
    )
}

export default OverviewTab
