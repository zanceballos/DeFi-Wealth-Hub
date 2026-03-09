/**
 * useGmailLink — manages Gmail connection state for the current user.
 *
 * Reads `gmailLinked` / `gmailEmail` / `lastGmailSync` from the user
 * document in Firestore. Links/unlinks entirely client-side.
 */

import { useCallback, useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import { useAuthContext } from './useAuthContext.js'
import { initiateGmailLink, revokeToken } from '../services/gmailService.js'

export default function useGmailLink() {
  const { user } = useAuthContext()
  const uid = user?.uid ?? ''

  const [gmailLinked, setGmailLinked]   = useState(false)
  const [gmailEmail, setGmailEmail]     = useState(null)
  const [lastSync, setLastSync]         = useState(null)
  const [linking, setLinking]           = useState(false)
  const [error, setError]               = useState(null)

  // Subscribe to user doc for real-time Gmail link status
  useEffect(() => {
    if (!uid) return
    const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setGmailLinked(!!data.gmailLinked)
        setGmailEmail(data.gmailEmail ?? null)
        setLastSync(data.lastGmailSync?.toDate?.() ?? null)
      }
    })
    return unsub
  }, [uid])

  const linkGmail = useCallback(async () => {
    setLinking(true)
    setError(null)
    try {
      const result = await initiateGmailLink()
      // Save linked status to Firestore
      await setDoc(doc(db, 'users', uid), {
        gmailLinked: true,
        gmailEmail: result.email,
        gmailLinkedAt: serverTimestamp(),
      }, { merge: true })
      setGmailLinked(true)
      setGmailEmail(result.email)
    } catch (err) {
      setError(err.message || 'Failed to link Gmail')
    } finally {
      setLinking(false)
    }
  }, [uid])

  const unlinkGmail = useCallback(async () => {
    setLinking(true)
    setError(null)
    try {
      revokeToken()
      await setDoc(doc(db, 'users', uid), {
        gmailLinked: false,
        gmailEmail: null,
        gmailLinkedAt: null,
        lastGmailSync: null,
      }, { merge: true })
      setGmailLinked(false)
      setGmailEmail(null)
    } catch (err) {
      setError(err.message || 'Failed to unlink Gmail')
    } finally {
      setLinking(false)
    }
  }, [uid])

  return {
    gmailLinked,
    gmailEmail,
    lastSync,
    linking,
    error,
    linkGmail,
    unlinkGmail,
  }
}
