# 🚀 DeFi Wealth Hub

![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite_7-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Firebase](https://img.shields.io/badge/Firebase_12-ffca28?style=for-the-badge&logo=firebase&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Groq](https://img.shields.io/badge/Groq_AI-f3f4f6?style=for-the-badge&logoColor=f97316)
![InternVL](https://img.shields.io/badge/InternVL-000000?style=for-the-badge&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-22b5bf?style=for-the-badge&logoColor=white)

> **A privacy-first AI financial cockpit** that helps users upload, parse, understand, and act on their financial data across banking, crypto, and investments — without ever sharing passwords or connecting bank accounts.

---

## 👨‍💻 The Team

Designed and developed by students from **Nanyang Technological University (NTU)**:

| Name | Major | GitHub |
| :--- | :--- | :--- |
| **Nicholas** | Computer Science | [@nicolotan](https://github.com/nicolotan) |
| **Izzan** | Computer Science | [@zanceballos](https://github.com/zanceballos) |
| **Kang** | Computer Science | [@lowkangxuan](https://github.com/lowkangxuan) |
| **Li Zhong** | Electrical & Electronic Engineering | [@Shoterz](https://github.com/Shoterz) |
| **Zheng Rong** | Computer Engineering | [@Caspian616](https://github.com/Caspian616) |

---

## 💡 The Problem

Personal finance data is **fragmented**. Users juggle bank statements, crypto exchange reports, and investment summaries across multiple platforms. Existing solutions fall short:

| Existing Tools | The Gap |
| :--- | :--- |
| Mint, Plaid-based apps | Force you to hand over **bank login credentials** |
| Crypto portfolio trackers | Only cover digital assets — no TradFi |
| Spreadsheet templates | Manual, error-prone, no intelligence layer |
| Robo-advisors | Black-box recommendations, zero transparency |

## ✅ Our Solution

DeFi Wealth Hub takes a fundamentally different approach — **deliberate, user-controlled ingestion**:

```
┌──────────────┐     ┌────────────────┐     ┌──────────────────┐     ┌────────────────┐
│  Upload File │────▶│  AI Parsing +  │────▶│  Human Review &  │────▶│  Unified       │
│  (PDF/CSV)   │     │  Structuring   │     │  Approval        │     │  Dashboard     │
└──────────────┘     └────────────────┘     └──────────────────┘     └────────────────┘
                                                                            │
                                                                            ▼
                                                                     ┌────────────────┐
                                                                     │  AI Advisory   │
                                                                     │  (Groq LLM)    │
                                                                     └────────────────┘
```

- **No bank credentials required** — you upload statements on your own terms
- **Human-in-the-loop** — review, edit, or reject every parsed row before it touches your analytics
- **TradFi + DeFi in one place** — bank, broker, crypto, and investment statements unified
- **Explainable AI** — every insight links back to specific data points, not black-box guesses
- **Privacy by design** — you always see exactly what data is stored and how it's used

---

## ✨ Features

### 📊 Unified Multi-Asset Dashboard

A three-tab command centre for your entire financial life.

| Tab | What It Shows |
| :--- | :--- |
| **Overview** | Net worth history chart, overall wellness score, four financial health pillars (Liquidity, Diversification, Risk Match, Digital Health), savings rate, hero stat cards, **editable monthly income** (inline edit with auto-wellness recalc) |
| **Budgeting** | **Persistent monthly budget** (saved to Firestore), category spending breakdown, emergency savings tracker (6× expenses target), recent transactions with merchant detection, **transaction exclude/restore** (fingerprint-based), Gmail sync controls, email transaction review (pending/approved/rejected tabs) |
| **Wallet** | Platform-level asset allocation pie chart, per-platform rows with risk labels (Core / Stable / Growth / Speculative), regulated vs. unregulated exposure |

- All data is **live from Firestore** — every upload refreshes your numbers in real time
- **Empty-state guidance** when no data exists yet, guiding users to their first upload
- Responsive glass-morphism UI inspired by DBS digibank with Tailwind CSS 4

### 🧠 AI-Powered Wealth Advisory

A dedicated `/advisory` page powered by **Groq AI (Llama 3.3 70B)** that turns raw financial data into structured, actionable guidance.

**How it works:**

```
Firestore Data ──▶ Payload Builder ──▶ Groq LLM ──▶ Structured JSON ──▶ Advisory UI
```

1. **Payload Builder** (`advisoryPayloadBuilder.js`) — collects profile, statements, wellness scores, and net worth history into a clean, null-safe JSON payload
2. **Groq Service** (`groqAdvisoryService.js`) — sends the payload to the Groq chat-completions API with a detailed financial-planner system prompt, enforces strict JSON output schema
3. **Advisory Page** — renders the structured response as:
   - **Hero card** with headline, risk level badge, and wellness score
   - **Financial Health Pillars** radar chart (Recharts) with four pillar progress cards
   - **Snapshot cards** — net worth, cash buffer months, platform count
   - **Key Insights** — colour-coded cards by severity (positive / neutral / warning / critical)
   - **Recommended Actions** — prioritised numbered steps
   - **Education accordion** — expandable learn-more topics
   - **Data-used footer** — shows which statements fed the advisory

**Rate-limit aware:** Results are cached in `sessionStorage` so the LLM is called **only once per browser session**. Users manually refresh after uploading new data.

### 📑 Statement Ingestion Pipeline

A robust, multi-step document workflow that keeps the human in control at every stage.

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   File       │     │   Parse with     │     │   Review Table   │     │   Save to        │
│   Upload     │────▶│   InternVL AI    │────▶│   (edit/skip/    │────▶│   Firestore      │
│              │     │                  │     │    approve rows)  │     │                  │
└──────────────┘     └──────────────────┘     └──────────────────┘     └──────────────────┘
                                                                             │
                                                                             ▼
                                                                    ┌──────────────────┐
                                                                    │  Recompute       │
                                                                    │  Wellness +      │
                                                                    │  Net Worth       │
                                                                    └──────────────────┘
```

- **Flexible uploads** — bank statements, broker reports, crypto exchange CSVs, expense summaries
- **Smart parsing** — rows are normalised with category, merchant detection, credit/debit classification
- **Review overlay** — a slide-in modal (rendered via React Portal to avoid z-index issues) lets you approve, edit, or skip each parsed row
- **Firestore write** — approved rows become documents in `/users/{uid}/statements/{id}/transactions/` subcollection
- **Auto-recompute** — wellness scores, pillar scores, and net worth history update immediately after save

### 💰 Budgeting & Expense Tracking

Turn parsed transaction data into practical budget signals.

- **Persistent monthly budget** — user-set budget saved to Firestore; falls back to `monthly_expenses` if unset
- **Budget progress bar** — spent this month vs. budget, remaining amount
- **Emergency savings tracker** — target = monthly expenses × 6; current = cash-like assets; progress bar + percentage
- **Category spending** — visual progress bars for Food, Transport, Shopping, Entertainment, Utilities, etc.
- **Recent transactions** — merchant-tagged list with signed amounts and dates
- **Transaction exclude/restore** — fingerprint-based (`date#amount#description`); excluded tx hidden from budget calculations; reversible
- **Gmail sync controls** — link/unlink Gmail, manual sync button, last sync timestamp
- **Email transaction review** — pending/approved/rejected tabs with inline edit
- **Merchant detection** — auto-recognises Grab, NTUC, Shopee, Netflix, Spotify, and more from raw descriptions

### 👛 Wallet & Asset Allocation

Monitor your cross-platform wealth composition.

- **Asset breakdown** — Cash, Bonds, Stocks, Crypto, Property, Tokenised assets
- **Platform rows** — each uploaded statement becomes a trackable platform with value and risk label
- **Risk classification** — Core / Stable / Growth / Speculative labels per platform
- **Regulated vs. unregulated** — highlights exposure to MAS-regulated vs. unregulated platforms

### 🔐 Authentication & Onboarding

Secure, frictionless user lifecycle.

- **Firebase Auth** — email/password and Google OAuth sign-in
- **Protected routes** — all dashboard and advisory pages gated behind authentication
- **2-step onboarding** — collects name, then monthly income/expenses on first login
- **Persistent profile** — data saved to Firestore at `/users/{uid}`, automatically loaded on every session
- **Password reset** — dedicated `/forgot-password` page via Firebase password reset email

### 🔒 Privacy Hub

A dedicated `/privacy` page so users always understand their data footprint and have full control over their data.

- See exactly which documents were uploaded and from which institutions
- View what was parsed and what is actively used for analytics
- **Delete individual statements** — removes statement + all transactions in subcollection
- **Delete all statements** — batch delete all statements + subcollections
- **Delete all email transactions** — batch delete all email tx docs
- **Delete email transactions by date** — deletes only transactions for a specific date key
- **Full account reset** — deletes statements + email tx + wellness + net worth history + clears manual accounts
- **Gmail link/unlink** — shows connected email; link or revoke OAuth
- Post-delete auto-recalculation of wellness score and net worth

### 📧 Gmail Transaction Sync

Auto-import transaction alert emails from Singapore banks via Google OAuth.

```
User connects Gmail → OAuth token (gmail.readonly) → Query transaction emails
      → Parse with emailParser.js → Dedup against Firestore → Save new tx
```

- **Supported banks:** DBS, OCBC, UOB, MariBank, GrabPay, PayNow
- **Auto-polling:** Every 5 minutes if OAuth token is valid
- **Manual sync** button on Budgeting tab
- **Email transaction review:** Pending / Approved / Rejected tabs with inline edit, approve, reject
- **Deduplication** — Gmail message ID prevents duplicate imports
- **Firestore:** `/users/{uid}/emailTransactions/{txId}` with status, merchant, category, direction fields

### 📋 Manual Accounts & Investment Lots

First-time users can manually enter their financial accounts without uploading statements.

- **Bank accounts** — add accounts with name, type (Savings/Current), balance
- **Investment positions** — add assets with type (stocks_etfs/crypto) and purchase lots (date, quantity, average cost)
- Saved to `users/{uid}.manual_accounts = { accounts[], investments[] }`
- Auto-triggers `recalculateNetWorth()` after save

### 📈 Live Crypto & Stock Prices

Real-time price feeds via **yfinance** (open-source Python library, no API key required).

- Backend endpoint: `{VITE_MARKETDATA_BASE}/price/{ticker}`
- Default API: `https://yfinance-defi-api.stocksuite.app`
- In-memory cache with 5-minute TTL to avoid rate limiting
- Supports any ticker supported by yfinance (crypto, stocks, ETFs)

### 🔒 Tab Gating

- Budgeting and Wallet tabs are **locked with 🔒 icon** until user has accounts or statements
- Tooltip: "Complete onboarding to unlock"
- Defined in `src/features/dashboard/tabs.js` with `requiresAccounts: true`

---

## 🏗️ Architecture

```
src/
├── components/          # Shared UI — Navbar, ProtectedRoute, charts, FinancialHealthPillarsCard
├── context/             # AuthContext + AppContext providers
├── data/                # Mock data for development fallbacks
├── features/
│   └── dashboard/
│       ├── tabs.js      # Tab definitions + gating config (requiresAccounts)
│       └── components/  # OverviewTab, BudgetingTab, WalletTab, Overlay, EmptyState, EmailTransactionsSection
├── hooks/               # useAuth, useAuthContext, useFirestore, useDashboardData, useEmailTransactions, useGmailLink, usePrivacy, useUser
├── lib/                 # Firebase initialisation (auth, db, storage)
├── pages/               # Dashboard, AdvisoryPage, LoginPage, SignUpPage, OnboardingPage, Privacy, DocsPage, ForgetPasswordPage
└── services/
    ├── advisoryPayloadBuilder.js    # Firebase → Groq payload mapper
    ├── dashboardViewModel.js        # Pure data transforms for dashboard tabs + tx fingerprinting
    ├── emailParser.js               # Client-side email parser (DBS, OCBC, UOB, GrabPay, PayNow, MariBank)
    ├── emailTransactionService.js   # Email tx CRUD — approve, reject, edit, soft-delete
    ├── financialDataService.js      # Upload, wellness recompute, net worth history, full reset
    ├── gmailService.js              # Gmail OAuth + sync — token management, email fetch, dedup
    ├── groqAdvisoryService.js       # Groq API client with fallback + session cache
    ├── marketDataService.js         # yfinance price API client with in-memory 5-min cache
    └── statementIngestionService.js # Statement + transaction subcollection writer
```

### Data Flow

```
User uploads file
        │
        ▼
Overlay (parse + review)
        │
        ▼
statementIngestionService ──▶ Firestore:
        │                       /users/{uid}/statements/{id}
        │                       /users/{uid}/statements/{id}/transactions/{txId}
        ▼
financialDataService ───────▶ Firestore:
        │                       /users/{uid}/wellness/current
        │                       /users/{uid}/history/net_worth/items/{monthKey}
        ▼
useDashboardData (hook) ────▶ dashboardViewModel ──▶ React UI
        │
        ▼
advisoryPayloadBuilder ─────▶ groqAdvisoryService ──▶ AdvisoryPage UI
```

### Gmail Sync Data Flow

```
User clicks "Link Gmail"
        │
        ▼
gmailService.initiateGmailLink() ──▶ Google OAuth popup (gmail.readonly scope)
        │
        ▼
Saves gmailLinked=true + gmailEmail to Firestore /users/{uid}
        │
        ▼
gmailService.syncGmailTransactions(uid)
        │
        ├──▶ Gmail REST API (query: transaction/payment/receipt emails, last 7 days)
        │
        ├──▶ emailParser.parseTransactionEmail() per email
        │
        ├──▶ Dedup against existing /users/{uid}/emailTransactions (by emailId)
        │
        └──▶ Write new tx to Firestore /users/{uid}/emailTransactions/{txId}
                │
                ▼
        EmailTransactionsSection (Pending → Approve/Reject/Edit → affects budget)
```

### Market Data Flow

```
marketDataService.getYfPrice(ticker) ──▶ {VITE_MARKETDATA_BASE}/price/{ticker}
        │                                  (yfinance Python backend)
        ▼
        In-memory cache (5-min TTL) ──▶ Returns price or null
```

---

## Data Structure & Calculation Reference

This section documents the Firestore data model, how each metric is derived, and the scoring formulas that power the dashboard.

### Firestore Document Schema

```
/users/{uid}
│
├── name                    (string)   "John Doe"
├── monthly_income          (number)   4490
├── monthly_expenses        (number)   3458
├── monthly_budget          (number)   ← NEW: user-set persistent budget
├── riskProfile             (string)   "moderate"
├── location                (string)   "Singapore"
├── onboarding_complete     (boolean)  ← NEW
├── gmailLinked             (boolean)  ← NEW: Gmail OAuth connected
├── gmailEmail              (string)   ← NEW: connected Gmail address
├── gmailLinkedAt           (timestamp) ← NEW
├── lastGmailSync           (timestamp) ← NEW
├── excluded_tx_fingerprints (string[]) ← NEW: array of "date#amt#desc"
├── manual_accounts         (map)      ← NEW
│   ├── accounts[]             [{name, type, balance}]
│   └── investments[]          [{asset, type, lots: [{date, quantity, averageCost}]}]
│
├── /statements/{statementId}
│   ├── file_name                (string)   "DBS_Mar2026.pdf"
│   ├── source_type              (string)   "bank" | "crypto" | "broker" | "investment" | "expenses" | "other"
│   ├── platform                 (string)   "DBS"
│   ├── status                   (string)   "uploaded" | "parsed" | "approved"
│   ├── net_worth_contribution   (number)   12500
│   ├── liquidity_contribution   (number)   12500
│   ├── transactions_count       (number)   15
│   ├── parsed_data
│   │   ├── closing_balance      (number)   12500
│   │   ├── total_credits        (number)   3400
│   │   ├── total_debits         (number)   2100
│   │   ├── statement_month      (string)   "2026-03"
│   │   └── currency             (string)   "SGD"
│   ├── asset_class_breakdown
│   │   ├── cash                 (number)   12500
│   │   ├── stocks               (number)   0
│   │   ├── crypto               (number)   0
│   │   ├── bonds                (number)   0
│   │   ├── property             (number)   0
│   │   └── tokenised            (number)   0
│   │
│   └── /transactions/{txId}
│       ├── date          (string)   "2026-03-01"
│       ├── description   (string)   "GRAB TRANSPORT"
│       ├── amount        (number)   12.50
│       ├── direction     (string)   "debit" | "credit"
│       ├── category      (string)   "transport"
│       ├── merchant      (string)   "Grab"
│       ├── currency      (string)   "SGD"
│       └── asset         (string)   "cash"
│
├── /wellness/current
│   ├── overall_score    (number)   72
│   ├── status           (string)   "green" | "amber" | "red"
│   ├── computed_at      (timestamp)
│   ├── pillars
│   │   ├── liquidity          { score: 83, status: "green" }
│   │   ├── diversification    { score: 65, status: "amber" }
│   │   ├── risk_match         { score: 78, status: "green" }
│   │   └── digital_health     { score: 62, status: "amber" }
│   └── key_metrics
│       ├── net_worth              (number)   86700
│       ├── cash_buffer_months     (number)   3.61
│       ├── crypto_pct             (number)   14.76
│       ├── digital_pct            (number)   19.49
│       ├── unregulated_pct        (number)   14.76
│       ├── savings_rate_pct       (number)   22.98
│       └── largest_position_pct   (number)   45.20
│
└── /history/net_worth/items/{monthKey}    e.g. "2026-03"
    ├── month        (string)   "Mar 2026"
    ├── month_key    (string)   "2026-03"
    ├── value        (number)   86700
    └── updated_at   (timestamp)

├── /emailTransactions/{txId}               ← NEW collection
│   ├── emailId                 (string)   Gmail message ID (dedup key)
│   ├── source                  (string)   "DBS"|"OCBC"|"UOB"|"GrabPay"|"PayNow"|"MariBank"
│   ├── merchant                (string)
│   ├── date                    (string)   "2026-03-01"
│   ├── time                    (string)   "14:30"
│   ├── amount                  (number)
│   ├── direction               (string)   "debit"|"credit"
│   ├── currency                (string)   "SGD"
│   ├── category                (string)
│   ├── status                  (string)   "pending"|"approved"|"rejected"
│   ├── deleted                 (boolean)  soft-delete flag
│   ├── edited                  (boolean)
│   ├── createdAt               (timestamp)
│   └── updatedAt               (timestamp)
```

### Intermediate Aggregation Values

Before pillar scores are computed, the system aggregates these values from all **active** (parsed/approved) statements:

| Variable | How It's Computed | Example |
| :--- | :--- | :--- |
| `totalNetWorth` | `Σ stmt.net_worth_contribution` for all active statements | S$86,700 |
| `totalCash` | `Σ stmt.asset_class_breakdown.cash` | S$32,100 |
| `totalCrypto` | `Σ stmt.asset_class_breakdown.crypto` | S$12,800 |
| `totalTokenised` | `Σ stmt.asset_class_breakdown.tokenised` | S$4,200 |
| `totalUnregulated` | `Σ stmt.net_worth_contribution` where `source_type ∈ {crypto, other}` | S$12,800 |
| `largestContribution` | `max(stmt.net_worth_contribution)` across all active statements | S$39,200 |

### Derived Percentage Metrics

| Metric | Formula | Example |
| :--- | :--- | :--- |
| `cashBufferMonths` | `totalCash / monthlyExpenses` | 32100 / 3458 = **9.28 months** |
| `cryptoPct` | `(totalCrypto / totalNetWorth) × 100` | (12800 / 86700) × 100 = **14.76%** |
| `digitalPct` | `((totalCrypto + totalTokenised) / totalNetWorth) × 100` | ((12800 + 4200) / 86700) × 100 = **19.61%** |
| `unregulatedPct` | `(totalUnregulated / totalNetWorth) × 100` | (12800 / 86700) × 100 = **14.76%** |
| `largestPositionPct` | `(largestContribution / totalNetWorth) × 100` | (39200 / 86700) × 100 = **45.21%** |
| `savingsRatePct` | `((monthlyIncome − monthlyExpenses) / monthlyIncome) × 100` | ((4490 − 3458) / 4490) × 100 = **22.98%** |

### Financial Health Pillar Scoring (0–100)

Each pillar produces a score from 0 to 100, clamped via `clampScore(x) = round(min(100, max(0, x)))`.

#### 1. Liquidity Score

> **Goal:** Ensure the user has 3–6 months of cash reserves relative to monthly expenses.

```
if cashBufferMonths ≥ 6:
    liquidityScore = 100
else:
    liquidityScore = (cashBufferMonths / 6) × 100
```

| Cash Buffer | Score | Status |
| :--- | :--- | :--- |
| 0 months | 0 | 🔴 Red |
| 2 months | 33 | 🔴 Red |
| 3 months | 50 | 🟡 Amber |
| 4.5 months | 75 | 🟢 Green |
| 6+ months | 100 | 🟢 Green |

#### 2. Diversification Score

> **Goal:** Penalise over-concentration in a single position and reward having multiple platforms.

```
diversificationScore = 100 − largestPositionPct + min(activeStatements × 10, 30)
```

| Largest Position | Active Statements | Score |
| :--- | :--- | :--- |
| 80% | 1 | 100 − 80 + 10 = **30** 🔴 |
| 50% | 2 | 100 − 50 + 20 = **70** 🟢 |
| 30% | 4 | 100 − 30 + 30 = **100** 🟢 |
| 45% | 3 | 100 − 45 + 30 = **85** 🟢 |

#### 3. Risk Match Score

> **Goal:** Higher crypto and unregulated exposure lowers the score.

```
riskMatchScore = 100 − (cryptoPct × 0.5) − (unregulatedPct × 0.5)
```

| Crypto % | Unregulated % | Score |
| :--- | :--- | :--- |
| 0% | 0% | **100** 🟢 |
| 15% | 15% | 100 − 7.5 − 7.5 = **85** 🟢 |
| 40% | 40% | 100 − 20 − 20 = **60** 🟡 |
| 80% | 80% | 100 − 40 − 40 = **20** 🔴 |

#### 4. Digital Health Score

> **Goal:** Digital asset exposure (crypto + tokenised) ideally between 5–30%.

```
if digitalPct ≤ 30:
    digitalHealthScore = 70 + digitalPct
else:
    digitalHealthScore = 100 − (digitalPct − 30) × 2
```

| Digital % | Score | Reasoning |
| :--- | :--- | :--- |
| 0% | **70** 🟢 | No digital = safe but not leveraging Web3 |
| 15% | **85** 🟢 | Sweet spot |
| 30% | **100** 🟢 | Maximum ideal exposure |
| 50% | **60** 🟡 | Over-exposed, penalised |
| 80% | **0** 🔴 | Extreme concentration |

### Overall Wellness Score

```
overallScore = round((liquidityScore + diversificationScore + riskMatchScore + digitalHealthScore) / 4)
```

| Overall Score | Status | UI Label |
| :--- | :--- | :--- |
| 80–100 | 🟢 Green | Excellent Health |
| 70–79 | 🟢 Green | Good Health |
| 50–69 | 🟡 Amber | Moderate Health |
| 40–49 | 🟡 Amber | Needs Attention |
| 0–39 | 🔴 Red | Critical |

### Budget & Emergency Savings Calculations

| Metric | Formula | Example |
| :--- | :--- | :--- |
| `monthlyBudget` | `profile.monthly_budget` (fallback: `monthly_expenses`) | S$3,458 |
| `spentThisMonth` | `Σ stmt.parsed_data.total_debits` (current month statements) | S$2,100 |
| `remainingBudget` | `max(monthlyBudget − spentThisMonth, 0)` | S$1,358 |
| `emergencySavingsTarget` | `monthlyExpenses × 6` | 3458 × 6 = **S$20,748** |
| `emergencySavingsCurrent` | `totalCash + totalBonds` (capped at 1.5× target) | S$32,100 |
| `emergencySavingsPct` | `min(round((current / target) × 100), 100)` | min(round(32100/20748 × 100), 100) = **100%** |

### Wallet Allocation Calculation

For each asset class in `[cash, bonds, stocks, crypto, property, tokenised]`:

```
allocationPct = round((assetClassTotal / totalNetWorth) × 100)
```

Per-platform row:

```
portfolioPct = round((stmt.net_worth_contribution / totalNetWorth) × 100)
```

### Category Spending Breakdown

For each transaction category (Food, Transport, etc.):

```
categoryPct = round((categoryAmount / totalCategorySpending) × 100)
```

Priority for category data:
1. **Transaction-level** — reads `category` from each transaction in the subcollection
2. **Statement-level fallback** — reads `category_breakdown` from statement `parsed_data`
3. **Last resort** — single "Uncategorised" bucket using `spentThisMonth`

### End-to-End Calculation Example

> A user with **monthly income S$4,490** and **monthly expenses S$3,458** uploads 3 statements:

| Statement | Source | Net Worth | Cash | Crypto | Tokenised |
| :--- | :--- | :--- | :--- | :--- | :--- |
| DBS Savings | bank | S$32,100 | S$32,100 | — | — |
| Interactive Brokers | broker | S$28,400 | — | — | — |
| Binance | crypto | S$12,800 | — | S$12,800 | — |

**Step 1 — Aggregate:**

| | Value |
| :--- | :--- |
| totalNetWorth | 32,100 + 28,400 + 12,800 = **S$73,300** |
| totalCash | **S$32,100** |
| totalCrypto | **S$12,800** |
| totalUnregulated | **S$12,800** (Binance = crypto source) |
| largestContribution | **S$32,100** (DBS) |

**Step 2 — Percentages:**

| | Calculation | Value |
| :--- | :--- | :--- |
| cashBufferMonths | 32,100 / 3,458 | **9.28** |
| cryptoPct | 12,800 / 73,300 × 100 | **17.46%** |
| digitalPct | 12,800 / 73,300 × 100 | **17.46%** |
| unregulatedPct | 12,800 / 73,300 × 100 | **17.46%** |
| largestPositionPct | 32,100 / 73,300 × 100 | **43.79%** |
| savingsRatePct | (4,490 − 3,458) / 4,490 × 100 | **22.98%** |

**Step 3 — Pillar Scores:**

| Pillar | Formula | Result |
| :--- | :--- | :--- |
| Liquidity | cashBuffer ≥ 6 → 100 | **100** 🟢 |
| Diversification | 100 − 43.79 + min(3×10, 30) | **86** 🟢 |
| Risk Match | 100 − 17.46×0.5 − 17.46×0.5 | **83** 🟢 |
| Digital Health | 17.46 ≤ 30 → 70 + 17.46 | **87** 🟢 |

**Step 4 — Overall:**

```
overallScore = round((100 + 86 + 83 + 87) / 4) = 89  →  🟢 Excellent Health
```

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
| :--- | :--- | :--- |
| **Framework** | React 19 + Vite 7 | Fastest HMR, modern JSX transform, minimal config |
| **Styling** | Tailwind CSS 4 | Utility-first, zero runtime, glass-morphism via backdrop-blur |
| **Database** | Cloud Firestore | Real-time, serverless, nested subcollections for transactions |
| **Auth** | Firebase Auth | Email + Google OAuth out of the box, integrates with Firestore rules |
| **Storage** | Firebase Storage | Secure file uploads with per-user path rules |
| **AI Parsing** | InternVL | Vision-language model for extracting structured data from statement PDFs |
| **AI Advisory** | Groq (Llama 3.3 70B) | Ultra-fast inference, structured JSON output, Singapore-aware financial prompting |
| **Crypto Data** | yfinance (Python) | Open-source, no API key required, live crypto + stock prices via backend service |
| **Charts** | Recharts 3.7 | Declarative React charts — PieChart, LineChart, RadarChart |
| **Icons** | Lucide React | Consistent, tree-shakeable icon library |
| **Routing** | React Router 7 | Nested layouts, protected route wrappers, NavLink active states |
| **HTTP** | Axios | Statement upload to parsing backend |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A **Firebase project** with Auth, Firestore, and Storage enabled
- A **Groq API key** (free tier at [console.groq.com](https://console.groq.com))
- A **Google OAuth Client ID** (for Gmail sync — enable Gmail API in Google Cloud Console)

### Setup

```bash
# Clone the repository
git clone https://github.com/nicolotan/DeFi-Wealth-Hub.git
cd DeFi-Wealth-Hub

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
```

Add your keys to `.env.local`:

```env
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

VITE_GROQ_API_KEY=gsk_your-groq-api-key

VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_API_BASE_URL=http://localhost:8000
VITE_PIPELINE_API_BASE_URL=https://defi-api.stocksuite.app
VITE_MARKETDATA_BASE=https://yfinance-defi-api.stocksuite.app
```

```bash
# Start development server
npm run dev
```

The app will be running at `http://localhost:5173`.

### Firestore Rules

Ensure your Firestore security rules cover the nested transaction subcollection:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

---

## 📱 Pages & Routes

| Route | Page | Auth Required |
| :--- | :--- | :--- |
| `/login` | Login (email + Google) | No |
| `/signup` | Sign Up | No |
| `/forgot-password` | Password Reset | No |
| `/docs` | Documentation | No |
| `/onboarding` | 2-step profile setup | Yes |
| `/` or `/dashboard` | Dashboard (Overview / Budgeting / Wallet tabs) | Yes |
| `/advisory` | AI Wealth Advisory | Yes |
| `/privacy` | Privacy Hub | Yes |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## 📄 License

This project was built as part of an academic project at NTU. Please contact the team for licensing enquiries.

---

<p align="center">
  <strong>Built with ❤️ at NTU</strong><br/>
  <em>Where traditional finance meets decentralised innovation</em>
</p>
