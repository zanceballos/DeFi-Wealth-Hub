# Feature Inventory — DeFi Wealth Hub

> Generated from a full codebase audit. Source of truth for DOCUMENTATION.md and DocsPage.jsx rebuilds.

---

## Pages & Routes

| Route | Component | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `/login` | LoginPage | No | Email/password + Google OAuth sign-in |
| `/signup` | SignUpPage | No | Registration with password strength indicator |
| `/forgot-password` | ForgotPasswordPage | No | Firebase password reset email |
| `/docs` | DocsPage | No | In-app documentation (light/dark, scroll-spy nav) |
| `/onboarding` | OnboardingPage | Yes | 2-step profile setup: name → monthly income/expenses |
| `/` or `/dashboard` | Dashboard | Yes | Main hub — Overview / Budgeting / Wallet tabs |
| `/advisory` | AdvisoryPage | Yes | AI Wealth Advisory (Groq Llama 3.3 70B) |
| `/privacy` | Privacy | Yes | Privacy Hub — data transparency + deletion controls |

**Protected Route behaviour** (`ProtectedRoute.jsx`):
- Redirects to `/login` if not authenticated
- Redirects to `/onboarding` if `onboarding_complete !== true`
- Renders `<Outlet />` otherwise

---

## Features by Tab

### Dashboard → Overview Tab (`OverviewTab.jsx`)

| Feature | Details |
| :--- | :--- |
| Net worth hero card | `heroStats.netWorth.value` + delta from previous month |
| Wellness score card | `heroStats.wellness.score` / 100, status badge (green/amber/red) |
| Monthly savings card | `savingsDetail.income - expenses`, savings rate % |
| **Editable monthly income** | Pencil icon → inline SGD input → saves `users/{uid}.monthly_income` → recalculates wellness |
| 4 pillar score cards | Liquidity, Diversification, Risk Match, Digital Health — each with score, colour, tooltip |
| Net worth trend chart | Recharts LineChart from `netWorthSeries[]` (monthly data points) |
| Net worth breakdown | Asset class breakdown bar (cash, bonds, stocks, crypto, property, tokenised) |
| Empty state | Greeting + EmptyState component for first-time onboarding |

### Dashboard → Budgeting Tab (`BudgetingTab.jsx`)

| Feature | Details |
| :--- | :--- |
| **Persistent monthly budget** | Input + save → writes `users/{uid}.monthly_budget` to Firestore; falls back to `monthly_expenses` if unset |
| Budget progress bar | Spent this month vs. budget, remaining amount |
| Emergency savings tracker | Target = `monthly_expenses × 6`; current = cash-like assets; progress bar + percentage |
| Category spending breakdown | Progress bars per category (Food, Transport, Shopping, etc.) with amounts and % |
| Recent transactions list | Merchant-tagged, signed amounts, dates — from statement subcollections |
| **Transaction exclude/restore** | `txFingerprint()` → adds/removes from `users/{uid}.excluded_tx_fingerprints[]` array; excluded tx hidden from budget calculations |
| Gmail connection controls | Link/unlink Gmail, manual sync button, last sync timestamp |
| Email transactions section | Pending/Approved/Rejected tabs, inline edit, approve/reject buttons (via `EmailTransactionsSection`) |
| Empty state | "How it works" 4-step guide (Upload → Link Gmail → Budget → Insights) |

### Dashboard → Wallet Tab (`WalletTab.jsx`)

| Feature | Details |
| :--- | :--- |
| Portfolio allocation pie chart | Recharts PieChart from `walletViewModel.allocation[]` |
| Total net worth | Donut centre label |
| Asset allocation legend | Colour-coded percentages per asset class |
| Platform-level asset table | Columns: Asset, Platform, Value (S$), % Portfolio, Risk Label, Regulated |
| Risk classification | Core / Stable / Growth / Speculative per platform (derived from `source_type`) |
| Regulated status | ✅ MAS / ⚠️ Unregulated per platform |

### Tab Gating

- Defined in `src/features/dashboard/tabs.js`
- `requiresAccounts: true` on Budgeting and Wallet tabs
- `hasAccounts = !isEmpty && !loading` in `Dashboard.jsx`
- Locked tabs show 🔒 icon + "Complete onboarding to unlock" tooltip

### Statement Upload Overlay (`Overlay.jsx`)

| Feature | Details |
| :--- | :--- |
| Source type selector | bank, crypto, broker, investment, expenses, other |
| File upload | PDF / CSV via file input |
| Backend parse | POST to `{VITE_PIPELINE_API_BASE_URL}/parse` with file + sourceType |
| Review table | Editable fields: date, description, amount, currency, category, direction, asset |
| Row-level approve/skip | Approve or skip each parsed row before Firestore write |
| Firestore ingest | `ingestStatementToFirestore()` → creates statement doc + transaction subcollection |
| Auto-recompute | Wellness scores + net worth history update after save |

