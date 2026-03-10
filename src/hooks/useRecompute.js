import { useState, useCallback } from 'react'
import { useAuthContext } from './useAuthContext'
import { recomputeAll } from '../services/financialDataService'

export function useRecompute() {
  const { user } = useAuthContext()
  const [recomputing, setRecomputing] = useState(false)

  const triggerRecompute = useCallback(async () => {
    if (!user?.uid) return null
    setRecomputing(true)
    try {
      return await recomputeAll(user.uid)
    } finally {
      setRecomputing(false)
    }
  }, [user?.uid])

  return { triggerRecompute, recomputing }
}
