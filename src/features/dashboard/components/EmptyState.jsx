import {useState} from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../../lib/firebase'
import { useAuth } from '../../../hooks/useAuth'
import { recalculateNetWorth } from '../../../services/financialDataService.js'
import {
    Activity,
    FileText,
    PiggyBank,
    Shield,
    TrendingUp,
    Upload,
    Wallet,
    Plus,
    Trash2,
    ArrowLeft,
    ArrowRight
} from 'lucide-react'

const ONBOARDING_STEPS = [
    {
        icon: FileText,
        title: 'Input current bank and investment details',
        description: 'Enter your bank accounts and add each investment with purchase lots.',
        color: 'bg-brand-primary/10 text-brand-primary',
    },
    {
        icon: TrendingUp,
        title: 'View dashboard',
        description: 'See your net worth, allocations, and insights in one place.',
        color: 'bg-amber-50 text-amber-600',
    },
    {
        icon: Shield,
        title: 'Track over time',
        description: 'Update your details regularly to build your financial trend history.',
        color: 'bg-violet-50 text-violet-600',
    },
]

export function EmptyState({ userName, todayLabel, onUploadClick, onCollectInitialData, onFinished }) {
    const { user } = useAuth()
    const [step, setStep] = useState(1)
    const [accounts, setAccounts] = useState([
        { name: '', type: '', balance: '' },
    ])
    // Investments v2 structure: array of assets, each with multiple purchase lots
    const [investments, setInvestments] = useState([
        { asset: '', type: 'stocks_etfs', lots: [{ date: '', quantity: '', averageCost: '' }] },
    ])
    const [errors, setErrors] = useState({})

    const updateAccount = (idx, field, value) => {
        setAccounts(prev => prev.map((a, i) => (i === idx ? { ...a, [field]: value } : a)))
    }

    const addAccount = () => setAccounts(prev => [...prev, { name: '', type: '', balance: '' }])
    const removeAccount = (idx) => setAccounts(prev => prev.filter((_, i) => i !== idx))

    const updateInvestmentName = (idx, value) => {
        setInvestments(prev => prev.map((it, i) => (i === idx ? { ...it, asset: value } : it)))
    }

    const updateInvestmentType = (idx, value) => {
        setInvestments(prev => prev.map((it, i) => (i === idx ? { ...it, type: value } : it)))
    }

    const addInvestment = () => setInvestments(prev => [
        ...prev,
        { asset: '', type: 'stocks_etfs', lots: [{ date: '', quantity: '', averageCost: '' }] },
    ])
    const removeInvestment = (idx) => setInvestments(prev => prev.filter((_, i) => i !== idx))

    const updateLot = (assetIdx, lotIdx, field, value) => {
        setInvestments(prev => prev.map((it, i) => {
            if (i !== assetIdx) return it
            const lots = it.lots.map((lot, j) => (j === lotIdx ? { ...lot, [field]: value } : lot))
            return { ...it, lots }
        }))
    }

    const addLot = (assetIdx) => {
        setInvestments(prev => prev.map((it, i) => (
            i === assetIdx ? { ...it, lots: [...it.lots, { date: '', quantity: '', averageCost: '' }] } : it
        )))
    }

    const removeLot = (assetIdx, lotIdx) => {
        setInvestments(prev => prev.map((it, i) => {
            if (i !== assetIdx) return it
            const lots = it.lots.filter((_, j) => j !== lotIdx)
            return { ...it, lots: lots.length ? lots : [{ date: '', quantity: '', averageCost: '' }] }
        }))
    }

    const validateAccounts = () => {
        // require at least one complete account
        const atLeastOne = accounts.some(a => a.name.trim() && a.type.trim() && a.balance !== '' && !Number.isNaN(Number(a.balance)))
        const newErrors = {}
        if (!atLeastOne) {
            newErrors.accounts = 'Please add at least one bank account with name, type, and a valid balance.'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const goNext = () => {
        if (step === 1) {
            if (!validateAccounts()) return
            setStep(2)
        }
    }

    const goBack = () => setStep(s => Math.max(1, s - 1))

    const handleFinish = async () => {
        const payload = {
            accounts: accounts
                .filter(a => a.name.trim() && a.type.trim() && a.balance !== '')
                .map(a => ({
                    name: a.name.trim(),
                    type: a.type.trim(),
                    balance: Number(a.balance),
                })),
            // New structured investments with multiple purchase lots
            investments: investments
                .filter(it => (it.asset?.trim?.() || '') || (Array.isArray(it.lots) && it.lots.some(l => l.date || l.quantity || l.averageCost)))
                .map(it => ({
                    asset: it.asset?.trim?.() || '',
                    type: it.type || 'stocks_etfs',
                    lots: (it.lots || [])
                        .filter(l => l.date || l.quantity !== '' || l.averageCost !== '')
                        .map(l => ({
                            date: l.date || '',
                            quantity: l.quantity !== '' ? Number(l.quantity) : null,
                            averageCost: l.averageCost !== '' ? Number(l.averageCost) : null,
                        })),
                })),
        }

        try {
            // Save to Firestore under users/{uid} with field "manual_accounts"
            if (user?.uid) {
                const userRef = doc(db, 'users', user.uid)
                await setDoc(userRef, { manual_accounts: payload }, { merge: true })
                // Compute wellness + net-worth history so the dashboard shows real data
                await recalculateNetWorth(user.uid)
            } else {
                console.warn('EmptyState.handleFinish: No authenticated user; skipping Firestore write')
            }
        } catch (err) {
            console.error('EmptyState.handleFinish: Failed to save manual_accounts to Firestore', err)
        }

        try {
            onCollectInitialData?.(payload)
        } catch (e) {
            // no-op: optional callback
        }
        console.log('payload', payload)
        // onUploadClick?.()
        // Notify parent that initial data collection is finished so it can update isEmpty/refresh
        try {
            onFinished?.()
        } catch (e) {
            // no-op
        }
    }

    return (
        <div className="space-y-8">
            <header className="px-1">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Welcome, {userName} 👋
                </h1>
                <p className="mt-1 text-sm text-slate-500">{todayLabel}</p>
            </header>

            <div className="relative rounded-2xl border border-dashed border-slate-300 bg-linear-to-br from-white to-slate-50 p-6 sm:p-8">
                <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-brand-primary/5 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-brand-accent/5 blur-2xl" />

                <div className="relative mx-auto max-w-2xl">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/10">
                        <Wallet className="h-7 w-7 text-brand-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                        Let’s set up your starting point
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                        Add your bank accounts and current investments. This helps us estimate your net worth and personalise insights.
                    </p>

                    {/* Step indicator */}
                    <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <span className={`inline-flex h-6 items-center gap-1 rounded-full px-2.5 ${step === 1 ? 'bg-brand-primary/10 text-brand-primary' : 'bg-slate-100'}`}>
                            1. Bank accounts
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                        <span className={`inline-flex h-6 items-center gap-1 rounded-full px-2.5 ${step === 2 ? 'bg-brand-primary/10 text-brand-primary' : 'bg-slate-100'}`}>
                            2. Investments
                        </span>
                    </div>

                    {/* Forms */}
                    {step === 1 ? (
                        <div className="mt-6 space-y-4">
                            {accounts.map((acc, idx) => (
                                <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        <div className="flex flex-col">
                                            <label className="text-xs font-medium text-slate-500">Account name</label>
                                            <input
                                                type="text"
                                                value={acc.name}
                                                onChange={(e) => updateAccount(idx, 'name', e.target.value)}
                                                className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-base outline-none transition focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/20"
                                                placeholder="e.g. DBS Multiplier"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="text-xs font-medium text-slate-500">Account type</label>
                                            <input
                                                type="text"
                                                value={acc.type}
                                                onChange={(e) => updateAccount(idx, 'type', e.target.value)}
                                                className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-base outline-none transition focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/20"
                                                placeholder="e.g. Savings, Chequing"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="text-xs font-medium text-slate-500">Balance (S$)</label>
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                step="0.01"
                                                min="0"
                                                value={acc.balance}
                                                onChange={(e) => updateAccount(idx, 'balance', e.target.value)}
                                                className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-base outline-none transition focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/20"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    {accounts.length > 1 && (
                                        <div className="mt-3 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => removeAccount(idx)}
                                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" /> Remove
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {!!errors.accounts && (
                                <p className="text-sm text-red-600">{errors.accounts}</p>
                            )}

                            <div className="flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={addAccount}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                                >
                                    <Plus className="h-4 w-4" /> Add another account
                                </button>
                                <button
                                    type="button"
                                    onClick={goNext}
                                    className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
                                >
                                    Continue <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-6 space-y-4">
                            {investments.map((it, idx) => (
                                <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                    {/* Asset header */}
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                                        <div className="flex flex-col">
                                            <label className="text-xs font-medium text-slate-500">
                                                {it.type === 'crypto' ? 'Asset (token/name)' : 'Asset (ticker/name)'}
                                            </label>
                                            <input
                                                type="text"
                                                value={it.asset}
                                                onChange={(e) => updateInvestmentName(idx, e.target.value)}
                                                className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-base outline-none transition focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/20"
                                                placeholder="e.g. AAPL, BTC, S&P500 ETF"
                                            />
                                        </div>
                                        <div className="mt-3 sm:mt-0 flex flex-col">
                                            <label className="text-xs font-medium text-slate-500">Asset type</label>
                                            <select
                                                value={it.type || 'stocks_etfs'}
                                                onChange={(e) => updateInvestmentType(idx, e.target.value)}
                                                className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-base outline-none transition focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/20"
                                            >
                                                <option value="stocks_etfs">Stocks/ETFs</option>
                                                <option value="crypto">Cryptocurrency</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Lots list */}
                                    <div className="mt-4 space-y-3">
                                        {it.lots.map((lot, j) => (
                                            <div key={j} className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                                                <div className="flex flex-col">
                                                    <label className="text-xs font-medium text-slate-500">Date of purchase</label>
                                                    <input
                                                        type="date"
                                                        value={lot.date}
                                                        onChange={(e) => updateLot(idx, j, 'date', e.target.value)}
                                                        className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-base outline-none transition focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/20"
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <label className="text-xs font-medium text-slate-500">Quantity</label>
                                                    <input
                                                        type="number"
                                                        inputMode="decimal"
                                                        step="any"
                                                        min="0"
                                                        value={lot.quantity}
                                                        onChange={(e) => updateLot(idx, j, 'quantity', e.target.value)}
                                                        className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-base outline-none transition focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/20"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <label className="text-xs font-medium text-slate-500">Average cost (S$)</label>
                                                    <input
                                                        type="number"
                                                        inputMode="decimal"
                                                        step="any"
                                                        min="0"
                                                        value={lot.averageCost}
                                                        onChange={(e) => updateLot(idx, j, 'averageCost', e.target.value)}
                                                        className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-base outline-none transition focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/20"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                {it.lots.length > 1 && (
                                                    <div className="lg:col-span-3 -mt-1 flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeLot(idx, j)}
                                                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" /> Remove lot
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-3 flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => addLot(idx)}
                                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                                        >
                                            <Plus className="h-4 w-4" /> Add another purchase for this asset
                                        </button>
                                        {investments.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeInvestment(idx)}
                                                className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" /> Remove asset
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={goBack}
                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                                    >
                                        <ArrowLeft className="h-4 w-4" /> Back
                                    </button>
                                    <button
                                        type="button"
                                        onClick={addInvestment}
                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                                    >
                                        <Plus className="h-4 w-4" /> Add another asset
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleFinish}
                                    className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
                                >
                                    Finish <Upload className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <h3 className="mb-4 px-1 text-sm font-semibold uppercase tracking-wide text-slate-400">
                    How it works
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 lg:grid-cols-3">
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