### EmptyState Onboarding (`EmptyState.jsx`)

| Feature | Details |
| :--- | :--- |
| Manual bank accounts | Add/remove accounts with name, type (Savings/Current), balance |
| Manual investments | Add/remove investment assets with type (stocks_etfs/crypto) + purchase lots (date, quantity, avgCost) |
| Firestore write | Saves to `users/{uid}.manual_accounts = { accounts[], investments[] }` |
| Auto-recompute | Calls `recalculateNetWorth(uid)` after save |

### Advisory Page (`AdvisoryPage.jsx`)

| Feature | Details |
| :--- | :--- |
| Data collection | Reads profile, statements, wellness, net worth history, email transactions from Firestore |
| Payload builder | `buildAdvisoryPayload()` → clean JSON for LLM |
| Groq LLM call | `fetchAdvisory()` → POST to `https://api.groq.com/openai/v1/chat/completions` with `llama-3.3-70b-versatile` |
| Session cache | `sessionStorage` keys: `dwh_advisory`, `dwh_advisory_payload`, `dwh_advisory_uid` — called once per session |
| Hero card | Headline, risk level badge (low/moderate/elevated/high/critical), wellness score |
| Financial Health Pillars | Radar chart (Recharts) + 4 pillar progress cards |
| Snapshot cards | Net worth, cash buffer months, platform count |
| Key insights | Colour-coded cards by severity (positive/neutral/warning/critical) |
| Recommended actions | Prioritised numbered steps (high/medium/low) |
| Education accordion | Expandable learn-more topics |
| Data-used footer | Lists which statements fed the advisory |
| Fallback | Static `fallbackAdvisory()` on API error |

### Privacy Hub (`Privacy.jsx`)

| Feature | Details |
| :--- | :--- |
| Summary stats | Total files, transactions parsed, net worth tracked |
| Grouped statements | Accordion sections by source type (Bank, Crypto, Broker, etc.) |
| Email transactions by date | Grouped by YYYY-MM-DD, newest first |
| Delete single statement | Removes statement + all transactions in subcollection |
| Delete all statements | Batch delete all statements + subcollections |
| Delete all email transactions | Batch delete all email tx docs |
| **Delete email tx by date** | Deletes only transactions for a specific date key |
| **Full account reset (deleteAll)** | Deletes statements + email tx + wellness + net worth history + clears `manual_accounts` field |
| Gmail link/unlink | Shows connected email; link or revoke OAuth |
| Post-delete recalc | `recalculateNetWorth()` if data remains, `resetUserToEmpty()` if all deleted |

### Email Transactions Section (`EmailTransactionsSection.jsx`)

| Feature | Details |
| :--- | :--- |
| Status tabs | Pending / Approved / Rejected with count badges |
| Approve | Sets `status='approved'` via `approveTransaction()` |
| Reject | Sets `status='rejected'` via `rejectTransaction()` |
| Inline edit | Editable fields: source, merchant, date, time, category, amount → `editTransaction()` sets `edited=true`, `status='approved'` |
| Gmail sync button | Manual trigger for `syncGmailTransactions(uid)` |
| Auto-polling | Every 5 minutes if OAuth token valid |

---

## Services Reference

### advisoryPayloadBuilder.js

| Function | Input → Output | Details |
| :--- | :--- | :--- |
| `buildAdvisoryPayload(data)` | `{profile, statements, wellness, netWorthHistory, emailTransactions}` → `{user, wellness, portfolio, email_transactions, trends}` | Aggregates manual_accounts, filters active statements (parsed/approved), computes email tx net cash (approved, non-deleted), normalises all numeric values |

### dashboardViewModel.js

| Function | Input → Output | Details |
| :--- | :--- | :--- |
| `safeNumber(value)` | any → number | Converts to finite number, default 0 |
| `safePercent(part, total, cap)` | numbers → number | Percentage capped at `cap` (default 100) |
| `formatCurrencySGD(value)` | number → `"S$1,234"` | SGD formatting, no decimals |
| `getCategoryColor(category)` | string → hex | Colour mapping for tx categories |
| `sumAssetBreakdown(statements)` | statements[] → `{cash, bonds, stocks, crypto, property, tokenised}` | Aggregates asset class totals |
| `deriveRiskLabel(statement)` | statement → `"Core"/"Speculative"/"Growth"/"Stable"` | Maps source_type to risk label |
| `deriveRegulatedLabel(statement)` | statement → `"✅ MAS"/"⚠️ Unregulated"` | Based on source type |
| `buildWalletViewModel(data)` | `{statements, wellness, emailTransactions}` → `{allocation, totalNetWorth, rows, emptyState}` | Wallet tab data |
| `buildBudgetViewModel(data)` | `{profile, statements, wellness}` → `{monthlyBudget, spentThisMonth, remainingBudget, emergencySavingsTarget, emergencySavingsCurrent, emergencySavingsPct, categorySpending, recentTransactions, emptyState}` | Budget tab data; emergency target = expenses × 6 |
| `buildTransactionsViewModel(statements)` | statements[] → `{transactions[], excluded[]}` | Flattens all tx; filters excluded fingerprints |
| `txFingerprint(tx)` | tx → `"${date}#${amt}#${desc}"` | Unique ID for exclude/restore |

