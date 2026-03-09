import {Sparkles, Wallet, Activity, PiggyBank, Droplets, CandlestickChart, ShieldAlert, ChevronRight, Upload, FileText, TrendingUp, Shield} from 'lucide-react'
import InfoTooltip from '../../../components/ui/InfoTooltip.jsx'
import {
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
} from 'recharts'
import MetricCard, {BreakdownRow, PillarRow} from '../../../components/ui/MetricCard.jsx'
import {EmptyState} from "./EmptyState.jsx";

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
    onFinished,
}) {
    if (isEmpty) {
        return (
            <EmptyState
                userName={userProfile.name?.split(' ')[0] ?? 'there'}
                todayLabel={todayLabel}
                onUploadClick={onUploadClick}
                onFinished={onFinished}
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
