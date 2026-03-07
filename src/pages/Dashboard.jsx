import { useMemo, useState } from 'react'
import { CandlestickChart, Droplets, ShieldAlert, Sparkles } from 'lucide-react'
import OverviewTab from '../components/dashboard/OverviewTab'
import WalletTab from '../components/dashboard/WalletTab'

const USER_PROFILE = {
  name: 'Alex Tan',
  riskProfile: 'Moderate',
  location: 'Singapore',
}

const HERO_STATS = {
  netWorth: {
    value: 'S$85,700',
    delta: '+4.8% this month',
  },
  wellness: {
    score: 78,
    label: 'Moderate Health',
  },
  savings: {
    value: 'S$1,032',
    rate: 23,
  },
}

const PILLAR_SCORES = [
  {
    name: 'Liquidity',
    score: 42,
    colorClass: 'bg-red-500',
    textClass: 'text-red-500',
    icon: Droplets,
    description: 'Cash reserves are below target for short-term resilience.',
  },
  {
    name: 'Diversification',
    score: 68,
    colorClass: 'bg-amber-400',
    textClass: 'text-amber-500',
    icon: CandlestickChart,
    description: 'Allocation is balanced but still concentrated in key sectors.',
  },
  {
    name: 'Risk Match',
    score: 54,
    colorClass: 'bg-amber-400',
    textClass: 'text-amber-500',
    icon: ShieldAlert,
    description: 'Current volatility is slightly above your moderate profile.',
  },
  {
    name: 'Digital Assets',
    score: 60,
    colorClass: 'bg-amber-400',
    textClass: 'text-amber-500',
    icon: Sparkles,
    description: 'Exposure is meaningful and should be actively monitored.',
  },
]

const NET_WORTH_SERIES = [
  { month: 'Jan', value: 65000 },
  { month: 'Feb', value: 67200 },
  { month: 'Mar', value: 69800 },
  { month: 'Apr', value: 71500 },
  { month: 'May', value: 72900 },
  { month: 'Jun', value: 75100 },
  { month: 'Jul', value: 77300 },
  { month: 'Aug', value: 79000 },
  { month: 'Sep', value: 80200 },
  { month: 'Oct', value: 82100 },
  { month: 'Nov', value: 83900 },
  { month: 'Dec', value: 85700 },
]

const OVERVIEW_INSIGHTS = [
  {
    tone: 'red',
    text: 'Crypto is 32% of net worth — above moderate threshold',
  },
  {
    tone: 'amber',
    text: 'Cash buffer is 4.5 months — target is 6 months',
  },
  {
    tone: 'emerald',
    text: 'Net worth grew +4.8% this month — great progress',
  },
]

const WALLET_ALLOCATION = [
  { name: 'Cash', value: 15, color: '#3B82F6' },
  { name: 'Bonds', value: 14, color: '#10B981' },
  { name: 'Stocks', value: 32, color: '#6366F1' },
  { name: 'Crypto', value: 27, color: '#F59E0B' },
  { name: 'Property', value: 6, color: '#EF4444' },
  { name: 'Tokenised', value: 6, color: '#8B5CF6' },
]

