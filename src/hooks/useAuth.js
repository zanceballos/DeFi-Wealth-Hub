import { useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../lib/firebase'

export function useAuth() {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function login(email, password) {
    setError(null)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      setError(err.message)
    }
  }

  async function register(email, password, name) {
    setError(null)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      if (name) {
        await updateProfile(cred.user, { displayName: name })
      }
      // Re-set user so downstream hooks (useUser) pick up the displayName
      setUser({ ...auth.currentUser })
    } catch (err) {
      setError(err.message)
    }
  }

  async function loginWithGoogle() {
    setError(null)
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (err) {
      setError(err.message)
    }
  }

  async function logout() {
    // Clear advisory session cache so next user doesn't see stale data
    sessionStorage.removeItem('dwh_advisory')
    sessionStorage.removeItem('dwh_advisory_payload')
    sessionStorage.removeItem('dwh_advisory_uid')
    await signOut(auth)
  }

  return { user, loading, error, login, register, loginWithGoogle, logout }
}
