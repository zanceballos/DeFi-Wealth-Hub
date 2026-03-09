import { useState, useEffect } from 'react'
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  getDocs,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuthContext } from './useAuthContext'
import { recomputeWellness } from '../services/financialDataService'

export function usePrivacy() {
  const { user } = useAuthContext()
  const [statements, setStatements]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [deleting, setDeleting]       = useState(null)
  const [recomputing, setRecomputing] = useState(false)

  useEffect(() => {
    if (!user) return

    const ref = collection(db, 'users', user.uid, 'statements')
    const unsubscribe = onSnapshot(ref, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setStatements(data)
      setLoading(false)
    })

    return unsubscribe
  }, [user])

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

      // 2. Recompute wellness + net worth with remaining statements
      setRecomputing(true)
      await recomputeWellness(user.uid)
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

      // 2. Recompute with zero statements — resets wellness + net worth to empty
      setRecomputing(true)
      await recomputeWellnessAndNetWorth(user.uid)
    } catch (err) {
      console.error('Failed to delete all statements:', err)
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
  const totalTransactions = statements.reduce((s, st) => s + (st.transactions_count || 0), 0)
  const totalNetWorth     = statements.reduce((s, st) => s + (st.net_worth_contribution || 0), 0)

  return {
    statements,
    grouped,
    loading,
    deleting,
    recomputing,
    totalFiles,
    totalTransactions,
    totalNetWorth,
    deleteStatement,
    deleteAllStatements,
  }
}
