/**
 * dashboardViewModel.js
 *
 * Pure data-mapping layer that reads raw Firebase user financial data
 * and transforms it into safe, UI-ready prop objects for the
 * Wallet page, Budget page, and empty-state screens.
 *
 * Every function is null-safe — missing / empty data never crashes the UI.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convert any value to a finite number, defaulting to 0. */
export function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Safe percentage: part / total × 100, capped between 0-cap (default 100). */
export function safePercent(part, total, cap = 100) {
  if (!total || total === 0) return 0;
  return Math.min(
    Math.round((safeNumber(part) / safeNumber(total)) * 100),
    cap,
  );
}

/** Format a number as SGD currency string: S$1,234 */
export function formatCurrencySGD(value) {
  const n = safeNumber(value);
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString("en-SG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return n < 0 ? `-S$${formatted}` : `S$${formatted}`;
}

/** Format a number as SGD with 2 decimal places for amounts: S$1,234.50 */
function formatCurrencySGD2(value) {
  const n = safeNumber(value);
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString("en-SG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return n < 0 ? `-S$${formatted}` : `S$${formatted}`;
}

// ─── Asset-class constants ──────────────────────────────────────────────────

const ASSET_CLASSES = [
  "cash",
  "stocks",
  "crypto",
];

const ASSET_CLASS_META = {
  cash:   { name: "Cash",   color: "#2081C3" },
  stocks: { name: "Stocks", color: "#10b981" },
  crypto: { name: "Crypto", color: "#f59e0b" },
};

function normalizeAsset(raw) {
  const s = (raw ?? "").toLowerCase().trim();
  if (s === "cash") return "cash";
  if (s === "stocks") return "stocks";
  if (s === "crypto") return "crypto";
  return null;
}

// ─── Category normalisation ─────────────────────────────────────────────────

const VALID_CATEGORIES = [
  "Food", "Transport", "Shopping", "Entertainment", "Utilities",
  "Healthcare", "Housing", "Groceries", "Dining", "Travel",
  "Education", "Investment", "Income", "Transfer", "Fees",
  "Insurance", "Savings", "Cash", "CPF", "Tax",
  "Dividend", "Interest", "Other",
];

const CATEGORY_LOOKUP = Object.fromEntries(
  VALID_CATEGORIES.map((c) => [c.toLowerCase(), c]),
);

export function normalizeCategory(raw) {
  if (!raw) return "Unknown";
  const key = String(raw).trim().toLowerCase();
  return CATEGORY_LOOKUP[key] ?? "Unknown";
}

// ─── Category colours ───────────────────────────────────────────────────────

const CATEGORY_COLORS = {
  food: "#F97316",
  groceries: "#EC4899",
  transport: "#22C55E",
  bills: "#84CC16",
  entertainment: "#A855F7",
  health: "#0EA5E9",
  housing: "#6366F1",
  shopping: "#F43F5E",
  income: "#10B981",
  investment: "#3B82F6",
  interest: "#14B8A6",
  transfer: "#64748B",
  paynow: "#8B5CF6",
  unknown: "#94A3B8",
  uncategorised: "#CBD5E1",
};

/** Return a hex colour for a spending category (case-insensitive). */
export function getCategoryColor(category) {
  if (!category) return CATEGORY_COLORS.uncategorised;
  return (
    CATEGORY_COLORS[category.toLowerCase()] ?? CATEGORY_COLORS.uncategorised
  );
}

// ─── Statement helpers ──────────────────────────────────────────────────────

/** Filter statements to only approved / parsed ones. */
function activeStatements(statements) {
  if (!Array.isArray(statements)) return [];
  return statements.filter(
    (s) => s && (s.status === "parsed" || s.status === "approved"),
  );
}

/** Sum asset_class_breakdown across an array of statements. */
export function sumAssetBreakdown(statements) {
  const totals = {};
  for (const key of ASSET_CLASSES) totals[key] = 0;

  const active = activeStatements(statements);
  for (const stmt of active) {
    const bd = stmt.asset_class_breakdown ?? {};
    for (const key of ASSET_CLASSES) {
      totals[key] += safeNumber(bd[key]);
    }
  }
  return totals;
}

/** Derive a risk label from statement source_type. */
export function deriveRiskLabel(statement) {
  const src = (statement?.source_type ?? "").toLowerCase();
  if (src === "bank") return "Core";
  if (src === "crypto") return "Speculative";
  if (src === "investment" || src === "broker") {
    // Heuristic: if net worth contribution is large relative to total, it's Growth
    const nwc = safeNumber(statement?.net_worth_contribution);
    return nwc > 10000 ? "Growth" : "Stable";
  }
  return "Stable";
}

/** Derive a regulated label from statement. */
export function deriveRegulatedLabel(statement) {
  if (statement?.regulated === true) return "✅ MAS";
  if (statement?.regulated === false) return "⚠️ Unregulated";
  // Default heuristic based on source type
  const src = (statement?.source_type ?? "").toLowerCase();
  if (src === "crypto") return "⚠️ Unregulated";
  return "✅ MAS";
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. WALLET VIEW MODEL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * buildWalletViewModel({ statements, wellness, transactions })
 *
 * Returns a UI-ready object for the Wallet page:
 *   { allocation, totalNetWorth, rows, emptyState }
 *
 * transactions = flat array from buildTransactionsViewModel().transactions
 */
export function buildWalletViewModel({
  statements,
  wellness,
  transactions,
} = {}) {
  const active = activeStatements(statements);

  // ── Total net worth from statements ───────────────────────────────────
  let stmtNetWorth = 0;
  for (const stmt of active) {
    stmtNetWorth += safeNumber(stmt.net_worth_contribution);
  }
  const totalNetWorth =
    safeNumber(wellness?.key_metrics?.net_worth) || stmtNetWorth;

  const allTx = Array.isArray(transactions) ? transactions : [];
  const hasAnyData =
    allTx.length > 0 ||
    active.length > 0 ||
    safeNumber(wellness?.key_metrics?.net_worth) > 0;

  // ── Aggregate transactions by asset class ─────────────────────────────
  const RISK = { cash: "Core", stocks: "Growth", crypto: "Speculative" };
  const REG = {
    cash: "✓ Regulated",
    stocks: "✓ Regulated",
    crypto: "⚠ Unregulated",
  };

  const groups = {};
  for (const key of ASSET_CLASSES) {
    groups[key] = { total: 0, platforms: {} };
  }

  for (const tx of allTx) {
    if (tx.excluded) continue;
    const assetKey = normalizeAsset(tx.asset);
    if (!assetKey) continue;
    if (tx.direction === "credit") {
      groups[assetKey].total += Math.abs(tx.amount);
    }
    const plat = tx.platform ?? tx.merchant ?? tx.sourceLabel ?? "—";
    groups[assetKey].platforms[plat] = (groups[assetKey].platforms[plat] || 0) + 1;
  }

  // If no credit transactions were found, fall back to statement asset_class_breakdown
  const hasTxData = ASSET_CLASSES.some((k) => groups[k].total > 0);
  if (!hasTxData) {
    const totals = sumAssetBreakdown(statements);
    for (const key of ASSET_CLASSES) {
      groups[key].total = totals[key];
    }
  }

  const grandTotal = ASSET_CLASSES.reduce((s, k) => s + groups[k].total, 0);
  const denominator = totalNetWorth > 0 ? totalNetWorth : grandTotal || 1;

  // ── Allocation (pie chart) ────────────────────────────────────────────
  const allocation = ASSET_CLASSES
    .map((key) => {
      const meta = ASSET_CLASS_META[key];
      const pct = denominator > 0
        ? Math.round((groups[key].total / denominator) * 100)
        : 0;
      return { name: meta.name, value: pct, color: meta.color };
    })
    .filter((a) => a.value > 0);

  // ── Wallet rows (one per asset class that has data) ───────────────────
  const rows = ASSET_CLASSES
    .filter((key) => groups[key].total > 0)
    .map((key) => {
      const meta = ASSET_CLASS_META[key];
      const g = groups[key];
      const pct = denominator > 0
        ? ((g.total / denominator) * 100).toFixed(1)
        : "0.0";
      // Top platform by count
      const topPlatform = Object.entries(g.platforms)
        .sort((a, b) => b[1] - a[1])
        .map(([p]) => p)
        .slice(0, 2)
        .join(", ") || "—";

      return {
        asset: meta.name,
        platform: topPlatform,
        value: formatCurrencySGD(g.total),
        portfolio: `${pct}%`,
        riskLabel: RISK[key],
        regulated: REG[key],
      };
    });

  // ── Empty state ───────────────────────────────────────────────────────
  const emptyState = {
    hasAnyData,
    message: hasAnyData
      ? ""
      : "No wallet data yet. Upload a bank, brokerage, or crypto statement to see your portfolio allocation.",
  };

  return { allocation, totalNetWorth, rows, emptyState };
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. BUDGET VIEW MODEL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * buildBudgetViewModel({ profile, statements, wellness })
 *
 * Returns a UI-ready object for the Budget page:
 *   { monthlyBudget, remainingBudget, spentThisMonth,
 *     emergencySavingsTarget, emergencySavingsCurrent, emergencySavingsPct,
 *     categorySpending, transactionSummary, recentTransactions, emptyState }
 */
export function buildBudgetViewModel({ profile, statements, wellness } = {}) {
  const active = activeStatements(statements);

  const _monthlyIncome = safeNumber(profile?.monthly_income);
  const monthlyExpenses = safeNumber(profile?.monthly_expenses);

  // ── Budget ────────────────────────────────────────────────────────────
  const monthlyBudget =
    safeNumber(profile?.monthly_budget) || monthlyExpenses || 0;

  // Spent this month: sum total_debits from current-month statements,
  // falling back to profile.monthly_expenses
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  let spentThisMonth = 0;
  let hasCurrentMonthData = false;
  for (const stmt of active) {
    const pd = stmt.parsed_data ?? {};
    const stmtMonth = pd.statement_month ?? "";
    if (stmtMonth === currentMonth || !stmtMonth) {
      spentThisMonth += safeNumber(pd.total_debits);
      if (stmtMonth === currentMonth) hasCurrentMonthData = true;
    }
  }
  // If no current-month statement data found, fall back to profile expenses
  if (spentThisMonth === 0 && !hasCurrentMonthData) {
    spentThisMonth = monthlyExpenses;
  }

  const remainingBudget = Math.max(monthlyBudget - spentThisMonth, 0);

  // ── Emergency savings ─────────────────────────────────────────────────
  const emergencySavingsTarget = monthlyExpenses * 6;

  // Current emergency savings = total liquidity (cash-like balances)
  const totals = sumAssetBreakdown(statements);
  const cashLike = totals.cash; // conservative liquid assets
  const emergencySavingsCurrent = safeNumber(wellness?.key_metrics?.net_worth)
    ? Math.min(
        cashLike || safeNumber(wellness?.key_metrics?.net_worth) * 0.3,
        emergencySavingsTarget * 1.5,
      )
    : cashLike;

  const emergencySavingsPct =
    emergencySavingsTarget > 0
      ? Math.min(
          Math.round((emergencySavingsCurrent / emergencySavingsTarget) * 100),
          100,
        )
      : 0;

  // ── Category spending ─────────────────────────────────────────────────
  // Priority: read from transactions subcollection (new schema), then fall
  // back to statement-level category_breakdown, then single bucket.
  const categoryMap = {};
  let hasCategoryData = false;

  // 1️⃣  Transaction-level categories (new subcollection schema)
  for (const stmt of active) {
    const txRows = stmt.transactions ?? [];
    if (!Array.isArray(txRows) || txRows.length === 0) continue;

    for (const tx of txRows) {
      const dir = (tx.direction ?? "").toLowerCase();
      if (dir === "credit" || dir === "in") continue; // skip income for spending breakdown
      const cat = (tx.category ?? "uncategorised").toLowerCase();
      const amt = Math.abs(safeNumber(tx.amount));
      if (amt > 0) {
        hasCategoryData = true;
        categoryMap[cat] = (categoryMap[cat] ?? 0) + amt;
      }
    }
  }

  // 2️⃣  Fallback: statement-level category_breakdown (legacy / summary)
  if (!hasCategoryData) {
    for (const stmt of active) {
      const txCategories =
        stmt.category_breakdown ?? stmt.parsed_data?.category_breakdown;
      if (txCategories && typeof txCategories === "object") {
        hasCategoryData = true;
        for (const [cat, amount] of Object.entries(txCategories)) {
          const key = cat.toLowerCase();
          categoryMap[key] = (categoryMap[key] ?? 0) + safeNumber(amount);
        }
      }
    }
  }

  let categorySpending;
  if (hasCategoryData) {
    const totalCatSpending = Object.values(categoryMap).reduce(
      (a, b) => a + b,
      0,
    );
    categorySpending = Object.entries(categoryMap)
      .sort(([, a], [, b]) => b - a)
      .map(([category, amount]) => ({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        amount,
        percentage: safePercent(amount, totalCatSpending),
        color: getCategoryColor(category),
      }));
  } else {
    // 3️⃣  Last resort: single uncategorised bucket
    categorySpending =
      spentThisMonth > 0
        ? [
            {
              category: "Uncategorised",
              amount: spentThisMonth,
              percentage: 100,
              color: getCategoryColor("uncategorised"),
            },
          ]
        : [];
  }

  // ── Transaction summary ───────────────────────────────────────────────
  let totalTransactions = 0;
  let totalInflow = 0;
  let totalOutflow = 0;

  for (const stmt of active) {
    totalTransactions += safeNumber(stmt.transactions_count);
    const pd = stmt.parsed_data ?? {};
    totalInflow += safeNumber(pd.total_credits);
    totalOutflow += safeNumber(pd.total_debits);
  }

  const transactionSummary = {
    totalCount: String(totalTransactions),
    totalInflow: formatCurrencySGD2(totalInflow),
    totalOutflow: formatCurrencySGD2(totalOutflow),
  };

  // ── Recent transactions ───────────────────────────────────────────────
  // Read from transactions subcollection first, fall back to embedded arrays
  const recentTransactions = [];
  for (const stmt of active) {
    const txRows = stmt.transactions ?? stmt.parsed_data?.transactions ?? [];
    if (!Array.isArray(txRows)) continue;

    for (const tx of txRows) {
      const amt = safeNumber(tx.amount);
      const dir = (tx.direction ?? "debit").toLowerCase();
      const signedAmt =
        dir === "credit" || dir === "in" ? Math.abs(amt) : -Math.abs(amt);

      recentTransactions.push({
        id: tx.id ?? tx.row_id ?? undefined,
        source: tx.description ?? tx.source ?? "Unknown",
        merchant: tx.merchant ?? stmt.platform ?? "—",
        date: tx.date ?? "—",
        time: tx.time ?? "—",
        category: tx.category ?? "uncategorised",
        posted: tx.posted ?? formatRelativeDate(tx.date),
        amount: signedAmt,
      });
    }
  }

  // Sort recent by date descending, limit to 50
  recentTransactions.sort((a, b) =>
    b.date > a.date ? 1 : b.date < a.date ? -1 : 0,
  );
  recentTransactions.splice(50);

  // ── Empty state ───────────────────────────────────────────────────────
  const hasBudgetData = monthlyBudget > 0 || spentThisMonth > 0;
  const hasTransactions =
    totalTransactions > 0 || recentTransactions.length > 0;
  const hasAnyData = hasBudgetData || hasTransactions;

  let message = "";
  if (!hasBudgetData && !hasTransactions) {
    message =
      "No budget or transaction data yet. Upload a financial statement to get started.";
  } else if (!hasBudgetData) {
    message = "Set your monthly budget to start tracking spending.";
  } else if (!hasTransactions) {
    message =
      "No transactions found yet. Upload a statement with transaction data.";
  }

  const emptyState = { hasBudgetData, hasTransactions, hasAnyData, message };

  return {
    monthlyBudget,
    remainingBudget,
    spentThisMonth,
    emergencySavingsTarget,
    emergencySavingsCurrent: Math.round(emergencySavingsCurrent),
    emergencySavingsPct,
    categorySpending,
    transactionSummary,
    recentTransactions,
    emptyState,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. EMPTY-STATE DETECTOR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * createDashboardEmptyStates({ profile, statements, wellness })
 *
 * Returns booleans and messages about what data is missing.
 */
export function createDashboardEmptyStates({
  profile,
  statements,
  wellness,
} = {}) {
  const active = activeStatements(statements);
  const totals = sumAssetBreakdown(statements);
  const hasAllocation = Object.values(totals).some((v) => v > 0);

  return {
    noStatementsUploaded: {
      empty: active.length === 0,
      message:
        active.length === 0
          ? "You haven't uploaded any financial statements yet. Upload one to get started."
          : "",
    },
    noBudgetData: {
      empty:
        !safeNumber(profile?.monthly_expenses) &&
        !safeNumber(profile?.monthly_income),
      message:
        "No income or expense data found. Set your monthly budget or upload a statement.",
    },
    noWalletAllocation: {
      empty: !hasAllocation,
      message: !hasAllocation
        ? "No asset allocation data yet. Upload statements from different platforms to build your portfolio view."
        : "",
    },
    noWellnessSnapshot: {
      empty: !wellness,
      message: !wellness
        ? "No wellness score computed yet. Upload a statement — we'll compute your financial health automatically."
        : "",
    },
  };
}

// ─── Internal helpers ───────────────────────────────────────────────────────

/** Best-effort relative date label. */
function formatRelativeDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.round(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    if (diffDay < 30) return `${Math.round(diffDay / 7)}w ago`;
    if (diffDay < 365) return `${Math.round(diffDay / 30)}mth ago`;
    return `${Math.round(diffDay / 365)}y ago`;
  } catch {
    return "—";
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. TRANSACTIONS VIEW MODEL (unified: Source B + Source C)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a stable fingerprint string for a transaction.
 * Used to remember user-excluded rows so re-imports don't resurface them.
 */
export function txFingerprint(tx) {
  const d = (tx.date ?? "").trim();
  const desc = (tx.description ?? "").trim().toLowerCase();
  const amt = Math.abs(safeNumber(tx.amount)).toFixed(2);
  return `${d}|${desc}|${amt}`;
}

/**
 * buildTransactionsViewModel({ statements, emailTransactions, excludedFingerprints })
 *
 * Merges statement transactions (Source B) and email transactions (Source C)
 * into a unified, sorted list with source badges.
 * Rows whose fingerprint is in excludedFingerprints are marked excluded.
 *
 * Returns:
 *   { transactions, summary: { totalCount, totalInflow, totalOutflow }, emptyState }
 */
export function buildTransactionsViewModel({
  statements,
  emailTransactions,
  excludedFingerprints,
} = {}) {
  const excludedSet = new Set(
    Array.isArray(excludedFingerprints) ? excludedFingerprints : [],
  );
  const active = activeStatements(statements);
  const allTx = [];

  // Source B: statement transactions
  for (const stmt of active) {
    const txRows = stmt.transactions ?? stmt.parsed_data?.transactions ?? [];
    if (!Array.isArray(txRows)) continue;

    for (const tx of txRows) {
      const amt = safeNumber(tx.amount);
      const dir = (
        tx.direction ?? (amt >= 0 ? "credit" : "debit")
      ).toLowerCase();
      const signedAmt =
        dir === "credit" || dir === "in" ? Math.abs(amt) : -Math.abs(amt);

      allTx.push({
        id: tx.id ?? tx.row_id ?? undefined,
        source: "statement",
        sourceLabel: "Statement",
        dataSource: "statement",
        description: tx.description ?? tx.source ?? "Unknown",
        merchant: tx.merchant ?? stmt.platform ?? "—",
        counterparty: tx.counterparty ?? "—",
        date: tx.date ?? "—",
        time: tx.time ?? "—",
        category: normalizeCategory(tx.category),
        direction: dir === "credit" || dir === "in" ? "credit" : "debit",
        amount: signedAmt,
        posted: tx.posted ?? formatRelativeDate(tx.date),
        statementId: stmt.id,
        _raw: tx,
      });
    }
  }

  // Source C: email transactions (approved + pending, exclude deleted)
  const emailTxs = Array.isArray(emailTransactions) ? emailTransactions : [];
  for (const tx of emailTxs) {
    if (tx.deleted) continue;
    const amt = safeNumber(tx.amount);

    allTx.push({
      id: tx.id,
      source: "email",
      sourceLabel: "Email",
      dataSource: tx.dataSource ?? "gmail",
      description: tx.description ?? "—",
      merchant: tx.merchant ?? "—",
      accountRef: tx.accountRef ?? "—",
      counterparty: tx.source ?? "—",
      date: tx.date ?? "—",
      time: tx.time ?? "—",
      category: normalizeCategory(tx.category),
      direction: amt >= 0 ? "credit" : "debit",
      amount: amt,
      posted: formatRelativeDate(tx.date),
      status: tx.status,
      edited: tx.edited ?? false,
      emailId: tx.emailId,
      _raw: tx,
    });
  }

  // Stamp each row with its fingerprint + excluded flag
  for (const tx of allTx) {
    tx._fp = txFingerprint(tx);
    tx.excluded = excludedSet.has(tx._fp);
  }

  // Sort by date descending, then time descending
  allTx.sort((a, b) => {
    const dateCmp = (b.date || "").localeCompare(a.date || "");
    if (dateCmp !== 0) return dateCmp;
    return (b.time || "").localeCompare(a.time || "");
  });

  // Summary (only from non-excluded rows)
  const visible = allTx.filter((tx) => !tx.excluded);
  let totalInflow = 0;
  let totalOutflow = 0;
  for (const tx of visible) {
    if (tx.amount >= 0) totalInflow += tx.amount;
    else totalOutflow += Math.abs(tx.amount);
  }

  const summary = {
    totalCount: allTx.length,
    totalInflow: formatCurrencySGD(totalInflow),
    totalOutflow: formatCurrencySGD(totalOutflow),
  };

  const hasAnyData = allTx.length > 0;
  const emptyState = {
    hasAnyData,
    message: hasAnyData
      ? ""
      : "No transactions yet. Upload a statement or link Gmail to see your transaction history.",
  };

  return { transactions: allTx, summary, emptyState };
}
