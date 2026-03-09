import { useState } from 'react'
import {
  Shield, FileText, FileSpreadsheet, Folder, Coins,
  Upload, CheckCircle2, XCircle, Lock, Key, Eye,
  RefreshCw, ChevronDown, ChevronUp, LifeBuoy,
  Trash2, ArrowRight, Loader2, AlertTriangle,
} from 'lucide-react'
import { usePrivacy } from '../hooks/usePrivacy'

// Map source_type → display config
const SOURCE_CONFIG = {
  bank:       { label: 'Bank Statements',    icon: FileText,       color: '#2081C3' },
  crypto:     { label: 'Crypto Exports',     icon: FileSpreadsheet, color: '#f59e0b' },
  broker:     { label: 'Broker Reports',     icon: Folder,          color: '#8b5cf6' },
  investment: { label: 'Investment Docs',    icon: Coins,           color: '#10b981' },
  expenses:   { label: 'Expense Summaries',  icon: FileText,        color: '#ef4444' },
  other:      { label: 'Other Documents',    icon: Folder,          color: '#6b7280' },
}

const STATUS_COLORS = {
  approved: 'bg-emerald-50 text-emerald-700',
  parsed:   'bg-blue-50 text-blue-700',
  uploaded: 'bg-amber-50 text-amber-700',
}

const canDo = [
  'Analyze balances',
  'Track portfolio value',
  'Generate financial insights',
  'Visualize wealth trends',
]

const cannotDo = [
  'Move money',
  'Execute trades',
  'Access bank accounts',
  'Modify financial records',
]

const protectionPoints = [
  'Uploaded files are encrypted during storage and processing.',
  'We never store banking credentials or login details.',
  'Documents are processed only to extract financial insights.',
  'Users can delete all uploaded documents anytime.',
]

const trustBadges = [
  { icon: Lock,     label: 'Encrypted uploads' },
  { icon: Key,      label: 'User-controlled data' },
  { icon: Eye,      label: 'Read-only analysis' },
  { icon: RefreshCw,label: 'Transparent processing' },
]

function formatSGD(val) {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', maximumFractionDigits: 0 }).format(val)
}

