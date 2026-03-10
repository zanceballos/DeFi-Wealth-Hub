import { useState, useCallback } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase.js'

/**
 * useEditBankAccount — modal-centric hook with full status state machine.
 *
 * Returns { status, values, setValues, fieldErrors, load, save }
 *
 * status: 'loading' | 'ready' | 'load_error' | 'saving' | 'save_error' | 'saved'
 */
export default function useEditBankAccount(uid, index) {
  const [status, setStatus] = useState('loading')
  const [values, setValues] = useState({
    bankName: '',
    accountType: 'Savings',
    balance: '',
    currency: 'SGD',
  })
  const [fieldErrors, setFieldErrors] = useState({})

  const load = useCallback(async () => {
    if (!uid) { setStatus('load_error'); return }
    setStatus('loading')
    setFieldErrors({})
    try {
      const snap = await getDoc(doc(db, 'users', uid))
      if (!snap.exists()) { setStatus('load_error'); return }
      const data = snap.data()
      const accounts = data?.manual_accounts?.accounts ?? []
      const acct = accounts[index]
      if (!acct) { setStatus('load_error'); return }
      setValues({
        bankName: acct.name ?? '',
        accountType: acct.type ?? 'Savings',
        balance: acct.balance != null ? String(acct.balance) : '',
        currency: acct.currency ?? 'SGD',
      })
      setStatus('ready')
    } catch {
      setStatus('load_error')
    }
  }, [uid, index])

  const save = useCallback(async () => {
    // Validate
    const errors = {}
    if (!values.bankName.trim()) errors.bankName = 'Bank name is required'
    const bal = parseFloat(values.balance)
    if (isNaN(bal) || bal < 0) errors.balance = 'Enter a valid balance'
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return null
    }
    setFieldErrors({})
    setStatus('saving')
    try {
      const userRef = doc(db, 'users', uid)
      const snap = await getDoc(userRef)
      const data = snap.exists() ? snap.data() : {}
      const accounts = [...(data.manual_accounts?.accounts ?? [])]

      accounts[index] = {
        name: values.bankName.trim(),
        type: values.accountType,
        balance: parseFloat(values.balance),
        currency: values.currency || 'SGD',
        updated_at: serverTimestamp(),
      }

      await setDoc(
        userRef,
        { manual_accounts: { ...data.manual_accounts, accounts } },
        { merge: true },
      )

      setStatus('saved')
      return {
        name: values.bankName.trim(),
        type: values.accountType,
        balance: parseFloat(values.balance),
        currency: values.currency || 'SGD',
      }
    } catch {
      setStatus('save_error')
      return null
    }
  }, [uid, index, values])

  return { status, values, setValues, fieldErrors, load, save }
}