const WALLET_ROWS = [
  {
    asset: 'DBS Savings',
    platform: 'DBS',
    value: 'S$8,500',
    portfolio: '10%',
    riskLabel: 'Core',
    regulated: '✅ MAS',
  },
  {
    asset: 'OCBC 360',
    platform: 'OCBC',
    value: 'S$4,200',
    portfolio: '5%',
    riskLabel: 'Core',
    regulated: '✅ MAS',
  },
  {
    asset: 'CPF (OA)',
    platform: 'CPF Board',
    value: 'S$12,000',
    portfolio: '14%',
    riskLabel: 'Stable',
    regulated: '✅ MAS',
  },
  {
    asset: 'StashAway',
    platform: 'StashAway',
    value: 'S$18,000',
    portfolio: '21%',
    riskLabel: 'Stable',
    regulated: '✅ MAS',
  },
  {
    asset: 'Tiger Brokers',
    platform: 'Tiger',
    value: 'S$9,500',
    portfolio: '11%',
    riskLabel: 'Growth',
    regulated: '✅ MAS',
  },
  {
    asset: 'Bitcoin (BTC)',
    platform: 'Coinbase',
    value: 'S$15,000',
    portfolio: '18%',
    riskLabel: 'Speculative',
    regulated: '⚠️ Unregulated',
  },
  {
    asset: 'Ethereum (ETH)',
    platform: 'MetaMask',
    value: 'S$8,000',
    portfolio: '9%',
    riskLabel: 'Speculative',
    regulated: '⚠️ Unregulated',
  },
  {
    asset: 'Schroders Token',
    platform: 'Schroders',
    value: 'S$5,000',
    portfolio: '6%',
    riskLabel: 'Stable',
    regulated: '✅ MAS',
  },
  {
    asset: 'HDB (partial)',
    platform: 'Manual',
    value: 'S$5,500',
    portfolio: '6%',
    riskLabel: 'Stable',
    regulated: '✅ MAS',
  },
]

const TABS = [
  { id: 'overview', label: '🏠 Overview' },
  { id: 'wallet', label: '💼 Wallet' },
]

const API_BASE_URL = import.meta.env.VITE_PIPELINE_API_BASE_URL ?? 'https://defi-api.stocksuite.app'
const REVIEWABLE_KEYS = ['date', 'description', 'amount', 'currency', 'category', 'direction', 'asset']
const FIXED_USER_ID = 'u1'

function toRows(rawRows) {
  if (!Array.isArray(rawRows)) return []
  return rawRows.map((row, index) => ({
    id: row.id ?? row.row_id ?? row.rowId ?? `local-${index}`,
    normalizedPayload: row.normalized_payload ?? row.normalizedPayload ?? {},
    fieldConfidence: row.field_confidence ?? row.fieldConfidence ?? {},
    rowConfidence: row.row_confidence ?? row.rowConfidence ?? null,
    validationFlags: row.validation_flags ?? row.validationFlags ?? [],
    state: row.state ?? 'pending',
    raw: row,
  }))
}

function extractBalancedJsonObject(text) {
  const start = text.indexOf('{')
  if (start < 0) return null
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i]
    if (escaped) {
      escaped = false
      continue
    }
    if (ch === '\\') {
      escaped = true
      continue
    }
    if (ch === '"') inString = !inString
    if (inString) continue
    if (ch === '{') depth += 1
    if (ch === '}') {
      depth -= 1
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return null
}

