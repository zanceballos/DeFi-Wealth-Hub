import {Sparkles} from 'lucide-react'
import {
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
} from 'recharts'
import {useState} from "react";

const SPENT = 1927.90
const CARD_CLASS = 'bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl shadow-xl p-5'

function CurrencyTooltip({active, payload, label}) {
    if (!active || !payload?.length) {
        return null
    }

    const point = payload[0]

    return (
        <div className="rounded-xl border border-white/70 bg-white/90 px-3 py-2 shadow-lg">
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

function OverviewTab({
                         userProfile,
                         heroStats,
                         pillarScores,
                         netWorthSeries,
                         todayLabel,
                     }) {
    const [budgetInput, setBudgetInput] = useState('')
    const [budget, setBudget] = useState(3927.90)

    return (
        <div className="space-y-6">
            <header className="px-1">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Good
                    morning, {userProfile.name.split(' ')[0]} 👋</h1>
                <p className="mt-1 text-sm text-slate-600">
                    {todayLabel} · {userProfile.location} · {userProfile.riskProfile} risk profile
                </p>
            </header>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <article className={`${CARD_CLASS} p-5`}>
                    <p className="text-sm font-medium text-slate-500">Total Net Worth</p>
                    <p className="mt-3 text-3xl font-bold text-slate-900">{heroStats.netWorth.value}</p>
                    <p className="mt-2 text-sm font-semibold text-emerald-500">{heroStats.netWorth.delta}</p>
                </article>

                <article className={`${CARD_CLASS} p-5`}>
                    <p className="text-sm font-medium text-slate-500">Wellness Score</p>
                    <div className="mt-3 flex items-center justify-between">
                        <div>
                            <p className="text-3xl font-bold text-slate-900">{heroStats.wellness.score}/100</p>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-amber-400"/>
                                <span className="text-sm font-medium text-slate-700">{heroStats.wellness.label}</span>
                            </div>
                        </div>
                        <WellnessRing score={heroStats.wellness.score}/>
                    </div>
                </article>

                <article className={`${CARD_CLASS} p-5`}>
                    <p className="text-sm font-medium text-slate-500">Monthly Savings</p>
                    <p className="mt-3 text-3xl font-bold text-slate-900">{heroStats.savings.value}</p>
                    <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                            className="h-full rounded-full bg-brand-accent"
                            style={{width: `${heroStats.savings.rate}%`}}
                        />
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{heroStats.savings.rate}% savings rate</p>
                </article>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {pillarScores.map((pillar) => {
                    const Icon = pillar.icon || Sparkles

                    return (
                        <article key={pillar.name} className={`${CARD_CLASS} p-5`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                  <span className="rounded-xl bg-white/80 p-2 text-brand-primary">
                    <Icon className="h-4 w-4"/>
                  </span>
                                    <h3 className="text-sm font-semibold text-slate-800">{pillar.name}</h3>
                                </div>
                                <span className={`text-sm font-bold ${pillar.textClass}`}>{pillar.score}/100</span>
                            </div>
                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                                <div className={`h-full rounded-full ${pillar.colorClass}`}
                                     style={{width: `${pillar.score}%`}}/>
                            </div>
                            <p className="mt-3 text-sm text-slate-600">{pillar.description}</p>
                        </article>
                    )
                })}
            </div>

            <article className={`${CARD_CLASS} p-5`}>
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-slate-900">Net Worth Trend</h2>
                    <span className="text-sm text-slate-500">Jan - Dec</span>
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
