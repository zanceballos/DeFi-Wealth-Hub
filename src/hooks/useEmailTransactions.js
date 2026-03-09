/**
 * useEmailTransactions — real-time email transactions with polling.
 *
 * Subscribes to Firestore `/users/{uid}/emailTransactions` for live updates
 * and polls Gmail every 5 minutes (+ supports manual sync).
 * Fully client-side — no Cloud Functions.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import { useAuthContext } from './useAuthContext.js'
import { subscribeEmailTransactions, approveTransaction, rejectTransaction, editTransaction } from '../services/emailTransactionService.js'
import { syncGmailTransactions, isTokenValid } from '../services/gmailService.js'

const POLL_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

export default function useEmailTransactions({ enabled = true } = {}) {
  const { user } = useAuthContext()
  const uid = user?.uid ?? ''

  const [transactions, setTransactions]   = useState([])
  const [syncing, setSyncing]             = useState(false)
  const [syncError, setSyncError]         = useState(null)
  const [lastSyncResult, setLastSyncResult] = useState(null)
  const pollRef = useRef(null)

  // ── Real-time Firestore subscription (filter out soft-deleted) ────────
  useEffect(() => {
    if (!uid || !enabled) return
    const unsub = subscribeEmailTransactions(uid, (txs) => {
      setTransactions(txs.filter((tx) => !tx.deleted))
    })
    return unsub
  }, [uid, enabled])

  // ── Manual sync ───────────────────────────────────────────────────────
  const sync = useCallback(async () => {
    if (!uid || syncing) return
    setSyncing(true)
    setSyncError(null)
    try {
      const result = await syncGmailTransactions(uid)
      setLastSyncResult(result)
      // Update last sync timestamp
      await setDoc(doc(db, 'users', uid), {
        lastGmailSync: serverTimestamp(),
      }, { merge: true })
    } catch (err) {
      setSyncError(err.message || 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }, [uid, syncing])

  // ── 5-minute polling (only if token is still valid) ───────────────────
  useEffect(() => {
    if (!uid || !enabled) return

    // Initial sync on mount
    if (isTokenValid()) sync()

    pollRef.current = setInterval(() => {
      if (isTokenValid()) sync()
    }, POLL_INTERVAL_MS)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, enabled])

  // ── Actions ───────────────────────────────────────────────────────────
  const approve = useCallback(
    (txId) => approveTransaction(uid, txId),
    [uid],
  )

  const reject = useCallback(
    (txId) => rejectTransaction(uid, txId),
    [uid],
  )

  const edit = useCallback(
    (txId, updates) => editTransaction(uid, txId, updates),
    [uid],
  )

  // ── Derived lists (sorted newest first by date, then time) ─────────
  const sortNewest = (a, b) => {
    const dateCmp = (b.date || '').localeCompare(a.date || '')
    if (dateCmp !== 0) return dateCmp
    return (b.time || '').localeCompare(a.time || '')
  }
  const pending  = transactions.filter((tx) => tx.status === 'pending').sort(sortNewest)
  const approved = transactions.filter((tx) => tx.status === 'approved').sort(sortNewest)
  const rejected = transactions.filter((tx) => tx.status === 'rejected').sort(sortNewest)

  return {
    transactions,
    pending,
    approved,
    rejected,
    syncing,
    syncError,
    lastSyncResult,
    sync,
    approve,
    reject,
    edit,
  }
}
