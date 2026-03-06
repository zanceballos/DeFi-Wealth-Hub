import { useAuth } from '../hooks/useAuth'
import { useUser } from '../hooks/useUser'
import { AuthContext } from './authContextValue'

export default function AuthProvider({ children }) {
  const { user, loading: authLoading, error, login, register, loginWithGoogle, logout } = useAuth()
  const { profile, loading: profileLoading, refreshProfile } = useUser()

  const loading = authLoading || profileLoading

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, error, login, register, loginWithGoogle, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}
