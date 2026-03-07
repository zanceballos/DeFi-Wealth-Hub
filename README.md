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
| **Overview** | Net worth history chart, overall wellness score, four financial health pillars (Liquidity, Diversification, Risk Match, Digital Health), savings rate, and hero stat cards |
| **Budgeting** | Category-based spending breakdown with progress bars, inflow vs. outflow analysis, monthly budget tracking, recent transactions list with merchant detection |
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

- **Category spending** — visual progress bars for Food, Transport, Shopping, Entertainment, Utilities, etc.
- **Recent transactions** — merchant-tagged list with signed amounts and dates
- **Inflow vs. outflow** — monthly cash flow summary derived directly from statement transactions
- **Emergency fund** — savings rate tracking relative to monthly income
- **Merchant detection** — automatically recognises Grab, NTUC, Shopee, Netflix, Spotify, and more from raw descriptions

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
- **3-step onboarding** — collects name, monthly income/expenses, and risk profile on first login
- **Persistent profile** — data saved to Firestore at `/users/{uid}`, automatically loaded on every session

### 🔒 Privacy Hub

A dedicated `/privacy` page so users always understand their data footprint.

- See exactly which documents were uploaded and from which institutions
- View what was parsed and what is actively used for analytics
- Full transparency — no hidden data processing

---

## 🏗️ Architecture

```
src/
├── components/          # Shared UI — Navbar, ProtectedRoute, charts, FinancialHealthPillarsCard
├── context/             # AuthContext + AppContext providers
├── data/                # Mock data for development fallbacks
├── features/
│   └── dashboard/
│       ├── tabs.js      # Tab definitions (Overview, Budgeting, Wallet)
│       └── components/  # OverviewTab, BudgetingTab, WalletTab, Overlay
├── hooks/               # useAuth, useAuthContext, useFirestore, useDashboardData
├── lib/                 # Firebase initialisation (auth, db, storage)
├── pages/               # Dashboard, AdvisoryPage, LoginPage, SignUpPage, OnboardingPage
└── services/
    ├── advisoryPayloadBuilder.js    # Firebase → Groq payload mapper
    ├── dashboardViewModel.js        # Pure data transforms for dashboard tabs
    ├── financialDataService.js      # Upload, wellness recompute, net worth history
    ├── groqAdvisoryService.js       # Groq API client with fallback + session cache
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
| `/onboarding` | 3-step profile setup | Yes |
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
