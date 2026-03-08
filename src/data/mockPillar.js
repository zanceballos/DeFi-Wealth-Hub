import {CandlestickChart, Droplets, ShieldAlert, Sparkles} from 'lucide-react'

export const PILLAR_SCORES = [
    {
        name: 'Liquidity',
        score: 42,
        colorClass: 'bg-red-500',
        textClass: 'text-red-500',
        icon: Droplets,
        description: 'Cash reserves are below target for short-term resilience.',
        calculationTooltip: 'Score = (Cash buffer months ÷ 6) × 100, capped at 100. A 6-month cash buffer earns a perfect score.',
    },
    {
        name: 'Diversification',
        score: 68,
        colorClass: 'bg-amber-400',
        textClass: 'text-amber-500',
        icon: CandlestickChart,
        description: 'Allocation is balanced but still concentrated in key sectors.',
        calculationTooltip: 'Score = 100 − largest position % + min(number of accounts × 10, 30). Penalises heavy concentration in a single asset.',
    },
    {
        name: 'Risk Match',
        score: 54,
        colorClass: 'bg-amber-400',
        textClass: 'text-amber-500',
        icon: ShieldAlert,
        description: 'Current volatility is slightly above your moderate profile.',
        calculationTooltip: 'Score = 100 − (crypto % × 0.5) − (unregulated % × 0.5). Lower crypto and unregulated exposure means better alignment with your risk profile.',
    },
    {
        name: 'Digital Assets',
        score: 60,
        colorClass: 'bg-amber-400',
        textClass: 'text-amber-500',
        icon: Sparkles,
        description: 'Exposure is meaningful and should be actively monitored.',
        calculationTooltip: 'If digital exposure ≤ 30%: Score = 70 + digital %. Above 30%: Score = 100 − (digital % − 30) × 2. Ideal range is 5–30%.',
    },
]