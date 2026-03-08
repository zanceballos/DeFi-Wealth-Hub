import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Upload,
  X,
  RefreshCw,
  Save,
  CheckCircle,
  XCircle,
  Pencil,
  SkipForward,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
  Zap,
  ChevronDown,
} from "lucide-react";
import {
  recomputeWellness,
  upsertNetWorthHistory,
} from "../../../services/financialDataService.js";
import { ingestStatementToFirestore } from "../../../services/statementIngestionService.js";
import { useAuthContext } from "../../../hooks/useAuthContext.js";

const API_BASE_URL =
  import.meta.env.VITE_PIPELINE_API_BASE_URL ??
  "https://defi-api.stocksuite.app";
const REVIEWABLE_KEYS = [
  "date",
  "description",
  "amount",
  "currency",
  "category",
  "direction",
  "asset",
];

// ── Mock data sets per source type ──
const MOCK_DATA = {
  bank: (prefix) => [
    {
      row_id: "bank-1",
      normalized_payload: {
        date: `${prefix}-01`,
        description: "Salary deposit — Accenture",
        amount: 4490,
        currency: "SGD",
        category: "income",
        direction: "credit",
        asset: "cash",
      },
      row_confidence: 0.97,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "bank-2",
      normalized_payload: {
        date: `${prefix}-02`,
        description: "Rent — Jurong East HDB",
        amount: 1800,
        currency: "SGD",
        category: "housing",
        direction: "debit",
        asset: "cash",
      },
      row_confidence: 0.95,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "bank-3",
      normalized_payload: {
        date: `${prefix}-03`,
        description: "Grab Food delivery",
        amount: 42.5,
        currency: "SGD",
        category: "food",
        direction: "debit",
        asset: "cash",
      },
      row_confidence: 0.92,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "bank-4",
      normalized_payload: {
        date: `${prefix}-05`,
        description: "DBS SaveUp interest",
        amount: 18.75,
        currency: "SGD",
        category: "interest",
        direction: "credit",
        asset: "cash",
      },
      row_confidence: 0.98,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "bank-5",
      normalized_payload: {
        date: `${prefix}-06`,
        description: "NTUC FairPrice groceries",
        amount: 87.3,
        currency: "SGD",
        category: "groceries",
        direction: "debit",
        asset: "cash",
      },
      row_confidence: 0.94,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "bank-6",
      normalized_payload: {
        date: `${prefix}-08`,
        description: "Singtel mobile bill",
        amount: 55,
        currency: "SGD",
        category: "utilities",
        direction: "debit",
        asset: "cash",
      },
      row_confidence: 0.96,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "bank-7",
      normalized_payload: {
        date: `${prefix}-10`,
        description: "Netflix subscription",
        amount: 18.98,
        currency: "SGD",
        category: "entertainment",
        direction: "debit",
        asset: "cash",
      },
      row_confidence: 0.99,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "bank-8",
      normalized_payload: {
        date: `${prefix}-12`,
        description: "Shopee purchase",
        amount: 134.5,
        currency: "SGD",
        category: "shopping",
        direction: "debit",
        asset: "cash",
      },
      row_confidence: 0.91,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "bank-9",
      normalized_payload: {
        date: `${prefix}-15`,
        description: "PayNow transfer from family",
        amount: 200,
        currency: "SGD",
        category: "transfer",
        direction: "credit",
        asset: "cash",
      },
      row_confidence: 0.93,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "bank-10",
      normalized_payload: {
        date: `${prefix}-20`,
        description: "SP Group electricity bill",
        amount: 92.4,
        currency: "SGD",
        category: "utilities",
        direction: "debit",
        asset: "cash",
      },
      row_confidence: 0.97,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "bank-11",
      normalized_payload: {
        date: `${prefix}-22`,
        description: "ATM withdrawal",
        amount: 300,
        currency: "SGD",
        category: "cash",
        direction: "debit",
        asset: "cash",
      },
      row_confidence: 0.89,
      validation_flags: ["large_cash"],
      state: "pending",
    },
    {
      row_id: "bank-12",
      normalized_payload: {
        date: `${prefix}-28`,
        description: "MRT/Bus SimplyGo",
        amount: 48.6,
        currency: "SGD",
        category: "transport",
        direction: "debit",
        asset: "cash",
      },
      row_confidence: 0.95,
      validation_flags: [],
      state: "pending",
    },
  ],

  crypto: (prefix) => [
    {
      row_id: "crypto-1",
      normalized_payload: {
        date: `${prefix}-01`,
        description: "BTC buy — Binance",
        amount: 1200,
        currency: "SGD",
        category: "investment",
        direction: "debit",
        asset: "crypto",
      },
      row_confidence: 0.95,
      validation_flags: ["crypto_transfer"],
      state: "pending",
    },
    {
      row_id: "crypto-2",
      normalized_payload: {
        date: `${prefix}-03`,
        description: "ETH buy — Binance",
        amount: 800,
        currency: "SGD",
        category: "investment",
        direction: "debit",
        asset: "crypto",
      },
      row_confidence: 0.93,
      validation_flags: ["crypto_transfer"],
      state: "pending",
    },
    {
      row_id: "crypto-3",
      normalized_payload: {
        date: `${prefix}-05`,
        description: "USDT deposit — Bybit",
        amount: 500,
        currency: "SGD",
        category: "transfer",
        direction: "credit",
        asset: "crypto",
      },
      row_confidence: 0.9,
      validation_flags: ["stablecoin"],
      state: "pending",
    },
    {
      row_id: "crypto-4",
      normalized_payload: {
        date: `${prefix}-07`,
        description: "ETH staking reward",
        amount: 12.4,
        currency: "SGD",
        category: "interest",
        direction: "credit",
        asset: "crypto",
      },
      row_confidence: 0.88,
      validation_flags: ["staking_reward"],
      state: "pending",
    },
    {
      row_id: "crypto-5",
      normalized_payload: {
        date: `${prefix}-10`,
        description: "BTC partial sell — Coinbase",
        amount: 650,
        currency: "SGD",
        category: "investment",
        direction: "credit",
        asset: "crypto",
      },
      row_confidence: 0.94,
      validation_flags: ["crypto_transfer"],
      state: "pending",
    },
    {
      row_id: "crypto-6",
      normalized_payload: {
        date: `${prefix}-12`,
        description: "SOL buy — Kraken",
        amount: 320,
        currency: "SGD",
        category: "investment",
        direction: "debit",
        asset: "crypto",
      },
      row_confidence: 0.91,
      validation_flags: ["crypto_transfer"],
      state: "pending",
    },
    {
      row_id: "crypto-7",
      normalized_payload: {
        date: `${prefix}-15`,
        description: "Gas fee — MetaMask",
        amount: 4.2,
        currency: "SGD",
        category: "fees",
        direction: "debit",
        asset: "crypto",
      },
      row_confidence: 0.96,
      validation_flags: ["gas_fee"],
      state: "pending",
    },
    {
      row_id: "crypto-8",
      normalized_payload: {
        date: `${prefix}-18`,
        description: "MATIC airdrop",
        amount: 28.8,
        currency: "SGD",
        category: "income",
        direction: "credit",
        asset: "crypto",
      },
      row_confidence: 0.82,
      validation_flags: ["airdrop", "unverified"],
      state: "pending",
    },
    {
      row_id: "crypto-9",
      normalized_payload: {
        date: `${prefix}-22`,
        description: "Crypto.com withdrawal to bank",
        amount: 400,
        currency: "SGD",
        category: "transfer",
        direction: "debit",
        asset: "crypto",
      },
      row_confidence: 0.92,
      validation_flags: ["crypto_transfer"],
      state: "pending",
    },
    {
      row_id: "crypto-10",
      normalized_payload: {
        date: `${prefix}-28`,
        description: "USDC yield farming reward",
        amount: 9.6,
        currency: "SGD",
        category: "interest",
        direction: "credit",
        asset: "crypto",
      },
      row_confidence: 0.85,
      validation_flags: ["defi", "unverified"],
      state: "pending",
    },
  ],

  broker: (prefix) => [
    {
      row_id: "broker-1",
      normalized_payload: {
        date: `${prefix}-02`,
        description: "AAPL buy 5 shares — Tiger",
        amount: 1087.5,
        currency: "SGD",
        category: "investment",
        direction: "debit",
        asset: "stocks",
      },
      row_confidence: 0.96,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "broker-2",
      normalized_payload: {
        date: `${prefix}-02`,
        description: "Brokerage fee — Tiger",
        amount: 2.99,
        currency: "SGD",
        category: "fees",
        direction: "debit",
        asset: "cash",
      },
      row_confidence: 0.99,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "broker-3",
      normalized_payload: {
        date: `${prefix}-05`,
        description: "TSLA sell 2 shares — Moomoo",
        amount: 490.2,
        currency: "SGD",
        category: "investment",
        direction: "credit",
        asset: "stocks",
      },
      row_confidence: 0.95,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "broker-4",
      normalized_payload: {
        date: `${prefix}-08`,
        description: "NVDA buy 3 shares — Moomoo",
        amount: 2130,
        currency: "SGD",
        category: "investment",
        direction: "debit",
        asset: "stocks",
      },
      row_confidence: 0.97,
      validation_flags: ["large_trade"],
      state: "pending",
    },
    {
      row_id: "broker-5",
      normalized_payload: {
        date: `${prefix}-10`,
        description: "SPY dividend received",
        amount: 34.8,
        currency: "SGD",
        category: "dividend",
        direction: "credit",
        asset: "stocks",
      },
      row_confidence: 0.98,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "broker-6",
      normalized_payload: {
        date: `${prefix}-14`,
        description: "MSFT buy 4 shares — IBKR",
        amount: 876,
        currency: "SGD",
        category: "investment",
        direction: "debit",
        asset: "stocks",
      },
      row_confidence: 0.96,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "broker-7",
      normalized_payload: {
        date: `${prefix}-18`,
        description: "DBS.SI buy 100 shares — CDP",
        amount: 3920,
        currency: "SGD",
        category: "investment",
        direction: "debit",
        asset: "stocks",
      },
      row_confidence: 0.94,
      validation_flags: ["large_trade"],
      state: "pending",
    },
    {
      row_id: "broker-8",
      normalized_payload: {
        date: `${prefix}-20`,
        description: "SG REITs — Mapletree dividend",
        amount: 88.5,
        currency: "SGD",
        category: "dividend",
        direction: "credit",
        asset: "stocks",
      },
      row_confidence: 0.97,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "broker-9",
      normalized_payload: {
        date: `${prefix}-25`,
        description: "QQQ ETF buy 2 units — IBKR",
        amount: 1240,
        currency: "SGD",
        category: "investment",
        direction: "debit",
        asset: "stocks",
      },
      row_confidence: 0.95,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "broker-10",
      normalized_payload: {
        date: `${prefix}-28`,
        description: "Withholding tax deducted",
        amount: 12.4,
        currency: "SGD",
        category: "tax",
        direction: "debit",
        asset: "cash",
      },
      row_confidence: 0.99,
      validation_flags: [],
      state: "pending",
    },
  ],

  investment: (prefix) => [
    {
      row_id: "inv-1",
      normalized_payload: {
        date: `${prefix}-01`,
        description: "CPF OA contribution",
        amount: 1230,
        currency: "SGD",
        category: "cpf",
        direction: "credit",
        asset: "bonds",
      },
      row_confidence: 0.99,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "inv-2",
      normalized_payload: {
        date: `${prefix}-01`,
        description: "CPF SA contribution",
        amount: 614,
        currency: "SGD",
        category: "cpf",
        direction: "credit",
        asset: "bonds",
      },
      row_confidence: 0.99,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "inv-3",
      normalized_payload: {
        date: `${prefix}-01`,
        description: "CPF Medisave contribution",
        amount: 430,
        currency: "SGD",
        category: "cpf",
        direction: "credit",
        asset: "bonds",
      },
      row_confidence: 0.99,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "inv-4",
      normalized_payload: {
        date: `${prefix}-05`,
        description: "Endowus fund top-up",
        amount: 500,
        currency: "SGD",
        category: "investment",
        direction: "debit",
        asset: "bonds",
      },
      row_confidence: 0.95,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "inv-5",
      normalized_payload: {
        date: `${prefix}-08`,
        description: "SRS contribution — DBS",
        amount: 800,
        currency: "SGD",
        category: "investment",
        direction: "debit",
        asset: "bonds",
      },
      row_confidence: 0.96,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "inv-6",
      normalized_payload: {
        date: `${prefix}-10`,
        description: "T-bills maturity payout",
        amount: 5040,
        currency: "SGD",
        category: "interest",
        direction: "credit",
        asset: "bonds",
      },
      row_confidence: 0.98,
      validation_flags: ["large_credit"],
      state: "pending",
    },
    {
      row_id: "inv-7",
      normalized_payload: {
        date: `${prefix}-12`,
        description: "Syfe REIT+ auto-invest",
        amount: 300,
        currency: "SGD",
        category: "investment",
        direction: "debit",
        asset: "stocks",
      },
      row_confidence: 0.93,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "inv-8",
      normalized_payload: {
        date: `${prefix}-15`,
        description: "Endowus cash management return",
        amount: 14.2,
        currency: "SGD",
        category: "interest",
        direction: "credit",
        asset: "bonds",
      },
      row_confidence: 0.94,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "inv-9",
      normalized_payload: {
        date: `${prefix}-20`,
        description: "StashAway Simple payout",
        amount: 22.5,
        currency: "SGD",
        category: "interest",
        direction: "credit",
        asset: "bonds",
      },
      row_confidence: 0.96,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "inv-10",
      normalized_payload: {
        date: `${prefix}-28`,
        description: "Property rental income",
        amount: 2800,
        currency: "SGD",
        category: "income",
        direction: "credit",
        asset: "property",
      },
      row_confidence: 0.91,
      validation_flags: ["large_credit"],
      state: "pending",
    },
  ],

  expenses: (prefix) => [
    {
      row_id: "exp-1",
      normalized_payload: {
        date: `${prefix}-01`,
        description: "Cold Storage weekly grocery",
        amount: 112.4,
        currency: "SGD",
        category: "groceries",
        direction: "debit",
        asset: "cash",
      },
      row_confidence: 0.94,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "exp-2",
      normalized_payload: {
        date: `${prefix}-02`,
        description: "Grab ride to airport",
        amount: 38.7,
        currency: "SGD",
        category: "transport",
        direction: "debit",
        asset: "cash",
      },
      row_confidence: 0.96,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "exp-3",
      normalized_payload: {
        date: `${prefix}-03`,
        description: "FairPrice Finest groceries",
        amount: 68.9,
        currency: "SGD",
        category: "groceries",
        direction: "debit",
        asset: "cash",
      },
      row_confidence: 0.93,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "exp-4",
      normalized_payload: {
        date: `${prefix}-05`,
        description: "Dentist — Raffles Medical",
        amount: 180,
        currency: "SGD",
        category: "healthcare",
        direction: "debit",
        asset: "cash",
      },
      row_confidence: 0.9,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "exp-5",
      normalized_payload: {
        date: `${prefix}-07`,
        description: "Uniqlo clothing purchase",
        amount: 89.9,
        currency: "SGD",
        category: "shopping",
        direction: "debit",
        asset: "cash",
      },
      row_confidence: 0.92,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "exp-6",
      normalized_payload: {
        date: `${prefix}-09`,
        description: "Spotify Premium",
        amount: 9.99,
        currency: "SGD",
        category: "entertainment",
        direction: "debit",
        asset: "cash",
      },
      row_confidence: 0.99,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "exp-7",
      normalized_payload: {
        date: `${prefix}-11`,
        description: "Restaurant — Odette",
        amount: 320,
        currency: "SGD",
        category: "dining",
        direction: "debit",
        asset: "cash",
      },
      row_confidence: 0.88,
      validation_flags: ["large_spend"],
      state: "pending",
    },
    {
      row_id: "exp-8",
      normalized_payload: {
        date: `${prefix}-13`,
        description: "Petrol — SPC Jurong",
        amount: 74.5,
        currency: "SGD",
        category: "transport",
        direction: "debit",
        asset: "cash",
      },
      row_confidence: 0.95,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "exp-9",
      normalized_payload: {
        date: `${prefix}-16`,
        description: "Guardian pharmacy",
        amount: 34.8,
        currency: "SGD",
        category: "healthcare",
        direction: "debit",
        asset: "cash",
      },
      row_confidence: 0.93,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "exp-10",
      normalized_payload: {
        date: `${prefix}-18`,
        description: "Lazada online shopping",
        amount: 156.7,
        currency: "SGD",
        category: "shopping",
        direction: "debit",
        asset: "cash",
      },
      row_confidence: 0.91,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "exp-11",
      normalized_payload: {
        date: `${prefix}-22`,
        description: "BreadTalk breakfast",
        amount: 8.5,
        currency: "SGD",
        category: "food",
        direction: "debit",
        asset: "cash",
      },
      row_confidence: 0.97,
      validation_flags: [],
      state: "pending",
    },
    {
      row_id: "exp-12",
      normalized_payload: {
        date: `${prefix}-25`,
        description: "Gym membership — Anytime Fitness",
        amount: 68,
        currency: "SGD",
        category: "health",
        direction: "debit",
        asset: "cash",
      },
      row_confidence: 0.98,
      validation_flags: [],
      state: "pending",
    },
  ],
};