function recoverRowsFromRowsArrayText(text) {
  const marker = text.search(/"rows"\s*:\s*\[/)
  if (marker < 0) return []
  const start = text.indexOf('[', marker)
  if (start < 0) return []
  const rows = []
  let depth = 0
  let objectStart = -1
  let inString = false
  let escaped = false
  for (let i = start + 1; i < text.length; i += 1) {
    const ch = text[i]
    if (escaped) {
      escaped = false
      continue
    }
    if (ch === '\\') {
      escaped = true
      continue
    }
    if (ch === '"') inString = !inString
    if (inString) continue
    if (ch === '{') {
      if (depth === 0) objectStart = i
      depth += 1
    } else if (ch === '}') {
      depth -= 1
      if (depth === 0 && objectStart >= 0) {
        const rawObject = text.slice(objectStart, i + 1)
        try {
          rows.push(JSON.parse(rawObject))
        } catch {
          // Ignore malformed partial objects from truncated model output.
        }
      }
    }
  }
  return rows
}

function parseRowsFromModelText(modelText) {
  if (typeof modelText !== 'string' || modelText.trim().length === 0) return []
  const stripped = modelText.replace(/```json/gi, '').replace(/```/g, '').trim()
  try {
    const parsed = JSON.parse(stripped)
    return Array.isArray(parsed?.rows) ? parsed.rows : []
  } catch {
    // Continue with resilient extraction.
  }

  const balanced = extractBalancedJsonObject(stripped)
  if (balanced) {
    try {
      const parsed = JSON.parse(balanced)
      if (Array.isArray(parsed?.rows)) return parsed.rows
    } catch {
      // Fall through to row-by-row salvage.
    }
  }
  return recoverRowsFromRowsArrayText(stripped)
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [isOverlayOpen, setIsOverlayOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [source, setSource] = useState('bank')
  const [jobId, setJobId] = useState('')
  const [rows, setRows] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [editRowId, setEditRowId] = useState(null)
  const [editPayloadDraft, setEditPayloadDraft] = useState('')

  const tableColumns = useMemo(() => {
    const seen = new Set(REVIEWABLE_KEYS)
    rows.forEach((row) => {
      Object.keys(row.normalizedPayload || {}).forEach((key) => seen.add(key))
    })
    return Array.from(seen).slice(0, 8)
  }, [rows])

  const todayLabel = new Intl.DateTimeFormat('en-SG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  const setRowStateLocally = (rowId, nextState) => {
    setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, state: nextState } : row)))
  }

  const updateRowPayloadLocally = (rowId, payload) => {
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, normalizedPayload: payload, state: 'edited' } : row)),
    )
  }

  const recoverRowsFromArtifacts = async (currentJobId) => {
    if (!currentJobId) return false
    const response = await fetch(`${API_BASE_URL}/v1/jobs/${currentJobId}/artifacts`)
    if (!response.ok) return false
    const payload = await response.json()
    const artifacts = payload?.artifacts
    if (!artifacts || typeof artifacts !== 'object') return false

    const qwenModelText = Object.values(artifacts)
      .map((entry) => entry?.qwenvl?.raw_response?.model_text)
      .find((text) => typeof text === 'string' && text.length > 0)

    const recoveredRows = parseRowsFromModelText(qwenModelText)
    if (!Array.isArray(recoveredRows) || recoveredRows.length === 0) return false

    const syntheticRows = recoveredRows.map((row, index) => ({
      row_id: `recovered-${currentJobId}-${index}`,
      normalized_payload: row,
      row_confidence: null,
      validation_flags: ['recovered_from_model_text'],
      state: 'pending',
    }))
    setRows(toRows(syntheticRows))
    setInfoMessage(
      `Recovered ${recoveredRows.length} row(s) from model_text because backend parsed output was empty.`,
    )
    return true
  }

  const handleUploadAndParse = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a file before uploading.')
      return
    }

    setIsProcessing(true)
    setErrorMessage('')
    setInfoMessage('')
    setRows([])

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('source', source)
    formData.append('user_id', FIXED_USER_ID)

    try {
      const response = await fetch(`${API_BASE_URL}/v1/documents/upload-and-parse`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'Upload and parse failed.')
      }

      const payload = await response.json()
      const returnedJobId = payload.job?.id ?? payload.job_id ?? ''
      setJobId(returnedJobId)
      const parsedRows = toRows(payload.rows)
      setRows(parsedRows)
      if (parsedRows.length === 0 && returnedJobId) {
        await recoverRowsFromArtifacts(returnedJobId)
      }
    } catch (error) {
      setErrorMessage(
        error instanceof TypeError
          ? `Unable to reach backend at ${API_BASE_URL}. Check backend is running and CORS allows the Vite origin.`
          : error.message || 'Unable to parse the uploaded file.',
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const refreshRows = async () => {
    if (!jobId) return
    setIsProcessing(true)
    setErrorMessage('')
    setInfoMessage('')
    try {
      const response = await fetch(`${API_BASE_URL}/v1/jobs/${jobId}/rows`)
      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'Failed to fetch parsed rows.')
      }
      const payload = await response.json()
      const rawRows = Array.isArray(payload) ? payload : payload.rows
      const parsedRows = toRows(rawRows)
      setRows(parsedRows)
      if (parsedRows.length === 0) {
        await recoverRowsFromArtifacts(jobId)
      }
    } catch (error) {
      setErrorMessage(
        error instanceof TypeError
          ? `Unable to reach backend at ${API_BASE_URL}. Check backend is running and CORS allows the Vite origin.`
          : error.message || 'Unable to refresh rows.',
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const approveRow = async (rowId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/rows/${rowId}/approve`, { method: 'PATCH' })
      if (!response.ok) throw new Error('approve_failed')
      setRowStateLocally(rowId, 'approved')
    } catch {
      setRowStateLocally(rowId, 'approved')
      setErrorMessage('Approve endpoint not reachable. Applied state locally for now.')
    }
  }

  const rejectRow = async (rowId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/rows/${rowId}/reject`, { method: 'PATCH' })
      if (!response.ok) throw new Error('reject_failed')
      setRowStateLocally(rowId, 'rejected')
    } catch {
      setRowStateLocally(rowId, 'rejected')
      setErrorMessage('Reject endpoint not reachable. Applied state locally for now.')
    }
  }

  const skipRow = (rowId) => {
    setRowStateLocally(rowId, 'pending')
  }

  const beginEditRow = (row) => {
    setEditRowId(row.id)
    setEditPayloadDraft(JSON.stringify(row.normalizedPayload ?? {}, null, 2))
  }

  const saveEditRow = async () => {
    if (!editRowId) return
    let parsedDraft
    try {
      parsedDraft = JSON.parse(editPayloadDraft)
    } catch {
      setErrorMessage('Edited JSON is invalid. Fix JSON and try again.')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/v1/rows/${editRowId}/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ normalized_payload: parsedDraft }),
      })
      if (!response.ok) throw new Error('edit_failed')
      updateRowPayloadLocally(editRowId, parsedDraft)
    } catch {
      updateRowPayloadLocally(editRowId, parsedDraft)
      setErrorMessage('Edit endpoint not reachable. Applied edit locally for now.')
    } finally {
      setEditRowId(null)
      setEditPayloadDraft('')
    }
  }

  return (
    <section className="relative isolate min-h-full w-full overflow-hidden p-4 sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />

      <div className="sticky top-0 z-20 mb-6 rounded-2xl border border-white/70 bg-white/70 p-2 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? 'rounded-xl bg-brand-primary text-white'
                  : 'rounded-xl text-gray-500 hover:text-brand-primary hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10">
        {activeTab === 'overview' ? (
          <OverviewTab
            userProfile={USER_PROFILE}
            heroStats={HERO_STATS}
            pillarScores={PILLAR_SCORES}
            netWorthSeries={NET_WORTH_SERIES}
            overviewInsights={OVERVIEW_INSIGHTS}
            todayLabel={todayLabel}
          />
        ) : (
          <WalletTab walletAllocation={WALLET_ALLOCATION} walletRows={WALLET_ROWS} />
        )}
      </div>

      <footer className="mt-8 px-1 text-xs text-slate-500">
        <p>
          Profile: {USER_PROFILE.name} · {USER_PROFILE.riskProfile} · {USER_PROFILE.location}
        </p>
      </footer>

      <button
        type="button"
        aria-label="Open overlay"
        onClick={() => setIsOverlayOpen(true)}
        className="fixed right-5 bottom-5 z-40 rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60 focus-visible:ring-offset-2"
      >
        Overlay
      </button>

      {isOverlayOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Financial document review overlay"
        >
          <div className="mx-auto h-[92vh] w-full max-w-7xl overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="border-b border-slate-200 p-5">
                <h2 className="text-lg font-semibold text-slate-900">Document Ingestion & Review</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Upload bank/trading/crypto files, parse, then approve, reject, or edit each row.
                </p>
              </div>
              <div className="p-5">
                <button
                  type="button"
                  onClick={() => setIsOverlayOpen(false)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid h-[calc(92vh-6.5rem)] gap-4 p-5 lg:grid-cols-[360px,1fr]">
              <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-800">Upload</h3>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Source</label>
                    <select
                      value={source}
                      onChange={(event) => setSource(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="bank">Bank</option>
                      <option value="broker">Broker</option>
                      <option value="crypto">Crypto</option>
                      <option value="expenses">Expenses</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                    User context: <span className="font-semibold text-slate-800">{FIXED_USER_ID}</span>
                  </p>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">File</label>
                    <input
                      type="file"
                      onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                      className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-primary file:px-3 file:py-2 file:text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleUploadAndParse}
                    disabled={isProcessing}
                    className="w-full rounded-lg bg-brand-primary px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isProcessing ? 'Processing...' : 'Upload & Parse'}
                  </button>
                  <div className="border-t border-slate-200 pt-3">
                    <label className="mb-1 block text-xs font-medium text-slate-600">Job ID</label>
                    <div className="flex gap-2">
                      <input
                        value={jobId}
                        onChange={(event) => setJobId(event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        placeholder="Paste job id"
                      />
                      <button
                        type="button"
                        onClick={refreshRows}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Load
                      </button>
                    </div>
                  </div>
                  {errorMessage && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {errorMessage}
                    </p>
                  )}
                  {infoMessage && (
                    <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700">
                      {infoMessage}
                    </p>
                  )}
                </div>
              </aside>

              <section className="min-h-0 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <h3 className="text-sm font-semibold text-slate-800">Parsed Rows</h3>
                  <p className="text-xs text-slate-500">Rows: {rows.length}</p>
                </div>

                <div className="h-[calc(92vh-15.5rem)] overflow-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead className="sticky top-0 z-10 bg-slate-100 text-slate-600">
                      <tr>
                        {tableColumns.map((column) => (
                          <th key={column} className="px-3 py-2 font-semibold capitalize">
                            {column}
                          </th>
                        ))}
                        <th className="px-3 py-2 font-semibold">Confidence</th>
                        <th className="px-3 py-2 font-semibold">Flags</th>
                        <th className="px-3 py-2 font-semibold">State</th>
                        <th className="px-3 py-2 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id} className="border-t border-slate-200 align-top">
                          {tableColumns.map((column) => (
                            <td key={`${row.id}-${column}`} className="max-w-[200px] px-3 py-2 text-slate-700">
                              <span className="line-clamp-3">{String(row.normalizedPayload?.[column] ?? '-')}</span>
                            </td>
                          ))}
                          <td className="px-3 py-2 text-slate-700">
                            {row.rowConfidence == null ? '-' : Number(row.rowConfidence).toFixed(2)}
                          </td>
                          <td className="max-w-[220px] px-3 py-2 text-slate-700">
                            {Array.isArray(row.validationFlags) && row.validationFlags.length > 0
                              ? row.validationFlags.join(', ')
                              : '-'}
                          </td>
                          <td className="px-3 py-2">
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
                              {row.state}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() => approveRow(row.id)}
                                className="rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => rejectRow(row.id)}
                                className="rounded-md bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-red-700"
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                onClick={() => beginEditRow(row)}
                                className="rounded-md bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-slate-900 hover:bg-amber-400"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => skipRow(row.id)}
                                className="rounded-md bg-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-800 hover:bg-slate-400"
                              >
                                Skip
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {rows.length === 0 && (
                        <tr>
                          <td
                            colSpan={tableColumns.length + 4}
                            className="px-4 py-8 text-center text-sm text-slate-500"
                          >
                            No parsed rows yet. Upload a file or load a `job_id`.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            {editRowId && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/40 p-5">
                <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                  <h4 className="mb-2 text-sm font-semibold text-slate-800">
                    Edit Parsed Payload (Row {editRowId})
                  </h4>
                  <textarea
                    value={editPayloadDraft}
                    onChange={(event) => setEditPayloadDraft(event.target.value)}
                    className="h-80 w-full rounded-lg border border-slate-300 p-3 font-mono text-xs text-slate-800"
                  />
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditRowId(null)
                        setEditPayloadDraft('')
                      }}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveEditRow}
                      className="rounded-lg bg-brand-primary px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90"
                    >
                      Save Edit
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
