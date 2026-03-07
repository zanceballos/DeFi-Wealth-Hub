import {useEffect, useState} from "react";
import {allTransactions, spendingByCategory} from "../../../data/mockData.js";
import StatCard from "../../../components/ui/StatCard.jsx";
import CategoryBadge from "../../../components/ui/CategoryBadge.jsx";
// import {useAppContext} from "../../../context/AppContext.jsx";

const SPENT = 1927.90
const CARD_CLASS = 'bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl shadow-xl p-5'

const fmtAmt = (amount) => {
    const abs = Math.abs(amount).toFixed(2)
    return amount >= 0 ? `+$${abs}` : `-$${abs}`
}

export default function BudgetingTab() {
    const [budgetInput, setBudgetInput] = useState('')
    const [budget, setBudget] = useState(3927.90)
    // const {setTimeFilters, setActiveFilter} = useAppContext()
    const [transactions, setTransactions] = useState(allTransactions)

    const handleSaveBudget = () => {
        const val = parseFloat(budgetInput)
        if (!isNaN(val) && val > 0) {
            setBudget(val)
            setBudgetInput('')
        }
    }

    // useEffect(() => {
    //     setTimeFilters(['All Time', 'Daily', 'Monthly', 'Yearly'])
    //     setActiveFilter('All Time')
    //     return () => setTimeFilters([])
    // }, [setTimeFilters, setActiveFilter])

    const handleCategoryChange = (id, newCategory) => {
        setTransactions((prev) =>
            prev.map((tx) => (tx.id === id ? {...tx, category: newCategory} : tx))
        )
    }

    const remaining = Math.max(0, budget - SPENT)
    const spentPct = Math.min(100, (SPENT / budget) * 100)
    const fmt = (n) =>
        n.toLocaleString('en-SG', {minimumFractionDigits: 2, maximumFractionDigits: 2})

    return (
        <div className="space-y-6">
            <div className="px-1">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Budget</h2>
                <span className="mt-1 text-sm text-slate-600">
                    Current Budget and emergency savings
                </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div className={`${CARD_CLASS} col-span-2`}>
                    <p className="text-sm text-gray-500 font-medium">Budget for the month</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">${fmt(budget)}</p>

                    {/* Progress bar */}
                    <div className="mt-3 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                            className={`h-2 rounded-full transition-all ${spentPct > 85 ? 'bg-red-400' : 'bg-teal-500'}`}
                            style={{width: `${spentPct}%`}}
                        />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                        Remaining:&nbsp;
                        <span className="font-semibold text-gray-700">${fmt(remaining)}</span>
                        <span className="text-gray-400 ml-2">· ${fmt(SPENT)} spent</span>
                    </p>
                </div>

                <div className={`${CARD_CLASS} col-span-1`}>
                    <p className="text-sm text-gray-500 font-medium">Update budget for the month</p>
                    <div className="mt-3 flex gap-2">
                        <input
                            type="number"
                            value={budgetInput}
                            onChange={(e) => setBudgetInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveBudget()}
                            placeholder="Enter amount"
                            className="flex-1 min-w-0 bg-gray-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400/30 focus:bg-white transition-all"
                        />
                        <button
                            onClick={handleSaveBudget}
                            className="bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white px-3 py-2.5 rounded-lg text-sm font-medium transition-colors shrink-0"
                        >
                            Save
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Current: ${fmt(budget)}/month</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className={`${CARD_CLASS} col-span-2`}>
                    <p className="text-sm text-gray-500 font-medium">6-months Emergency Savings</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">$7,213.00</p>
                    <p className="text-sm text-gray-400 mt-1">
                        Amount is based on your spending over the past 6-months
                    </p>

                    {/* Progress toward goal */}
                    <div className="mt-4 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className="h-2 rounded-full bg-green-500" style={{width: '62%'}}/>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                        <span>$4,472 saved</span>
                        <span>$2,741 to goal · 62%</span>
                    </div>
                </div>
            </div>

            <div className="px-1 mt-8">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Transactions</h2>
                <span className="mt-1 text-sm text-slate-600">
                    Transaction history and current spending
                </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
                <StatCard
                    title="Total Transactions"
                    value="132,322"
                    valueColor="text-teal-500"
                    changeText="+20% All Time"
                    changeColor="text-green-500"
                />
                <StatCard
                    title="Total Inflow"
                    value="$123,234"
                    valueColor="text-teal-500"
                    changeText="+12% All Time"
                    changeColor="text-green-500"
                />
                <StatCard
                    title="Total Outflow"
                    value="$50,232"
                    valueColor="text-teal-500"
                    changeText="+124% All Time"
                    changeColor="text-green-500"
                />
            </div>

            <div className={`${CARD_CLASS}`}>
                <div className="overflow-hidden">
                    <div className="overflow-auto" style={{maxHeight: '520px'}}>
                        <table className="w-full">
                            <thead className="sticky top-0 bg-white z-10">
                            <tr className="border-b border-gray-100">
                                <th className="text-left px-5 py-2 text-xs text-gray-400 font-medium w-[30%]">Source</th>
                                <th className="text-left px-4 py-2 text-xs text-gray-400 font-medium">Merchant</th>
                                <th className="text-left px-4 py-2 text-xs text-gray-400 font-medium">Date</th>
                                <th className="text-left px-4 py-2 text-xs text-gray-400 font-medium">Time</th>
                                <th className="text-left px-4 py-2 text-xs text-gray-400 font-medium">Category</th>
                                <th className="text-right px-4 py-2 text-xs text-gray-400 font-medium">Posted</th>
                                <th className="text-right px-5 py-2 text-xs text-gray-400 font-medium">Amount</th>
                            </tr>
                            </thead>

                            <tbody>
                            {transactions.map((tx) => (
                                <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                                    <td className="px-5 py-3 text-sm text-gray-900 font-medium truncate max-w-0 w-[30%]">
                                        {tx.source}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{tx.merchant}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{tx.date}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{tx.time}</td>
                                    <td className="px-4 py-3">
                                        <CategoryBadge
                                            category={tx.category}
                                            onCategoryChange={(cat) => handleCategoryChange(tx.id, cat)}
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-400 text-right whitespace-nowrap">
                                        {tx.posted}
                                    </td>
                                    <td
                                        className={`px-5 py-3 text-sm font-semibold text-right whitespace-nowrap ${
                                            tx.amount >= 0 ? 'text-teal-500' : 'text-red-500'
                                        }`}
                                    >
                                        {fmtAmt(tx.amount)}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div className={`${CARD_CLASS} col-span-1`}>
                <p className="text-sm text-gray-500 font-medium mb-4">Spending by Category — This Month</p>
                <div className="space-y-3">
                    {spendingByCategory.map((item) => (
                        <div key={item.category} className="flex items-center gap-3">
                            <span className="text-xs text-gray-600 w-28 shrink-0">{item.category}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-2 rounded-full transition-all duration-500"
                                    style={{width: `${item.percentage}%`, backgroundColor: item.color}}
                                />
                            </div>
                            <span className="text-xs font-medium text-gray-600 w-16 text-right shrink-0">
                                    ${item.amount.toFixed(2)}
                                </span>
                            <span className="text-xs text-gray-400 w-8 text-right shrink-0">
                                    {item.percentage}%
                                </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}