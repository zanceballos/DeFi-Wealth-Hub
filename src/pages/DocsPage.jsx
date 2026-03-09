import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, Users, Lightbulb, Sparkles, LayoutDashboard, Brain, Upload,
  Wallet, ShieldCheck, Lock, Building2, Layers, Rocket, Map, Code2,
  ChevronRight, Github, ExternalLink, Menu, X, CheckCircle, GitBranch,
  FileText, PieChart, TrendingUp, Calculator, FlaskConical, Sun, Moon,
} from "lucide-react";

const NAV_SECTIONS = [
  { id: "overview",          label: "Overview",            icon: BookOpen },
  { id: "the-problem",       label: "The Problem",         icon: Lightbulb },
  { id: "our-solution",      label: "Our Solution",        icon: CheckCircle },
  { id: "features",          label: "Features",            icon: Sparkles },
  { id: "architecture",      label: "Architecture",        icon: Layers },
  { id: "firebase-security", label: "Firebase",            icon: ShieldCheck },
  { id: "data-model",        label: "Data Model",          icon: Building2 },
  { id: "aggregation",       label: "Aggregation & Metrics", icon: Calculator },
  { id: "scoring",           label: "Scoring Formulas",    icon: Brain },
  { id: "budget-calc",       label: "Budget Calculations", icon: TrendingUp },
  { id: "worked-example",    label: "Worked Example",      icon: FlaskConical },
  { id: "tech-stack",        label: "Tech Stack",          icon: Code2 },
  { id: "getting-started",   label: "Getting Started",     icon: Rocket },
  { id: "routes",            label: "Pages & Routes",      icon: Map },
  { id: "contributing",      label: "Contributing",        icon: GitBranch },
  { id: "license",           label: "License",             icon: FileText },
  { id: "team",              label: "The Team",            icon: Users },
];

const TEAM = [
  { name: "Nicholas",   major: "Computer Science",                    github: "nicolotan"   },
  { name: "Izzan",      major: "Computer Science",                    github: "zanceballos" },
  { name: "Kang",       major: "Computer Science",                    github: "lowkangxuan" },
  { name: "Li Zhong",   major: "Electrical & Electronic Engineering", github: "Shoterz"     },
  { name: "Zheng Rong", major: "Computer Engineering",               github: "Caspian616"  },
];

const TECH_STACK = [
  { layer: "Framework",   tech: "React 19 + Vite 7",      reason: "Fastest HMR, modern JSX transform, minimal config" },
  { layer: "Styling",     tech: "Tailwind CSS 4",          reason: "Utility-first, zero runtime, glass-morphism via backdrop-blur" },
  { layer: "Database",    tech: "Cloud Firestore",         reason: "Real-time, serverless, nested subcollections for transactions" },
  { layer: "Auth",        tech: "Firebase Auth",           reason: "Email + Google OAuth out of the box, integrates with Firestore rules" },
  { layer: "Storage",     tech: "Firebase Storage",        reason: "Secure file uploads with per-user path rules" },
  { layer: "AI Parsing",  tech: "InternVL",                reason: "Vision-language model for extracting structured data from statement PDFs" },
  { layer: "AI Advisory", tech: "Groq (Llama 3.3 70B)",   reason: "Ultra-fast inference, structured JSON output, Singapore-aware financial prompting" },
  { layer: "Charts",      tech: "Recharts 3.7",            reason: "Declarative React charts — PieChart, LineChart, RadarChart" },
  { layer: "Icons",       tech: "Lucide React",            reason: "Consistent, tree-shakeable icon library" },
  { layer: "Routing",     tech: "React Router 7",          reason: "Nested layouts, protected route wrappers, NavLink active states" },
  { layer: "HTTP",        tech: "Axios",                   reason: "Statement upload to parsing backend" },
];

const ROUTES = [
  { route: "/login",      page: "Login (email + Google)",           auth: false },
  { route: "/signup",     page: "Sign Up",                          auth: false },
  { route: "/onboarding", page: "3-step profile setup",             auth: true  },
  { route: "/dashboard",  page: "Dashboard (Overview/Budget/Wallet)", auth: true },
  { route: "/advisory",   page: "AI Wealth Advisory",               auth: true  },
  { route: "/privacy",    page: "Privacy Hub",                      auth: true  },
  { route: "/docs",       page: "Documentation",                    auth: false },
];

// ─── Helper components ────────────────────────────────────────────────────────

function SectionTitle({ icon: Icon, title, dk }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${dk ? "bg-white/5 text-teal-400" : "bg-teal-50 text-teal-600"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h2 className={`text-2xl font-bold ${dk ? "text-white" : "text-gray-900"}`}>{title}</h2>
    </div>
  );
}

function Card({ children, className = "", dk }) {
  return (
    <div className={`rounded-2xl border p-5 ${dk ? "border-white/10 bg-white/5 backdrop-blur-sm" : "border-gray-100 bg-gray-50"} ${className}`}>
      {children}
    </div>
  );
}

// Code blocks always stay dark — standard docs convention
function CodeBlock({ children }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-gray-700 bg-gray-900 p-4 text-xs leading-relaxed text-teal-300">
      <code>{children}</code>
    </pre>
  );
}