export default function Privacy() {
  const {
    grouped, loading, deleting,
    totalFiles, totalTransactions, totalNetWorth,
    deleteStatement, deleteAllStatements, recomputing
  } = usePrivacy()

  const [openType, setOpenType]           = useState(null)
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[#2081C3]" />
      </div>
    )
  }

  const sourceTypes = Object.keys(grouped)

  return (
    <div className="min-h-screen font-sans">
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">

        {/* HEADER */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#2081C3]/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#2081C3]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Trust & Security</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Transparency about how your financial documents are uploaded, processed and protected.
            </p>
          </div>
        </div>

        {recomputing && (
  <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3 text-sm text-blue-700">
    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
    Recalculating your wellness score and net worth history...
  </div>
)}

        {/* SUMMARY STATS */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Documents uploaded', value: totalFiles },
            { label: 'Transactions parsed', value: totalTransactions.toLocaleString() },
            { label: 'Net worth tracked',   value: formatSGD(totalNetWorth) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-2xl p-5 text-center">
              <p className="text-2xl font-black text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* DATA SOURCES — live from Firestore */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Your Uploaded Documents
          </h2>

          {sourceTypes.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
              <Upload className="mx-auto mb-3 h-8 w-8 text-gray-300" />
              <p className="text-sm font-semibold text-gray-500">No documents uploaded yet</p>
              <p className="text-xs text-gray-400 mt-1">Upload a statement from the dashboard to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sourceTypes.map((type) => {
                const config  = SOURCE_CONFIG[type] || SOURCE_CONFIG.other
                const Icon    = config.icon
                const stmts   = grouped[type]
                const isOpen  = openType === type

                return (
                  <div key={type} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                    {/* Accordion header */}
                    <button
                      onClick={() => setOpenType(isOpen ? null : type)}
                      className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition text-left"
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${config.color}18` }}>
                        <Icon className="w-5 h-5" style={{ color: config.color }} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{config.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {stmts.length} document{stmts.length !== 1 ? 's' : ''} ·{' '}
                          {stmts.reduce((s, st) => s + (st.transactions_count || 0), 0)} transactions
                        </p>
                      </div>
                      {isOpen
                        ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                      }
                    </button>

                    {/* Expanded file list */}
                    {isOpen && (
                      <div className="border-t border-gray-50 px-6 py-4 space-y-2">
                        {stmts.map((stmt) => {
                          const statusClass = STATUS_COLORS[stmt.status] || STATUS_COLORS.uploaded
                          const isDeleting  = deleting === stmt.id

                          return (
                            <div
                              key={stmt.id}
                              className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 gap-3"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">
                                  {stmt.file_name || stmt.platform || stmt.id}
                                </p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${statusClass}`}>
                                    <CheckCircle2 className="w-3 h-3" />
                                    {stmt.status}
                                  </span>
                                  {stmt.parsed_data?.statement_month && (
                                    <span className="text-xs text-gray-400">{stmt.parsed_data.statement_month}</span>
                                  )}
                                  {stmt.parsed_data?.currency && (
                                    <span className="text-xs text-gray-400">{stmt.parsed_data.currency}</span>
                                  )}
                                  {stmt.net_worth_contribution > 0 && (
                                    <span className="text-xs text-gray-400">
                                      {formatSGD(stmt.net_worth_contribution)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <button
                                onClick={() => deleteStatement(stmt.id)}
                                disabled={isDeleting || deleting === 'all'}
                                className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600 disabled:opacity-40 shrink-0"
                              >
                                {isDeleting
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : <Trash2 className="w-3.5 h-3.5" />
                                }
                                Remove
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* FILE PROCESSING */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-3">How File Processing Works</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Uploaded PDFs and CSV files are parsed to extract balances, transactions and asset values.
            Our system analyzes these files to generate portfolio insights and financial visualizations.
            No banking credentials or direct bank connections are required.
          </p>
        </section>

        {/* DATA FLOW */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-6">How Your Data Flows</h3>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center">
            {[
              { icon: Upload,    label: 'Upload Documents' },
              { icon: Shield,    label: 'Secure Processing' },
              { icon: RefreshCw, label: 'Portfolio Insights' },
            ].map(({ icon: Icon, label }, i, arr) => (
              <>
                <div key={label} className="flex flex-col items-center gap-2">
                  <Icon className="w-6 h-6 text-[#2081C3]" />
                  <p className="text-xs font-medium text-gray-600">{label}</p>
                </div>
                {i < arr.length - 1 && <ArrowRight key={`arrow-${i}`} className="text-gray-300 shrink-0" />}
              </>
            ))}
          </div>
        </section>

        {/* FILE PROCESSING STATUS TABLE */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            File Processing Status
          </h2>
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  {['File', 'Platform', 'Status', 'Month', 'Net Worth'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs text-gray-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {Object.values(grouped).flat().length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">
                      No documents uploaded yet.
                    </td>
                  </tr>
                ) : (
                  Object.values(grouped).flat().map((stmt) => (
                    <tr key={stmt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-800 max-w-[180px] truncate">
                        {stmt.file_name || stmt.id}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{stmt.platform || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${STATUS_COLORS[stmt.status] || STATUS_COLORS.uploaded}`}>
                          <CheckCircle2 className="w-3 h-3" />
                          {stmt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {stmt.parsed_data?.statement_month || '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {stmt.net_worth_contribution ? formatSGD(stmt.net_worth_contribution) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* CAN / CANNOT */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h3 className="font-bold text-gray-900 mb-4">What we can do</h3>
            <ul className="space-y-3">
              {canDo.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h3 className="font-bold text-gray-900 mb-4">What we cannot do</h3>
            <ul className="space-y-3">
              {cannotDo.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* DATA PROTECTION */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 mb-4">How We Protect Your Data</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            {protectionPoints.map((point) => (
              <li key={point} className="flex gap-2">
                <span className="w-1.5 h-1.5 bg-[#78D5D7] rounded-full mt-2 shrink-0" />
                {point}
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t">
            {trustBadges.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 text-center">
                <div className="w-9 h-9 bg-[#2081C3]/10 rounded-xl flex items-center justify-center text-[#2081C3]">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </div>

          {/* DELETE ALL */}
          <div className="mt-8 pt-6 border-t">
            {!confirmDeleteAll ? (
              <button
                onClick={() => setConfirmDeleteAll(true)}
                disabled={Object.keys(grouped).length === 0 || deleting === 'all'}
                className="flex items-center gap-2 text-sm font-semibold text-red-500 hover:text-red-600 disabled:opacity-40"
              >
                <Trash2 className="w-4 h-4" />
                Delete all uploaded documents
              </button>
            ) : (
              <div className="flex items-center gap-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-700 flex-1">
                  This will permanently delete all {totalFiles} documents and {totalTransactions} transactions. Are you sure?
                </p>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setConfirmDeleteAll(false)}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => { await deleteAllStatements(); setConfirmDeleteAll(false) }}
                    disabled={deleting === 'all'}
                    className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-40"
                  >
                    {deleting === 'all' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    Yes, delete all
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SUPPORT */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <LifeBuoy className="w-4 h-4 text-[#2081C3]" />
            <h3 className="text-sm font-bold text-gray-900">Need Help?</h3>
          </div>
          <p className="text-sm text-gray-500 mb-5">
            If you have questions about file uploads, document parsing, or security, our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-gray-600">
              Contact support:{' '}
              <a href="mailto:support@wealthwellness.ai" className="font-semibold text-[#2081C3] hover:underline">
                support@wealthwellness.ai
              </a>
            </div>
            <div className="flex gap-4 text-xs font-semibold text-[#2081C3]">
              <button className="hover:underline">Help Center</button>
              <button className="hover:underline">Privacy Policy</button>
              <button className="hover:underline">Terms</button>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}
