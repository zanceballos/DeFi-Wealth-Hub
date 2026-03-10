import { useState } from 'react'
import {Sparkles, Wallet, Activity, PiggyBank, Droplets, CandlestickChart, ShieldAlert, ChevronRight, Upload, FileText, TrendingUp, Shield, Pencil, Plus, Trash2, X} from 'lucide-react'
import InfoTooltip from '../../../components/ui/InfoTooltip.jsx'
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import MetricCard, {BreakdownRow, PillarRow} from '../../../components/ui/MetricCard.jsx'
import {EmptyState} from "./EmptyState.jsx";
import BankAccountCard from './BankAccountCard.jsx'
import CryptoHoldingCard from './CryptoHoldingCard.jsx'
import { useFirestore } from '../../../hooks/useFirestore.js'
import { useAuthContext } from '../../../hooks/useAuthContext.js'
import { recalculateNetWorth } from '../../../services/financialDataService.js'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../../lib/firebase.js'

const CARD_CLASS =
    'rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.04)] p-4 sm:p-5'


const fmtAxis = (v) => {
    if (v >= 1_000_000) return `S$${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `S$${(v / 1_000).toFixed(0)}k`
    return `S$${v}`
}

function CurrencyTooltip({active, payload, label}) {
    if (!active || !payload?.length) {
        return null
    }

    const point = payload[0]

    return (
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="text-sm font-semibold text-brand-primary">S${Number(point.value).toLocaleString()}</p>
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
    liveCryptoPrices = {},
    todayLabel,
    isEmpty = false,
    onUploadClick,
    onFinished,
    onRefresh,
}) {
    const { refreshProfile } = useAuthContext()
    const { update } = useFirestore('users')

    const [editingIncome, setEditingIncome] = useState(false)
    const [incomeInput,   setIncomeInput]   = useState('')
    const [savingIncome,  setSavingIncome]  = useState(false)

    // ── Manual accounts editor modal state ──
    const [manualOpen, setManualOpen] = useState(false)
    const [savingManual, setSavingManual] = useState(false)
    const [manAccounts, setManAccounts] = useState([])
    const [manInvestments, setManInvestments] = useState([])

    async function openManualEditor() {
        setManualOpen(true)
        // Always read fresh from Firestore
        try {
            const snap = await getDoc(doc(db, 'users', userProfile.uid))
            const m = snap.exists() ? (snap.data()?.manual_accounts ?? {}) : {}
            setManAccounts(
                Array.isArray(m.accounts) && m.accounts.length > 0
                    ? m.accounts.map(a => ({ name: a?.name ?? '', type: a?.type ?? '', balance: a?.balance != null ? String(a.balance) : '' }))
                    : [{ name: '', type: '', balance: '' }],
            )
            setManInvestments(
                Array.isArray(m.investments) && m.investments.length > 0
                    ? m.investments.map(it => ({
                        asset: it?.asset ?? '',
                        type: it?.type ?? 'stocks_etfs',
                        lots: Array.isArray(it?.lots) && it.lots.length > 0
                            ? it.lots.map(l => ({ date: l?.date ?? '', quantity: l?.quantity != null ? String(l.quantity) : '', averageCost: l?.averageCost != null ? String(l.averageCost) : '' }))
                            : [{ date: '', quantity: '', averageCost: '' }],
                    }))
                    : [{ asset: '', type: 'stocks_etfs', lots: [{ date: '', quantity: '', averageCost: '' }] }],
            )
        } catch (err) {
            console.error('Failed to load manual accounts:', err)
            // Fallback to local profile data
            const m = userProfile?.manual_accounts ?? {}
            setManAccounts(
                Array.isArray(m.accounts) && m.accounts.length > 0
                    ? m.accounts.map(a => ({ name: a?.name ?? '', type: a?.type ?? '', balance: a?.balance != null ? String(a.balance) : '' }))
                    : [{ name: '', type: '', balance: '' }],
            )
            setManInvestments(
                Array.isArray(m.investments) && m.investments.length > 0
                    ? m.investments.map(it => ({
                        asset: it?.asset ?? '',
                        type: it?.type ?? 'stocks_etfs',
                        lots: Array.isArray(it?.lots) && it.lots.length > 0
                            ? it.lots.map(l => ({ date: l?.date ?? '', quantity: l?.quantity != null ? String(l.quantity) : '', averageCost: l?.averageCost != null ? String(l.averageCost) : '' }))
                            : [{ date: '', quantity: '', averageCost: '' }],
                    }))
                    : [{ asset: '', type: 'stocks_etfs', lots: [{ date: '', quantity: '', averageCost: '' }] }],
            )
        }
    }

    async function handleSaveManual() {
        setSavingManual(true)
        try {
            const payload = {
                accounts: manAccounts
                    .filter(a => a.name.trim() && a.type.trim() && a.balance !== '')
                    .map(a => ({ name: a.name.trim(), type: a.type.trim(), balance: Number(a.balance) })),
                investments: manInvestments
                    .filter(it => it.asset?.trim())
                    .map(it => ({
                        asset: it.asset.trim(),
                        type: it.type || 'stocks_etfs',
                        lots: (it.lots || [])
                            .filter(l => l.quantity !== '' || l.averageCost !== '')
                            .map(l => ({
                                date: l.date || '',
                                quantity: l.quantity !== '' ? Number(l.quantity) : 0,
                                averageCost: l.averageCost !== '' ? Number(l.averageCost) : 0,
                            })),
                    })),
            }
            await update(userProfile.uid, { manual_accounts: payload })
            await recalculateNetWorth(userProfile.uid)
            if (onRefresh) onRefresh()
            setManualOpen(false)
        } catch (err) {
            console.error('Failed to save manual accounts:', err)
        } finally {
            setSavingManual(false)
        }
    }

    async function handleSaveIncome() {
        const val = parseFloat(incomeInput)
        if (isNaN(val) || val <= 0) { setEditingIncome(false); return }
        setSavingIncome(true)
        try {
            await update(userProfile.uid, { monthly_income: val })
            await refreshProfile()
            await recalculateNetWorth(userProfile.uid)
            if (onRefresh) onRefresh()
        } catch (err) {
            console.error('Failed to save income:', err)
        } finally {
            setSavingIncome(false)
            setEditingIncome(false)
            setIncomeInput('')
        }
    }

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
            : heroStats.wellness.score >= 50
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700'

    return (
        <div className="space-y-6">
            {/* ── Greeting header ── */}
            <header className="px-1">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
                    Welcome Back, {userProfile.name.split(' ')[0]} 👋
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    {todayLabel} · {userProfile.location} · {userProfile.riskProfile} risk profile
                </p>
            </header>

            {/* ── Hero metric cards ── */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <MetricCard
                    title="Net worth"
                    value={(() => {
                        if (netWorthBreakdown.length > 0) {
                            const total = netWorthBreakdown.reduce((sum, item) => {
                                const num = Number(String(item.value).replace(/[^0-9.-]/g, ''))
                                return sum + (Number.isFinite(num) ? num : 0)
                            }, 0)
                            return `S$${total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                        }
                        return heroStats.netWorth.value
                    })()}
                    caption={heroStats.netWorth.delta}
                    captionColor="text-emerald-500"
                    accentColor="bg-emerald-400"
                    icon={Wallet}
                    onClick={openManualEditor}
                >
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Asset Breakdown
                    </p>
                    {netWorthBreakdown.map((item) => (
                        <BreakdownRow key={item.label} {...item} />
                    ))}
                    {netWorthBreakdown.length > 0 && (
                        <div className="mt-3 flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                            </span>
                            <span className="text-[10px] font-semibold leading-none text-green-500">Live Update</span>
                        </div>
                    )}
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
                        {/* ── Editable income row ── */}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Monthly income</span>
                            {editingIncome ? (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-slate-400">SGD</span>
                                    <input
                                        type="number"
                                        min="0"
                                        autoFocus
                                        value={incomeInput}
                                        onChange={(e) => setIncomeInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveIncome()
                                            if (e.key === 'Escape') setEditingIncome(false)
                                        }}
                                        className="w-24 rounded-lg border border-sky-300 bg-sky-50 px-2 py-1 text-right text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-brand-primary"
                                    />
                                    <button
                                        onClick={handleSaveIncome}
                                        disabled={savingIncome}
                                        className="rounded-lg bg-brand-primary px-2 py-1 text-[10px] font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                                    >
                                        {savingIncome ? '…' : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => setEditingIncome(false)}
                                        className="text-[10px] text-slate-400 hover:text-slate-600"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => {
                                        setIncomeInput(userProfile.monthly_income?.toString() ?? '')
                                        setEditingIncome(true)
                                    }}
                                    className="group flex items-center gap-1 font-semibold text-slate-800 transition hover:text-brand-primary"
                                    title="Click to edit"
                                >
                                    {savingsDetail.income}
                                    <Pencil className="h-3 w-3 opacity-0 transition group-hover:opacity-60" />
                                </button>
                            )}
                        </div>
                        {/* ── Auto-derived expenses row ── */}
                        <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1 text-slate-500">
                                This month's spending
                                <InfoTooltip text="Auto-calculated from debit transactions in your uploaded statements for the current calendar month." />
                            </span>
                            <span className="font-semibold text-slate-800">{savingsDetail.expenses}</span>
                        </div>
                        {/* ── Net savings ── */}
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

            {/* ── Bank & Crypto Account Cards ── */}
            {(() => {
                const bankAccounts = userProfile?.manual_accounts?.accounts ?? []
                const investments = userProfile?.manual_accounts?.investments ?? []
                const cryptoHoldings = investments.filter(i => (i?.type || '').toLowerCase() === 'crypto')
                if (bankAccounts.length === 0 && cryptoHoldings.length === 0) return null
                return (
                    <div className="space-y-4">
                        <h2 className="px-1 text-base font-semibold text-slate-900">Your Accounts</h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {bankAccounts.map((acc, idx) => (
                                <BankAccountCard
                                    key={`bank-${idx}`}
                                    account={acc}
                                    index={idx}
                                    onUpdated={() => { if (onRefresh) onRefresh() }}
                                />
                            ))}
                            {cryptoHoldings.map((holding, idx) => {
                                const invIdx = investments.indexOf(holding)
                                const symbol = (holding.asset || '').toUpperCase()
                                const livePrice = liveCryptoPrices[symbol] ?? null
                                return (
                                    <CryptoHoldingCard
                                        key={`crypto-${invIdx}`}
                                        holding={holding}
                                        index={invIdx}
                                        livePrice={livePrice}
                                        onUpdated={() => { if (onRefresh) onRefresh() }}
                                    />
                                )
                            })}
                        </div>
                    </div>
                )
            })()}

            {/* ── Net Worth Trend chart ── */}
            <article className={`${CARD_CLASS}`}>
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-slate-900">Net Worth Trend</h2>
                    {netWorthSeries.length > 0 && (
                        <span className="text-sm text-slate-400">
                            {netWorthSeries[0]?.month} — {netWorthSeries[netWorthSeries.length - 1]?.month}
                        </span>
                    )}
                </div>
                <div className="h-72 w-full">
                    {netWorthSeries.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-sm text-slate-400">
                            No trend data yet — your chart will appear as net worth updates each month.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={netWorthSeries} margin={{top: 10, right: 12, left: 6, bottom: 0}}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    tick={{fontSize: 11, fill: '#94A3B8'}}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tickFormatter={fmtAxis}
                                    tick={{fontSize: 11, fill: '#94A3B8'}}
                                    axisLine={false}
                                    tickLine={false}
                                    width={54}
                                />
                                <Tooltip content={<CurrencyTooltip/>} cursor={{stroke: '#78D5D7', strokeWidth: 1.5}}/>
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#2081C3"
                                    strokeWidth={3}
                                    dot={netWorthSeries.length <= 3}
                                    activeDot={{r: 5, fill: '#2081C3', stroke: '#fff', strokeWidth: 2}}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </article>

            {/* ── Manual Accounts Edit Modal ── */}
            {manualOpen && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget && !savingManual) setManualOpen(false) }}
                    onKeyDown={(e) => { if (e.key === 'Escape' && !savingManual) setManualOpen(false) }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Edit accounts & investments"
                        tabIndex={-1}
                        className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl outline-none"
                    >
                        <button
                            type="button"
                            onClick={() => setManualOpen(false)}
                            disabled={savingManual}
                            className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-600 disabled:opacity-40"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <h2 className="mb-5 text-lg font-bold text-slate-900">Edit Accounts & Investments</h2>

                        {/* ── Bank Accounts Section ── */}
                        <section className="mb-6">
                            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Bank Accounts</h3>
                            {manAccounts.map((acc, idx) => (
                                <div key={idx} className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-slate-400">Account {idx + 1}</span>
                                        <button type="button" onClick={() => setManAccounts(p => p.filter((_, i) => i !== idx))} className="text-slate-400 transition hover:text-red-500">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Bank name"
                                        value={acc.name}
                                        onChange={(e) => setManAccounts(p => p.map((a, i) => i === idx ? { ...a, name: e.target.value } : a))}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Account type"
                                            value={acc.type}
                                            onChange={(e) => setManAccounts(p => p.map((a, i) => i === idx ? { ...a, type: e.target.value } : a))}
                                            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Balance"
                                            value={acc.balance}
                                            onChange={(e) => setManAccounts(p => p.map((a, i) => i === idx ? { ...a, balance: e.target.value } : a))}
                                            className="w-32 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                                        />
                                    </div>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => setManAccounts(p => [...p, { name: '', type: '', balance: '' }])}
                                className="flex items-center gap-1 text-xs font-medium text-brand-primary transition hover:opacity-80"
                            >
                                <Plus className="h-3.5 w-3.5" /> Add account
                            </button>
                        </section>

                        {/* ── Investments Section ── */}
                        <section className="mb-6">
                            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Investments</h3>
                            {manInvestments.map((inv, idx) => (
                                <div key={idx} className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-slate-400">Asset {idx + 1}</span>
                                        <button type="button" onClick={() => setManInvestments(p => p.filter((_, i) => i !== idx))} className="text-slate-400 transition hover:text-red-500">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Symbol (e.g. BTC)"
                                            value={inv.asset}
                                            onChange={(e) => setManInvestments(p => p.map((it, i) => i === idx ? { ...it, asset: e.target.value } : it))}
                                            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                                        />
                                        <select
                                            value={inv.type}
                                            onChange={(e) => setManInvestments(p => p.map((it, i) => i === idx ? { ...it, type: e.target.value } : it))}
                                            className="w-36 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-primary"
                                        >
                                            <option value="stocks_etfs">Stocks / ETFs</option>
                                            <option value="crypto">Crypto</option>
                                        </select>
                                    </div>
                                    {/* Lots */}
                                    {inv.lots.map((lot, lIdx) => (
                                        <div key={lIdx} className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                placeholder="Qty"
                                                value={lot.quantity}
                                                onChange={(e) => setManInvestments(p => p.map((it, i) => {
                                                    if (i !== idx) return it
                                                    const lots = it.lots.map((l, j) => j === lIdx ? { ...l, quantity: e.target.value } : l)
                                                    return { ...it, lots }
                                                }))}
                                                className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-brand-primary"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Avg cost (USD)"
                                                value={lot.averageCost}
                                                onChange={(e) => setManInvestments(p => p.map((it, i) => {
                                                    if (i !== idx) return it
                                                    const lots = it.lots.map((l, j) => j === lIdx ? { ...l, averageCost: e.target.value } : l)
                                                    return { ...it, lots }
                                                }))}
                                                className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-brand-primary"
                                            />
                                            <input
                                                type="date"
                                                value={lot.date}
                                                onChange={(e) => setManInvestments(p => p.map((it, i) => {
                                                    if (i !== idx) return it
                                                    const lots = it.lots.map((l, j) => j === lIdx ? { ...l, date: e.target.value } : l)
                                                    return { ...it, lots }
                                                }))}
                                                className="w-32 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-brand-primary"
                                            />
                                            {inv.lots.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setManInvestments(p => p.map((it, i) => {
                                                        if (i !== idx) return it
                                                        const lots = it.lots.filter((_, j) => j !== lIdx)
                                                        return { ...it, lots: lots.length ? lots : [{ date: '', quantity: '', averageCost: '' }] }
                                                    }))}
                                                    className="text-slate-400 hover:text-red-500"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setManInvestments(p => p.map((it, i) =>
                                            i === idx ? { ...it, lots: [...it.lots, { date: '', quantity: '', averageCost: '' }] } : it
                                        ))}
                                        className="text-[11px] font-medium text-brand-primary hover:opacity-80"
                                    >
                                        + Add lot
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => setManInvestments(p => [...p, { asset: '', type: 'stocks_etfs', lots: [{ date: '', quantity: '', averageCost: '' }] }])}
                                className="flex items-center gap-1 text-xs font-medium text-brand-primary transition hover:opacity-80"
                            >
                                <Plus className="h-3.5 w-3.5" /> Add investment
                            </button>
                        </section>

                        {/* ── Actions ── */}
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setManualOpen(false)}
                                disabled={savingManual}
                                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveManual}
                                disabled={savingManual}
                                className="flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                            >
                                {savingManual && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                                {savingManual ? 'Saving…' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default OverviewTab