### emailParser.js

| Function | Input → Output | Details |
| :--- | :--- | :--- |
| `parseTransactionEmail(subject, body, from)` | email parts → `{date, amount, currency, category, direction, merchant, counterparty, description, source, validation_flags}` or `null` | Detects DBS, OCBC, UOB, MariBank, GrabPay, PayNow; infers category from merchant keywords |

### emailTransactionService.js

**Firestore path:** `/users/{uid}/emailTransactions/{txId}`

| Function | Input → Output | Details |
| :--- | :--- | :--- |
| `fetchEmailTransactions(uid)` | uid → tx[] | Ordered by createdAt desc |
| `subscribeEmailTransactions(uid, cb)` | uid, callback → unsubscribe fn | Real-time listener via onSnapshot |
| `approveTransaction(uid, txId)` | uid, txId → void | Sets `status='approved'` |
| `rejectTransaction(uid, txId)` | uid, txId → void | Sets `status='rejected'` |
| `editTransaction(uid, txId, updates)` | uid, txId, fields → void | Whitelist: source, merchant, amount, date, time, category, direction, currency, description; sets `edited=true`, `status='approved'` |
| `deleteEmailTransaction(uid, txId)` | uid, txId → void | Soft-delete: sets `deleted=true` |

### financialDataService.js

**Firestore paths:**
- `/users/{uid}` — profile
- `/users/{uid}/statements/{stmtId}` — statement summary
- `/users/{uid}/statements/{stmtId}/transactions/{txId}` — tx items
- `/users/{uid}/wellness/current` — wellness snapshot
- `/users/{uid}/history/net_worth/items/{monthKey}` — monthly net worth
- `/users/{uid}/emailTransactions/{txId}` — read during wellness computation

| Function | Input → Output | Details |
| :--- | :--- | :--- |
| `uploadStatementFile(uid, file, metadata)` | uid, file, meta → statement obj | Uploads to Firebase Storage + creates Firestore doc, `status='uploaded'` |
| `saveParsedStatement(uid, stmtId, parsed)` | uid, id, parsed → obj | Updates statement with parsed_data, `status='parsed'` |
| `recomputeWellness(uid, options)` | uid → wellness snapshot | Reads 3 sources (manual, statements, email tx); computes 4 pillar scores; saves to `/wellness/current` |
| `upsertNetWorthHistory(uid, date, value)` | uid, date, num → entry | Creates/updates `/history/net_worth/items/{monthKey}` |
| `recalculateNetWorth(uid)` | uid → `{wellness, historyEntry}` | Convenience: recomputeWellness + upsertNetWorthHistory |
| `resetUserToEmpty(uid)` | uid → void | Deletes wellness + all net worth history entries |
| `processStatementAndRefreshMetrics(uid, file, meta)` | uid, file, meta → obj | Orchestrator: upload → recompute → history |

**Wellness scoring formulas:**

```
Liquidity:       cashBufferMonths ≥ 6 → 100, else (cashBufferMonths / 6) × 100
Diversification: 100 − largestPositionPct + min(activeStatements × 10, 30)
Risk Match:      100 − (cryptoPct × 0.5) − (unregulatedPct × 0.5)
Digital Health:  digitalPct ≤ 30 → 70 + digitalPct, else 100 − (digitalPct − 30) × 2
Overall:         round(average of 4 pillar scores)
Status:          ≥70 → 'green', 40–69 → 'amber', <40 → 'red'
```

### gmailService.js

**External APIs:** Google Identity Services (`accounts.google.com/gsi/client`), Gmail REST API (`gmail.googleapis.com/gmail/v1`)
**Scope:** `gmail.readonly`, `userinfo.email`

