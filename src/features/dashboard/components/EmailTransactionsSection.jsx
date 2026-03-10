/**
 * EmailTransactionsSection — shows Gmail-sourced transactions with
 * pending / approved / rejected tabs, inline editing, and approve/reject actions.
 */

import { useState } from 'react'
import { Mail, RefreshCw, Link2, Unlink, Check, X, Pencil, Save, Loader2 } from 'lucide-react'
import CategoryBadge from '../../../components/ui/CategoryBadge.jsx'

const CARD_CLASS = 'bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl shadow-xl p-5'

const STATUS_TABS = ['Pending', 'Approved', 'Rejected']

const fmtAmt = (amount) => {
  const abs = Math.abs(amount).toFixed(2)
  return amount >= 0 ? `+$${abs}` : `-$${abs}`
}

function formatRelativeTime(date) {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('en-SG', { dateStyle: 'medium', timeStyle: 'short' })
}

// ─── Inline Edit Row ───────────────────────────────────────────────────────

function EditableRow({ tx, onSave, onCancel }) {
  const [fields, setFields] = useState({
    source:   tx.source ?? '',
    merchant: tx.merchant ?? '',
    date:     tx.date ?? '',
    time:     tx.time ?? '',
    category: tx.category ?? '',
    amount:   tx.amount ?? 0,
  })

  const update = (key, value) => setFields((prev) => ({ ...prev, [key]: value }))

  return (
    <tr className="border-b border-blue-100 bg-blue-50/40">
      <td className="px-5 py-2">
        <input
          className="w-full bg-white rounded-lg px-2 py-1.5 text-sm border border-gray-200 focus:ring-2 focus:ring-teal-400/30 outline-none"
          value={fields.source}
          onChange={(e) => update('source', e.target.value)}
        />
      </td>
      <td className="px-4 py-2">
        <input
          className="w-full bg-white rounded-lg px-2 py-1.5 text-sm border border-gray-200 focus:ring-2 focus:ring-teal-400/30 outline-none"
          value={fields.merchant}
          onChange={(e) => update('merchant', e.target.value)}
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="date"
          className="bg-white rounded-lg px-2 py-1.5 text-sm border border-gray-200 focus:ring-2 focus:ring-teal-400/30 outline-none"
          value={fields.date}
          onChange={(e) => update('date', e.target.value)}
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="time"
          className="bg-white rounded-lg px-2 py-1.5 text-sm border border-gray-200 focus:ring-2 focus:ring-teal-400/30 outline-none"
          value={fields.time}
          onChange={(e) => update('time', e.target.value)}
        />
      </td>
      <td className="px-4 py-2">
        <CategoryBadge
          category={fields.category}
          onCategoryChange={(cat) => update('category', cat)}
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="number"
          step="0.01"
          className="w-24 bg-white rounded-lg px-2 py-1.5 text-sm text-right border border-gray-200 focus:ring-2 focus:ring-teal-400/30 outline-none"
          value={fields.amount}
          onChange={(e) => update('amount', parseFloat(e.target.value) || 0)}
        />
      </td>
      <td className="px-5 py-2">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onSave(fields)}
            className="p-1.5 rounded-lg bg-teal-500 text-white hover:bg-teal-600 transition-colors"
            title="Save & Approve"
          >
            <Save className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
            title="Cancel"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function EmailTransactionsSection({
  gmailLinked,
  gmailEmail,
  lastSync,
  linking,
  linkError,
  onLinkGmail,
  onUnlinkGmail,
  pending = [],
  approved = [],
  rejected = [],
  syncing,
  onSync,
  onApprove,
  onReject,
  onEdit,
}) {
  const [activeTab, setActiveTab] = useState('Pending')
  const [editingId, setEditingId] = useState(null)

  const tabData = {
    Pending:  pending,
    Approved: approved,
    Rejected: rejected,
  }

  const currentTxs = tabData[activeTab] ?? []

  const handleEdit = async (txId, fields) => {
    await onEdit(txId, fields)
    setEditingId(null)
  }

  return (
    <div className="space-y-4">
      {/* ── Gmail connection banner ─────────────────── */}
      <div className={CARD_CLASS}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${gmailLinked ? 'bg-green-100' : 'bg-gray-100'}`}>
              <Mail className={`h-5 w-5 ${gmailLinked ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {gmailLinked ? 'Gmail Connected' : 'Connect Gmail'}
              </p>
              <p className="text-xs text-gray-500">
                {gmailLinked
                  ? <>Linked to <span className="font-medium">{gmailEmail}</span></>
                  : 'Link your Gmail to auto-import transaction emails'}
              </p>
              {gmailLinked && lastSync && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Last synced: {formatRelativeTime(lastSync)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {gmailLinked && (
              <>
                <button
                  onClick={onSync}
                  disabled={syncing}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-600 disabled:opacity-50"
                >
                  {syncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {syncing ? 'Syncing…' : 'Sync Transactions'}
                </button>
                <button
                  onClick={onUnlinkGmail}
                  disabled={linking}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  title="Unlink Gmail"
                >
                  <Unlink className="h-4 w-4" />
                </button>
              </>
            )}
            {!gmailLinked && (
              <button
                onClick={onLinkGmail}
                disabled={linking}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
              >
                {linking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                {linking ? 'Connecting…' : 'Link Gmail'}
              </button>
            )}
          </div>
        </div>
        {linkError && (
          <p className="mt-2 text-xs text-red-500">{linkError}</p>
        )}
      </div>

      {/* ── If not linked, stop here ───────────────── */}
      {!gmailLinked && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
          <Mail className="mx-auto h-8 w-8 text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">
            Link your Gmail account to automatically import transaction emails.
          </p>
        </div>
      )}

      {/* ── Transactions table (only when linked) ──── */}
      {gmailLinked && (
        <>
          {/* Status tabs */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            {STATUS_TABS.map((tab) => {
              const count = tabData[tab]?.length ?? 0
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                    activeTab === tab
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                  {count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      tab === 'Pending' ? 'bg-amber-100 text-amber-700' :
                      tab === 'Approved' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Table */}
          <div className={CARD_CLASS}>
            <div className="overflow-hidden">
              <div className="overflow-auto" style={currentTxs.length > 0 ? { maxHeight: '420px' } : undefined}>
                <table className="w-full">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-5 py-2 text-xs text-gray-400 font-medium w-[20%]">Source</th>
                      <th className="text-left px-4 py-2 text-xs text-gray-400 font-medium">Merchant</th>
                      <th className="text-left px-4 py-2 text-xs text-gray-400 font-medium">Date</th>
                      <th className="text-left px-4 py-2 text-xs text-gray-400 font-medium">Time</th>
                      <th className="text-left px-4 py-2 text-xs text-gray-400 font-medium">Category</th>
                      <th className="text-right px-4 py-2 text-xs text-gray-400 font-medium">Amount</th>
                      <th className="text-right px-5 py-2 text-xs text-gray-400 font-medium w-30">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTxs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-400">
                          No {activeTab.toLowerCase()} transactions.
                        </td>
                      </tr>
                    ) : (
                      currentTxs.map((tx) =>
                        editingId === tx.id ? (
                          <EditableRow
                            key={tx.id}
                            tx={tx}
                            onSave={(fields) => handleEdit(tx.id, fields)}
                            onCancel={() => setEditingId(null)}
                          />
                        ) : (
                          <tr
                            key={tx.id}
                            className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${
                              tx.status === 'pending' ? 'bg-amber-50/30' : ''
                            }`}
                          >
                            <td className="px-5 py-3 text-sm text-gray-900 font-medium truncate max-w-0 w-[20%]">
                              {tx.source}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">{tx.merchant}</td>
                            <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{tx.date}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{tx.time || '—'}</td>
                            <td className="px-4 py-3">
                              <CategoryBadge category={tx.category} />
                            </td>
                            <td className={`px-4 py-3 text-sm font-semibold text-right whitespace-nowrap ${
                              tx.amount >= 0 ? 'text-teal-500' : 'text-red-500'
                            }`}>
                              {fmtAmt(tx.amount)}
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center justify-end gap-1">
                                {tx.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => onApprove(tx.id)}
                                      className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                                      title="Approve"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => onReject(tx.id)}
                                      className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                      title="Reject"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setEditingId(tx.id)}
                                      className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                                      title="Edit"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                  </>
                                )}
                                {tx.status === 'approved' && (
                                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                    <Check className="h-3 w-3" /> Approved
                                  </span>
                                )}
                                {tx.status === 'rejected' && (
                                  <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                                    <X className="h-3 w-3" /> Rejected
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ),
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
