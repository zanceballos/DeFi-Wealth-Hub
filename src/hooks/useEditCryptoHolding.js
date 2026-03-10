import { useState, useCallback } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase.js'

/**
 * useEditCryptoHolding — modal-centric hook with full status state machine.
 *
 * Returns { status, values, setValues, fieldErrors, load, save }
 *
 * status: 'loading' | 'ready' | 'load_error' | 'saving' | 'save_error' | 'saved'
 */
export default function useEditCryptoHolding(uid, index) {
  const [status, setStatus] = useState('loading')
  const [values, setValues] = useState({
    symbol: '',
    quantity: '',
    exchange: '',
    purchasePrice: '',
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
      const investments = data?.manual_accounts?.investments ?? []
      const inv = investments[index]
      if (!inv) { setStatus('load_error'); return }

      const lots = Array.isArray(inv.lots) ? inv.lots : []
      const totalQty = lots.reduce((s, l) => s + (Number(l.quantity) || 0), 0)
      const avgCost = lots.length > 0 ? (lots[0]?.averageCost ?? '') : ''

      setValues({
        symbol: (inv.asset ?? '').toUpperCase(),
        quantity: totalQty ? String(totalQty) : '',
        exchange: inv.exchange ?? '',
        purchasePrice: avgCost !== '' && avgCost !== 0 ? String(avgCost) : '',
      })
      setStatus('ready')
    } catch {
      setStatus('load_error')
    }
  }, [uid, index])

  const save = useCallback(async () => {
    // Validate
    const errors = {}
    if (!values.symbol.trim()) errors.symbol = 'Symbol is required'
    const qty = parseFloat(values.quantity)
    if (isNaN(qty) || qty < 0) errors.quantity = 'Enter a valid quantity'
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
      const investments = [...(data.manual_accounts?.investments ?? [])]
      const existing = investments[index] ?? {}
      const existingLots = Array.isArray(existing.lots) ? existing.lots : []

      investments[index] = {
        asset: values.symbol.toUpperCase(),
        type: 'crypto',
        exchange: values.exchange || '',
        lots: [{
          date: existingLots[0]?.date || new Date().toISOString().slice(0, 10),
          quantity: parseFloat(values.quantity) || 0,
          averageCost: values.purchasePrice !== '' ? parseFloat(values.purchasePrice) : 0,
        }],
        updated_at: serverTimestamp(),
      }

      await setDoc(
        userRef,
        { manual_accounts: { ...data.manual_accounts, investments } },
        { merge: true },
      )

      setStatus('saved')
      return {
        asset: values.symbol.toUpperCase(),
        type: 'crypto',
        exchange: values.exchange || '',
        lots: investments[index].lots,
      }
    } catch {
      setStatus('save_error')
      return null
    }
  }, [uid, index, values])

  return { status, values, setValues, fieldErrors, load, save }
}