| Function | Input → Output | Details |
| :--- | :--- | :--- |
| `initiateGmailLink()` | → `{accessToken, email}` | OAuth popup (implicit token flow); stores token in-memory with expiry |
| `refreshAccessToken()` | → token | Silent renewal, falls back to prompt |
| `revokeToken()` | → void | Revokes OAuth token, clears in-memory |
| `getAccessToken()` | → token or null | Current token getter |
| `isTokenValid()` | → boolean | Checks expiry |
| `clearToken()` | → void | Clears in-memory token |
| `syncGmailTransactions(uid)` | uid → `{newCount, skippedCount, errors[]}` | Queries Gmail for transaction emails, parses with `parseTransactionEmail()`, deduplicates against existing Firestore docs, writes new to `/users/{uid}/emailTransactions/` |

**Gmail query:**
```
subject:(transaction OR payment OR receipt OR alert OR "card ending" OR debit OR credit OR transfer OR received) newer_than:7d
```

### groqAdvisoryService.js

**Endpoint:** `https://api.groq.com/openai/v1/chat/completions`
**Model:** `llama-3.3-70b-versatile`
**Auth:** Bearer token via `VITE_GROQ_API_KEY`

| Function | Input → Output | Details |
| :--- | :--- | :--- |
| `fetchAdvisory(payload)` | payload → advisory JSON | Temperature 0.4, max 2048 tokens; financial-planner system prompt; returns `{headline, summary, risk_level, insights[], actions[], education[]}` |
| `fallbackAdvisory()` | → static advisory | Safe fallback on API error or parse failure |

### marketDataService.js

**Endpoint:** `{VITE_MARKETDATA_BASE}/price/{asset}` (default: `https://yfinance-defi-api.stocksuite.app`)

| Function | Input → Output | Details |
| :--- | :--- | :--- |
| `getYfPrice(asset, opts)` | ticker, `{ttlMs}` → price or null | In-memory cache with 5-min default TTL; tries multiple response shapes; returns null on error |
| `clearMarketCache()` | → void | Clears cache |

### statementIngestionService.js

**Firestore paths:**
- `/users/{uid}/statements/{stmtId}` — statement summary
- `/users/{uid}/statements/{stmtId}/transactions/{txId}` — transaction items

| Function | Input → Output | Details |
| :--- | :--- | :--- |
| `deriveMerchant(description)` | string → merchant name | Known merchants: Grab, NTUC, DBS, Binance, Singtel, Shopee, Lazada, Netflix, Spotify, etc. |
| `normalizeParsedRow(row, sourceType)` | row, type → normalised tx | Handles camelCase (Overlay) and snake_case (backend) shapes |
| `computeStatementSummaryFromRows(rows)` | rows → `{total_credits, total_debits, closing_balance, category_breakdown}` | Aggregates sums and category groups |
| `inferAssetBreakdownFromRows(rows, type)` | rows, sourceType → `{cash, bonds, stocks, crypto, property, tokenised}` | Infers from rows or falls back to source-type heuristics |
| `createStatementSummary(uid, file, meta)` | uid, file, meta → `{statementId, statementData}` | Creates Firestore doc, `status='parsed'` |
| `saveStatementTransactions(uid, stmtId, rows, type)` | uid, id, rows, type → count | Creates subcollection docs per row |
| `ingestStatementToFirestore(uid, file, rows, meta)` | uid, file, rows, meta → `{statementId, transactionCount, statementData}` | Orchestrator: summary → transactions → patch count |

---

## Hooks Reference

### useAuth (`src/hooks/useAuth.js`)

| Key | Type | Details |
| :--- | :--- | :--- |
| `user` | FirebaseUser or null | Auth state from `onAuthStateChanged` |
| `loading` | boolean | Auth state loading |
| `error` | string or null | Auth error message |
| `login(email, pw)` | async → `{ok, error?}` | Email/password sign-in |
| `register(email, pw, name)` | async → `{ok, error?}` | Create account + set displayName |
| `loginWithGoogle()` | async → `{ok, error?}` | Google OAuth popup |
| `resetPassword(email)` | async → `{ok, error?}` | Firebase password reset email |
| `logout()` | void | Signs out + clears sessionStorage (`dwh_advisory*`) |

### useAuthContext (`src/hooks/useAuthContext.js`)

Returns AuthContext value: `{ user, profile, loading, error, login, register, loginWithGoogle, logout, refreshProfile }`

### useDashboardData (`src/hooks/useDashboardData.js`)

**Reads from Firestore:**
- `users/{uid}` (profile)
- `users/{uid}/wellness/current`
- `users/{uid}/statements` + each statement's `/transactions/` subcollection
- `users/{uid}/history/net_worth/items`
- `users/{uid}/emailTransactions`

