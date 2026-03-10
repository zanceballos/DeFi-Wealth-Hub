/**
 * useDashboardData — fetches Firestore data for the authenticated user and
 * transforms it into UI-ready shapes for every Dashboard tab.
 *
 * Returns:
 *   {
 *     loading, error, isEmpty,
 *
 *     // Overview tab (existing contract — unchanged)
 *     userProfile, heroStats, pillarScores, netWorthSeries,
 *     savingsDetail, netWorthBreakdown,
 *
 *     // Wallet & Budget tabs (new)
 *     walletViewModel, budgetViewModel,
 *
 *     // Raw data (for power / debug use)
 *     raw: { profile, statements, wellness, netWorthHistory },
 *
 *     refresh,
 *   }
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { db } from "../lib/firebase.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { useAuthContext } from "./useAuthContext.js";
import {
  CandlestickChart,
  Droplets,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import {
  buildWalletViewModel,
  buildBudgetViewModel,
  buildTransactionsViewModel,
  safeNumber,
} from "../services/dashboardViewModel.js";
import { getYfPrice } from "../services/marketDataService.js";
import { recomputeAll } from "../services/financialDataService.js";

// ── Empty defaults (no mock data — real values come from Firestore) ──
const EMPTY_HERO = {
  netWorth: { value: "S$0", delta: "" },
  wellness: { score: 0, label: "" },
  savings: { value: "S$0", rate: 0 },
};
const EMPTY_USER_PROFILE = { name: "", riskProfile: "", location: "" };

// ═══════════════════════════════════════════════════════════════════════════
// Overview-specific helpers (kept here because they reference lucide icons
// which belong to the UI layer, not the pure data-mapping service)
// ═══════════════════════════════════════════════════════════════════════════

const PILLAR_META = {
  liquidity: {
    icon: Droplets,
    label: "Liquidity",
    calculationTooltip:
      "Score = (Cash buffer months ÷ 6) × 100, capped at 100. A 6-month cash buffer earns a perfect score.",
  },
  diversification: {
    icon: CandlestickChart,
    label: "Diversification",
    calculationTooltip:
      "Score = 100 − largest position % + min(number of accounts × 10, 30). Penalises heavy concentration in a single asset.",
  },
  risk_match: {
    icon: ShieldAlert,
    label: "Risk Match",
    calculationTooltip:
      "Score = 100 − (crypto % × 0.5) − (unregulated % × 0.5). Lower crypto and unregulated exposure means better alignment with your risk profile.",
  },
  digital_health: {
    icon: Sparkles,
    label: "Digital Assets",
    calculationTooltip:
      "If digital exposure ≤ 30%: Score = 70 + digital %. Above 30%: Score = 100 − (digital % − 30) × 2. Ideal range is 5–30%.",
  },
};

function pillarDescription(key, score) {
  const descriptions = {
    liquidity:
      score >= 70
        ? "Cash reserves comfortably cover short-term needs."
        : score >= 50
          ? "Cash buffer is building but below the ideal range."
          : "Cash reserves are below target for short-term resilience.",
    diversification:
      score >= 70
        ? "Portfolio is well diversified across asset classes."
        : score >= 50
          ? "Allocation is balanced but still concentrated in key sectors."
          : "Portfolio is heavily concentrated — consider diversifying.",
    risk_match:
      score >= 70
        ? "Portfolio risk is well aligned with your profile."
        : score >= 50
          ? "Current volatility is slightly above your profile."
          : "Risk exposure significantly exceeds your comfort zone.",
    digital_health:
      score >= 70
        ? "Digital asset exposure is healthy and well-managed."
        : score >= 50
          ? "Exposure is meaningful and should be actively monitored."
          : "Digital asset allocation needs attention.",
  };
  return descriptions[key] ?? "";
}

function scoreToColor(score) {
  if (score >= 70)
    return { colorClass: "bg-emerald-500", textClass: "text-emerald-500" };
  if (score >= 50)
    return { colorClass: "bg-amber-400", textClass: "text-amber-500" };
  return { colorClass: "bg-red-500", textClass: "text-red-500" };
}

function wellnessLabel(score) {
  if (score >= 80) return "Excellent Health";
  if (score >= 70) return "Good Health";
  if (score >= 50) return "Moderate Health";
  return "Needs Attention";
}

function fmtCurrency(value, currency = "S$") {
  if (value == null) return `${currency}0`;
  return `${currency}${Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const BREAKDOWN_COLORS = {
  cash: "bg-emerald-400",
  stocks: "bg-blue-500",
  crypto: "bg-amber-400",
  property: "bg-rose-400",
  tokenised: "bg-violet-400",
  bonds: "bg-sky-400",
};

const BREAKDOWN_LABELS = {
  cash: "Cash & savings",
  stocks: "Stocks & ETFs",
  crypto: "Crypto",
  property: "Property",
  tokenised: "Tokenised assets",
  bonds: "Bonds",
};

// ═══════════════════════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════════════════════

export default function useDashboardData() {
  const { user } = useAuthContext();
  const uid = user?.uid ?? "";

  // ── State ─────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEmpty, setIsEmpty] = useState(false);

  // Overview tab
  const [userProfile, setUserProfile] = useState(EMPTY_USER_PROFILE);
  const [heroStats, setHeroStats] = useState(EMPTY_HERO);
  const [pillarScores, setPillarScores] = useState([]);
  const [netWorthSeries, setNetWorthSeries] = useState([]);
  const [savingsDetail, setSavingsDetail] = useState({
    income: "S$0",
    expenses: "S$0",
    net: "S$0",
    target: 20,
  });
  const [netWorthBreakdown, setNetWorthBreakdown] = useState([]);

  // Wallet + Budget + Transactions tabs
  const [walletViewModel, setWalletViewModel] = useState(() =>
    buildWalletViewModel(),
  );
  const [budgetViewModel, setBudgetViewModel] = useState(() =>
    buildBudgetViewModel(),
  );
  const [transactionsViewModel, setTransactionsViewModel] = useState(() =>
    buildTransactionsViewModel(),
  );
  const [emailTransactions, setEmailTransactions] = useState([]);

  // Per-symbol live SGD prices for crypto holdings (symbol → price)
  const [liveCryptoPrices, setLiveCryptoPrices] = useState({})

  // Raw data
  const [raw, setRaw] = useState({
    profile: null,
    statements: [],
    wellness: null,
    netWorthHistory: [],
    emailTransactions: [],
  });

  // Keep refs so the onSnapshot callbacks always have the latest data
  const statementsRef = useRef([]);
  const profileRef = useRef(null);
  const emailTxRef = useRef([]);
  const excludedFpRef = useRef([]);

  // ── Helper: apply wellness data to overview state ─────────────────────
  const applyWellness = useCallback(
    (wellness, profile, statements, emailTx) => {
      if (!wellness) return;
      const km = wellness.key_metrics ?? {};
      const netWorth = safeNumber(km.net_worth);
      const savingsRate = safeNumber(km.savings_rate_pct);
      const monthlyIncome = safeNumber(profile?.monthly_income);
      const monthlyExp = safeNumber(profile?.monthly_expenses);
      const netSavings = monthlyIncome - monthlyExp;

      setHeroStats({
        netWorth: {
          value: fmtCurrency(netWorth),
          delta:
            wellness.status === "green"
              ? "Healthy"
              : wellness.status === "amber"
                ? "Moderate"
                : "Needs attention",
        },
        wellness: {
          score: wellness.overall_score ?? 0,
          label: wellnessLabel(wellness.overall_score ?? 0),
        },
        savings: {
          value: fmtCurrency(Math.max(netSavings, 0)),
          rate: Math.round(savingsRate),
        },
      });

      setSavingsDetail({
        income: fmtCurrency(monthlyIncome),
        expenses: fmtCurrency(monthlyExp),
        net: fmtCurrency(netSavings),
        target: 20,
      });

      const pillars = wellness.pillars ?? {};
      setPillarScores(
        Object.entries(PILLAR_META).map(([key, meta]) => {
          const p = pillars[key] ?? {};
          const score = p.score ?? 0;
          return {
            name: meta.label,
            score,
            ...scoreToColor(score),
            icon: meta.icon,
            description: pillarDescription(key, score),
            calculationTooltip: meta.calculationTooltip,
          };
        }),
      );

      // Rebuild wallet + budget with fresh wellness + email transactions
      setWalletViewModel(
        buildWalletViewModel({
          statements,
          wellness,
          transactions: buildTransactionsViewModel({
            statements,
            emailTransactions: emailTx,
            excludedFingerprints: excludedFpRef.current,
          }).transactions,
        }),
      );
      setBudgetViewModel(
        buildBudgetViewModel({ profile, statements, wellness }),
      );
    },
    [],
  );

  // ── Fetch ─────────────────────────────────────────────────────────────
  const hasLoadedOnce = useRef(false);

  const fetchData = useCallback(async ({ silent = false } = {}) => {
    if (!uid) {
      setIsEmpty(true);
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    setError(null);

    try {
      // 1. User profile
      const profileSnap = await getDoc(doc(db, "users", uid));
      const profile = profileSnap.exists() ? profileSnap.data() : null;

      if (profile) {
        setUserProfile({
          uid,
          name: profile.name ?? profile.displayName ?? "",
          riskProfile: profile.riskProfile ?? profile.risk_profile ?? "",
          location: profile.location ?? "",
        });
      }

      // 2. Wellness snapshot
      const wellnessSnap = await getDoc(
        doc(db, "users", uid, "wellness", "current"),
      );
      const wellness = wellnessSnap.exists() ? wellnessSnap.data() : null;

      // 3. Statements + their transaction subcollections
      const statementsSnap = await getDocs(
        collection(db, "users", uid, "statements"),
      );
      const statements = [];
      statementsSnap.forEach((d) => statements.push({ id: d.id, ...d.data() }));
      const activeStmts = statements.filter(
        (s) => s.status === "parsed" || s.status === "approved",
      );

      // Fetch transactions subcollection for each active statement (needed for Budget)
      for (const stmt of activeStmts) {
        try {
          const txCol = collection(
            db,
            "users",
            uid,
            "statements",
            stmt.id,
            "transactions",
          );
          const txSnap = await getDocs(
            query(txCol, orderBy("date", "desc"), limit(200)),
          );
          const txns = [];
          txSnap.forEach((td) => txns.push({ id: td.id, ...td.data() }));
          stmt.transactions = txns;
        } catch {
          stmt.transactions = [];
        }
      }

      // 4. Net worth history
      const historyRef = collection(
        db,
        "users",
        uid,
        "history",
        "net_worth",
        "items",
      );
      const historySnap = await getDocs(
        query(historyRef, orderBy("month_key", "asc")),
      );
      const historyItems = [];
      historySnap.forEach((d) => historyItems.push(d.data()));

      // 5. Email transactions (Source C)
      let emailTxItems = [];
      try {
        const emailTxCol = collection(db, "users", uid, "emailTransactions");
        const emailTxSnap = await getDocs(
          query(emailTxCol, orderBy("createdAt", "desc"), limit(500)),
        );
        emailTxSnap.forEach((d) =>
          emailTxItems.push({ id: d.id, ...d.data() }),
        );
        emailTxItems = emailTxItems.filter((tx) => !tx.deleted);
      } catch {
        emailTxItems = [];
      }
      setEmailTransactions(emailTxItems);

      // ── Save raw ──────────────────────────────────────────────────────
      statementsRef.current = statements;
      profileRef.current = profile;
      emailTxRef.current = emailTxItems;
      const excludedFp = Array.isArray(profile?.excluded_tx_fingerprints)
        ? profile.excluded_tx_fingerprints
        : [];
      excludedFpRef.current = excludedFp;
      setRaw({
        profile,
        statements,
        wellness,
        netWorthHistory: historyItems,
        emailTransactions: emailTxItems,
      });

      // ── Detect empty state ────────────────────────────────────────────
      // Also consider manual_accounts saved on the user document
      const manual = profile?.manual_accounts;
      const hasManual =
        (Array.isArray(manual?.accounts) && manual.accounts.length > 0) ||
        (Array.isArray(manual?.investments) && manual.investments.length > 0);
      const hasEmailTx = emailTxItems.length > 0;
      const hasData =
        hasManual ||
        !!wellness ||
        activeStmts.length > 0 ||
        historyItems.length > 0 ||
        hasEmailTx;
      setIsEmpty(!hasData);

      // ── Bootstrap: if user has data but no history/wellness, run initial recompute ──
      if (hasData && (historyItems.length === 0 || !wellness)) {
        recomputeAll(uid).catch((err) =>
          console.error("[useDashboardData] bootstrap recompute failed:", err),
        );
      }

      // ════════════════════════════════════════════════════════════════════
      // OVERVIEW TAB transformations + Wallet/Budget rebuild
      // ════════════════════════════════════════════════════════════════════
      applyWellness(wellness, profile, statements, emailTxItems);

      // Asset breakdown (overview card) — statements + manual + email tx
      {
        const totals = { cash: 0, stocks: 0, crypto: 0, property: 0, tokenised: 0, bonds: 0 };
        let grandTotal = 0;

        // Source B: statements
        for (const stmt of activeStmts) {
          const bd = stmt.asset_class_breakdown ?? {};
          for (const key of Object.keys(totals)) {
            const v = safeNumber(bd[key]);
            totals[key] += v;
            grandTotal += v;
          }
        }

        // Source A: manual accounts
        const manualAccounts = profile?.manual_accounts?.accounts;
        const manualInvestments = profile?.manual_accounts?.investments;
        const manualCash = Array.isArray(manualAccounts)
          ? manualAccounts.reduce((sum, acc) => sum + safeNumber(acc?.balance), 0)
          : 0;
        let manualStocks = 0;
        let manualCrypto = 0;
        if (Array.isArray(manualInvestments)) {
          for (const inv of manualInvestments) {
            const lots = Array.isArray(inv?.lots) ? inv.lots : [];
            const assetTotal = lots.reduce((sum, lot) => {
              const qty = safeNumber(lot?.quantity);
              const avg = safeNumber(lot?.averageCost);
              const val = qty * avg;
              return sum + (Number.isFinite(val) ? val : 0);
            }, 0);
            const t = (inv?.type || "").toLowerCase();
            if (t === "crypto") manualCrypto += assetTotal;
            else manualStocks += assetTotal;
          }
        }
        if (manualCash > 0) { totals.cash += manualCash; grandTotal += manualCash; }
        if (manualStocks > 0) { totals.stocks += manualStocks; grandTotal += manualStocks; }
        if (manualCrypto > 0) { totals.crypto += manualCrypto; grandTotal += manualCrypto; }

        // Source C: email transactions (non-rejected net cash inflow/outflow)
        const emailNetCash = emailTxItems
          .filter((tx) => tx.status !== "rejected" && !tx.deleted)
          .reduce((sum, tx) => sum + safeNumber(tx.amount), 0);
        if (emailNetCash !== 0) {
          totals.cash += emailNetCash;
          grandTotal += emailNetCash;
        }

        const breakdown = Object.entries(totals)
          .filter(([, v]) => v > 0)
          .map(([key, v]) => ({
            color: BREAKDOWN_COLORS[key] ?? "bg-slate-400",
            label: BREAKDOWN_LABELS[key] ?? key,
            value: fmtCurrency(v),
            percent: grandTotal > 0 ? Math.round((v / grandTotal) * 100) : 0,
          }));
        if (breakdown.length > 0) {
          setNetWorthBreakdown(breakdown);
        }
      }

      // Net worth time series
      if (historyItems.length > 0) {
        setNetWorthSeries(
          historyItems.map((item) => ({
            month: item.month ?? item.month_key,
            value: item.value ?? 0,
          })),
        );
      }

      // ════════════════════════════════════════════════════════════════════
      // TRANSACTIONS TAB view model (wallet + budget already set by applyWellness)
      // ════════════════════════════════════════════════════════════════════
      setTransactionsViewModel(
        buildTransactionsViewModel({
          statements,
          emailTransactions: emailTxItems,
          excludedFingerprints: excludedFpRef.current,
        }),
      );
    } catch (err) {
      console.error("useDashboardData: failed to fetch from Firestore", err);
      setError(err);
      // Keep mock / previous data as fallback
    } finally {
      setLoading(false);
      hasLoadedOnce.current = true;
    }
  }, [uid, applyWellness]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(
    () => fetchData({ silent: hasLoadedOnce.current }),
    [fetchData],
  );

  // ── Real-time listener for emailTransactions (so Gmail sync updates UI) ──
  useEffect(() => {
    if (!uid) return;
    const emailTxCol = collection(db, "users", uid, "emailTransactions");
    const q = query(emailTxCol, orderBy("createdAt", "desc"), limit(500));
    const unsub = onSnapshot(q, (snap) => {
      const items = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
      const filtered = items.filter((tx) => !tx.deleted);
      emailTxRef.current = filtered;
      setEmailTransactions(filtered);
      setRaw((prev) => ({ ...prev, emailTransactions: filtered }));
      setTransactionsViewModel(
        buildTransactionsViewModel({
          statements: statementsRef.current,
          emailTransactions: filtered,
          excludedFingerprints: excludedFpRef.current,
        }),
      );
      // If we now have email txns, clear empty state
      if (filtered.length > 0) setIsEmpty(false);
    });
    return unsub;
  }, [uid]);

  // ── Real-time listener for wellness (so recomputeAll updates overview + wallet + budget) ──
  useEffect(() => {
    if (!uid) return;
    const wellnessRef = doc(db, "users", uid, "wellness", "current");
    const unsub = onSnapshot(wellnessRef, (snap) => {
      if (!snap.exists()) return;
      const wellness = snap.data();
      setRaw((prev) => ({ ...prev, wellness }));
      applyWellness(
        wellness,
        profileRef.current,
        statementsRef.current,
        emailTxRef.current,
      );
    });
    return unsub;
  }, [uid, applyWellness]);

  // ── Real-time listener for user profile (manual_accounts changes → recompute) ──
  const prevManualRef = useRef(null);
  useEffect(() => {
    if (!uid) return;
    const userDocRef = doc(db, "users", uid);
    const unsub = onSnapshot(userDocRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      profileRef.current = data;
      // Only trigger recompute when manual_accounts actually changes
      const manualJson = JSON.stringify(data.manual_accounts ?? {});
      if (prevManualRef.current !== null && prevManualRef.current !== manualJson) {
        recomputeAll(uid).catch((err) =>
          console.error("[useDashboardData] manual_accounts recompute failed:", err),
        );
      }
      prevManualRef.current = manualJson;
    });
    return unsub;
  }, [uid]);

  // ── Real-time listener for net-worth history (keeps chart + series in sync) ──
  useEffect(() => {
    if (!uid) return;
    const historyRef = collection(
      db,
      "users",
      uid,
      "history",
      "net_worth",
      "items",
    );
    const q = query(historyRef, orderBy("month_key", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const items = [];
      snap.forEach((d) => items.push(d.data()));
      setRaw((prev) => ({ ...prev, netWorthHistory: items }));
      if (items.length > 0) {
        setNetWorthSeries(
          items.map((item) => ({
            month: item.month ?? item.month_key,
            value: item.value ?? 0,
          })),
        );
      }
    });
    return unsub;
  }, [uid]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Manual holdings aggregation helpers (quantities per asset by type)
  // ═══════════════════════════════════════════════════════════════════════════
  const manualHoldings = useMemo(() => {
    const profile = raw.profile;
    const investments = profile?.manual_accounts?.investments;
    const accounts = profile?.manual_accounts?.accounts;

    // Cash total from accounts
    const manualCash = Array.isArray(accounts)
      ? accounts.reduce((sum, acc) => sum + safeNumber(acc?.balance), 0)
      : 0;

    const stocks = new Map(); // symbol -> totalQty
    const crypto = new Map(); // symbol -> totalQty

    if (Array.isArray(investments)) {
      for (const inv of investments) {
        const lots = Array.isArray(inv?.lots) ? inv.lots : [];
        const qtyTotal = lots.reduce((s, l) => s + safeNumber(l?.quantity), 0);
        const symbolRaw = (inv?.asset ?? "").trim();
        if (!symbolRaw || qtyTotal <= 0) continue;
        const symbol = symbolRaw.toUpperCase();
        const type = (inv?.type || "").toLowerCase();
        if (type === "crypto") {
          crypto.set(symbol, (crypto.get(symbol) || 0) + qtyTotal);
        } else {
          // default and stocks_etfs bucket
          stocks.set(symbol, (stocks.get(symbol) || 0) + qtyTotal);
        }
      }
    }

    return { manualCash, stocks, crypto };
  }, [raw.profile]);

  // Helper: rebuild net worth breakdown combining statements + manual cash + provided live valuations
  // Accepts an overrides object where you can pass per-asset-class live values, e.g. { stocks: number, crypto: number }
  // Backward compatible: also accepts { liveStocksValue, liveCryptoValue } keys.
  const rebuildBreakdown = useCallback(
    (overrides = {}) => {
      const activeStmts = Array.isArray(raw.statements)
        ? raw.statements.filter(
            (s) => s.status === "parsed" || s.status === "approved",
          )
        : [];

      const totals = {
        cash: 0,
        stocks: 0,
        crypto: 0,
        property: 0,
        tokenised: 0,
        bonds: 0,
      };
      let grand = 0;
      for (const stmt of activeStmts) {
        const bd = stmt.asset_class_breakdown ?? {};
        for (const key of Object.keys(totals)) {
          const v = safeNumber(bd[key]);
          totals[key] += v;
          grand += v;
        }
      }

      // Add manual cash
      if (manualHoldings.manualCash > 0) {
        totals.cash += manualHoldings.manualCash;
        grand += manualHoldings.manualCash;
      }

    // Add manual stocks at cost as baseline
    let manualStocksCost = 0
    for (const [symbol, qty] of manualHoldings.stocks) {
      const profile = raw.profile
      const inv = (profile?.manual_accounts?.investments ?? []).find(
        i => (i?.asset ?? '').toUpperCase() === symbol
      )
      const lots = Array.isArray(inv?.lots) ? inv.lots : []
      const costValue = lots.reduce((s, l) => s + safeNumber(l?.quantity) * safeNumber(l?.averageCost), 0)
      if (costValue > 0) {
        manualStocksCost += costValue
      }
    }
    totals.stocks += manualStocksCost
    grand += manualStocksCost

    // Add manual crypto at cost as baseline
    let manualCryptoCost = 0
    for (const [symbol, qty] of manualHoldings.crypto) {
      const profile = raw.profile
      const inv = (profile?.manual_accounts?.investments ?? []).find(
        i => (i?.asset ?? '').toUpperCase() === symbol && (i?.type || '').toLowerCase() === 'crypto'
      )
      const lots = Array.isArray(inv?.lots) ? inv.lots : []
      const costValue = lots.reduce((s, l) => s + safeNumber(l?.quantity) * safeNumber(l?.averageCost), 0)
      if (costValue > 0) {
        manualCryptoCost += costValue
      }
    }
    totals.crypto += manualCryptoCost
    grand += manualCryptoCost

    // Source C: email transactions (non-rejected net cash inflow/outflow)
    const emailTxItems = Array.isArray(raw.emailTransactions) ? raw.emailTransactions : []
    const emailNetCash = emailTxItems
      .filter(tx => tx.status !== 'rejected' && !tx.deleted)
      .reduce((sum, tx) => sum + safeNumber(tx.amount), 0)
    if (emailNetCash !== 0) {
      totals.cash += emailNetCash
      grand += emailNetCash
    }

    // Apply per-key live valuations if provided (replace manual cost with live value)
    const addByKey = {}
    // New interface: direct keys like { stocks, crypto }
    for (const k of Object.keys(totals)) {
      const v = overrides?.[k]
      if (Number.isFinite(v) && v > 0) addByKey[k] = Number(v)
    }
    // Backward compatibility with { liveStocksValue, liveCryptoValue }
    if (overrides?.liveStocksValue != null && overrides.liveStocksValue > 0) {
      addByKey.stocks = (addByKey.stocks || 0) + Number(overrides.liveStocksValue)
    }
    if (overrides?.liveCryptoValue != null && overrides.liveCryptoValue > 0) {
      addByKey.crypto = (addByKey.crypto || 0) + Number(overrides.liveCryptoValue)
    }

    for (const [k, v] of Object.entries(addByKey)) {
      if (k in totals) {
        // Remove cost baseline before adding live value to avoid double-counting
        if (k === 'stocks' && manualStocksCost > 0) {
          totals[k] -= manualStocksCost
          grand -= manualStocksCost
        }
        if (k === 'crypto' && manualCryptoCost > 0) {
          totals[k] -= manualCryptoCost
          grand -= manualCryptoCost
        }
        totals[k] += v
        grand += v
      }
    }
    const breakdown = Object.entries(totals)
      .filter(([, v]) => v > 0)
      .map(([key, v]) => ({
        color:   BREAKDOWN_COLORS[key] ?? 'bg-slate-400',
        label:   BREAKDOWN_LABELS[key] ?? key,
        value:   fmtCurrency(v),
        percent: grand > 0 ? Math.round((v / grand) * 100) : 0,
      }))
    if (breakdown.length > 0) {
      setNetWorthBreakdown(breakdown)
    }
  }, [raw.statements, raw.profile, raw.emailTransactions, manualHoldings])

  // ═══════════════════════════════════════════════════════════════════════════
  // Periodic price updates via yfinance-defi
  //  - Stocks every 24 hours
  //  - Crypto every 1 hour
  // Writes to Firestore under users/{uid}/live_quotes/{SYMBOL}
  // Also updates local netWorthBreakdown so UI reflects changes without extra listeners.
  // ═══════════════════════════════════════════════════════════════════════════

  // Stocks (24h)
  useEffect(() => {
    if (!uid) return;
    const symbols = Array.from(manualHoldings.stocks.keys());
    if (symbols.length === 0) return;

    let cancelled = false;

    async function runOnce() {
      // Fetch all stock symbols; daily cadence so burst should be acceptable if list is small
      const [fxSgdUsd, ...prices] = await Promise.all([
        // Yahoo-style pair: 1 SGD = X USD → convert USD → SGD by dividing by this FX
        getYfPrice("SGDUSD=X", { ttlMs: 60 * 60 * 1000 }),
        ...symbols.map((s) => getYfPrice(s, { ttlMs: 24 * 60 * 60 * 1000 })),
      ]);
      if (cancelled) return;

      const fx = Number(fxSgdUsd);
      const fxValid = Number.isFinite(fx) && fx > 0;

      // Persist and compute valuation in SGD
      let liveStocksValue = 0;
      await Promise.all(
        symbols.map(async (s, i) => {
          const priceUsd = Number(prices[i]);
          if (!Number.isFinite(priceUsd) || priceUsd <= 0) return;
          const priceSgd = fxValid ? priceUsd / fx : priceUsd; // fallback: treat as SGD if FX missing
          const qty = manualHoldings.stocks.get(s) || 0;
          liveStocksValue += qty * priceSgd;
        }),
      );

      rebuildBreakdown({ stocks: liveStocksValue });
    }

    runOnce();
    const interval = setInterval(runOnce, 86_400_000); // 24h
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [uid, manualHoldings.stocks, rebuildBreakdown]);

  // Crypto (1h)
  useEffect(() => {
    if (!uid) return;
    const symbols = Array.from(manualHoldings.crypto.keys());
    if (symbols.length === 0) return;
    let cancelled = false;

    async function runOnce() {
      // yfinance-defi expects crypto pairs like BTC-USD; append "-USD" if not already present
      const pairSymbols = symbols.map((s) =>
        s.includes("-") ? s : `${s}-USD`,
      );
      const [fxSgdUsd, ...prices] = await Promise.all([
        getYfPrice("SGDUSD=X", { ttlMs: 60 * 60 * 1000 }),
        ...pairSymbols.map((ps) => getYfPrice(ps, { ttlMs: 60 * 60 * 1000 })),
      ])
      if (cancelled) return
      const fx = Number(fxSgdUsd)
      const fxValid = Number.isFinite(fx) && fx > 0

      let liveCryptoValue = 0
      const newPrices = {}
      await Promise.all(symbols.map(async (s, i) => {
        const priceUsd = Number(prices[i])
        if (!Number.isFinite(priceUsd) || priceUsd <= 0) return
        const priceSgd = fxValid ? priceUsd / fx : priceUsd
        newPrices[s.toUpperCase()] = priceSgd
        const qty = manualHoldings.crypto.get(s) || 0
        liveCryptoValue += qty * priceSgd
      }))
      setLiveCryptoPrices(prev => ({ ...prev, ...newPrices }))
      rebuildBreakdown({ crypto: liveCryptoValue })
    }

    runOnce();
    const interval = setInterval(runOnce, 3_600_000); // 1h
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [uid, manualHoldings.crypto, rebuildBreakdown]);

  // ── Return ────────────────────────────────────────────────────────────
  return {
    loading,
    error,
    isEmpty,
    setIsEmpty,

    // Overview tab
    userProfile,
    heroStats,
    pillarScores,
    netWorthSeries,
    savingsDetail,
    netWorthBreakdown,
    liveCryptoPrices,

    // Wallet & Budget & Transactions tabs
    walletViewModel,
    budgetViewModel,
    transactionsViewModel,
    emailTransactions,

    // Excluded transaction fingerprints (persisted on user profile)
    excludedFingerprints: excludedFpRef.current,
    updateExcludedFingerprints(fps) {
      excludedFpRef.current = fps;
      // Rebuild transactions view model with updated exclusions
      setTransactionsViewModel(
        buildTransactionsViewModel({
          statements: statementsRef.current,
          emailTransactions: emailTxRef.current,
          excludedFingerprints: fps,
        }),
      );
    },

    // Raw Firestore data
    raw,

    refresh,
  };
}
