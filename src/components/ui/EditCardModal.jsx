import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, RefreshCw } from 'lucide-react'

/**
 * EditCardModal — reusable portal modal with Firestore read/write status machine.
 *
 * Props:
 *   isOpen        (boolean)
 *   onClose       () => void
 *   title         (string)
 *   fields        { key, label, type, placeholder, options? }[]
 *   status        'loading' | 'ready' | 'load_error' | 'saving' | 'save_error' | 'saved'
 *   values        Record<string, any>      — form values from hook
 *   setValues     (fn) => void             — state setter from hook
 *   fieldErrors   Record<string, string>   — per-field validation errors
 *   onLoad        () => void               — trigger Firestore read
 *   onSave        () => Promise<any>       — trigger validate + Firestore write
 */
export default function EditCardModal({
  isOpen,
  onClose,
  title,
  fields = [],
  status = 'loading',
  values = {},
  setValues,
  fieldErrors = {},
  onLoad,
  onSave,
}) {
  const panelRef = useRef(null)
  const closedByAutoRef = useRef(false)

  // Load data from Firestore when modal opens
  useEffect(() => {
    if (isOpen && onLoad) {
      closedByAutoRef.current = false
      onLoad()
    }
  }, [isOpen, onLoad])

  // Auto-close after 'saved' status
  useEffect(() => {
    if (status === 'saved' && isOpen && !closedByAutoRef.current) {
      const timer = setTimeout(() => {
        closedByAutoRef.current = true
        onClose()
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [status, isOpen, onClose])

  // Focus the panel on open
  useEffect(() => {
    if (isOpen) panelRef.current?.focus()
  }, [isOpen])

  const isBusy = status === 'saving'

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && !isBusy) onClose()
    },
    [isBusy, onClose],
  )

  if (!isOpen) return null

  function handleChange(key, raw) {
    if (setValues) setValues((prev) => ({ ...prev, [key]: raw }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (onSave) await onSave()
  }

  // ── Render helpers ──

  const renderSkeleton = () => (
    <div className="space-y-4">
      {fields.map((f) => (
        <div key={f.key}>
          <div className="mb-1 h-4 w-24 rounded bg-slate-100 animate-pulse" />
          <div className="h-9 w-full rounded-lg bg-slate-100 animate-pulse" />
        </div>
      ))}
    </div>
  )

  const renderLoadError = () => (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <p className="text-sm text-red-600">Failed to load data</p>
      <button
        type="button"
        onClick={onLoad}
        className="flex items-center gap-1.5 rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
      >
        <RefreshCw className="h-4 w-4" /> Retry
      </button>
    </div>
  )

  const renderSaved = () => (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <Check className="h-5 w-5" />
      </span>
      <p className="text-sm font-semibold text-emerald-600">Saved</p>
    </div>
  )

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((f) => (
        <label key={f.key} className="block">
          <span className="mb-1 block text-sm font-medium text-slate-600">
            {f.label}
          </span>

          {f.options ? (
            <select
              value={values[f.key] ?? ''}
              onChange={(e) => handleChange(f.key, e.target.value)}
              disabled={isBusy}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary disabled:opacity-50"
            >
              {f.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={f.type ?? 'text'}
              step={f.type === 'number' ? 'any' : undefined}
              min={f.type === 'number' ? '0' : undefined}
              placeholder={f.placeholder}
              value={values[f.key] ?? ''}
              onChange={(e) => handleChange(f.key, e.target.value)}
              disabled={isBusy}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary disabled:opacity-50"
            />
          )}

          {fieldErrors[f.key] && (
            <p className="mt-0.5 text-xs text-red-500">{fieldErrors[f.key]}</p>
          )}
        </label>
      ))}

      {status === 'save_error' && (
        <p className="text-sm text-red-600">Save failed. Please try again.</p>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isBusy}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isBusy}
          className="flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {isBusy && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          {isBusy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )

  return createPortal(
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isBusy) onClose()
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl outline-none"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isBusy}
          className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-600 disabled:opacity-40"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-5 text-lg font-bold text-slate-900">{title}</h2>

        {status === 'loading' && renderSkeleton()}
        {status === 'load_error' && renderLoadError()}
        {status === 'saved' && renderSaved()}
        {(status === 'ready' || status === 'saving' || status === 'save_error') && renderForm()}
      </div>
    </div>,
    document.body,
  )
}