| Key | Type | Details |
| :--- | :--- | :--- |
| `loading` | boolean | Data fetching state |
| `error` | string or null | Fetch error |
| `isEmpty` | boolean | No manual accounts, no statements, no email tx, no wellness, no history |
| `userProfile` | object | `{uid, name, riskProfile, location}` |
| `heroStats` | object | `{netWorth: {value, delta}, wellness: {score, label}, savings: {value, rate}}` |
| `pillarScores` | array | `[{name, score, colorClass, textClass, icon, description, calculationTooltip}]` |
| `netWorthSeries` | array | `[{month_key, value}]` for line chart |
| `savingsDetail` | object | `{income, expenses, net, target}` |
| `netWorthBreakdown` | array | `[{color, label, value, percent}]` |
| `walletViewModel` | object | From `buildWalletViewModel()` |
| `budgetViewModel` | object | From `buildBudgetViewModel()` |
| `transactionsViewModel` | object | `{transactions[], excluded[]}` |
| `emailTransactions` | array | Raw email tx |
| `excludedFingerprints` | string[] | From `profile.excluded_tx_fingerprints` |
| `updateExcludedFingerprints(arr)` | function | Updates local state |
| `raw` | object | `{profile, statements, wellness, netWorthHistory, emailTransactions}` |
| `refresh()` | async | Re-fetches all data |

### useEmailTransactions (`src/hooks/useEmailTransactions.js`)

**Firestore:** Real-time listener on `/users/{uid}/emailTransactions`
**Polling:** Auto-sync every 5 minutes if token valid

| Key | Type | Details |
| :--- | :--- | :--- |
| `transactions` | array | All non-deleted tx |
| `pending` | array | `status='pending'` |
| `approved` | array | `status='approved'` |
| `rejected` | array | `status='rejected'` |
| `syncing` | boolean | Currently syncing with Gmail |
| `syncError` | string or null | Sync error |
| `lastSyncResult` | object | `{newCount, skippedCount, errors[]}` |
| `sync()` | async | Manual sync trigger |
| `approve(txId)` | async | Approve + recalc wellness + clear advisory cache |
| `reject(txId)` | async | Reject |
| `edit(txId, updates)` | async | Edit + approve + recalc + clear cache |

### useFirestore (`src/hooks/useFirestore.js`)

Generic CRUD wrapper for any Firestore collection.

| Key | Type | Details |
| :--- | :--- | :--- |
| `loading` | boolean | Operation in progress |
| `error` | string or null | Error message |
| `getAll()` | async → doc[] | All documents |
| `getOne(id)` | async → doc or null | Single document |
| `add(data)` | async → docId | Creates doc with `createdAt` |
| `set(id, data)` | async → void | Overwrites doc |
| `update(id, data)` | async → void | Merges fields, sets `updatedAt` |
| `remove(id)` | async → void | Hard delete |
| `subscribe(cb, filters)` | → unsubscribe fn | Real-time listener |

### useGmailLink (`src/hooks/useGmailLink.js`)

**Firestore:** Real-time subscription to `users/{uid}` doc fields

| Key | Type | Details |
| :--- | :--- | :--- |
| `gmailLinked` | boolean | From Firestore `gmailLinked` field |
| `gmailEmail` | string or null | Connected email address |
| `lastSync` | Date or null | Last sync timestamp |
| `linking` | boolean | OAuth flow in progress |
| `error` | string or null | Link/unlink error |
| `linkGmail()` | async | OAuth popup → saves `gmailLinked: true, gmailEmail, gmailLinkedAt` to Firestore |
| `unlinkGmail()` | async | Revokes token → saves `gmailLinked: false, gmailEmail: null, gmailLinkedAt: null, lastGmailSync: null` |

### usePrivacy (`src/hooks/usePrivacy.js`)

**Firestore:** Real-time subscriptions on statements + email transactions

| Key | Type | Details |
| :--- | :--- | :--- |
| `grouped` | object | Statements by source type |
| `loading` | boolean | |
| `deleting` | null or string | ID of statement being deleted, or `'all'` |
| `recomputing` | boolean | Wellness recalc in progress |
| `statements` | array | All statements |
| `emailTransactions` | array | All email tx |
| `totalFiles` | number | Statement count |
| `totalTransactions` | number | Sum of `transactions_count` |
| `totalNetWorth` | number | Sum of `net_worth_contribution` |
| `emailTxCount` | number | Email tx count |
| `emailTxByDate` | array | `[[dateKey, txs[]]]` grouped by YYYY-MM-DD |
| `deleteStatement(id)` | async | Delete stmt + subcollection → recalc |
| `deleteAllStatements()` | async | Batch delete all statements |
| `deleteAllEmailTx()` | async | Batch delete all email tx |
| `deleteEmailTxByDate(dateKey)` | async | Delete email tx for specific date |
| `deleteAll()` | async | Full reset: delete everything + clear manual_accounts |
| `getDeleteSummary(id)` | fn → `{title, details[]}` | Pre-delete impact description |

### useUser (`src/hooks/useUser.js`)

**Firestore:** Reads/creates `/users/{uid}`