function getMockRows(source = 'bank', offsetMonths = 0) {
  const now = new Date()
  now.setMonth(now.getMonth() + offsetMonths)
  const year  = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const prefix = `${year}-${month}`
  const generator = MOCK_DATA[source] ?? MOCK_DATA.bank
  return generator(prefix)
}


function toRows(rawRows) {
  if (!Array.isArray(rawRows)) return [];
  return rawRows.map((row, index) => {
    const payload = row.normalized_payload ?? row.normalizedPayload ?? {};
    return {
      id: row.id ?? row.row_id ?? row.rowId ?? `local-${index}`,
      normalizedPayload: {
        ...payload,
        category: payload.category
          ? payload.category.charAt(0).toUpperCase() + payload.category.slice(1)
          : payload.category,
      },
      fieldConfidence: row.field_confidence ?? row.fieldConfidence ?? {},
      rowConfidence: row.row_confidence ?? row.rowConfidence ?? null,
      validationFlags: row.validation_flags ?? row.validationFlags ?? [],
      state: row.state ?? "pending",
      raw: row,
    };
  });
}

function extractBalancedJsonObject(text) {
  const start = text.indexOf("{");
  if (start < 0) return null;
  let depth = 0,
    inString = false,
    escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"') inString = !inString;
    if (inString) continue;
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function recoverRowsFromRowsArrayText(text) {
  const marker = text.search(/"rows"\s*:\s*\[/);
  if (marker < 0) return [];
  const start = text.indexOf("[", marker);
  if (start < 0) return [];
  const rows = [];
  let depth = 0,
    objectStart = -1,
    inString = false,
    escaped = false;
  for (let i = start + 1; i < text.length; i++) {
    const ch = text[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"') inString = !inString;
    if (inString) continue;
    if (ch === "{") {
      if (depth === 0) objectStart = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && objectStart >= 0) {
        try {
          rows.push(JSON.parse(text.slice(objectStart, i + 1)));
        } catch (error) {
          console.log("Failed to parse row JSON:", error);
        }
      }
    }
  }
  return rows;
}

function parseRowsFromModelText(modelText) {
  if (typeof modelText !== "string" || !modelText.trim()) return [];
  const stripped = modelText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  try {
    const parsed = JSON.parse(stripped);
    if (Array.isArray(parsed?.rows)) return parsed.rows;
  } catch {}
  const balanced = extractBalancedJsonObject(stripped);
  if (balanced) {
    try {
      const parsed = JSON.parse(balanced);
      if (Array.isArray(parsed?.rows)) return parsed.rows;
    } catch {}
  }
  return recoverRowsFromRowsArrayText(stripped);
}

const STATE_PILL = {
  approved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  rejected: "bg-red-50   text-red-600   border border-red-200",
  edited: "bg-blue-50  text-blue-700  border border-blue-200",
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
};

const DIRECTION_COLOR = {
  credit: "text-emerald-600",
  debit: "text-red-500",
};

export default function Overlay({
  onSaveSuccess,
  externalOpen,
  onExternalClose,
}) {
  const { user } = useAuthContext();
  const uid = user?.uid ?? "";

  const [internalOpen, setInternalOpen] = useState(false);
  const isOverlayOpen = externalOpen || internalOpen;
  const setIsOverlayOpen = (val) => {
    setInternalOpen(val);
    if (!val) {
      resetState();
      onExternalClose?.();
    }
  };

  useEffect(() => {
    if (!isOverlayOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOverlayOpen]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [source, setSource] = useState("bank");
  const [jobId, setJobId] = useState("");
  const [rows, setRows] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [editRowId, setEditRowId] = useState(null);
  const [editPayloadDraft, setEditPayloadDraft] = useState("");
  const [isSavingToFirebase, setIsSavingToFirebase] = useState(false);
  const [firebaseSaveResult, setFirebaseSaveResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [filterState, setFilterState] = useState("all");
  const [mockMonthOffset, setMockMonthOffset] = useState(0);

  // Add this function after all your useState declarations
  const resetState = () => {
    setSelectedFile(null);
    setSource("bank");
    setJobId("");
    setRows([]);
    setIsProcessing(false);
    setErrorMessage("");
    setInfoMessage("");
    setEditRowId(null);
    setEditPayloadDraft("");
    setIsSavingToFirebase(false);
    setFirebaseSaveResult(null);
    setToast(null);
    setFilterState("all");
    setMockMonthOffset(0);
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (type, message) => setToast({ type, message });

  const tableColumns = useMemo(() => {
    const seen = new Set(REVIEWABLE_KEYS);
    rows.forEach((row) =>
      Object.keys(row.normalizedPayload || {}).forEach((k) => seen.add(k)),
    );
    return Array.from(seen).slice(0, 8);
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (filterState === "all") return rows;
    return rows.filter((r) => r.state === filterState);
  }, [rows, filterState]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      approved: rows.filter((r) => r.state === "approved").length,
      rejected: rows.filter((r) => r.state === "rejected").length,
      pending: rows.filter((r) => r.state === "pending").length,
      edited: rows.filter((r) => r.state === "edited").length,
    }),
    [rows],
  );

  const allReviewed = rows.length > 0 && stats.pending === 0;
  const canSave = stats.approved + stats.edited > 0;

  const approveRow = (rowId) =>
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, state: "approved" } : r)),
    );
  const rejectRow = (rowId) =>
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, state: "rejected" } : r)),
    );
  const skipRow = (rowId) =>
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, state: "pending" } : r)),
    );
  const approveAll = () =>
    setRows((prev) =>
      prev.map((r) =>
        r.state === "pending" ? { ...r, state: "approved" } : r,
      ),
    );
  const rejectAll = () =>
    setRows((prev) =>
      prev.map((r) =>
        r.state === "pending" ? { ...r, state: "rejected" } : r,
      ),
    );

  const beginEditRow = (row) => {
    setEditRowId(row.id);
    setEditPayloadDraft(JSON.stringify(row.normalizedPayload ?? {}, null, 2));
  };

  const saveEditRow = () => {
    if (!editRowId) return;
    let parsedDraft;
    try {
      parsedDraft = JSON.parse(editPayloadDraft);
    } catch {
      setErrorMessage("Invalid JSON. Fix and try again.");
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        r.id === editRowId
          ? { ...r, normalizedPayload: parsedDraft, state: "edited" }
          : r,
      ),
    );
    setEditRowId(null);
    setEditPayloadDraft("");
  };

  const recoverRowsFromArtifacts = async (currentJobId) => {
    if (!currentJobId) return false;
    const response = await fetch(
      `${API_BASE_URL}/v1/jobs/${currentJobId}/artifacts`,
    );
    if (!response.ok) return false;
    const payload = await response.json();
    const artifacts = payload?.artifacts;
    if (!artifacts || typeof artifacts !== "object") return false;
    const qwenModelText = Object.values(artifacts)
      .map((e) => e?.qwenvl?.raw_response?.model_text)
      .find((t) => typeof t === "string" && t.length > 0);
    const recoveredRows = parseRowsFromModelText(qwenModelText);
    if (!Array.isArray(recoveredRows) || recoveredRows.length === 0)
      return false;
    setRows(
      toRows(
        recoveredRows.map((row, i) => ({
          row_id: `recovered-${currentJobId}-${i}`,
          normalized_payload: row,
          row_confidence: null,
          validation_flags: ["recovered"],
          state: "pending",
        })),
      ),
    );
    setInfoMessage(
      `Recovered ${recoveredRows.length} row(s) from model output.`,
    );
    return true;
  };

  const handleUploadAndParse = async () => {
    if (!selectedFile) {
      setErrorMessage("Please select a file first.");
      return;
    }
    setIsProcessing(true);
    setErrorMessage("");
    setInfoMessage("");
    setRows([]);
    setFirebaseSaveResult(null);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("source", source);
    formData.append("user_id", uid);
    try {
      const res = await fetch(`${API_BASE_URL}/v1/documents/upload-and-parse`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error((await res.text()) || "Upload failed.");
      const payload = await res.json();
      const returnedJobId = payload.job?.id ?? payload.job_id ?? "";
      setJobId(returnedJobId);
      const parsedRows = toRows(payload.rows);
      setRows(parsedRows);
      if (parsedRows.length === 0 && returnedJobId)
        await recoverRowsFromArtifacts(returnedJobId);
      showToast(
        "success",
        `${parsedRows.length} rows parsed. Review each row before saving.`,
      );
    } catch (err) {
      const msg =
        err instanceof TypeError
          ? `Cannot reach backend at ${API_BASE_URL}.`
          : err.message;
      setErrorMessage(msg);
      showToast("error", msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const refreshRows = async () => {
    if (!jobId) return;
    setIsProcessing(true);
    setErrorMessage("");
    try {
      const res = await fetch(`${API_BASE_URL}/v1/jobs/${jobId}/rows`);
      if (!res.ok) throw new Error((await res.text()) || "Failed.");
      const payload = await res.json();
      const parsedRows = toRows(
        Array.isArray(payload) ? payload : payload.rows,
      );
      setRows(parsedRows);
      if (parsedRows.length === 0) await recoverRowsFromArtifacts(jobId);
    } catch (err) {
      setErrorMessage(
        err instanceof TypeError ? "Cannot reach backend." : err.message,
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const saveToFirebase = async () => {
    const rowsToSave = rows.filter((r) => r.state !== "rejected");
    if (!rowsToSave.length) {
      setErrorMessage("No rows to save.");
      return;
    }
    setIsSavingToFirebase(true);
    setErrorMessage("");
    try {
      const { statementId, transactionCount, statementData } =
        await ingestStatementToFirestore(
          uid,
          selectedFile ?? null,
          rowsToSave,
          {
            sourceType: source,
            platform: source,
            currency: rowsToSave[0]?.normalizedPayload?.currency ?? "SGD",
          },
        );
      const wellness = await recomputeWellness(uid);
      const historyEntry = await upsertNetWorthHistory(
        uid,
        new Date(),
        wellness.key_metrics?.net_worth ?? 0,
      );
      setFirebaseSaveResult({
        statement: { id: statementId, ...statementData },
        wellness,
        historyEntry,
      });
      showToast(
        "success",
        `${transactionCount} transactions saved · Wellness ${wellness.overall_score ?? "–"}`,
      );

      onSaveSuccess?.();
      setTimeout(() => setIsOverlayOpen(false), 1500);
    } catch (err) {
      showToast("error", "Save failed: " + (err.message || "Unknown error"));
    } finally {
      setIsSavingToFirebase(false);
    }
  };

  const handleLoadMockData = () => {
    setErrorMessage("");
    setInfoMessage("");
    setFirebaseSaveResult(null);

    const currentOffset = mockMonthOffset; // ← snapshot before increment

    const mockRows = toRows(getMockRows(source, currentOffset));
    setRows(mockRows);
    setJobId("mock-job-" + Date.now());
    setMockMonthOffset(currentOffset + 1); // ← increment using snapshot

    const labelDate = new Date();
    labelDate.setMonth(labelDate.getMonth() + currentOffset);
    const label = labelDate.toLocaleString("en-SG", {
      month: "long",
      year: "numeric",
    });
    showToast(
      "success",
      `${mockRows.length} mock rows loaded for ${label} (${source}).`,
    );
  };

  if (!isOverlayOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOverlayOpen(true)}
        className="fixed right-5 bottom-5 z-50 flex items-center gap-2.5 rounded-2xl bg-[#2081C3] px-5 py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.03] hover:bg-[#1a6faa] active:scale-[0.98]"
        style={{ boxShadow: "0 4px 20px rgba(32,129,195,0.35)" }}
      >
        <Upload className="h-4 w-4" />
        Upload Statement
      </button>
    );
  }

  return createPortal(
    <>
      {/* FAB hidden when open */}
      <div
        className="fixed inset-0 z-[100] overflow-y-auto bg-black/30 backdrop-blur-[2px]"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex min-h-full items-start justify-center px-4 py-6">
          <div
            className="w-full max-w-6xl rounded-2xl bg-white shadow-2xl overflow-hidden"
            style={{ border: "1px solid #E5EAF2" }}
          >
            {/* ── Toast ── */}
            {toast && (
              <div
                className={`flex items-center justify-between px-5 py-2.5 text-xs font-medium border-b ${
                  toast.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                    : "bg-red-50 text-red-700 border-red-100"
                }`}
              >
                <span className="flex items-center gap-2">
                  {toast.type === "success" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                  )}
                  {toast.message}
                </span>
                <button
                  onClick={() => setToast(null)}
                  className="opacity-40 hover:opacity-80 text-[11px]"
                >
                  ✕
                </button>
              </div>
            )}

            {/* ── Modal header ── */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{
                background: "linear-gradient(135deg, #1a6faa 0%, #2081C3 100%)",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Document Ingestion & Review
                  </h2>
                  <p className="text-xs text-blue-100/80">
                    Upload · Parse · Review · Save
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOverlayOpen(false)}
                className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 transition hover:bg-white/20"
              >
                <X className="h-3.5 w-3.5" /> Close
              </button>
            </div>

            {/* ── Step 1: Upload controls ── */}
            <div
              className="border-b px-6 py-4"
              style={{ borderColor: "#E5EAF2", background: "#F8FAFF" }}
            >
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Step 1 — Upload & Parse
              </p>
              <div className="flex flex-wrap items-end gap-3">
                {/* Source dropdown */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-gray-500">
                    Source type
                  </label>
                  <div className="relative">
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      className="appearance-none rounded-lg border bg-white pl-3 pr-8 py-2 text-xs font-medium text-gray-700 outline-none focus:border-[#2081C3] focus:ring-2 focus:ring-[#2081C3]/10 cursor-pointer"
                      style={{ borderColor: "#D0D9E8" }}
                    >
                      <option value="bank">🏦 Bank</option>
                      <option value="broker">📈 Broker</option>
                      <option value="crypto">₿ Crypto</option>
                      <option value="expenses">💳 Expenses</option>
                      <option value="other">📁 Other</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-3 w-3 text-gray-400" />
                  </div>
                </div>

                {/* File input */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-gray-500">
                    Statement file
                  </label>
                  <div
                    className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs cursor-pointer transition hover:border-[#2081C3]"
                    style={{ borderColor: "#D0D9E8" }}
                  >
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Upload className="h-3.5 w-3.5 text-[#2081C3]" />
                      <span
                        className={
                          selectedFile
                            ? "text-gray-700 font-medium max-w-[160px] truncate"
                            : "text-gray-400"
                        }
                      >
                        {selectedFile ? selectedFile.name : "Choose file…"}
                      </span>
                      <input
                        type="file"
                        onChange={(e) =>
                          setSelectedFile(e.target.files?.[0] ?? null)
                        }
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Parse button */}
                <button
                  onClick={handleUploadAndParse}
                  disabled={isProcessing}
                  className="flex items-center gap-2 rounded-lg bg-[#2081C3] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1a6faa] disabled:opacity-50 shadow-sm"
                  style={{ boxShadow: "0 1px 8px rgba(32,129,195,0.25)" }}
                >
                  {isProcessing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  {isProcessing ? "Parsing…" : "Upload & Parse"}
                </button>

                {/* Divider */}
                <div className="h-8 w-px bg-gray-200" />

                {/* Mock data */}
                <button
                  onClick={handleLoadMockData}
                  disabled={isProcessing}
                  className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 disabled:opacity-50"
                  style={{ borderColor: "#F6C87A" }}
                >
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  Load Mock Data
                </button>

                {/* Job ID */}
                <div className="flex flex-col gap-1 ml-auto">
                  <label className="text-[11px] font-semibold text-gray-500">
                    Job ID (optional)
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      value={jobId}
                      onChange={(e) => setJobId(e.target.value)}
                      placeholder="Paste existing job id"
                      className="w-44 rounded-lg border bg-white px-3 py-2 text-xs text-gray-700 placeholder-gray-300 outline-none focus:border-[#2081C3]"
                      style={{ borderColor: "#D0D9E8" }}
                    />
                    <button
                      onClick={refreshRows}
                      title="Load rows from job"
                      className="rounded-lg border bg-white px-2.5 py-2 text-gray-400 transition hover:bg-gray-50 hover:text-[#2081C3]"
                      style={{ borderColor: "#D0D9E8" }}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Inline messages */}
              {(errorMessage || infoMessage) && (
                <div
                  className={`mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                    errorMessage
                      ? "border-red-100 bg-red-50 text-red-600"
                      : "border-blue-100 bg-blue-50 text-blue-600"
                  }`}
                >
                  {errorMessage ? (
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  )}
                  {errorMessage || infoMessage}
                </div>
              )}
            </div>

            {/* ── Step 2: Review banner ── */}
            {rows.length > 0 && (
              <div
                className={`flex flex-wrap items-center gap-3 border-b px-6 py-3 ${
                  allReviewed
                    ? "bg-emerald-50 border-emerald-100"
                    : "bg-amber-50 border-amber-100"
                }`}
              >
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mr-2">
                  Step 2 — Review
                </p>

                {/* Stat pills */}
                <div className="flex items-center gap-1.5">
                  {[
                    {
                      label: `${stats.total} total`,
                      bg: "bg-white border-gray-200 text-gray-600",
                    },
                    {
                      label: `${stats.pending} pending`,
                      bg:
                        stats.pending > 0
                          ? "bg-amber-100 border-amber-300 text-amber-800 font-bold"
                          : "bg-white border-gray-200 text-gray-400",
                    },
                    {
                      label: `${stats.approved} approved`,
                      bg: "bg-emerald-50 border-emerald-200 text-emerald-700",
                    },
                    {
                      label: `${stats.edited} edited`,
                      bg: "bg-blue-50 border-blue-200 text-blue-700",
                    },
                    {
                      label: `${stats.rejected} rejected`,
                      bg: "bg-red-50 border-red-200 text-red-600",
                    },
                  ].map(({ label, bg }) => (
                    <span
                      key={label}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${bg}`}
                    >
                      {label}
                    </span>
                  ))}
                </div>

                {/* Bulk action buttons */}
                {stats.pending > 0 && (
                  <div className="flex items-center gap-2 ml-2">
                    <button
                      onClick={approveAll}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-emerald-500 shadow-sm"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Approve all pending
                    </button>
                    <button
                      onClick={rejectAll}
                      className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <XCircle className="h-3 w-3" />
                      Reject all pending
                    </button>
                  </div>
                )}

                {/* Save — Step 3 */}
                <div className="ml-auto flex items-center gap-3">
                  {!allReviewed && (
                    <p className="text-[11px] text-amber-700">
                      Review all {stats.pending} pending row
                      {stats.pending !== 1 ? "s" : ""} before saving
                    </p>
                  )}
                  {allReviewed && canSave && !firebaseSaveResult && (
                    <p className="text-[11px] text-emerald-700 font-medium">
                      ✓ {stats.approved + stats.edited} row
                      {stats.approved + stats.edited !== 1 ? "s" : ""} ready to
                      save
                    </p>
                  )}
                  <button
                    onClick={saveToFirebase}
                    disabled={isSavingToFirebase || !allReviewed || !canSave}
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                    style={{
                      background:
                        allReviewed && canSave ? "#059669" : "#9CA3AF",
                      boxShadow:
                        allReviewed && canSave
                          ? "0 1px 8px rgba(5,150,105,0.3)"
                          : "none",
                    }}
                    title={
                      !allReviewed
                        ? "Approve or reject all pending rows first"
                        : ""
                    }
                  >
                    {isSavingToFirebase ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    {isSavingToFirebase ? "Saving…" : "Save to Firebase"}
                  </button>
                </div>
              </div>
            )}

            {/* Save success bar */}
            {firebaseSaveResult && (
              <div className="flex items-center gap-3 border-b border-emerald-100 bg-emerald-50 px-6 py-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <p className="text-xs font-semibold text-emerald-700">
                  Saved to Firebase
                </p>
                <span className="text-xs text-emerald-600">
                  Wellness score:{" "}
                  {firebaseSaveResult.wellness?.overall_score ?? "–"} · Net
                  worth: S$
                  {(
                    firebaseSaveResult.wellness?.key_metrics?.net_worth ?? 0
                  ).toLocaleString()}
                </span>
              </div>
            )}

            {/* ── Filter tabs + row count ── */}
            {rows.length > 0 && (
              <div
                className="flex items-center gap-0.5 border-b px-5 py-0"
                style={{ borderColor: "#E5EAF2" }}
              >
                {["all", "pending", "approved", "edited", "rejected"].map(
                  (state) => {
                    const count =
                      state === "all"
                        ? stats.total
                        : state === "pending"
                          ? stats.pending
                          : state === "approved"
                            ? stats.approved
                            : state === "edited"
                              ? stats.edited
                              : stats.rejected;
                    return (
                      <button
                        key={state}
                        onClick={() => setFilterState(state)}
                        className={`relative px-4 py-3 text-xs font-semibold capitalize transition border-b-2 ${
                          filterState === state
                            ? "border-[#2081C3] text-[#2081C3]"
                            : "border-transparent text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        {state}
                        <span
                          className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                            filterState === state
                              ? "bg-[#2081C3]/10 text-[#2081C3]"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  },
                )}
                <span className="ml-auto pr-4 text-[11px] text-gray-300">
                  {filteredRows.length} row
                  {filteredRows.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}

            {/* ── Table ── */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead style={{ background: "#F8FAFF" }}>
                  <tr style={{ borderBottom: "1px solid #E5EAF2" }}>
                    {tableColumns.map((col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-400"
                      >
                        {col}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                      Score
                    </th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                      Flags
                    </th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                      Status
                    </th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, i) => (
                    <tr
                      key={row.id}
                      className={`group transition-colors ${
                        i % 2 === 0 ? "bg-white" : "bg-[#FAFBFF]"
                      } ${row.state === "rejected" ? "opacity-40" : ""} hover:bg-blue-50/40`}
                      style={{ borderBottom: "1px solid #F0F4FA" }}
                    >
                      {tableColumns.map((col) => {
                        const val = row.normalizedPayload?.[col];
                        const isAmount = col === "amount";
                        const isDirection = col === "direction";
                        const dirColor =
                          DIRECTION_COLOR[row.normalizedPayload?.direction] ??
                          "text-gray-700";
                        return (
                          <td
                            key={`${row.id}-${col}`}
                            className="px-4 py-2.5 text-xs max-w-[160px]"
                          >
                            {isAmount ? (
                              <span
                                className={`font-semibold tabular-nums ${dirColor}`}
                              >
                                {row.normalizedPayload?.direction === "debit"
                                  ? "−"
                                  : "+"}
                                {Number(val ?? 0).toLocaleString("en-SG", {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                            ) : isDirection ? (
                              <span
                                className={`font-medium capitalize ${dirColor}`}
                              >
                                {String(val ?? "—")}
                              </span>
                            ) : (
                              <span className="text-gray-700 line-clamp-1">
                                {String(val ?? "—")}
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Score */}
                      <td className="px-4 py-2.5 text-xs">
                        {row.rowConfidence == null ? (
                          <span className="text-gray-300">—</span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-12 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${Number(row.rowConfidence) >= 0.9 ? "bg-emerald-400" : "bg-amber-400"}`}
                                style={{
                                  width: `${Number(row.rowConfidence) * 100}%`,
                                }}
                              />
                            </div>
                            <span
                              className={`tabular-nums font-medium ${Number(row.rowConfidence) >= 0.9 ? "text-emerald-600" : "text-amber-600"}`}
                            >
                              {Math.round(Number(row.rowConfidence) * 100)}%
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Flags */}
                      <td className="px-4 py-2.5 text-xs">
                        {row.validationFlags?.length > 0 ? (
                          row.validationFlags.map((f) => (
                            <span
                              key={f}
                              className="inline-block rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 mr-1"
                            >
                              {f}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-200">—</span>
                        )}
                      </td>

                      {/* Status pill */}
                      <td className="px-4 py-2.5">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${STATE_PILL[row.state] ?? STATE_PILL.pending}`}
                        >
                          {row.state}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => approveRow(row.id)}
                            disabled={row.state === "approved"}
                            title="Approve"
                            className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-25 disabled:cursor-default"
                          >
                            <CheckCircle className="h-3 w-3" /> Approve
                          </button>
                          <button
                            onClick={() => rejectRow(row.id)}
                            disabled={row.state === "rejected"}
                            title="Reject"
                            className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-25 disabled:cursor-default"
                          >
                            <XCircle className="h-3 w-3" /> Reject
                          </button>
                          <button
                            onClick={() => beginEditRow(row)}
                            title="Edit"
                            className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50"
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </button>
                          {row.state !== "pending" && (
                            <button
                              onClick={() => skipRow(row.id)}
                              title="Reset to pending"
                              className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-400 transition hover:bg-gray-50"
                            >
                              <SkipForward className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={tableColumns.length + 4}
                        className="py-16 text-center"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-8 w-8 text-gray-200" />
                          <p className="text-sm font-medium text-gray-400">
                            {rows.length === 0
                              ? "Upload a file or load mock data to get started."
                              : `No ${filterState} rows.`}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom padding */}
            <div className="h-4" />
          </div>
        </div>
      </div>

      {/* ── Edit modal ── */}
      {editRowId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-5">
          <div
            className="w-full max-w-xl rounded-2xl border bg-white p-6 shadow-2xl"
            style={{ borderColor: "#E5EAF2" }}
          >
            <h4 className="mb-0.5 text-sm font-black text-gray-900">
              Edit Transaction
            </h4>
            <p className="mb-4 text-xs text-gray-400">
              Modify the JSON payload. Changes mark this row as <em>edited</em>.
            </p>
            <textarea
              value={editPayloadDraft}
              onChange={(e) => setEditPayloadDraft(e.target.value)}
              className="h-64 w-full rounded-xl border bg-gray-50 p-4 font-mono text-xs text-gray-800 outline-none focus:border-[#2081C3] focus:ring-2 focus:ring-[#2081C3]/10"
              style={{ borderColor: "#D0D9E8" }}
              spellCheck={false}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditRowId(null);
                  setEditPayloadDraft("");
                }}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveEditRow}
                className="rounded-xl bg-[#2081C3] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a6faa]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}
