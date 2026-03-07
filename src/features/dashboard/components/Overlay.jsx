import {useEffect, useMemo, useState} from "react";
import {createPortal} from "react-dom";
import {recomputeWellness, upsertNetWorthHistory} from '../../../services/financialDataService.js'
import {ingestStatementToFirestore} from '../../../services/statementIngestionService.js'
import {useAuthContext} from '../../../hooks/useAuthContext.js'

const API_BASE_URL = import.meta.env.VITE_PIPELINE_API_BASE_URL ?? 'https://defi-api.stocksuite.app'
const REVIEWABLE_KEYS = ['date', 'description', 'amount', 'currency', 'category', 'direction', 'asset']

/* ── Mock rows used when backend is unreachable ── */
const MOCK_PARSED_ROWS = [
    { row_id: 'mock-1', normalized_payload: { date: '2026-03-01', description: 'Salary deposit', amount: 4490, currency: 'SGD', category: 'income', direction: 'credit', asset: 'cash' }, row_confidence: 0.97, validation_flags: [], state: 'pending' },
    { row_id: 'mock-2', normalized_payload: { date: '2026-03-02', description: 'Rent payment', amount: 1800, currency: 'SGD', category: 'housing', direction: 'debit', asset: 'cash' }, row_confidence: 0.95, validation_flags: [], state: 'pending' },
    { row_id: 'mock-3', normalized_payload: { date: '2026-03-03', description: 'Grab Food', amount: 42.50, currency: 'SGD', category: 'food', direction: 'debit', asset: 'cash' }, row_confidence: 0.92, validation_flags: [], state: 'pending' },
    { row_id: 'mock-4', normalized_payload: { date: '2026-03-05', description: 'DBS SaveUp interest', amount: 18.75, currency: 'SGD', category: 'interest', direction: 'credit', asset: 'cash' }, row_confidence: 0.98, validation_flags: [], state: 'pending' },
    { row_id: 'mock-5', normalized_payload: { date: '2026-03-06', description: 'NTUC FairPrice groceries', amount: 87.30, currency: 'SGD', category: 'groceries', direction: 'debit', asset: 'cash' }, row_confidence: 0.94, validation_flags: [], state: 'pending' },
    { row_id: 'mock-6', normalized_payload: { date: '2026-03-07', description: 'ETH purchase on Binance', amount: 500, currency: 'SGD', category: 'investment', direction: 'debit', asset: 'crypto' }, row_confidence: 0.91, validation_flags: ['crypto_transfer'], state: 'pending' },
    { row_id: 'mock-7', normalized_payload: { date: '2026-03-08', description: 'Singtel mobile bill', amount: 55, currency: 'SGD', category: 'utilities', direction: 'debit', asset: 'cash' }, row_confidence: 0.96, validation_flags: [], state: 'pending' },
]

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