| Key | Type | Details |
| :--- | :--- | :--- |
| `profile` | object or null | Full user profile from Firestore |
| `loading` | boolean | |
| `refreshProfile()` | async | Re-fetches profile from Firestore |

**Auto-create defaults:** `risk_profile: 'moderate'`, `monthly_income: 0`, `monthly_expenses: 0`

---

## Context Reference

### AuthContext (`src/context/AuthContext.jsx` + `authContextValue.js`)

**Provider:** `AuthProvider` — wraps app in `main.jsx`

**Composes:** `useAuth()` + `useUser()`

| Value | Type | Details |
| :--- | :--- | :--- |
| `user` | FirebaseUser or null | Firebase Auth user |
| `profile` | object or null | Firestore `/users/{uid}` doc |
| `loading` | boolean | Auth + profile loading |
| `error` | string or null | |
| `login` | function | Email/password |
| `register` | function | Create account |
| `loginWithGoogle` | function | Google OAuth |
| `logout` | function | Sign out + clear cache |
| `refreshProfile` | function | Re-fetch profile doc |

### AppContext (`src/context/AppContext.jsx`)

**Purpose:** Legacy UI time filter state (used by Home/Portfolio/Transactions pages, not by Dashboard)

| Value | Type |
| :--- | :--- |
| `timeFilters` | string[] |
| `setTimeFilters` | function |
| `activeFilter` | string |
| `setActiveFilter` | function |

---

## New Features (since last docs)

### 1. Gmail OAuth Sync

- **What:** Users connect Gmail via Google OAuth to auto-import transaction alert emails from DBS, OCBC, UOB, GrabPay, PayNow, MariBank
- **Files:** `gmailService.js`, `emailParser.js`, `emailTransactionService.js`, `useGmailLink.js`, `useEmailTransactions.js`, `EmailTransactionsSection.jsx`, `BudgetingTab.jsx`
- **Firestore:** `users/{uid}.gmailLinked`, `users/{uid}.gmailEmail`, `users/{uid}.gmailLinkedAt`, `users/{uid}.lastGmailSync`, `/users/{uid}/emailTransactions/{txId}`
- **External APIs:** Google Identity Services (OAuth), Gmail REST API (`gmail.readonly` scope)
- **Polling:** Auto-sync every 5 minutes if token valid

### 2. Email Transaction Parsing

- **What:** Client-side parsing of email subjects/bodies to extract transaction data (amount, merchant, category, direction) from Singapore bank alerts
- **Files:** `emailParser.js`
- **Supported banks:** DBS, OCBC, UOB, MariBank, GrabPay, PayNow
- **Category inference:** Keyword-based mapping to Food, Transport, Shopping, Entertainment, Bills, etc.

### 3. Transaction Exclude/Restore with Fingerprinting

- **What:** Users can exclude individual transactions from budget calculations without deleting them; excluded tx can be restored
- **Files:** `BudgetingTab.jsx`, `dashboardViewModel.js` (`txFingerprint()`)
- **Firestore:** `users/{uid}.excluded_tx_fingerprints: string[]`
- **Fingerprint format:** `${date}#${amount}#${description}`

### 4. Editable Monthly Income

- **What:** Inline pencil-to-edit on the Overview tab savings card; saves to Firestore and triggers wellness recalculation
- **Files:** `OverviewTab.jsx`
- **Firestore:** `users/{uid}.monthly_income`

### 5. Persistent Monthly Budget

- **What:** User-set monthly budget saved to Firestore; falls back to `monthly_expenses` if unset
- **Files:** `BudgetingTab.jsx`
- **Firestore:** `users/{uid}.monthly_budget`

### 6. Live Crypto Price Feed via yfinance

- **What:** Backend fetches live prices for crypto (and stock) tickers using yfinance (Python, open-source, no API key required)
- **Files:** `marketDataService.js`
- **Endpoint:** `{VITE_MARKETDATA_BASE}/price/{ticker}` (default: `https://yfinance-defi-api.stocksuite.app`)
- **Caching:** In-memory, 5-minute default TTL

### 7. Privacy Hub with Per-Date Email Tx Deletion

- **What:** Privacy page groups email transactions by date and allows deletion of a single date's worth of transactions
- **Files:** `Privacy.jsx`, `usePrivacy.js`
- **Firestore:** `/users/{uid}/emailTransactions/{txId}` (batch delete filtered by date)

### 8. Full Account Reset

- **What:** Deletes all statements + transactions + email tx + wellness + net worth history + clears `manual_accounts`
- **Files:** `Privacy.jsx`, `usePrivacy.js`, `financialDataService.js` (`resetUserToEmpty`)
- **Firestore:** All user subcollections deleted; `manual_accounts` cleared via `deleteField()`