function Table({ headers, rows, dk }) {
  return (
    <Card dk={dk}>
      <table className="w-full text-sm">
        <thead>
          <tr className={`border-b text-left ${dk ? "border-white/10" : "border-gray-200"}`}>
            {headers.map((h) => (
              <th key={h} className={`pb-3 pr-4 font-semibold ${dk ? "text-slate-300" : "text-gray-700"}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className={`divide-y ${dk ? "divide-white/5" : "divide-gray-100"}`}>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`py-2.5 pr-4 ${j === 0 ? "font-mono text-xs" : ""} ${
                    j === 0
                      ? dk ? "text-teal-300" : "text-teal-600"
                      : j === row.length - 1
                        ? ""
                        : dk ? "text-slate-300" : "text-gray-700"
                  }`}
                  style={j > 0 && j === row.length - 1 ? { color: dk ? "#8899AA" : "#6B7280" } : {}}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const sectionRefs = useRef({});
  const dk = darkMode; // shorthand passed to helpers

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach((e) => { if (e.isIntersecting) setActiveSection(e.target.id); }); },
      { rootMargin: "-10% 0px -50% 0px", threshold: 0.1 },
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function handleScroll() {
      const scrollBottom = window.scrollY + window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      if (docHeight - scrollBottom < 80) { setActiveSection("team"); return; }
      const entries = Object.entries(sectionRefs.current)
        .filter(([, el]) => el !== null)
        .map(([id, el]) => ({ id, top: el.getBoundingClientRect().top }))
        .filter(({ top }) => top <= window.innerHeight * 0.3)
        .sort((a, b) => b.top - a.top);
      if (entries.length > 0) setActiveSection(entries[0].id);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollTo(id) {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileNavOpen(false);
  }
  function setRef(id) { return (el) => { sectionRefs.current[id] = el; }; }

  // ── Shared text color helper
  const muted = dk ? "#8899AA" : "#6B7280";
  const heading = dk ? "text-white" : "text-gray-900";
  const subtext = dk ? "text-slate-300" : "text-gray-700";

  return (
    <div
      className="min-h-screen font-sans"
      style={dk ? { background: "#0A0F1E" } : { background: "#F8FAFC" }}
    >
      {/* ── Top bar ── */}
      <header
        className={`sticky top-0 z-40 flex items-center justify-between border-b px-6 py-3 backdrop-blur-xl ${
          dk ? "border-white/10" : "border-gray-200 bg-white/90"
        }`}
        style={dk ? { background: "rgba(10,15,30,0.85)" } : {}}
      >
        <div className="flex items-center gap-3">
          <button
            className={`mr-1 rounded-lg p-1.5 lg:hidden ${dk ? "text-slate-400 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"}`}
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link to="/login" className={`flex items-center gap-2 text-sm font-semibold ${dk ? "text-white" : "text-gray-900"}`}>
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg,#00C9B1,#0099FF)" }}>
              DeFi Wealth Hub
            </span>
            <ChevronRight className={`h-3.5 w-3.5 ${dk ? "text-slate-500" : "text-gray-400"}`} />
            <span className={`font-normal ${dk ? "text-slate-400" : "text-gray-500"}`}>Docs</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* Dark/Light toggle */}
          <button
            onClick={() => setDarkMode((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              dk
                ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {dk ? <><Sun className="h-3.5 w-3.5" /> Light</> : <><Moon className="h-3.5 w-3.5" /> Dark</>}
          </button>

          <a
            href="https://github.com/nicolotan/DeFi-Wealth-Hub"
            target="_blank" rel="noreferrer"
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition ${
              dk
                ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Github className="h-3.5 w-3.5" />
            GitHub
            <ExternalLink className="h-3 w-3 opacity-50" />
          </a>
        </div>
      </header>

      <div className="mx-auto flex max-w-screen-xl">
        {/* ── Sidebar desktop ── */}
        <aside className={`sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r px-4 py-8 lg:block ${
          dk ? "border-white/10" : "border-gray-200"
        }`}>
          <p className={`mb-3 px-3 text-xs font-semibold uppercase tracking-widest ${dk ? "text-slate-500" : "text-gray-400"}`}>
            Contents
          </p>
          <nav className="space-y-0.5">
            {NAV_SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  activeSection === id
                    ? dk ? "bg-white/10 text-teal-300" : "bg-teal-50 text-teal-700"
                    : dk ? "text-slate-400 hover:bg-white/5 hover:text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Mobile nav ── */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-30 lg:hidden" onClick={() => setMobileNavOpen(false)}>
            <div
              className={`absolute left-0 top-14 w-64 border-r px-4 py-8 backdrop-blur-xl ${dk ? "border-white/10" : "border-gray-200"}`}
              style={{ background: dk ? "rgba(10,15,30,0.97)" : "rgba(255,255,255,0.97)", bottom: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <nav className="space-y-0.5">
                {NAV_SECTIONS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => scrollTo(id)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      dk ? "text-slate-400 hover:bg-white/5 hover:text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* ── Main content ── */}
        <main className="min-w-0 flex-1 px-6 py-12 lg:px-12">
          <div className="mx-auto max-w-3xl space-y-20">

            {/* ── Overview ── */}
            <section id="overview" ref={setRef("overview")}>
              <div className={`mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-teal-300 ${dk ? "border-white/10" : "border-teal-200 bg-teal-50 text-teal-600"}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400 inline-block" />
                Documentation
              </div>
              <h1 className={`mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl ${dk ? "text-white" : "text-gray-900"}`}>
                DeFi{" "}
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg,#00C9B1,#0099FF)" }}>
                  Wealth Hub
                </span>
              </h1>
              <p className="mb-6 text-lg leading-relaxed" style={{ color: muted }}>
                A privacy-first AI financial cockpit that helps users upload, parse, understand, and act on their financial data across banking, crypto, and investments — without ever sharing passwords or connecting bank accounts.
              </p>
              <div className="flex flex-wrap gap-2">
                {["React 19", "Vite 7", "Firebase 12", "Tailwind CSS 4", "Groq AI", "InternVL", "Recharts"].map((tag) => (
                  <span key={tag} className={`rounded-full border px-3 py-1 text-xs font-medium ${dk ? "border-white/10 bg-white/5 text-slate-300" : "border-gray-200 bg-gray-100 text-gray-600"}`}>
                    {tag}
                  </span>
                ))}
              </div>
            </section>

            {/* ── The Problem ── */}
            <section id="the-problem" ref={setRef("the-problem")}>
              <SectionTitle icon={Lightbulb} title="The Problem" dk={dk} />
              <p className="mb-6 leading-relaxed" style={{ color: muted }}>
                Personal finance data is fragmented. Users juggle bank statements, crypto exchange reports, and investment summaries across multiple platforms. Existing solutions fall short:
              </p>
              <Table dk={dk}
                headers={["Existing Tool", "The Gap"]}
                rows={[
                  ["Mint, Plaid-based apps",    "Force you to hand over bank login credentials"],
                  ["Crypto portfolio trackers", "Only cover digital assets — no TradFi"],
                  ["Spreadsheet templates",     "Manual, error-prone, no intelligence layer"],
                  ["Robo-advisors",             "Black-box recommendations, zero transparency"],
                ]}
              />
            </section>

            {/* ── Our Solution ── */}
            <section id="our-solution" ref={setRef("our-solution")}>
              <SectionTitle icon={CheckCircle} title="Our Solution" dk={dk} />
              <p className="mb-4 leading-relaxed" style={{ color: muted }}>
                DeFi Wealth Hub takes a fundamentally different approach —{" "}
                <strong className={heading}>deliberate, user-controlled ingestion</strong>:
              </p>
              <CodeBlock>{`┌──────────────┐     ┌────────────────┐     ┌──────────────────┐     ┌────────────────┐
│  Upload File │────▶│  AI Parsing +  │────▶│  Human Review &  │────▶│  Unified       │
│  (PDF/CSV)   │     │  Structuring   │     │  Approval        │     │  Dashboard     │
└──────────────┘     └────────────────┘     └──────────────────┘     └────────────────┘
                                                                            │
                                                                            ▼
                                                                     ┌────────────────┐
                                                                     │  AI Advisory   │
                                                                     │  (Groq LLM)    │
                                                                     └────────────────┘`}</CodeBlock>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  { icon: Lock,       text: "No bank credentials required — upload statements on your own terms" },
                  { icon: Users,      text: "Human-in-the-loop — review, edit, or reject every parsed row" },
                  { icon: Wallet,     text: "TradFi + DeFi in one place — bank, broker, crypto, investments unified" },
                  { icon: Brain,      text: "Explainable AI — every insight links back to specific data points" },
                  { icon: ShieldCheck,text: "Privacy by design — you always see exactly what data is stored and how it's used" },
                ].map(({ icon: Icon, text }) => (
                  <Card key={text} className="flex items-start gap-3" dk={dk}>
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-teal-400" />
                    <p className={`text-sm leading-relaxed ${subtext}`}>{text}</p>
                  </Card>
                ))}
              </div>
            </section>

            {/* ── Features ── */}
            <section id="features" ref={setRef("features")}>
              <SectionTitle icon={Sparkles} title="Features" dk={dk} />

              {/* Dashboard */}
              <Card className="mb-4" dk={dk}>
                <div className="flex items-start gap-4">
                  <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${dk ? "bg-white/5 text-teal-300" : "bg-teal-50 text-teal-600"}`}>
                    <LayoutDashboard className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className={`mb-3 font-semibold ${heading}`}>📊 Unified Multi-Asset Dashboard</p>
                    <p className="mb-3 text-sm leading-relaxed" style={{ color: muted }}>
                      A three-tab command centre for your entire financial life. All data is live from Firestore — every upload refreshes your numbers in real time.
                    </p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={`border-b text-left ${dk ? "border-white/10" : "border-gray-200"}`}>
                          <th className={`pb-2 font-semibold ${dk ? "text-slate-300" : "text-gray-700"}`}>Tab</th>
                          <th className={`pb-2 font-semibold ${dk ? "text-slate-300" : "text-gray-700"}`}>What It Shows</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${dk ? "divide-white/5" : "divide-gray-100"}`}>
                        {[
                          ["Overview",   "Net worth history chart, overall wellness score, four financial health pillars (Liquidity, Diversification, Risk Match, Digital Health), savings rate, hero stat cards"],
                          ["Budgeting",  "Category-based spending breakdown with progress bars, inflow vs. outflow analysis, monthly budget tracking, recent transactions with merchant detection"],
                          ["Wallet",     "Platform-level asset allocation pie chart, per-platform rows with risk labels (Core / Stable / Growth / Speculative), regulated vs. unregulated exposure"],
                        ].map(([tab, desc]) => (
                          <tr key={tab}>
                            <td className="py-2 pr-4 font-medium text-teal-500 whitespace-nowrap">{tab}</td>
                            <td className="py-2 text-xs" style={{ color: muted }}>{desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>

              {/* Advisory */}
              <Card className="mb-4" dk={dk}>
                <div className="flex items-start gap-4">
                  <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${dk ? "bg-white/5 text-teal-300" : "bg-teal-50 text-teal-600"}`}>
                    <Brain className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className={`mb-2 font-semibold ${heading}`}>🧠 AI-Powered Wealth Advisory</p>
                    <p className="mb-3 text-sm leading-relaxed" style={{ color: muted }}>
                      A dedicated <code className="text-teal-500">/advisory</code> page powered by{" "}
                      <strong className={heading}>Groq AI (Llama 3.3 70B)</strong> that turns raw financial data into structured, actionable guidance.
                    </p>
                    <CodeBlock>{"Firestore Data ──▶ Payload Builder ──▶ Groq LLM ──▶ Structured JSON ──▶ Advisory UI"}</CodeBlock>
                    <ul className="mt-3 space-y-1 text-sm" style={{ color: muted }}>
                      {[
                        "Payload Builder — collects profile, statements, wellness scores, and net worth history into a null-safe JSON payload",
                        "Groq Service — sends payload with a detailed financial-planner system prompt, enforces strict JSON output schema",
                        "Hero card with headline, risk level badge, and wellness score",
                        "Financial Health Pillars radar chart (Recharts) with four pillar progress cards",
                        "Key Insights — colour-coded cards by severity (positive / neutral / warning / critical)",
                        "Recommended Actions — prioritised numbered steps",
                        "Education accordion — expandable learn-more topics",
                        "Data-used footer — shows which statements fed the advisory",
                      ].map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 rounded-lg border border-teal-500/20 bg-teal-500/10 px-3 py-2 text-xs text-teal-500">
                      ⚡ Rate-limit aware — results cached in <code>sessionStorage</code> so the LLM is called only once per browser session.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Ingestion */}
              <Card className="mb-4" dk={dk}>
                <div className="flex items-start gap-4">
                  <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${dk ? "bg-white/5 text-teal-300" : "bg-teal-50 text-teal-600"}`}>
                    <Upload className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className={`mb-2 font-semibold ${heading}`}>📑 Statement Ingestion Pipeline</p>
                    <p className="mb-3 text-sm leading-relaxed" style={{ color: muted }}>
                      A robust, multi-step document workflow that keeps the human in control at every stage.
                    </p>
                    <CodeBlock>{`File Upload ──▶ InternVL Parse ──▶ Review Table ──▶ Save to Firestore
                             (edit/skip/approve)        │
                                                        ▼
                                               Recompute Wellness
                                               + Net Worth`}</CodeBlock>
                    <ul className="mt-3 space-y-1 text-sm" style={{ color: muted }}>
                      {[
                        "Flexible uploads — bank statements, broker reports, crypto exchange CSVs, expense summaries",
                        "Smart parsing — rows normalised with category, merchant detection, credit/debit classification",
                        "Review overlay — slide-in modal via React Portal to avoid z-index issues",
                        "Firestore write — approved rows saved to /users/{uid}/statements/{id}/transactions/ subcollection",
                        "Auto-recompute — wellness scores, pillar scores, and net worth history update immediately after save",
                      ].map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Budgeting */}
              <Card className="mb-4" dk={dk}>
                <div className="flex items-start gap-4">
                  <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${dk ? "bg-white/5 text-teal-300" : "bg-teal-50 text-teal-600"}`}>
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className={`mb-2 font-semibold ${heading}`}>💰 Budgeting & Expense Tracking</p>
                    <ul className="space-y-1 text-sm" style={{ color: muted }}>
                      {[
                        "Category spending — visual progress bars for Food, Transport, Shopping, Entertainment, Utilities, etc.",
                        "Recent transactions — merchant-tagged list with signed amounts and dates",
                        "Inflow vs. outflow — monthly cash flow summary derived from statement transactions",
                        "Emergency fund — savings rate tracking relative to monthly income",
                        "Merchant detection — auto-recognises Grab, NTUC, Shopee, Netflix, Spotify, and more from raw descriptions",
                      ].map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Wallet */}
              <Card className="mb-4" dk={dk}>
                <div className="flex items-start gap-4">
                  <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${dk ? "bg-white/5 text-teal-300" : "bg-teal-50 text-teal-600"}`}>
                    <PieChart className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className={`mb-2 font-semibold ${heading}`}>👛 Wallet & Asset Allocation</p>
                    <ul className="space-y-1 text-sm" style={{ color: muted }}>
                      {[
                        "Asset breakdown — Cash, Bonds, Stocks, Crypto, Property, Tokenised assets",
                        "Platform rows — each uploaded statement becomes a trackable platform with value and risk label",
                        "Risk classification — Core / Stable / Growth / Speculative labels per platform",
                        "Regulated vs. unregulated — highlights exposure to MAS-regulated vs. unregulated platforms",
                      ].map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Auth + Privacy */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card dk={dk}>
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-400" />
                    <div>
                      <p className={`mb-2 font-semibold ${heading}`}>🔐 Auth & Onboarding</p>
                      <ul className="space-y-1 text-xs" style={{ color: muted }}>
                        {[
                          "Firebase Auth — email/password and Google OAuth",
                          "Protected routes — all dashboard pages gated behind auth",
                          "3-step onboarding — name, income/expenses, risk profile",
                          "Persistent profile saved to Firestore /users/{uid}",
                        ].map((item) => (
                          <li key={item} className="flex gap-1.5">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
                <Card dk={dk}>
                  <div className="flex items-start gap-3">
                    <Lock className="mt-0.5 h-5 w-5 shrink-0 text-teal-400" />
                    <div>
                      <p className={`mb-2 font-semibold ${heading}`}>🔒 Privacy Hub</p>
                      <ul className="space-y-1 text-xs" style={{ color: muted }}>
                        {[
                          "See exactly which documents were uploaded and from which institutions",
                          "View what was parsed and what is actively used for analytics",
                          "Full transparency — no hidden data processing",
                        ].map((item) => (
                          <li key={item} className="flex gap-1.5">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>
            </section>

            {/* ── Architecture ── */}
            <section id="architecture" ref={setRef("architecture")}>
              <SectionTitle icon={Layers} title="Architecture" dk={dk} />
              <CodeBlock>{`src/
├── components/          # Shared UI — Navbar, ProtectedRoute, charts
├── context/             # AuthContext + AppContext providers
├── data/                # Mock data for development fallbacks
├── features/
│   └── dashboard/
│       ├── tabs.js      # Tab definitions (Overview, Budgeting, Wallet)
│       └── components/  # OverviewTab, BudgetingTab, WalletTab, Overlay
├── hooks/               # useAuth, useAuthContext, useFirestore, useDashboardData
├── lib/                 # Firebase init (auth, db, storage)
├── pages/               # Dashboard, AdvisoryPage, LoginPage, SignUpPage, OnboardingPage
└── services/
    ├── advisoryPayloadBuilder.js     # Firebase → Groq payload mapper
    ├── dashboardViewModel.js         # Pure data transforms for dashboard tabs
    ├── financialDataService.js       # Upload, wellness recompute, net worth history
    ├── groqAdvisoryService.js        # Groq API client with fallback + session cache
    └── statementIngestionService.js  # Statement + transaction subcollection writer`}</CodeBlock>
              <p className={`mt-6 mb-3 font-semibold ${heading}`}>Data Flow</p>
              <CodeBlock>{`User uploads file
      │
      ▼
Overlay (InternVL parse + human review)
      │
      ▼
statementIngestionService ──▶ Firestore:
      │                         /users/{uid}/statements/{id}
      │                         /users/{uid}/statements/{id}/transactions/{txId}
      ▼
financialDataService ───────▶ Firestore:
      │                         /users/{uid}/wellness/current
      │                         /users/{uid}/history/net_worth/items/{monthKey}
      ▼
useDashboardData ───────────▶ dashboardViewModel ──▶ React UI
      │
      ▼
advisoryPayloadBuilder ─────▶ groqAdvisoryService ──▶ AdvisoryPage UI`}</CodeBlock>
            </section>

            {/* ── Firebase Security ── */}
            <section id="firebase-security" ref={setRef("firebase-security")}>
              <SectionTitle icon={ShieldCheck} title="Firebase Security" dk={dk} />
              <p className="mb-6 text-sm leading-relaxed" style={{ color: muted }}>
                All user data — transactions, wellness scores, statements, and profile — lives exclusively in Firebase. We chose Firebase not just for developer convenience, but because it provides{" "}
                <strong className={heading}>enterprise-grade security guarantees</strong> that are enforced at the infrastructure level, independent of our application code.
              </p>

              <p className={`mb-3 text-sm font-bold ${heading}`}>Why Firebase?</p>
              <div className="mb-6 grid gap-3 sm:grid-cols-2">
                {[
                  { icon: ShieldCheck, title: "No server required",         desc: "There is no backend server holding your data. Firebase's client SDKs talk directly to Google's infrastructure — reducing the attack surface to near-zero.", color: "#00C9B1" },
                  { icon: Lock,        title: "Auth-gated by default",       desc: "Every Firestore read and write is evaluated against Security Rules before execution. Unauthenticated requests are rejected at the edge.", color: "#0099FF" },
                  { icon: Building2,   title: "Google Cloud infrastructure", desc: "Firebase runs on Google Cloud Platform — the same infrastructure used by Google Search, Gmail, and YouTube. It inherits ISO 27001, SOC 1/2/3, and PCI DSS compliance.", color: "#A78BFA" },
                  { icon: Layers,      title: "Real-time + serverless",      desc: "Firestore is a serverless NoSQL document database. There are no VMs, no patches to apply, and no infrastructure to mis-configure — Google manages all of that.", color: "#34D399" },
                ].map(({ icon: Icon, title, desc, color }) => (
                  <Card key={title} className="flex items-start gap-3" dk={dk}>
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: `${color}15` }}>
                      <Icon className="h-4 w-4" style={{ color }} />
                    </div>
                    <div>
                      <p className={`mb-1 text-sm font-semibold ${heading}`}>{title}</p>
                      <p className="text-xs leading-relaxed" style={{ color: muted }}>{desc}</p>
                    </div>
                  </Card>
                ))}
              </div>

              <p className={`mb-3 text-sm font-bold ${heading}`}>Encryption</p>
              <Card className="mb-6" dk={dk}>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: "In Transit",   value: "TLS 1.3",   detail: "All data between your browser and Firebase is encrypted with TLS 1.3 — the same standard used by online banking.", color: "#00C9B1" },
                    { label: "At Rest",      value: "AES-256",   detail: "Firestore and Firebase Storage encrypt all stored data using AES-256 — the encryption standard used by governments and financial institutions worldwide.", color: "#0099FF" },
                    { label: "Auth Tokens",  value: "RS256 JWT", detail: "Firebase Auth issues RS256-signed JSON Web Tokens. Every Firestore request carries this token and is verified server-side before execution.", color: "#A78BFA" },
                  ].map(({ label, value, detail, color }) => (
                    <div key={label} className="rounded-xl p-4 text-center" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: muted }}>{label}</p>
                      <p className="mb-2 text-2xl font-black" style={{ color }}>{value}</p>
                      <p className="text-xs leading-relaxed" style={{ color: muted }}>{detail}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <p className={`mb-3 text-sm font-bold ${heading}`}>How Security Rules Protect Your Data</p>
              <div className="mb-4 flex flex-col gap-0">
                {[
                  { actor: "Any Request",        check: "Is the user authenticated via Firebase Auth?",                      pass: "Yes → continue",                          fail: "No → 403 Denied immediately",                       color: "#F59E0B" },
                  { actor: "Authenticated User", check: "Does request.auth.uid match the {uid} in the document path?",       pass: "Yes → allow read/write",                  fail: "No → 403 Denied — cannot access another user's data", color: "#00C9B1" },
                  { actor: "Matched User",        check: "Does the path fall under /users/{uid}/**?",                         pass: "Yes → full read/write on own subtree only", fail: "No matching rule → implicitly denied",               color: "#0099FF" },
                ].map(({ actor, check, pass, fail, color }, i, arr) => (
                  <div key={actor} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                        style={{ background: `${color}15`, border: `1.5px solid ${color}30`, color }}>
                        {i + 1}
                      </div>
                      {i < arr.length - 1 && (
                        <div className="w-px flex-1 my-1" style={{ background: `linear-gradient(to bottom, ${color}30, transparent)` }} />
                      )}
                    </div>
                    <div className="mb-3 flex-1 rounded-2xl p-4" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color }}>{actor}</p>
                      <p className={`mb-2 text-sm font-medium ${heading}`}>{check}</p>
                      <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
                        <span className="flex items-center gap-1.5 text-xs text-emerald-500">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />{pass}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-red-500">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />{fail}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className={`mb-2 text-sm font-bold ${heading}`}>Firestore Security Rules</p>
              <CodeBlock>{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only the authenticated owner can read or write their own data.
    // This covers ALL subcollections: statements, transactions,
    // wellness scores, net worth history, and profile.
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == uid;
    }
    // All other paths are implicitly denied.
  }
}`}</CodeBlock>

              <p className={`mt-5 mb-2 text-sm font-bold ${heading}`}>Firebase Storage Rules</p>
              <CodeBlock>{`rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Statement files are stored at /users/{uid}/statements/{filename}
    // Only the file owner can upload, download, or delete.
    match /users/{uid}/{allPaths=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == uid;
    }
  }
}`}</CodeBlock>

              <p className={`mt-6 mb-3 text-sm font-bold ${heading}`}>What This Means for You</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { emoji: "🔒", title: "Zero cross-user access",    desc: "No user can read, write, or even discover another user's documents — not even team members with Firestore Console access (unless they have your UID)." },
                  { emoji: "🚫", title: "No credential sharing",     desc: "You never connect your bank account. You upload exported statements yourself — your banking login is never involved." },
                  { emoji: "🛡️", title: "Rules enforced server-side", desc: "Security Rules are evaluated on Google's servers, not in your browser. Bypassing them via client-side code is architecturally impossible." },
                  { emoji: "🗑️", title: "Right to delete",           desc: "The Privacy Hub lets you see every uploaded document. Deleting your account removes your entire /users/{uid} subtree from Firestore." },
                ].map(({ emoji, title, desc }) => (
                  <Card key={title} className="flex items-start gap-3" dk={dk}>
                    <span className="mt-0.5 text-xl">{emoji}</span>
                    <div>
                      <p className={`mb-1 text-sm font-semibold ${heading}`}>{title}</p>
                      <p className="text-xs leading-relaxed" style={{ color: muted }}>{desc}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* ── Data Model ── */}
            <section id="data-model" ref={setRef("data-model")}>
              <SectionTitle icon={Building2} title="Firestore Data Model" dk={dk} />
              <CodeBlock>{`/users/{uid}
├── name                    (string)   "John Doe"
├── monthly_income          (number)   4490
├── monthly_expenses        (number)   3458
├── riskProfile             (string)   "moderate"
├── location                (string)   "Singapore"
│
├── /statements/{statementId}
│   ├── file_name                (string)   "DBS_Mar2026.pdf"
│   ├── source_type              (string)   "bank"|"crypto"|"broker"|"investment"|"expenses"|"other"
│   ├── platform                 (string)   "DBS"
│   ├── status                   (string)   "uploaded"|"parsed"|"approved"
│   ├── net_worth_contribution   (number)   12500
│   ├── liquidity_contribution   (number)   12500
│   ├── transactions_count       (number)   15
│   ├── parsed_data
│   │   ├── closing_balance      (number)
│   │   ├── total_credits        (number)
│   │   ├── total_debits         (number)
│   │   ├── statement_month      (string)   "2026-03"
│   │   └── currency             (string)   "SGD"
│   ├── asset_class_breakdown
│   │   └── cash | stocks | crypto | bonds | property | tokenised  (number each)
│   └── /transactions/{txId}
│       ├── date        (string)   "2026-03-01"
│       ├── description (string)   "GRAB TRANSPORT"
│       ├── amount      (number)   12.50
│       ├── direction   (string)   "debit" | "credit"
│       ├── category    (string)   "transport"
│       ├── merchant    (string)   "Grab"
│       ├── currency    (string)   "SGD"
│       └── asset       (string)   "cash"
│
├── /wellness/current
│   ├── overall_score    (number)
│   ├── status           (string)   "green"|"amber"|"red"
│   ├── computed_at      (timestamp)
│   ├── pillars
│   │   ├── liquidity        { score, status }
│   │   ├── diversification  { score, status }
│   │   ├── risk_match       { score, status }
│   │   └── digital_health   { score, status }
│   └── key_metrics
│       └── net_worth | cash_buffer_months | crypto_pct | digital_pct
│           unregulated_pct | savings_rate_pct | largest_position_pct
│
└── /history/net_worth/items/{monthKey}
    ├── month        (string)   "Mar 2026"
    ├── month_key    (string)   "2026-03"
    ├── value        (number)
    └── updated_at   (timestamp)`}</CodeBlock>
            </section>

            {/* ── Aggregation & Metrics ── */}
            <section id="aggregation" ref={setRef("aggregation")}>
              <SectionTitle icon={Calculator} title="Aggregation & Metrics" dk={dk} />
              <p className="mb-4 text-sm leading-relaxed" style={{ color: muted }}>
                Before pillar scores are computed, these values are aggregated from all <strong className={heading}>active</strong> (parsed/approved) statements:
              </p>
              <Table dk={dk}
                headers={["Variable", "How It's Computed", "Example"]}
                rows={[
                  ["totalNetWorth",       "Σ stmt.net_worth_contribution",                          "S$86,700"],
                  ["totalCash",           "Σ stmt.asset_class_breakdown.cash",                      "S$32,100"],
                  ["totalCrypto",         "Σ stmt.asset_class_breakdown.crypto",                    "S$12,800"],
                  ["totalTokenised",      "Σ stmt.asset_class_breakdown.tokenised",                 "S$4,200"],
                  ["totalUnregulated",    "Σ net_worth_contribution where source_type ∈ {crypto, other}", "S$12,800"],
                  ["largestContribution", "max(stmt.net_worth_contribution)",                       "S$39,200"],
                ]}
              />
              <p className={`mt-6 mb-4 font-semibold ${heading}`}>Derived Percentage Metrics</p>
              <Table dk={dk}
                headers={["Metric", "Formula", "Example"]}
                rows={[
                  ["cashBufferMonths",   "totalCash / monthlyExpenses",                                     "32100 / 3458 = 9.28 months"],
                  ["cryptoPct",          "(totalCrypto / totalNetWorth) × 100",                             "14.76%"],
                  ["digitalPct",         "((totalCrypto + totalTokenised) / totalNetWorth) × 100",          "19.61%"],
                  ["unregulatedPct",     "(totalUnregulated / totalNetWorth) × 100",                        "14.76%"],
                  ["largestPositionPct", "(largestContribution / totalNetWorth) × 100",                     "45.21%"],
                  ["savingsRatePct",     "((monthlyIncome − monthlyExpenses) / monthlyIncome) × 100",       "22.98%"],
                ]}
              />
            </section>

            {/* ── Scoring Formulas ── */}
            <section id="scoring" ref={setRef("scoring")}>
              <SectionTitle icon={Brain} title="Scoring Formulas" dk={dk} />
              <p className="mb-4 text-sm leading-relaxed" style={{ color: muted }}>
                All pillar scores are clamped to 0–100 via{" "}
                <code className="text-teal-500">clampScore(x) = round(min(100, max(0, x)))</code>.
              </p>
              <div className="space-y-4">
                {[
                  {
                    name: "💧 Liquidity Score",
                    goal: "Ensure the user has 3–6 months of cash reserves relative to monthly expenses.",
                    formula: "if cashBufferMonths ≥ 6:\n    liquidityScore = 100\nelse:\n    liquidityScore = (cashBufferMonths / 6) × 100",
                    table: {
                      headers: ["Cash Buffer", "Score", "Status"],
                      rows: [["0 months","0","🔴 Red"],["2 months","33","🔴 Red"],["3 months","50","🟡 Amber"],["4.5 months","75","🟢 Green"],["6+ months","100","🟢 Green"]],
                    },
                  },
                  {
                    name: "📊 Diversification Score",
                    goal: "Penalise over-concentration in a single position and reward having multiple platforms.",
                    formula: "diversificationScore = 100 − largestPositionPct + min(activeStatements × 10, 30)",
                    table: {
                      headers: ["Largest Position", "Active Statements", "Score"],
                      rows: [["80%","1","30 🔴"],["50%","2","70 🟢"],["30%","4","100 🟢"],["45%","3","85 🟢"]],
                    },
                  },
                  {
                    name: "⚖️ Risk Match Score",
                    goal: "Higher crypto and unregulated exposure lowers the score.",
                    formula: "riskMatchScore = 100 − (cryptoPct × 0.5) − (unregulatedPct × 0.5)",
                    table: {
                      headers: ["Crypto %", "Unregulated %", "Score"],
                      rows: [["0%","0%","100 🟢"],["15%","15%","85 🟢"],["40%","40%","60 🟡"],["80%","80%","20 🔴"]],
                    },
                  },
                  {
                    name: "🔗 Digital Health Score",
                    goal: "Digital asset exposure (crypto + tokenised) ideally between 5–30%.",
                    formula: "if digitalPct ≤ 30:\n    digitalHealthScore = 70 + digitalPct\nelse:\n    digitalHealthScore = 100 − (digitalPct − 30) × 2",
                    table: {
                      headers: ["Digital %", "Score", "Reasoning"],
                      rows: [["0%","70 🟢","No digital = safe but not leveraging Web3"],["15%","85 🟢","Sweet spot"],["30%","100 🟢","Maximum ideal exposure"],["50%","60 🟡","Over-exposed, penalised"],["80%","0 🔴","Extreme concentration"]],
                    },
                  },
                ].map(({ name, goal, formula, table }) => (
                  <Card key={name} dk={dk}>
                    <p className={`mb-1 font-semibold ${heading}`}>{name}</p>
                    <p className="mb-3 text-xs italic" style={{ color: muted }}>{goal}</p>
                    <CodeBlock>{formula}</CodeBlock>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className={`border-b text-left ${dk ? "border-white/10" : "border-gray-200"}`}>
                            {table.headers.map((h) => (
                              <th key={h} className={`pb-2 pr-4 font-semibold ${dk ? "text-slate-400" : "text-gray-600"}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${dk ? "divide-white/5" : "divide-gray-100"}`}>
                          {table.rows.map((row, i) => (
                            <tr key={i}>
                              {row.map((cell, j) => (
                                <td key={j} className={`py-1.5 pr-4 ${j === 0 ? "text-teal-500 font-mono" : dk ? "text-slate-300" : "text-gray-700"}`}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                ))}
              </div>

              <Card className="mt-4" dk={dk}>
                <p className={`mb-2 font-semibold ${heading}`}>🏅 Overall Wellness Score</p>
                <CodeBlock>{"overallScore = round((liquidity + diversification + riskMatch + digitalHealth) / 4)"}</CodeBlock>
                <table className="mt-3 w-full text-xs">
                  <tbody className={`divide-y ${dk ? "divide-white/5" : "divide-gray-100"}`}>
                    {[["80–100","🟢 Excellent Health"],["70–79","🟢 Good Health"],["50–69","🟡 Moderate Health"],["40–49","🟡 Needs Attention"],["0–39","🔴 Critical"]].map(([range, label]) => (
                      <tr key={range}>
                        <td className="py-1.5 pr-4 font-mono text-teal-500">{range}</td>
                        <td className={`py-1.5 ${dk ? "text-slate-300" : "text-gray-700"}`}>{label}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </section>

            {/* ── Budget Calculations ── */}
            <section id="budget-calc" ref={setRef("budget-calc")}>
              <SectionTitle icon={TrendingUp} title="Budget Calculations" dk={dk} />
              <p className={`mb-4 font-semibold text-sm ${heading}`}>Budget & Emergency Savings</p>
              <Table dk={dk}
                headers={["Metric", "Formula", "Example"]}
                rows={[
                  ["monthlyBudget",          "profile.monthly_expenses",                              "S$3,458"],
                  ["spentThisMonth",          "Σ stmt.parsed_data.total_debits (current month)",      "S$2,100"],
                  ["remainingBudget",         "max(monthlyBudget − spentThisMonth, 0)",                "S$1,358"],
                  ["emergencySavingsTarget",  "monthlyExpenses × 6",                                  "S$20,748"],
                  ["emergencySavingsCurrent", "totalCash + totalBonds (capped at 1.5× target)",        "S$32,100"],
                  ["emergencySavingsPct",     "min(round((current / target) × 100), 100)",             "100%"],
                ]}
              />

              <p className={`mt-6 mb-4 font-semibold text-sm ${heading}`}>Wallet Allocation</p>
              <Card dk={dk}>
                <p className={`mb-2 text-sm ${subtext}`}>
                  For each asset class in <code className="text-teal-500">[cash, bonds, stocks, crypto, property, tokenised]</code>:
                </p>
                <CodeBlock>{"allocationPct = round((assetClassTotal / totalNetWorth) × 100)"}</CodeBlock>
                <p className={`mt-3 mb-2 text-sm ${subtext}`}>Per-platform row:</p>
                <CodeBlock>{"portfolioPct = round((stmt.net_worth_contribution / totalNetWorth) × 100)"}</CodeBlock>
              </Card>

              <p className={`mt-6 mb-4 font-semibold text-sm ${heading}`}>Category Spending Breakdown</p>
              <Card dk={dk}>
                <CodeBlock>{"categoryPct = round((categoryAmount / totalCategorySpending) × 100)"}</CodeBlock>
                <p className={`mt-3 mb-2 text-sm font-medium ${heading}`}>Priority for category data:</p>
                <ol className="space-y-1 text-sm" style={{ color: muted }}>
                  {[
                    "Transaction-level — reads category from each transaction in the subcollection",
                    "Statement-level fallback — reads category_breakdown from statement parsed_data",
                    'Last resort — single "Uncategorised" bucket using spentThisMonth',
                  ].map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-teal-500 font-bold shrink-0">{i + 1}.</span>
                      {item}
                    </li>
                  ))}
                </ol>
              </Card>
            </section>

            {/* ── Worked Example ── */}
            <section id="worked-example" ref={setRef("worked-example")}>
              <SectionTitle icon={FlaskConical} title="End-to-End Worked Example" dk={dk} />
              <p className="mb-4 text-sm leading-relaxed" style={{ color: muted }}>
                A user with <strong className={heading}>monthly income S$4,490</strong> and{" "}
                <strong className={heading}>monthly expenses S$3,458</strong> uploads 3 statements:
              </p>
              <Table dk={dk}
                headers={["Statement", "Source", "Net Worth", "Cash", "Crypto"]}
                rows={[
                  ["DBS Savings",          "bank",   "S$32,100", "S$32,100", "—"],
                  ["Interactive Brokers",  "broker", "S$28,400", "—",        "—"],
                  ["Binance",              "crypto", "S$12,800", "—",        "S$12,800"],
                ]}
              />
              <p className={`mt-6 mb-2 font-semibold text-sm ${heading}`}>Step 1 — Aggregate</p>
              <CodeBlock>{`totalNetWorth      = 32,100 + 28,400 + 12,800 = S$73,300
totalCash          = S$32,100
totalCrypto        = S$12,800
totalUnregulated   = S$12,800  (Binance = crypto source)
largestContribution= S$32,100  (DBS)`}</CodeBlock>
              <p className={`mt-4 mb-2 font-semibold text-sm ${heading}`}>Step 2 — Percentages</p>
              <CodeBlock>{`cashBufferMonths   = 32,100 / 3,458        = 9.28 months
cryptoPct          = 12,800 / 73,300 × 100 = 17.46%
digitalPct         = 12,800 / 73,300 × 100 = 17.46%
unregulatedPct     = 12,800 / 73,300 × 100 = 17.46%
largestPositionPct = 32,100 / 73,300 × 100 = 43.79%
savingsRatePct     = (4,490 − 3,458) / 4,490 × 100 = 22.98%`}</CodeBlock>
              <p className={`mt-4 mb-2 font-semibold text-sm ${heading}`}>Step 3 — Pillar Scores</p>
              <Table dk={dk}
                headers={["Pillar", "Formula", "Result"]}
                rows={[
                  ["Liquidity",       "cashBuffer ≥ 6 → 100",                  "100 🟢"],
                  ["Diversification", "100 − 43.79 + min(3×10, 30)",           "86 🟢"],
                  ["Risk Match",      "100 − 17.46×0.5 − 17.46×0.5",          "83 🟢"],
                  ["Digital Health",  "17.46 ≤ 30 → 70 + 17.46",              "87 🟢"],
                ]}
              />
              <p className={`mt-4 mb-2 font-semibold text-sm ${heading}`}>Step 4 — Overall</p>
              <CodeBlock>{"overallScore = round((100 + 86 + 83 + 87) / 4) = 89  →  🟢 Excellent Health"}</CodeBlock>
            </section>

            {/* ── Tech Stack ── */}
            <section id="tech-stack" ref={setRef("tech-stack")}>
              <SectionTitle icon={Code2} title="Tech Stack" dk={dk} />
              <Card dk={dk}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b text-left ${dk ? "border-white/10" : "border-gray-200"}`}>
                      <th className={`pb-3 pr-3 font-semibold ${dk ? "text-slate-300" : "text-gray-700"}`}>Layer</th>
                      <th className={`pb-3 pr-3 font-semibold ${dk ? "text-slate-300" : "text-gray-700"}`}>Technology</th>
                      <th className={`pb-3 hidden sm:table-cell font-semibold ${dk ? "text-slate-300" : "text-gray-700"}`}>Why</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${dk ? "divide-white/5" : "divide-gray-100"}`}>
                    {TECH_STACK.map(({ layer, tech, reason }) => (
                      <tr key={layer}>
                        <td className={`py-2.5 pr-3 text-xs whitespace-nowrap ${dk ? "text-slate-400" : "text-gray-500"}`}>{layer}</td>
                        <td className={`py-2.5 pr-3 font-medium whitespace-nowrap ${dk ? "text-white" : "text-gray-900"}`}>{tech}</td>
                        <td className="py-2.5 hidden sm:table-cell text-xs" style={{ color: muted }}>{reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </section>

            {/* ── Getting Started ── */}
            <section id="getting-started" ref={setRef("getting-started")}>
              <SectionTitle icon={Rocket} title="Getting Started" dk={dk} />
              <p className="mb-4 text-sm" style={{ color: muted }}>
                Prerequisites: Node.js ≥ 18, npm ≥ 9, a Firebase project with Auth + Firestore + Storage enabled, and a Groq API key (free tier at{" "}
                <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="text-teal-500 hover:underline">console.groq.com</a>).
              </p>
              <CodeBlock>{`# Clone the repository
git clone https://github.com/nicolotan/DeFi-Wealth-Hub.git
cd DeFi-Wealth-Hub

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local`}</CodeBlock>
              <p className={`mt-5 mb-2 font-semibold text-sm ${heading}`}>Add to <code className="text-teal-500">.env.local</code></p>
              <CodeBlock>{`VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

VITE_GROQ_API_KEY=gsk_your-groq-api-key`}</CodeBlock>
              <p className={`mt-5 mb-2 font-semibold text-sm ${heading}`}>Start dev server</p>
              <CodeBlock>{`npm run dev\n# → http://localhost:5173`}</CodeBlock>
              <p className={`mt-5 mb-2 font-semibold text-sm ${heading}`}>Firestore Security Rules</p>
              <CodeBlock>{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}`}</CodeBlock>
            </section>

            {/* ── Routes ── */}
            <section id="routes" ref={setRef("routes")}>
              <SectionTitle icon={Map} title="Pages & Routes" dk={dk} />
              <Card dk={dk}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b text-left ${dk ? "border-white/10" : "border-gray-200"}`}>
                      <th className={`pb-3 pr-4 font-semibold ${dk ? "text-slate-300" : "text-gray-700"}`}>Route</th>
                      <th className={`pb-3 pr-4 font-semibold ${dk ? "text-slate-300" : "text-gray-700"}`}>Page</th>
                      <th className={`pb-3 font-semibold ${dk ? "text-slate-300" : "text-gray-700"}`}>Auth</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${dk ? "divide-white/5" : "divide-gray-100"}`}>
                    {ROUTES.map(({ route, page, auth }) => (
                      <tr key={route}>
                        <td className="py-2.5 pr-4 font-mono text-teal-500 text-xs">{route}</td>
                        <td className={`py-2.5 pr-4 ${dk ? "text-slate-200" : "text-gray-700"}`}>{page}</td>
                        <td className="py-2.5">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${auth ? "bg-teal-500/10 text-teal-500" : "bg-slate-500/10 text-slate-500"}`}>
                            {auth ? "Required" : "Public"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </section>

            {/* ── Contributing ── */}
            <section id="contributing" ref={setRef("contributing")}>
              <SectionTitle icon={GitBranch} title="Contributing" dk={dk} />
              <ol className="space-y-3">
                {[
                  "Fork the repository",
                  "Create a feature branch: git checkout -b feature/my-feature",
                  "Commit your changes: git commit -m 'Add my feature'",
                  "Push to the branch: git push origin feature/my-feature",
                  "Open a Pull Request",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: "linear-gradient(135deg,#00C9B1,#0099FF)" }}>
                      {i + 1}
                    </span>
                    <code className={`text-sm ${dk ? "text-slate-300" : "text-gray-700"}`}>{step}</code>
                  </li>
                ))}
              </ol>
            </section>

            {/* ── License ── */}
            <section id="license" ref={setRef("license")}>
              <SectionTitle icon={FileText} title="License" dk={dk} />
              <Card dk={dk}>
                <p className="text-sm leading-relaxed" style={{ color: muted }}>
                  This project was built as part of an academic project at{" "}
                  <strong className={heading}>Nanyang Technological University (NTU)</strong>. Please contact the team for licensing enquiries.
                </p>
              </Card>
            </section>

            {/* ── Team ── */}
            <section id="team" ref={setRef("team")}>
              <SectionTitle icon={Users} title="The Team" dk={dk} />
              <p className="mb-4 text-sm" style={{ color: muted }}>
                Designed and developed by students from{" "}
                <strong className={heading}>Nanyang Technological University (NTU)</strong>.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {TEAM.map(({ name, major, github }) => (
                  <a key={name} href={`https://github.com/${github}`} target="_blank" rel="noreferrer"
                    className={`group flex items-center gap-3 rounded-2xl border p-4 transition ${
                      dk
                        ? "border-white/10 bg-white/5 hover:border-teal-500/40 hover:bg-white/10"
                        : "border-gray-100 bg-gray-50 hover:border-teal-300 hover:bg-teal-50/50"
                    }`}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ background: "linear-gradient(135deg,#00C9B1,#0099FF)" }}>
                      {name[0]}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold transition group-hover:text-teal-500 ${dk ? "text-white" : "text-gray-900"}`}>{name}</p>
                      <p className="text-xs" style={{ color: muted }}>{major}</p>
                    </div>
                    <Github className={`ml-auto h-4 w-4 transition ${dk ? "text-slate-600 group-hover:text-slate-400" : "text-gray-300 group-hover:text-gray-500"}`} />
                  </a>
                ))}
              </div>
              <p className="mt-12 text-center text-sm" style={{ color: muted }}>
                Built with ❤️ at NTU ·{" "}
                <em>Where traditional finance meets decentralised innovation</em>
              </p>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}
