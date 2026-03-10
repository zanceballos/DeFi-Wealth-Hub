import { useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase.js'

/**
 * Hook to update a bank account inside the `manual_accounts.accounts` array
 * on the user document.
 *
 * Returns { saving, updateAccount }
 */
export default function useUpdateBankAccount(uid) {
  const [saving, setSaving] = useState(false)

  /**
   * @param {number} index    – position in the accounts array
   * @param {object} updated  – { name, type, balance, currency }
   * @returns {Promise<object[]>} the new accounts array
   */
  async function updateAccount(index, updated) {
    if (!uid) throw new Error('Not authenticated')
    setSaving(true)
    try {
      const userRef = doc(db, 'users', uid)
      const snap = await getDoc(userRef)
      const data = snap.exists() ? snap.data() : {}
      const accounts = [...(data.manual_accounts?.accounts ?? [])]

      accounts[index] = {
        name: updated.name,
        type: updated.type,
        balance: Number(updated.balance) || 0,
        currency: updated.currency ?? 'SGD',
      }

      await setDoc(
        userRef,
        { manual_accounts: { ...data.manual_accounts, accounts } },
        { merge: true },
      )
      return accounts
    } finally {
      setSaving(false)
    }
  }

  return { saving, updateAccount }
}