### 9. Statement Approve/Review Overlay

- **What:** Human-in-the-loop parsing — users review, edit, approve/skip each parsed row before it's written to Firestore
- **Files:** `Overlay.jsx`, `statementIngestionService.js`
- **Backend:** POST to `{VITE_PIPELINE_API_BASE_URL}/parse`

### 10. Wellness 4-Pillar Scoring

- **What:** Liquidity, Diversification, Risk Match, Digital Health — each scored 0–100 with traffic-light status
- **Files:** `financialDataService.js` (`recomputeWellness`), `OverviewTab.jsx`, `FinancialHealthPillarsCard.jsx`
- **Firestore:** `/users/{uid}/wellness/current`

### 11. Emergency Savings Tracker

- **What:** 6× monthly expenses target with progress bar and current cash-like assets
- **Files:** `BudgetingTab.jsx`, `dashboardViewModel.js` (`buildBudgetViewModel`)

### 12. Manual Accounts (Bank + Investments with Lots)

- **What:** First-time users can enter bank accounts (name, type, balance) and investment positions (asset, type, lots with date/quantity/avgCost)
- **Files:** `EmptyState.jsx`, `financialDataService.js`
- **Firestore:** `users/{uid}.manual_accounts = { accounts[], investments[] }`

### 13. Tab Gating Behind Onboarding

- **What:** Budgeting and Wallet tabs locked with 🔒 icon until user has accounts/statements
- **Files:** `Dashboard.jsx`, `tabs.js`

### 14. Responsive Layout

- **What:** Full mobile/tablet/desktop responsiveness — horizontal scroll tabs, 44px touch targets, overflow-x-auto tables, text-base inputs (iOS zoom prevention)
- **Files:** Navbar, Dashboard, OverviewTab, BudgetingTab, WalletTab, AdvisoryPage, TransactionsTable, MetricCard, InfoTooltip, StatCard, LoginPage, SignUpPage, OnboardingPage, EmptyState

---

## Firestore Schema

```
/users/{uid}
├── name                        (string)
├── email                       (string)
├── avatar_url                  (string)
├── created_at                  (timestamp)
├── risk_profile                (string)   "moderate"
├── monthly_income              (number)
├── monthly_expenses            (number)
├── monthly_budget              (number)   ← NEW: persistent user-set budget
├── onboarding_complete         (boolean)
├── gmailLinked                 (boolean)  ← NEW
├── gmailEmail                  (string)   ← NEW
├── gmailLinkedAt               (timestamp) ← NEW
├── lastGmailSync               (timestamp) ← NEW
├── excluded_tx_fingerprints    (string[]) ← NEW: array of "date#amt#desc" fingerprints
├── manual_accounts             (map)      ← NEW
│   ├── accounts[]              [{name, type, balance}]
│   └── investments[]           [{asset, type, lots: [{date, quantity, averageCost}]}]
│
├── /statements/{statementId}
│   ├── file_name               (string)
│   ├── file_url                (string)
│   ├── source_type             (string)   "bank"|"crypto"|"broker"|"investment"|"expenses"|"other"
│   ├── platform                (string)
│   ├── status                  (string)   "uploaded"|"parsed"|"approved"
│   ├── uploaded_at             (timestamp)
│   ├── net_worth_contribution  (number)
│   ├── liquidity_contribution  (number)
│   ├── transactions_count      (number)
│   ├── parsed_data
│   │   ├── closing_balance     (number)
│   │   ├── total_credits       (number)
│   │   ├── total_debits        (number)
│   │   ├── statement_month     (string)   "2026-03"
│   │   └── currency            (string)   "SGD"
│   ├── asset_class_breakdown
│   │   ├── cash                (number)
│   │   ├── stocks              (number)
│   │   ├── crypto              (number)
│   │   ├── bonds               (number)
│   │   ├── property            (number)
│   │   └── tokenised           (number)
│   │
│   └── /transactions/{txId}
│       ├── date                (string)   "2026-03-01"
│       ├── description         (string)
│       ├── amount              (number)
│       ├── direction           (string)   "debit"|"credit"
│       ├── category            (string)
│       ├── merchant            (string)
│       ├── currency            (string)   "SGD"
│       ├── asset               (string)   "cash"
│       ├── source_type         (string)
│       ├── row_confidence      (number)
│       ├── validation_flags    (array)
│       ├── state               (string)   "approved"|"skipped"
│       └── created_at          (timestamp)
│
├── /emailTransactions/{txId}               ← NEW collection
│   ├── emailId                 (string)   Gmail message ID (dedup key)
│   ├── source                  (string)   "DBS"|"OCBC"|"UOB"|"GrabPay"|"PayNow"|"MariBank"
│   ├── merchant                (string)
│   ├── counterparty            (string)
│   ├── date                    (string)   "2026-03-01"
│   ├── time                    (string)   "14:30"
│   ├── amount                  (number)
│   ├── direction               (string)   "debit"|"credit"
│   ├── currency                (string)   "SGD"
│   ├── category                (string)
│   ├── description             (string)
│   ├── status                  (string)   "pending"|"approved"|"rejected"
│   ├── deleted                 (boolean)  soft-delete flag
│   ├── edited                  (boolean)
│   ├── createdAt               (timestamp)
│   └── updatedAt               (timestamp)
│
├── /wellness/current
│   ├── overall_score           (number)   0–100
│   ├── status                  (string)   "green"|"amber"|"red"
│   ├── computed_at             (timestamp)
│   ├── pillars
│   │   ├── liquidity           {score, status}
│   │   ├── diversification     {score, status}
│   │   ├── risk_match          {score, status}
│   │   └── digital_health      {score, status}
│   └── key_metrics
│       ├── net_worth           (number)
│       ├── cash_buffer_months  (number)
│       ├── crypto_pct          (number)
│       ├── digital_pct         (number)
│       ├── unregulated_pct     (number)
│       ├── savings_rate_pct    (number)
│       └── largest_position_pct (number)
│
└── /history/net_worth/items/{monthKey}     e.g. "2026-03"
    ├── month                   (string)   "Mar 2026"
    ├── month_key               (string)   "2026-03"
    ├── value                   (number)
    └── updated_at              (timestamp)
```

