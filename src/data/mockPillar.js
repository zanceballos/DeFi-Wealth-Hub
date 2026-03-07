import {CandlestickChart, Droplets, ShieldAlert, Sparkles} from 'lucide-react'

export const PILLAR_SCORES = [
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