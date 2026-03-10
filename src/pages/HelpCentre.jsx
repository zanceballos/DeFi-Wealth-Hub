import { useState } from "react";
import {
  LifeBuoy, ChevronDown, ChevronUp, Search,
  BookOpen, MessageSquare, Github, Mail,
  ExternalLink, Clock,
} from "lucide-react";

const faqs = [
  {
    id: 1, category: "Getting Started",
    question: "How do I upload my first financial statement?",
    answer: "Click the 'Upload Statement' button on the Dashboard. You can upload bank statements, broker reports, or crypto exchange exports as PDF or CSV files. Our AI pipeline (powered by InternVL) will parse your document, extract transactions, and present them for your review before saving.",
  },
  {
    id: 2, category: "Getting Started",
    question: "What file types and sources are supported?",
    answer: "We support PDF and CSV files from banks (DBS, OCBC, UOB, etc.), brokerage platforms (Tiger Brokers, Moomoo, IBKR, CDP), crypto exchanges (Binance, Bybit, Coinbase, Kraken), and expense summaries. You can also link your Gmail to automatically pull transaction emails.",
  },
  {
    id: 3, category: "Getting Started",
    question: "Do I need to connect my bank account?",
    answer: "No. DeFi Wealth Hub never asks for your banking credentials or login details. You simply export a statement from your bank's app or website and upload it here. This is by design — your credentials stay with you.",
  },
  {
    id: 4, category: "Statements & Transactions",
    question: "What happens after I upload a statement?",
    answer: "After uploading, our AI parses the document and presents each transaction in a review table. You can approve, reject, or edit any row before saving. Only approved and edited rows are saved to your account. Once saved, your Wellness Score and net worth history are automatically recomputed.",
  },
  {
    id: 5, category: "Statements & Transactions",
    question: "How do I link my Gmail for email transactions?",
    answer: "Go to the Budgeting tab and click 'Link Gmail'. You will be prompted to sign in with Google and grant read-only access to your emails. We scan for transaction-related emails (e.g. PayNow receipts, card alerts) and automatically parse the amount, merchant, and date. You can unlink Gmail anytime from the Trust & Security page.",
  },
  {
    id: 6, category: "Statements & Transactions",
    question: "Can I edit or exclude a transaction after saving?",
    answer: "Yes. In the Budgeting tab's transaction table, click the pencil icon to edit a transaction's amount or category. Click the eye-off icon to exclude a transaction from analytics. Excluded transactions do not count toward your budget, spending breakdown, or Wellness Score.",
  },
  {
    id: 7, category: "Wellness & Analytics",
    question: "What is the Wellness Score?",
    answer: "The Wellness Score (0–100) is a composite metric made up of 4 pillars: Liquidity (cash buffer vs monthly expenses), Diversification (spread across asset classes and platforms), Risk Match (crypto and unregulated exposure), and Digital Health (ideal digital asset exposure of 5–30%). Green = 70+, Amber = 50–69, Red = below 50.",
  },
  {
    id: 8, category: "Wellness & Analytics",
    question: "Why did my Wellness Score change?",
    answer: "Your score is automatically recomputed whenever you upload or delete a statement, sync or remove email transactions, edit a transaction, or update your monthly income or expenses in your profile. Any change in your financial data triggers a fresh calculation.",
  },
  {
    id: 9, category: "Wellness & Analytics",
    question: "How is net worth calculated?",
    answer: "Net worth is the sum of net_worth_contribution across all your uploaded statements. Each statement contributes its closing balance or total asset value. The donut chart on the Wallet tab breaks this down into Cash, Stocks, and Crypto based on the asset field of your transactions.",
  },
  {
    id: 10, category: "AI Advisory",
    question: "How does the AI Advisory work?",
    answer: "The Advisory page uses Groq AI (Llama 3.3 70B) to analyse your full financial profile — statements, wellness scores, net worth history, income, expenses, and risk profile. It returns structured, Singapore-aware recommendations covering key insights, action steps, and educational topics. Results are cached per session to avoid rate limits.",
  },
  {
    id: 11, category: "Privacy & Security",
    question: "Where is my data stored and who can see it?",
    answer: "All data is stored in Firebase Firestore under your unique user ID. Firebase Security Rules ensure that only you can read or write your own data — not other users, not our team. Data is encrypted in transit (TLS 1.3) and at rest (AES-256). We never store your banking credentials.",
  },
  {
    id: 12, category: "Privacy & Security",
    question: "How do I delete my data?",
    answer: "Go to the Trust & Security page (shield icon in the sidebar). You can delete individual statements, all email transactions by date, or reset your entire account. Resetting deletes all statements, transactions, wellness scores, and net worth history while keeping your login and profile intact.",
  },
];

