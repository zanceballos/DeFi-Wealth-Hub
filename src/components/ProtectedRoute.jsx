import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuthContext } from '../hooks/useAuthContext'

export default function ProtectedRoute() {
  const { user, profile, loading } = useAuthContext()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#0A0F1E' }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
          <p className="text-sm text-slate-400">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Redirect to onboarding if not completed (but don't loop if already there)
  if (profile && !profile.onboarding_complete && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
