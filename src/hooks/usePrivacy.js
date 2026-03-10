import { useState, useEffect, useMemo } from 'react'
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  getDocs,
  writeBatch,
  deleteField,
  setDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuthContext } from './useAuthContext'
import { recomputeAll, resetUserToEmpty } from '../services/financialDataService'

export function usePrivacy() {
  const { user } = useAuthContext()
  const [statements, setStatements]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [deleting, setDeleting]       = useState(null)
  const [recomputing, setRecomputing] = useState(false)
  const [emailTransactions, setEmailTransactions] = useState([])

  useEffect(() => {
    if (!user) return

    const ref = collection(db, 'users', user.uid, 'statements')
    const unsubscribe = onSnapshot(ref, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setStatements(data)
      setLoading(false)
    })

    // Listen for email transactions (full docs, not just count)
    const emailRef = collection(db, 'users', user.uid, 'emailTransactions')
    const unsubEmail = onSnapshot(emailRef, (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((tx) => !tx.deleted)
      setEmailTransactions(data)
    })

    return () => { unsubscribe(); unsubEmail() }
  }, [user])

  const emailTxCount = emailTransactions.length

  /** Email transactions grouped by date (YYYY-MM-DD), sorted newest first */
  const emailTxByDate = useMemo(() => {
    const map = {}
    for (const tx of emailTransactions) {
      // Use the parsed transaction date, fall back to receivedAt or createdAt
      const raw = tx.date || tx.receivedAt || tx.createdAt
      let dateKey = 'Unknown date'
      if (raw) {
        const d = raw.toDate ? raw.toDate() : new Date(raw)
        if (!isNaN(d.getTime())) {
          dateKey = d.toISOString().slice(0, 10) // YYYY-MM-DD
        }
      }
      if (!map[dateKey]) map[dateKey] = []
      map[dateKey].push(tx)
    }
    // Sort date keys newest-first, "Unknown date" last
    return Object.entries(map)
      .sort(([a], [b]) => {
        if (a === 'Unknown date') return 1
        if (b === 'Unknown date') return -1
        return b.localeCompare(a)
      })
  }, [emailTransactions])

  /**
   * Delete a single statement + its transactions subcollection.
   * Then recalculate or reset to empty if no data remains.
   */
  async function deleteStatement(statementId) {
    if (!user) return
    setDeleting(statementId)
    try {
      // 1. Delete all transactions in subcollection
      const txRef  = collection(db, 'users', user.uid, 'statements', statementId, 'transactions')
      const txSnap = await getDocs(txRef)

      const batch = writeBatch(db)
      txSnap.docs.forEach((d) => batch.delete(d.ref))
      batch.delete(doc(db, 'users', user.uid, 'statements', statementId))
      await batch.commit()

      // 2. Check if any data remains after deletion
      setRecomputing(true)
      const remainingStatements = statements.filter((s) => s.id !== statementId)
      const hasManual = await checkHasManualAccounts(user.uid)

      if (remainingStatements.length === 0 && emailTxCount === 0 && !hasManual) {
        // Reset to empty state
        await resetUserToEmpty(user.uid)
      } else {
        // Recompute wellness + net worth with remaining data
        await recomputeAll(user.uid)
      }
      // Clear advisory cache
      try {
        sessionStorage.removeItem('dwh_advisory')
        sessionStorage.removeItem('dwh_advisory_payload')
      } catch { /* ignore */ }
    } catch (err) {
      console.error('Failed to delete statement:', err)
    } finally {
      setDeleting(null)
      setRecomputing(false)
    }
  }

  async function deleteAllStatements() {
    if (!user) return
    setDeleting('all')
    try {
      // 1. Batch delete all statements + their transactions
      const batch = writeBatch(db)

      for (const stmt of statements) {
        const txRef  = collection(db, 'users', user.uid, 'statements', stmt.id, 'transactions')
        const txSnap = await getDocs(txRef)
        txSnap.docs.forEach((d) => batch.delete(d.ref))
        batch.delete(doc(db, 'users', user.uid, 'statements', stmt.id))
      }

      await batch.commit()

      // 2. Check remaining data
      setRecomputing(true)
      const hasManual = await checkHasManualAccounts(user.uid)

      if (emailTxCount === 0 && !hasManual) {
        await resetUserToEmpty(user.uid)
      } else {
        await recomputeAll(user.uid)
      }
      // Clear advisory cache
      try {
        sessionStorage.removeItem('dwh_advisory')
        sessionStorage.removeItem('dwh_advisory_payload')
      } catch { /* ignore */ }
    } catch (err) {
      console.error('Failed to delete all statements:', err)
    } finally {
      setDeleting(null)
      setRecomputing(false)
    }
  }

  /** Full account data reset — delete everything and return user to empty state */
  async function deleteAll() {
    if (!user) return
    setDeleting('reset-all')
    try {
      // 1. Delete all statements + their transactions subcollections
      const batch = writeBatch(db)
      for (const stmt of statements) {
        const txRef  = collection(db, 'users', user.uid, 'statements', stmt.id, 'transactions')
        const txSnap = await getDocs(txRef)
        txSnap.docs.forEach((d) => batch.delete(d.ref))
        batch.delete(doc(db, 'users', user.uid, 'statements', stmt.id))
      }

      // 2. Delete all email transactions (query Firestore directly)
      const emailRef = collection(db, 'users', user.uid, 'emailTransactions')
      const emailSnap = await getDocs(emailRef)
      emailSnap.docs.forEach((d) => batch.delete(d.ref))
      await batch.commit()

      // 3. Reset wellness + net worth history
      setRecomputing(true)
      await resetUserToEmpty(user.uid)

      // 4. Clear manual_accounts on the user profile doc
      const userDocRef = doc(db, 'users', user.uid)
      await setDoc(userDocRef, { manual_accounts: deleteField() }, { merge: true })

      // 5. Clear advisory cache
      try {
        sessionStorage.removeItem('dwh_advisory')
        sessionStorage.removeItem('dwh_advisory_payload')
      } catch { /* ignore */ }
    } catch (err) {
      console.error('Failed to reset account data:', err)
    } finally {
      setDeleting(null)
      setRecomputing(false)
    }
  }

  /**
   * Generate a summary of what will be removed when deleting a statement.
   */
  function getDeleteSummary(statementId) {
    if (statementId === 'reset-all') {
      return {
        title: 'Reset all account data?',
        details: [
          `${statements.length} statement(s) and their transactions will be deleted`,
          `${emailTxCount} email transaction(s) will be deleted`,
          'Wellness score and net worth history will be wiped',
          'Manual accounts will be cleared',
          'This action cannot be undone',
        ],
      }
    }
    if (statementId === 'all') {
      const totalTx = statements.reduce((s, st) => s + (st.transactions_count || 0), 0)
      const totalNw = statements.reduce((s, st) => s + (st.net_worth_contribution || 0), 0)
      return {
        title: `Delete all ${statements.length} document(s)?`,
        details: [
          `${statements.length} statement(s) will be permanently removed`,
          `${totalTx} parsed transaction(s) will be deleted`,
          totalNw > 0 ? `S$${totalNw.toLocaleString()} removed from net worth tracking` : null,
          'Your wellness score and net worth history will be recalculated',
        ].filter(Boolean),
      }
    }
    if (statementId === 'all-email') {
      return {
        title: `Delete all ${emailTxCount} email transaction(s)?`,
        details: [
          `${emailTxCount} email transaction(s) will be permanently removed`,
          'Your wellness score and net worth history will be recalculated',
        ],
      }
    }
    if (typeof statementId === 'string' && statementId.startsWith('email-date:')) {
      const dateKey = statementId.replace('email-date:', '')
      const count = emailTxByDate.find(([d]) => d === dateKey)?.[1]?.length ?? 0
      return {
        title: `Delete ${count} email transaction(s) from ${dateKey}?`,
        details: [
          `${count} email transaction(s) from ${dateKey} will be permanently removed`,
          'Your wellness score and net worth history will be recalculated',
        ],
      }
    }
    const stmt = statements.find((s) => s.id === statementId)
    if (!stmt) return { title: 'Delete this document?', details: ['This cannot be undone.'] }
    return {
      title: `Delete "${stmt.file_name || stmt.platform || 'this document'}"?`,
      details: [
        `${stmt.transactions_count || 0} transaction(s) will be removed`,
        stmt.net_worth_contribution > 0 ? `S$${stmt.net_worth_contribution.toLocaleString()} removed from net worth` : null,
        'Your wellness score and net worth history will be recalculated',
      ].filter(Boolean),
    }
  }

  /** Delete all email transactions */
  async function deleteAllEmailTx() {
    if (!user) return
    setDeleting('all-email')
    try {
      // Query Firestore directly to avoid stale / filtered React state
      const emailRef = collection(db, 'users', user.uid, 'emailTransactions')
      const emailSnap = await getDocs(emailRef)
      const batch = writeBatch(db)
      emailSnap.docs.forEach((d) => batch.delete(d.ref))
      await batch.commit()

      setRecomputing(true)
      const hasManual = await checkHasManualAccounts(user.uid)
      if (statements.length === 0 && !hasManual) {
        await resetUserToEmpty(user.uid)
      } else {
        await recomputeAll(user.uid)
      }
      try {
        sessionStorage.removeItem('dwh_advisory')
        sessionStorage.removeItem('dwh_advisory_payload')
      } catch { /* ignore */ }
    } catch (err) {
      console.error('Failed to delete all email transactions:', err)
    } finally {
      setDeleting(null)
      setRecomputing(false)
    }
  }

  /** Delete email transactions for a specific date key (YYYY-MM-DD or "Unknown date") */
  async function deleteEmailTxByDate(dateKey) {
    if (!user) return
    const entry = emailTxByDate.find(([d]) => d === dateKey)
    if (!entry) return
    const txsToDelete = entry[1]

    setDeleting(`email-date:${dateKey}`)
    try {
      const batch = writeBatch(db)
      for (const tx of txsToDelete) {
        batch.delete(doc(db, 'users', user.uid, 'emailTransactions', tx.id))
      }
      await batch.commit()

      setRecomputing(true)
      const remaining = emailTransactions.length - txsToDelete.length
      const hasManual = await checkHasManualAccounts(user.uid)
      if (statements.length === 0 && remaining === 0 && !hasManual) {
        await resetUserToEmpty(user.uid)
      } else {
        await recomputeAll(user.uid)
      }
      try {
        sessionStorage.removeItem('dwh_advisory')
        sessionStorage.removeItem('dwh_advisory_payload')
      } catch { /* ignore */ }
    } catch (err) {
      console.error('Failed to delete email transactions for date:', err)
    } finally {
      setDeleting(null)
      setRecomputing(false)
    }
  }

  const grouped = statements.reduce((acc, stmt) => {
    const type = stmt.source_type || 'other'
    if (!acc[type]) acc[type] = []
    acc[type].push(stmt)
    return acc
  }, {})

  const totalFiles        = statements.length
  const totalTransactions = statements.reduce((s, st) => s + (st.transactions_count || 0), 0) + emailTxCount

  // Privacy-only net worth: only data the user uploaded (statements + email tx)
  // Does NOT include manual accounts — those feed into the dashboard wellness score separately
  // Clamped to 0 — never show negative net worth
  const totalNetWorth = useMemo(() => {
    const stmtNW = statements.reduce((s, st) => s + (Number(st.net_worth_contribution) || 0), 0)
    const emailNW = emailTransactions
      .filter((tx) => tx.status !== 'rejected')
      .reduce((s, tx) => s + (Number(tx.amount) || 0), 0)
    return Math.max(0, stmtNW + emailNW)
  }, [statements, emailTransactions])

  return {
    statements,
    grouped,
    loading,
    deleting,
    recomputing,
    totalFiles,
    totalTransactions,
    totalNetWorth,
    emailTxCount,
    emailTxByDate,
    deleteStatement,
    deleteAllStatements,
    deleteAllEmailTx,
    deleteEmailTxByDate,
    deleteAll,
    getDeleteSummary,
  }
}

/** Check if user has manual_accounts with any data */
async function checkHasManualAccounts(uid) {
  try {
    const { getDoc, doc: docRef } = await import('firebase/firestore')
    const snap = await getDoc(docRef(db, 'users', uid))
    if (!snap.exists()) return false
    const manual = snap.data().manual_accounts
    return (
      (Array.isArray(manual?.accounts) && manual.accounts.length > 0) ||
      (Array.isArray(manual?.investments) && manual.investments.length > 0)
    )
  } catch {
    return false
  }
}