---

## External APIs

| API / Service | Used for | Auth method | Key needed? |
| :--- | :--- | :--- | :--- |
| Firebase Auth | Email + Google login | Firebase SDK | Yes (`VITE_FIREBASE_*`) |
| Cloud Firestore | All user data storage | Firebase SDK | Yes (`VITE_FIREBASE_*`) |
| Firebase Storage | Statement file uploads | Firebase SDK | Yes (`VITE_FIREBASE_*`) |
| InternVL backend | PDF/CSV statement parsing | Internal (VITE_PIPELINE_API_BASE_URL) | No (no auth) |
| Groq API | AI advisory (Llama 3.3 70B) | Bearer token | Yes (`VITE_GROQ_API_KEY`) |
| yfinance API | Live crypto + stock prices | None (open-source) | No |
| Gmail REST API | Email transaction import | Google OAuth 2.0 (implicit flow) | Yes (`VITE_GOOGLE_CLIENT_ID`), OAuth flow |
| Google Identity Services | OAuth token acquisition | Client-side SDK | Yes (`VITE_GOOGLE_CLIENT_ID`) |

---

## Environment Variables

| Variable | Required | Description |
| :--- | :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Yes | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase Auth domain (e.g. `project.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | Firebase Storage bucket (e.g. `project.firebasestorage.app`) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase app ID |
| `VITE_GROQ_API_KEY` | Yes | Groq LLM API key (free tier at console.groq.com) |
| `VITE_GOOGLE_CLIENT_ID` | Yes (for Gmail) | Google OAuth client ID for Gmail sync |
| `VITE_API_BASE_URL` | Yes | Backend API for statement parsing (e.g. `http://localhost:8000`) |
| `VITE_PIPELINE_API_BASE_URL` | Optional | Alternative pipeline endpoint (default: `https://defi-api.stocksuite.app`) |
| `VITE_MARKETDATA_BASE` | Optional | yfinance market data API (default: `https://yfinance-defi-api.stocksuite.app`) |
| `VITE_APP_ENV` | Optional | `development` or `production` |

---

## Tech Stack (from package.json)

| Layer | Technology | Version |
| :--- | :--- | :--- |
| Framework | React | ^19.2.0 |
| Build | Vite | ^7.3.1 |
| Styling | Tailwind CSS | ^4.2.1 |
| Database | Firebase (Firestore) | ^12.10.0 |
| Auth | Firebase Auth | ^12.10.0 |
| Storage | Firebase Storage | ^12.10.0 |
| AI Parsing | InternVL (vision LLM) | Backend service |
| AI Advisory | Groq (Llama 3.3 70B) | External API |
| Crypto Data | yfinance (Python) | Backend service, open-source, no API key |
| Charts | Recharts | ^3.7.0 |
| Icons | Lucide React | ^0.577.0 |
| Routing | React Router | ^7.13.1 |
| HTTP | Axios | ^1.13.6 |

| Dev Dependency | Version |
| :--- | :--- |
| @tailwindcss/vite | ^4.2.1 |
| @vitejs/plugin-react | ^5.1.1 |
| eslint | ^9.39.1 |
| postcss | ^8.5.8 |
| autoprefixer | ^10.4.27 |