const CARD = "bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl shadow-xl";

const CATEGORY_COLORS = {
  "Getting Started":           "bg-emerald-50 text-emerald-700",
  "Statements & Transactions": "bg-violet-50 text-violet-700",
  "Wellness & Analytics":      "bg-amber-50 text-amber-700",
  "AI Advisory":               "bg-blue-50 text-blue-700",
  "Privacy & Security":        "bg-red-50 text-red-600",
};

export default function HelpCentre() {
  const [expandedFAQ,    setExpandedFAQ]    = useState(null);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [activeTab,      setActiveTab]      = useState("faq");
  const [formData,       setFormData]       = useState({
    name: "", email: "", subject: "",
    category: "general", message: "", priority: "medium",
  });
  const [submitLoading,  setSubmitLoading]  = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage,   setErrorMessage]   = useState("");

  const filteredFAQs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const showMessage = (msg, isError = false) => {
    if (isError) { setErrorMessage(msg); setTimeout(() => setErrorMessage(""), 5000); }
    else         { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(""), 5000); }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      showMessage("Please fill in all required fields.", true);
      return;
    }
    setSubmitLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      showMessage("Your query has been submitted! We'll reply within 3 business days.");
      setFormData({ name: "", email: "", subject: "", category: "general", message: "", priority: "medium" });
    } catch (err) {
      showMessage(err.message || "Failed to submit.", true);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans">
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">

        {/* HEADER */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#2081C3]/10 flex items-center justify-center shrink-0">
            <LifeBuoy className="w-5 h-5 text-[#2081C3]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Help Centre</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Find answers to common questions or raise a support query.
            </p>
          </div>
        </div>

        {/* STATUS BANNER */}
        <div className="flex items-center gap-3 rounded-3xl border border-[#2081C3]/20 bg-[#2081C3]/5 px-5 py-4">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#2081C3]">Support Status: Active</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Monitored by the DeFi Wealth Hub team · NTU Hackathon Project
            </p>
          </div>
        </div>

        {/* TOASTS */}
        {successMessage && (
          <div className="flex items-center gap-3 rounded-3xl border border-emerald-100 bg-emerald-50 px-5 py-3 text-sm text-emerald-700">
            ✓ {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="flex items-center gap-3 rounded-3xl border border-red-100 bg-red-50 px-5 py-3 text-sm text-red-600">
            ✕ {errorMessage}
          </div>
        )}

        {/* SEARCH */}
        <div className={`${CARD} p-5`}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setActiveTab("faq"); }}
              placeholder="Search FAQs and topics…"
              className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2081C3]/20 focus:border-[#2081C3] transition-all"
            />
          </div>
        </div>

        {/* TABS — only 2 now */}
        <div className="flex gap-1 rounded-2xl bg-gray-100 p-1 w-fit">
          {[
            { key: "faq",     label: "FAQ"           },
            { key: "support", label: "Raise a Query" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── FAQ TAB ── */}
        {activeTab === "faq" && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Frequently Asked Questions
            </h2>

            {filteredFAQs.length === 0 ? (
              <div className={`${CARD} p-10 text-center`}>
                <Search className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                <p className="text-sm font-semibold text-gray-500">No matching questions found</p>
                <p className="text-xs text-gray-400 mt-1">Try a different search term.</p>
              </div>
            ) : (
              filteredFAQs.map((faq) => {
                const isOpen = expandedFAQ === faq.id;
                return (
                  <div key={faq.id} className={`${CARD} overflow-hidden`}>
                    <button
                      onClick={() => setExpandedFAQ(isOpen ? null : faq.id)}
                      className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition text-left"
                    >
                      <div className="flex-1">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold mb-1.5 ${CATEGORY_COLORS[faq.category] ?? "bg-gray-100 text-gray-500"}`}>
                          {faq.category}
                        </span>
                        <p className="font-semibold text-gray-900 text-sm">{faq.question}</p>
                      </div>
                      {isOpen
                        ? <ChevronUp   className="w-4 h-4 text-gray-400 shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                      }
                    </button>
                    {isOpen && (
                      <div className="border-t border-gray-50 px-6 py-4 bg-gray-50/40">
                        <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </section>
        )}

        {/* ── SUPPORT FORM TAB ── */}
        {activeTab === "support" && (
          <section className="space-y-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Raise a Query
            </h2>

            <div className="flex items-center gap-3 rounded-3xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-700">
              <MessageSquare className="w-4 h-4 shrink-0" />
              Submit your query and our team will respond within 3 business days.
              For urgent issues, select High priority.
            </div>

            <form onSubmit={handleSubmit} className={`${CARD} p-6 space-y-5`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Name *</label>
                  <input
                    type="text" name="name" value={formData.name}
                    onChange={handleFormChange} placeholder="Your name"
                    disabled={submitLoading}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2081C3]/20 focus:border-[#2081C3] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email Address *</label>
                  <input
                    type="email" name="email" value={formData.email}
                    onChange={handleFormChange} placeholder="you@example.com"
                    disabled={submitLoading}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2081C3]/20 focus:border-[#2081C3] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Category</label>
                  <select
                    name="category" value={formData.category}
                    onChange={handleFormChange} disabled={submitLoading}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2081C3]/20 focus:border-[#2081C3] transition-all"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="technical">Technical Issue</option>
                    <option value="account">Account & Security</option>
                    <option value="feature">Feature Request</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Priority</label>
                  <select
                    name="priority" value={formData.priority}
                    onChange={handleFormChange} disabled={submitLoading}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2081C3]/20 focus:border-[#2081C3] transition-all"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Subject *</label>
                <input
                  type="text" name="subject" value={formData.subject}
                  onChange={handleFormChange} placeholder="Brief subject of your query"
                  disabled={submitLoading}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2081C3]/20 focus:border-[#2081C3] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Message *</label>
                <textarea
                  name="message" value={formData.message}
                  onChange={handleFormChange}
                  placeholder="Describe your issue in detail…"
                  rows={5} disabled={submitLoading}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2081C3]/20 focus:border-[#2081C3] transition-all resize-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit" disabled={submitLoading}
                  className="flex items-center gap-2 bg-[#2081C3] text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                  {submitLoading ? "Submitting…" : "Submit Query"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* RESOURCES */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Additional Resources
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { href: "/docs",                                          icon: BookOpen, label: "Documentation", sub: "Full technical docs"        },
              { href: "https://github.com/zanceballos/DeFi-Wealth-Hub",  icon: Github,   label: "GitHub Repo",   sub: "View source code", external: true },
              { href: "mailto:wealthhub.defi@gmail.com",               icon: Mail,     label: "Email Support", sub: "wealthhub.defi@gmail.com"   },
            ].map(({ href, icon: Icon, label, sub, external }) => (
              <a
                key={label} href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                className={`${CARD} flex items-center gap-4 p-5 hover:shadow-2xl hover:border-[#2081C3]/30 transition-all`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#2081C3]/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#2081C3]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                    {label}
                    {external && <ExternalLink className="w-3 h-3 text-gray-400" />}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{sub}</p>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* CONTACT */}
        <section className={`${CARD} p-6`}>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">
            Direct Contact
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: "Email",          value: "wealthhub.defi@gmail.com", href: "mailto:wealthhub.defi@gmail.com" },
              { label: "Response Time",  value: "Within 3 business days"                                            },
              { label: "Business Hours", value: "Mon–Fri, 9am–6pm SGT"                                             },
            ].map(({ label, value, href }) => (
              <div key={label}>
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                {href
                  ? <a href={href} className="text-sm font-semibold text-[#2081C3] hover:underline">{value}</a>
                  : <p className="text-sm font-semibold text-gray-900">{value}</p>
                }
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
