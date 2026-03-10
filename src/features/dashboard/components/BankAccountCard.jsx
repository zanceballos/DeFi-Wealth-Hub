import { useState } from 'react'
import { Landmark, Pencil } from 'lucide-react'
import EditCardModal from '../../../components/ui/EditCardModal.jsx'
import { useAuthContext } from '../../../hooks/useAuthContext.js'
import useEditBankAccount from '../../../hooks/useEditBankAccount.js'
import { recalculateNetWorth } from '../../../services/financialDataService.js'

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'Savings', label: 'Savings' },
  { value: 'Current', label: 'Current' },
  { value: 'Fixed Deposit', label: 'Fixed Deposit' },
]

const CURRENCY_OPTIONS = [
  { value: 'SGD', label: 'SGD' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'MYR', label: 'MYR' },
]

const FIELDS = [
  { key: 'bankName', label: 'Bank name', type: 'text', placeholder: 'e.g. DBS' },
  {
    key: 'accountType',
    label: 'Account type',
    type: 'text',
    placeholder: 'Savings',
    options: ACCOUNT_TYPE_OPTIONS,
  },
  { key: 'balance', label: 'Balance', type: 'number', placeholder: '0' },
  {
    key: 'currency',
    label: 'Currency',
    type: 'text',
    placeholder: 'SGD',
    options: CURRENCY_OPTIONS,
  },
]

function fmtCurrency(value, currency = 'S$') {
  if (value == null) return `${currency}0`
  return `${currency}${Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

/**
 * BankAccountCard — clickable card showing a bank account with edit modal.
 *
 * Props:
 *   account   { name, type, balance, currency }
 *   index     position in the manual_accounts.accounts array
 *   onUpdated () => void   called after successful save
 */
export default function BankAccountCard({ account, index, onUpdated }) {
  const { user } = useAuthContext()
  const uid = user?.uid
  const [modalOpen, setModalOpen] = useState(false)
  const [optimistic, setOptimistic] = useState(null)

  const { status, values, setValues, fieldErrors, load, save } = useEditBankAccount(uid, index)

  const display = optimistic ?? account

  async function handleSave() {
    const result = await save()
    if (result) {
      setOptimistic(result)
      recalculateNetWorth(uid).catch((err) => console.error('[BankAccountCard] recompute failed:', err))
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
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
              <Landmark className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {display.name || 'Bank Account'}
              </p>
              <p className="text-xs text-slate-400">{display.type ?? 'Savings'}</p>
            </div>
          </div>
          <Pencil className="h-4 w-4 text-slate-300 opacity-0 transition group-hover:opacity-100" />
        </div>

        <p className="mt-3 text-xl font-bold text-slate-900">
          {fmtCurrency(display.balance, display.currency === 'USD' ? 'US$' : 'S$')}
        </p>
      </article>

      <EditCardModal
        isOpen={modalOpen}
        onClose={handleClose}
        title="Edit Bank Account"
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
