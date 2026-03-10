import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'
import { updateEmail, deleteUser, sendPasswordResetEmail } from 'firebase/auth'
import { doc, deleteDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { User, Mail, Lock, Shield, Bell, Globe, LogOut, Trash2, ChevronRight, Check, AlertTriangle } from 'lucide-react'

const CARD = 'rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.04)] p-5 sm:p-6'

export default function Settings() {
  const navigate = useNavigate()
  const { user, logout } = useAuthContext()

  // Form states
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [email, setEmail] = useState(user?.email || '')


  // Preferences
  const [currency, setCurrency] = useState('SGD')
  const [timezone, setTimezone] = useState('GMT+8')
  const [language, setLanguage] = useState('English')

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState({
    transactions: true,
    alerts: true,
    portfolioChanges: true,
    weeklyReport: true,
    securityAlerts: true,
  })

  // Security
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [activeSessions] = useState([
    { id: 1, device: 'Chrome on Windows', lastActive: 'Now', location: 'Singapore' },
    { id: 2, device: 'Safari on iPhone', lastActive: '2 hours ago', location: 'Singapore' },
  ])
  const [sessions, setSessions] = useState(activeSessions)

  // Submission states
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const showMessage = (message, isError = false) => {
    if (isError) {
      setErrorMessage(message)
      setTimeout(() => setErrorMessage(''), 5000)
    } else {
      setSuccessMessage(message)
      setTimeout(() => setSuccessMessage(''), 5000)
    }
  }

  const handleToggleNotification = (key) => {
    setEmailNotifications(prev => ({ ...prev, [key]: !prev[key] }))
    showMessage('Notification preference updated')
  }

  const handleLogoutSession = (sessionId) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId))
    showMessage('Session ended')
  }

  const handleToggle2FA = () => {
    setTwoFactorEnabled(!twoFactorEnabled)
    showMessage(`Two-factor authentication ${!twoFactorEnabled ? 'enabled' : 'disabled'}`)
  }

  const handleUpdateDisplayName = async (e) => {
    e.preventDefault()
    if (!displayName.trim()) { showMessage('Display name cannot be empty', true); return }
    setLoading(true)
    try {
      await user.updateProfile({ displayName: displayName.trim() })
      showMessage('Display name updated successfully')
    } catch (error) {
      showMessage(error.message || 'Failed to update display name', true)
    } finally { setLoading(false) }
  }

  const handleUpdateEmail = async (e) => {
    e.preventDefault()
    if (!email.trim()) { showMessage('Email cannot be empty', true); return }
    setLoading(true)
    try {
      const currentUser = auth.currentUser
      if (!currentUser) { showMessage('User not authenticated', true); return }
      await updateEmail(currentUser, email.trim())
      showMessage('Email updated successfully')
    } catch (error) {
      showMessage(error.message || 'Failed to update email', true)
    } finally { setLoading(false) }
  }

  const handleResetPassword = async () => {
    if (!user?.email) { showMessage('No email associated with this account', true); return }
    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, user.email)
      showMessage('Password reset email sent — check your inbox and spam folder')
    } catch (error) {
      showMessage(error.message || 'Failed to send reset email', true)
    } finally { setLoading(false) }
  }

  const handleLogout = async () => {
    setLoading(true)
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      showMessage(error.message || 'Failed to logout', true)
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setLoading(true)
    try {
      const currentUser = auth.currentUser
      if (!currentUser) { showMessage('User not authenticated', true); return }
      await deleteDoc(doc(db, 'users', currentUser.uid)).then(() => deleteUser(currentUser))
      navigate('/login')
    } catch (error) {
      showMessage(error.message || 'Failed to delete account', true)
      setLoading(false)
    }
  }

  const NOTIFICATION_ITEMS = [
    { key: 'transactions', label: 'Transaction Alerts', desc: 'Get notified of new transactions' },
    { key: 'portfolioChanges', label: 'Portfolio Changes', desc: 'Notify on significant portfolio changes' },
    { key: 'alerts', label: 'Price Alerts', desc: 'Notify when asset prices hit your targets' },
    { key: 'weeklyReport', label: 'Weekly Report', desc: 'Receive weekly portfolio summary' },
    { key: 'securityAlerts', label: 'Security Alerts', desc: 'Important alerts about account security' },
  ]

  return (
    <section className="relative isolate min-h-full w-full p-4 sm:p-6 lg:p-8">
      {/* Background blobs — same as dashboard */}
      <div className="pointer-events-none fixed -top-20 -right-20 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />

      <div className="relative z-10 space-y-6">
        {/* ── Page header ── */}
        <header className="px-1">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
            Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your account, preferences, and security
          </p>
        </header>

        {/* ── Toast messages ── */}
        {successMessage && (
          <div className={`${CARD} !border-emerald-200 !bg-emerald-50/80 flex items-center gap-2`}>
            <Check className="h-4 w-4 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-700">{successMessage}</p>
          </div>
        )}
        {errorMessage && (
          <div className={`${CARD} !border-red-200 !bg-red-50/80 flex items-center gap-2`}>
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <p className="text-sm font-medium text-red-700">{errorMessage}</p>
          </div>
        )}

        {/* ── Profile Settings ── */}
        <article className={CARD}>
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
              <User className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-slate-900">Profile</h2>
          </div>

          {/* Display Name */}
          <form onSubmit={handleUpdateDisplayName} className="mb-5">
            <label className="mb-1.5 block text-sm font-medium text-slate-600">Display Name</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                disabled={loading}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:bg-white disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || displayName === (user?.displayName || '')}
                className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                Update
              </button>
            </div>
            <p className="mt-1.5 text-xs text-slate-400">Current: {user?.displayName || 'Not set'}</p>
          </form>

          {/* Email */}
          <form onSubmit={handleUpdateEmail} className="mb-5">
            <label className="mb-1.5 block text-sm font-medium text-slate-600">Email Address</label>
            <div className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={loading}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:bg-white disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || email === (user?.email || '')}
                className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                Update
              </button>
            </div>
            <p className="mt-1.5 text-xs text-slate-400">Current: {user?.email}</p>
          </form>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">Password</label>
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <div>
                <p className="text-sm font-medium text-slate-800">Reset Password</p>
                <p className="text-xs text-slate-400">We'll send a reset link to {user?.email}</p>
              </div>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={loading}
                className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                Send Reset Email
              </button>
            </div>
          </div>
        </article>

        {/* ── Preferences ── */}
        <article className={CARD}>
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
              <Globe className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-slate-900">Preferences</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">Currency</label>
              <select
                value={currency}
                onChange={(e) => { setCurrency(e.target.value); showMessage(`Currency changed to ${e.target.value}`) }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              >
                <option value="SGD">SGD ($)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => { setTimezone(e.target.value); showMessage(`Timezone changed to ${e.target.value}`) }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              >
                <option value="UTC">UTC</option>
                <option value="GMT+8">GMT+8 (Singapore)</option>
                <option value="EST">EST (Eastern)</option>
                <option value="PST">PST (Pacific)</option>
                <option value="CET">CET (Central Europe)</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">Language</label>
              <select
                value={language}
                onChange={(e) => { setLanguage(e.target.value); showMessage(`Language changed to ${e.target.value}`) }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              >
                <option value="English">English</option>
                <option value="Chinese">中文 (Chinese)</option>
                <option value="Spanish">Español (Spanish)</option>
                <option value="French">Français (French)</option>
              </select>
            </div>
          </div>
        </article>

        {/* ── Notifications ── */}
        <article className={CARD}>
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
              <Bell className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Notifications</h2>
              <p className="text-xs text-slate-400">Manage your email notification preferences</p>
            </div>
          </div>

          <div className="space-y-2">
            {NOTIFICATION_ITEMS.map((item) => (
              <div key={item.key} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 transition hover:border-slate-200">
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotification(item.key)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    emailNotifications[item.key] ? 'bg-brand-primary' : 'bg-slate-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                    emailNotifications[item.key] ? 'translate-x-5' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </article>

        {/* ── Security ── */}
        <article className={CARD}>
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
              <Shield className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-slate-900">Security</h2>
          </div>

          {/* 2FA */}
          <div className="mb-5 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <div>
              <p className="text-sm font-medium text-slate-800">Two-Factor Authentication</p>
              <p className="text-xs text-slate-400 mt-0.5">Add an extra layer of security</p>
              {twoFactorEnabled && (
                <p className="mt-1 text-xs font-medium text-emerald-600 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Enabled
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleToggle2FA}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                twoFactorEnabled ? 'bg-brand-primary' : 'bg-slate-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                twoFactorEnabled ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Active Sessions */}
          <div>
            <p className="mb-3 text-sm font-medium text-slate-600">Active Sessions</p>
            <div className="space-y-2">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{session.device}</p>
                    <p className="text-xs text-slate-400">{session.location} · {session.lastActive}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLogoutSession(session.id)}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                  >
                    End
                  </button>
                </div>
              ))}
            </div>
          </div>
        </article>

        {/* ── Account Actions ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loading}
            className={`${CARD} group flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:border-sky-200/60 cursor-pointer disabled:opacity-50`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors group-hover:bg-sky-50 group-hover:text-brand-primary">
              <LogOut className="h-5 w-5" />
            </span>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-slate-800">Log Out</p>
              <p className="text-xs text-slate-400">Sign out of your account</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-brand-primary" />
          </button>

          <button
            type="button"
            onClick={() => setDeleteConfirm(true)}
            disabled={loading}
            className={`${CARD} group flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(239,68,68,0.08)] hover:border-red-200/60 cursor-pointer disabled:opacity-50`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-400 transition-colors group-hover:text-red-500">
              <Trash2 className="h-5 w-5" />
            </span>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-red-600">Delete Account</p>
              <p className="text-xs text-slate-400">Permanently delete your account</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-red-400" />
          </button>
        </div>
      </div>

      {/* ── Delete Account Confirmation Modal ── */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget && !loading) setDeleteConfirm(false) }}
        >
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-bold text-slate-900">Delete Account?</h3>
            </div>
            <p className="mb-2 text-sm text-slate-600">
              This will permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <p className="mb-6 text-xs font-medium text-amber-600">
              Please make sure you want to proceed.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(false)}
                disabled={loading}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={loading}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {loading ? 'Deleting…' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}