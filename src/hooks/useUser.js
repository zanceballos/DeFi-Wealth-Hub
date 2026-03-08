import { useState, useEffect, useRef } from 'react'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './useAuth'

export function useUser() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  useEffect(() => {
    async function fetchOrCreateProfile() {
      // No user — clear profile
      if (!user) {
        if (isMounted.current) {
          setProfile(null)
          setLoading(false)
        }
        return
      }

      try {
        const userRef = doc(db, 'users', user.uid)
        const snapshot = await getDoc(userRef)

        if (!isMounted.current) return

        if (snapshot.exists()) {
          const data = snapshot.data()
          if (!data.name && user.displayName) {
            await updateDoc(userRef, { name: user.displayName })
            data.name = user.displayName
          }
          setProfile({ id: snapshot.id, ...data })
        } else {
          const newProfile = {
            uid:              user.uid,
            name:             user.displayName || '',
            email:            user.email || '',
            avatar_url:       user.photoURL || '',
            created_at:       serverTimestamp(),
            risk_profile:     'moderate',
            monthly_income:   0,
            monthly_expenses: 0,
          }
          await setDoc(userRef, newProfile)
          if (isMounted.current) setProfile({ id: user.uid, ...newProfile })
        }
      } catch (err) {
        console.error('useUser: failed to fetch/create profile', err)
      }

      if (isMounted.current) setLoading(false)
    }

    fetchOrCreateProfile()
  }, [user, refreshKey])

  // Bump refreshKey to re-run the effect and re-fetch from Firestore
  function refreshProfile() {
    return new Promise((resolve) => {
      setRefreshKey((k) => k + 1)
      // Give the effect time to run and update profile
      setTimeout(resolve, 500)
    })
  }

  return { profile, loading, refreshProfile }
}
