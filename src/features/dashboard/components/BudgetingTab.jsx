import { useState, useMemo, useCallback, useEffect } from "react";
import {
  PiggyBank, Upload, RefreshCw, Mail, Unlink, Sparkles,
} from "lucide-react";
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../../lib/firebase.js'
import { txFingerprint } from '../../../services/dashboardViewModel.js'
import StatCard from "../../../components/ui/StatCard.jsx";
import InfoTooltip from "../../../components/ui/InfoTooltip.jsx";
import TransactionsTable from "../../../components/TransactionsTable.jsx";
import useGmailLink from "../../../hooks/useGmailLink.js";
import useEmailTransactions from "../../../hooks/useEmailTransactions.js";
import { useAuthContext } from "../../../hooks/useAuthContext.js";
import { useFirestore } from "../../../hooks/useFirestore.js";

const CARD_CLASS =
  "bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl shadow-xl p-4 sm:p-5";

const fmt = (n) =>
  Number(n).toLocaleString("en-SG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const CATEGORY_COLORS = {
  Transport: "#22c55e",
  Food: "#ef4444",
  Bills: "#84cc16",
  Unknown: "#9ca3af",
  Paynow: "#a855f7",
  Groceries: "#ec4899",
  Entertainment: "#3b82f6",
  Health: "#06b6d4",
  Shopping: "#f97316",
  Housing: "#6366f1",
  Investment: "#3b82f6",
  Utilities: "#94a3b8",
};

const HOW_IT_WORKS = [
  {
    icon: Upload,
    title: "1. Upload a Statement",
    description:
      "Upload bank or brokerage statements (PDF/CSV). We'll automatically extract transactions, balances, and category data.",
  },
  {
    icon: Mail,
    title: "1. Or Link your Gmail",
    description:
      "Alternatively, connect your Gmail to automatically import transaction alert emails from DBS, OCBC, UOB, GrabPay, and more — no file uploads needed.",
  },
  {
    icon: PiggyBank,
    title: "2. Track your Budget",
    description:
      "Set a monthly budget and see real-time spending progress with category breakdowns across all your data sources.",
  },
  {
    icon: Sparkles,
    title: "3. Get Smart Insights",
    description:
      "Your combined statement and email data powers AI-driven wellness scores, net worth tracking, and personalised advisory.",
  },
];

