import { useState } from 'react'
import { Bitcoin, Pencil } from 'lucide-react'
import EditCardModal from '../../../components/ui/EditCardModal.jsx'
import { useAuthContext } from '../../../hooks/useAuthContext.js'
import useEditCryptoHolding from '../../../hooks/useEditCryptoHolding.js'
import { recalculateNetWorth } from '../../../services/financialDataService.js'

const FIELDS = [
  { key: 'symbol', label: 'Token / coin symbol', type: 'text', placeholder: 'e.g. BTC' },
  { key: 'quantity', label: 'Quantity held', type: 'number', placeholder: '0' },
  { key: 'exchange', label: 'Exchange / wallet', type: 'text', placeholder: 'e.g. Binance' },
  { key: 'purchasePrice', label: 'Purchase price per unit (USD, optional)', type: 'number', placeholder: 'optional' },
]

function fmtCurrency(value, currency = 'S$') {
  if (value == null) return `${currency}0`
  return `${currency}${Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

/**
 * CryptoHoldingCard — clickable card for a crypto investment with live indicator.
 *
 * Props:
 *   holding     { asset, type, exchange, lots: [{ date, quantity, averageCost }] }
 *   index       position in manual_accounts.investments array
 *   livePrice   number | null — resolved SGD price; null = not yet resolved
 *   onUpdated   () => void
 */
export default function CryptoHoldingCard({ holding, index, livePrice, onUpdated }) {
  const { user } = useAuthContext()
  const uid = user?.uid
  const [modalOpen, setModalOpen] = useState(false)
  const [optimistic, setOptimistic] = useState(null)

  const { status, values, setValues, fieldErrors, load, save } = useEditCryptoHolding(uid, index)

  const display = optimistic ?? holding
  const lots = display.lots ?? []
  const totalQty = lots.reduce((s, l) => s + (Number(l.quantity) || 0), 0)
  const avgCost = lots.length > 0 ? (lots[0]?.averageCost ?? 0) : 0

  const isLive = livePrice != null && Number.isFinite(livePrice) && livePrice > 0
  const displayValue = isLive ? totalQty * livePrice : totalQty * (Number(avgCost) || 0)

  async function handleSave() {
    const result = await save()
    if (result) {
      setOptimistic(result)
      recalculateNetWorth(uid).catch((err) => console.error('[CryptoHoldingCard] recompute failed:', err))
      if (onUpdated) onUpdated()
    }
  }

  function handleClose() {
    setModalOpen(false)
  }

  return (
    <>
      <article
        onClick={() => setModalOpen(true)}
        className={
          'group relative cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 ' +
          'shadow-[0_2px_12px_rgba(15,23,42,0.04)] ' +
          'transition-all duration-300 ease-out ' +
          'hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:border-sky-200/60'
        }
      >
        {/* Live indicator — top right */}
        <div className="absolute right-4 top-4">
          {isLive ? (
            <span className="inline-flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="text-[10px] font-semibold leading-none text-green-500">
                Live
              </span>
            </span>
          ) : (
            <span className="inline-flex h-2 w-2 rounded-full bg-slate-300" />
          )}
        </div>

        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
            <Bitcoin className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {display.asset || 'Crypto'}
              </p>
              <Pencil className="h-3.5 w-3.5 text-slate-300 opacity-0 transition group-hover:opacity-100" />
            </div>
            <p className="text-xs text-slate-400">
              {display.exchange || 'Wallet'} · {totalQty} units
            </p>
          </div>
        </div>

        <p className="mt-3 text-xl font-bold text-slate-900">
          {fmtCurrency(displayValue)}
        </p>
      </article>

      <EditCardModal
        isOpen={modalOpen}
        onClose={handleClose}
        title={`Edit ${display.asset || 'Crypto'} Holding`}
        fields={FIELDS}
        status={status}
        values={values}
        setValues={setValues}
        fieldErrors={fieldErrors}
        onLoad={load}
        onSave={handleSave}
      />
    </>
  )
}