export default function Overlay({ onSaveSuccess, externalOpen, onExternalClose }) {
    const { user } = useAuthContext()
    const uid = user?.uid ?? ''

    const [internalOpen, setInternalOpen] = useState(false)
    const isOverlayOpen = externalOpen || internalOpen
    const setIsOverlayOpen = (val) => {
        setInternalOpen(val)
        if (!val) onExternalClose?.()
    }

    // Lock body scroll when overlay is open
    useEffect(() => {
        if (!isOverlayOpen) return
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = prev }
    }, [isOverlayOpen])

    const [selectedFile, setSelectedFile] = useState(null)
    const [source, setSource] = useState('bank')
    const [jobId, setJobId] = useState('')
    const [rows, setRows] = useState([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [infoMessage, setInfoMessage] = useState('')
    const [editRowId, setEditRowId] = useState(null)
    const [editPayloadDraft, setEditPayloadDraft] = useState('')
    const [isSavingToFirebase, setIsSavingToFirebase] = useState(false)
    const [firebaseSaveResult, setFirebaseSaveResult] = useState(null)
    const [toast, setToast] = useState(null) // { type: 'success'|'error', message: string }

    // Auto-dismiss toast after 5 seconds
    useEffect(() => {
        if (!toast) return
        const timer = setTimeout(() => setToast(null), 5000)
        return () => clearTimeout(timer)
    }, [toast])

    const showToast = (type, message) => setToast({ type, message })

    const tableColumns = useMemo(() => {
        const seen = new Set(REVIEWABLE_KEYS)
        rows.forEach((row) => {
            Object.keys(row.normalizedPayload || {}).forEach((key) => seen.add(key))
        })
        return Array.from(seen).slice(0, 8)
    }, [rows])

    const setRowStateLocally = (rowId, nextState) => {
        setRows((prev) => prev.map((row) => (row.id === rowId ? {...row, state: nextState} : row)))
    }

    const updateRowPayloadLocally = (rowId, payload) => {
        setRows((prev) =>
            prev.map((row) => (row.id === rowId ? {...row, normalizedPayload: payload, state: 'edited'} : row)),
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
        formData.append('user_id', uid)

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

            // Save to Firebase after successful parse
            try {
                const result = await saveToFirebase(parsedRows)
                setFirebaseSaveResult(result)
                setInfoMessage((prev) => (prev ? prev + ' | ' : '') + 'Saved to Firebase successfully.')
            } catch (firebaseError) {
                console.error('Firebase save failed:', firebaseError)
                setErrorMessage((prev) => (prev ? prev + ' | ' : '') + 'Parsed OK but Firebase save failed: ' + firebaseError.message)
            }
        } catch (error) {
            const msg = error instanceof TypeError
                ? `Unable to reach backend at ${API_BASE_URL}. Check backend is running and CORS allows the Vite origin.`
                : error.message || 'Unable to parse the uploaded file.'
            setErrorMessage(msg)
            showToast('error', msg)
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
            const response = await fetch(`${API_BASE_URL}/v1/rows/${rowId}/approve`, {method: 'PATCH'})
            if (!response.ok) throw new Error('approve_failed')
            setRowStateLocally(rowId, 'approved')
        } catch {
            setRowStateLocally(rowId, 'approved')
            setErrorMessage('Approve endpoint not reachable. Applied state locally for now.')
        }
    }

    const rejectRow = async (rowId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/v1/rows/${rowId}/reject`, {method: 'PATCH'})
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

    const saveToFirebase = async (currentRows) => {
        const rowsToSave = currentRows ?? rows
        if (rowsToSave.length === 0) {
            setErrorMessage('Nothing to save – upload/parse a file or load mock data first.')
            return null
        }
        setIsSavingToFirebase(true)
        setErrorMessage('')
        try {
            const fileToUpload = selectedFile ?? null

            // ── New ingestion: summary doc + transactions subcollection ──
            const { statementId, transactionCount, statementData } =
                await ingestStatementToFirestore(uid, fileToUpload, rowsToSave, {
                    sourceType: source,
                    platform: source,
                    currency: rowsToSave[0]?.normalizedPayload?.currency ?? 'SGD',
                })

            // ── Recompute wellness & net-worth history (existing pipeline) ──
            const wellness = await recomputeWellness(uid)
            const historyEntry = await upsertNetWorthHistory(
                uid,
                new Date(),
                wellness.key_metrics?.net_worth ?? 0,
            )

            const result = { statement: { id: statementId, ...statementData }, wellness, historyEntry }
            setFirebaseSaveResult(result)
            showToast(
                'success',
                `Saved ${transactionCount} transactions — wellness: ${wellness.overall_score ?? '–'}, net worth: ${wellness.key_metrics?.net_worth ?? '–'}`,
            )
            onSaveSuccess?.()
            return result
        } catch (err) {
            showToast('error', 'Firebase save failed: ' + (err.message || 'Unknown error'))
            throw err
        } finally {
            setIsSavingToFirebase(false)
        }
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
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({normalized_payload: parsedDraft}),
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

    /** Load mock rows into the table — no Firebase, no backend */
    const handleLoadMockData = () => {
        setErrorMessage('')
        setInfoMessage('')
        setFirebaseSaveResult(null)
        const mockRows = toRows(MOCK_PARSED_ROWS)
        setRows(mockRows)
        setJobId('mock-job-' + Date.now())
        setInfoMessage(`Loaded ${mockRows.length} mock rows. Review them, then click "Save to Firebase" when ready.`)
        showToast('success', `${mockRows.length} mock rows loaded into table.`)
    }

    return (
        <>
            {/* ── Floating action button ── */}
            <button
                type="button"
                aria-label="Upload & review statements"
                onClick={() => setIsOverlayOpen(true)}
                className="fixed right-5 bottom-5 z-50 flex items-center gap-2.5 rounded-2xl bg-brand-primary px-5 py-3.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(32,129,195,0.35)] transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_6px_28px_rgba(32,129,195,0.45)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60 focus-visible:ring-offset-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="12" y1="18" x2="12" y2="12"/>
                    <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
                Upload Statement
            </button>

            {isOverlayOpen && createPortal(
                <div
                    className="fixed inset-0 z-100 bg-slate-900/45 p-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Financial document review overlay"
                >
                    <div className="mx-auto h-[92vh] w-full max-w-7xl overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl">
                        {/* ── Toast notification ── */}
                        {toast && (
                            <div
                                className={[
                                    'flex items-center justify-between gap-3 px-5 py-3 text-sm font-medium transition-all duration-300',
                                    toast.type === 'success'
                                        ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                                        : 'bg-red-50 text-red-800 border-b border-red-200',
                                ].join(' ')}
                                role="alert"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-base">{toast.type === 'success' ? '✓' : '✗'}</span>
                                    <span>{toast.message}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setToast(null)}
                                    className="shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold opacity-60 hover:opacity-100 transition-opacity"
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}
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
                                        User context: <span
                                        className="font-semibold text-slate-800">{uid || 'not signed in'}</span>
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
                                    <button
                                        type="button"
                                        onClick={handleLoadMockData}
                                        disabled={isProcessing}
                                        className="w-full rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        ⚡ Load Mock Data
                                    </button>
                                    <p className="text-[11px] text-slate-400">
                                        Loads sample transactions into the table. Review them, then click Save to Firebase.
                                    </p>
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
                                    {rows.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => saveToFirebase()}
                                            disabled={isSavingToFirebase}
                                            className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {isSavingToFirebase ? 'Saving to Firebase...' : 'Save to Firebase'}
                                        </button>
                                    )}
                                    {firebaseSaveResult && (
                                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                                            <p className="font-semibold">Saved ✓</p>
                                            <p>Wellness: {firebaseSaveResult.wellness?.overall_score ?? '–'} ({firebaseSaveResult.wellness?.status ?? '–'})</p>
                                            <p>Net worth: {firebaseSaveResult.wellness?.key_metrics?.net_worth ?? '–'}</p>
                                        </div>
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
                                                    <td key={`${row.id}-${column}`}
                                                        className="max-w-[200px] px-3 py-2 text-slate-700">
                                                        <span
                                                            className="line-clamp-3">{String(row.normalizedPayload?.[column] ?? '-')}</span>
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
                            <span
                                className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
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
                                <div
                                    className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
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
                </div>,
                document.body,
            )}
        </>
    )
}