export default function BudgetingTab({
  viewModel = {},
  transactionsViewModel = {},
  excludedFingerprints = [],
  updateExcludedFingerprints,
  onUploadClick,
}) {
  const {
    spentThisMonth = 0,
    remainingBudget: vmRemaining,
    emergencySavingsTarget = 0,
    emergencySavingsCurrent = 0,
    emergencySavingsPct = 0,
    recentTransactions: vmTransactions = [],
    emptyState,
  } = viewModel;

  const { transactions = [] } = transactionsViewModel;
  const hasData = emptyState?.hasAnyData !== false;

  const { user, profile, refreshProfile } = useAuthContext();
  const { update } = useFirestore("users");
  const gmail = useGmailLink();
  const emailTx = useEmailTransactions({ enabled: gmail.gmailLinked });

  const [budgetInput, setBudgetInput] = useState("");
  const [budget, setBudget] = useState(
    profile?.monthly_budget ?? profile?.monthly_expenses ?? 0
  );
  const [savingBudget, setSavingBudget] = useState(false);

  useEffect(() => {
    if (profile?.monthly_budget) {
      setBudget(profile.monthly_budget);
    } else if (profile?.monthly_expenses) {
      setBudget(profile.monthly_expenses);
    }
  }, [profile?.monthly_budget, profile?.monthly_expenses]);

  const spent = spentThisMonth;
  const remaining = vmRemaining ?? Math.max(0, budget - spent);
  const spentPct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;

  const handleSaveBudget = async () => {
    const val = parseFloat(budgetInput);
    if (isNaN(val) || val <= 0) return;
    setSavingBudget(true);
    try {
      await update(user.uid, { monthly_budget: val });
      await refreshProfile();
      setBudget(val);
      setBudgetInput("");
    } catch (err) {
      console.error("Failed to save budget:", err);
    } finally {
      setSavingBudget(false);
    }
  };

  const emergencyGap = Math.max(0, emergencySavingsTarget - emergencySavingsCurrent);

  const handleEdit = useCallback(
    async (tx, updates) => {
      if (!user?.uid) return;
      if (tx.source === "email" && tx.id) {
        await emailTx.edit(tx.id, {
          description: updates.description,
          category: updates.category,
          amount: updates.amount,
        });
      }
    },
    [user?.uid, emailTx]
  );

  const handleCategoryChange = useCallback(
    (tx, newCategory) => {
      if (!user?.uid) return;
      if (tx.source === "email" && tx.id) {
        emailTx.edit(tx.id, { category: newCategory });
      }
    },
    [user?.uid, emailTx]
  );

  const handleExclude = useCallback(
    async (tx) => {
      if (!user?.uid) return;
      const fp = tx._fp ?? txFingerprint(tx);
      const next = [...excludedFingerprints, fp];
      updateExcludedFingerprints?.(next);
      try {
        await updateDoc(doc(db, 'users', user.uid), { excluded_tx_fingerprints: next });
      } catch (err) {
        console.error('Failed to persist excluded fingerprint:', err);
      }
    },
    [user?.uid, excludedFingerprints, updateExcludedFingerprints],
  );

  const handleRestore = useCallback(
    async (tx) => {
      if (!user?.uid) return;
      const fp = tx._fp ?? txFingerprint(tx);
      const next = excludedFingerprints.filter((f) => f !== fp);
      updateExcludedFingerprints?.(next);
      try {
        await updateDoc(doc(db, 'users', user.uid), { excluded_tx_fingerprints: next });
      } catch (err) {
        console.error('Failed to persist restored fingerprint:', err);
      }
    },
    [user?.uid, excludedFingerprints, updateExcludedFingerprints],
  );

  const liveSummary = useMemo(() => {
    const visible = transactions.filter((tx) => !tx.excluded);
    let inflow = 0;
    let outflow = 0;
    for (const tx of visible) {
      if (tx.amount >= 0) inflow += tx.amount;
      else outflow += Math.abs(tx.amount);
    }
    return {
      totalCount: visible.length,
      totalInflow: `S$${fmt(inflow)}`,
      totalOutflow: `S$${fmt(outflow)}`,
    };
  }, [transactions]);

  const derivedCategorySpending = useMemo(() => {
    const source = transactions.length > 0 ? transactions : vmTransactions || [];
    const totals = {};
    source.forEach((tx) => {
      if (tx.excluded) return;
      if (tx.amount < 0) {
        const cat = tx.category || "Unknown";
        totals[cat] = (totals[cat] || 0) + Math.abs(tx.amount);
      }
    });
    const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0,
        color: CATEGORY_COLORS[category] ?? "#9ca3af",
      }));
  }, [transactions, vmTransactions]);

  /* ── Empty state ─────────────────────────────────── */
  if (!hasData) {
    return (
      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-white/60 px-4 py-10 sm:px-8 sm:py-14 text-center backdrop-blur-sm">
          <div className="mx-auto max-w-md">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary/10">
              <PiggyBank className="h-8 w-8 text-brand-primary" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Budget & Transactions
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Get started in two ways: upload a bank statement for a full
              snapshot, or link your Gmail to automatically pull transaction
              alert emails. You can use both!
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {onUploadClick && (
                <button
                  type="button"
                  onClick={onUploadClick}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
                >
                  <Upload className="h-4 w-4" />
                  Upload a statement
                </button>
              )}
              {gmail.gmailLinked ? (
                <button
                  type="button"
                  onClick={emailTx.sync}
                  disabled={emailTx.syncing}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-teal-600 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${emailTx.syncing ? "animate-spin" : ""}`} />
                  {emailTx.syncing ? "Syncing…" : "Sync Gmail now"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={gmail.linkGmail}
                  disabled={gmail.linking}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
                >
                  <Mail className="h-4 w-4" />
                  {gmail.linking ? "Linking…" : "Link Gmail"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          <h3 className="px-1 text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
            How it works — choose your path
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {HOW_IT_WORKS.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex items-start gap-4 rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-xl"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10">
                  <Icon className="h-5 w-5 text-brand-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Main content ────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* ── Budget header ─────────────────────────── */}
      <div className="px-1">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
          Budget
        </h2>
        <span className="mt-1 text-sm text-slate-600">
          Monthly spending limit and emergency savings
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Budget progress */}
        <div className={`${CARD_CLASS} col-span-1 sm:col-span-2`}>
          <p className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
            Monthly spending limit
            <InfoTooltip text="Your self-set monthly spending limit saved to your profile. The progress bar shows (This month's statement outflows ÷ Budget) × 100. Remaining = Budget − outflows." />
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-2 sm:text-3xl">
            S${fmt(budget)}
          </p>
          <div className="mt-3 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${
                spentPct > 85 ? "bg-red-400" : "bg-teal-500"
              }`}
              style={{ width: `${spentPct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
            <span>
              Remaining:{" "}
              <span className="font-semibold text-gray-700">S${fmt(remaining)}</span>
            </span>
            <span className="flex items-center gap-1 text-gray-400">
              S${fmt(spent)} spent this month
              <InfoTooltip text="Derived from debit transactions in your uploaded statements for the current calendar month." />
            </span>
          </div>
        </div>

        {/* Budget input */}
        <div className={`${CARD_CLASS} col-span-1`}>
          <p className="text-sm text-gray-500 font-medium">Update spending limit</p>
          <p className="text-xs text-gray-400 mt-0.5 mb-3">Saved to your profile</p>
          <div className="flex gap-2">
            <input
              type="number"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveBudget()}
              placeholder="Enter amount"
              className="flex-1 min-w-0 bg-gray-100 rounded-lg px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-teal-400/30 focus:bg-white transition-all"
            />
            <button
              onClick={handleSaveBudget}
              disabled={savingBudget}
              className="bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white px-3 py-2.5 rounded-lg text-sm font-medium transition-colors shrink-0 disabled:opacity-50"
            >
              {savingBudget ? "…" : "Save"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Current: S${fmt(budget)}/month</p>
        </div>
      </div>

      {/* ── Emergency savings ─────────────────────── */}
      <div className={`${CARD_CLASS}`}>
        <p className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
          6-month Emergency Savings Goal
          <InfoTooltip text="Target = Monthly expenses × 6. Progress = (Current liquid savings ÷ Target) × 100. We recommend keeping 6 months of expenses in easily accessible accounts." />
        </p>
        <p className="text-2xl font-bold text-gray-900 mt-2 sm:text-3xl">
          S${fmt(emergencySavingsTarget)}
        </p>
        <p className="text-sm text-gray-400 mt-1">Based on your monthly expenses × 6</p>
        <div className="mt-4 bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 rounded-full bg-green-500 transition-all duration-500"
            style={{ width: `${emergencySavingsPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1.5">
          <span>S${fmt(emergencySavingsCurrent)} saved</span>
          <span>S${fmt(emergencyGap)} to goal · {Math.round(emergencySavingsPct)}%</span>
        </div>
      </div>

      {/* ── Transactions header + Gmail controls ─── */}
      <div className="px-1 mt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
              Transactions
            </h2>
            <span className="mt-1 text-sm text-slate-600">
              All transactions from statements and email imports
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onUploadClick && (
              <button
                onClick={onUploadClick}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 shadow-sm transition hover:bg-gray-50"
              >
                <Upload className="h-4 w-4" />
                Upload
              </button>
            )}
            {gmail.gmailLinked ? (
              <>
                <button
                  onClick={emailTx.sync}
                  disabled={emailTx.syncing}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-teal-600 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${emailTx.syncing ? "animate-spin" : ""}`} />
                  {emailTx.syncing ? "Syncing…" : "Pull from inbox"}
                </button>
                <button
                  onClick={gmail.unlinkGmail}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 min-h-[44px] text-sm text-gray-500 hover:bg-gray-50 transition"
                  title={`Linked: ${gmail.gmailEmail || "Gmail"}`}
                >
                  <Unlink className="h-4 w-4" />
                </button>
              </>
            ) : (
              <button
                onClick={gmail.linkGmail}
                disabled={gmail.linking}
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-teal-600 disabled:opacity-50"
              >
                <Mail className="h-4 w-4" />
                {gmail.linking ? "Linking…" : "Link Gmail"}
              </button>
            )}
          </div>
        </div>
        {gmail.gmailLinked && gmail.gmailEmail && (
          <p className="text-xs text-gray-400 mt-1">Connected to {gmail.gmailEmail}</p>
        )}
      </div>

      {/* ── Summary stat cards — NO overflow-x-auto, isolate tooltip context ── */}
      {/* ⚠️ overflow-x-auto clips fixed-position tooltips — use scroll wrapper only on the  */}
      {/* inner div, and ensure StatCard's tooltip uses position:fixed via InfoTooltip       */}
      <div className="-mx-1 px-1">
        <div className="grid grid-cols-3 gap-4 min-w-0">
          <StatCard
            title="Total Transactions"
            value={liveSummary.totalCount}
            valueColor="text-teal-500"
            tooltip="Count of all debit and credit entries from statements and email imports."
          />
          <StatCard
            title="Total Inflow"
            value={liveSummary.totalInflow}
            valueColor="text-teal-500"
            tooltip="Sum of all positive (credit) transactions — salary, transfers in, refunds."
          />
          <StatCard
            title="Total Outflow"
            value={liveSummary.totalOutflow}
            valueColor="text-teal-500"
            tooltip="Sum of all negative (debit) transactions — purchases, bills, transfers out."
          />
        </div>
      </div>

      {/* Unified transaction table */}
      <TransactionsTable
        transactions={transactions}
        onEdit={handleEdit}
        onCategoryChange={handleCategoryChange}
        onExclude={handleExclude}
        onRestore={handleRestore}
      />

      {/* ── Category spending ─────────────────────── */}
      {derivedCategorySpending.length > 0 && (
        <div className={`${CARD_CLASS}`}>
          <p className="text-sm text-gray-500 font-medium mb-4 flex items-center gap-1.5">
            Spending by Category — This Month
            <InfoTooltip text="Each category total = sum of outflow transactions tagged with that category. Percentages show each category's share of total outflows." />
          </p>
          <div className="space-y-3">
            {derivedCategorySpending.map((item) => (
              <div key={item.category} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-20 sm:w-28 shrink-0 truncate">
                  {item.category}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-600 w-16 text-right shrink-0">
                  S${Number(item.amount).toFixed(2)}
                </span>
                <span className="text-xs text-gray-400 w-8 text-right shrink-0">
                  {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
