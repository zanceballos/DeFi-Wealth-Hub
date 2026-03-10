import { useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase.js'

/**
 * Hook to update a crypto/investment holding inside the
 * `manual_accounts.investments` array on the user document.
 *
 * Returns { saving, updateHolding }
 */
export default function useUpdateCryptoHolding(uid) {
  const [saving, setSaving] = useState(false)

  /**
   * @param {number} index    – position in the investments array
   * @param {object} updated  – { asset, type, exchange, lots }
   * @returns {Promise<object[]>} the new investments array
   */
  async function updateHolding(index, updated) {
    if (!uid) throw new Error('Not authenticated')
    setSaving(true)
    try {
      const userRef = doc(db, 'users', uid)
      const snap = await getDoc(userRef)
      const data = snap.exists() ? snap.data() : {}
      const investments = [...(data.manual_accounts?.investments ?? [])]

      const existing = investments[index] ?? {}
      investments[index] = {
        ...existing,
        asset: updated.asset ?? existing.asset,
        type: updated.type ?? existing.type ?? 'crypto',
        exchange: updated.exchange ?? existing.exchange ?? '',
        lots: Array.isArray(updated.lots) ? updated.lots.map((l) => ({
          date: l.date ?? '',
          quantity: Number(l.quantity) || 0,
          averageCost: Number(l.averageCost) || 0,
        })) : existing.lots ?? [],
      }

      await setDoc(
        userRef,
        { manual_accounts: { ...data.manual_accounts, investments } },
        { merge: true },
      )
      return investments
    } finally {
      setSaving(false)
    }
  }

  return { saving, updateHolding }
}
