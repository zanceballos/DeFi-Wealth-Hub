import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'
import { updatePassword, updateEmail, deleteUser } from 'firebase/auth'
import { auth } from '../lib/firebase'

export default function Settings() {
  const navigate = useNavigate()
  const { user, logout } = useAuthContext()

  // Form states
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Preferences
  const [currency, setCurrency] = useState('USD')
  const [timezone, setTimezone] = useState('UTC')
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
  const [activeSessions, setActiveSessions] = useState([
    { id: 1, device: 'Chrome on Windows', lastActive: 'Now', location: 'Singapore' },
    { id: 2, device: 'Safari on iPhone', lastActive: '2 hours ago', location: 'Singapore' },
  ])

  // Submission states
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteDataConfirm, setDeleteDataConfirm] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  // Clear messages after 5 seconds
  const showMessage = (message, isError = false) => {
    if (isError) {
      setErrorMessage(message)
      setTimeout(() => setErrorMessage(''), 5000)
    } else {
      setSuccessMessage(message)
      setTimeout(() => setSuccessMessage(''), 5000)
    }
  }

  // Toggle notification preference
  const handleToggleNotification = (key) => {
    setEmailNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
    showMessage(`${key.charAt(0).toUpperCase() + key.slice(1)} notification updated`)
  }

  // Export data as JSON
  const handleExportData = async () => {
    setExportLoading(true)
    try {
      const dataToExport = {
        user: {
          name: user?.displayName,
          email: user?.email,
          accountCreated: user?.metadata?.creationTime,
          lastSignIn: user?.metadata?.lastSignInTime,
        },
        exportedAt: new Date().toISOString(),
      }
      const dataStr = JSON.stringify(dataToExport, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `defi-wealth-hub-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      showMessage('Data exported successfully')
    } catch (error) {
      showMessage(error.message || 'Failed to export data', true)
    } finally {
      setExportLoading(false)
    }
  }

  // Handle logout session
  const handleLogoutSession = (sessionId) => {
    setActiveSessions(prev => prev.filter(s => s.id !== sessionId))
    showMessage('Session ended')
  }

  // Toggle 2FA
  const handleToggle2FA = () => {
    setTwoFactorEnabled(!twoFactorEnabled)
    showMessage(`Two-factor authentication ${!twoFactorEnabled ? 'enabled' : 'disabled'}`)
  }

  // Update display name
  const handleUpdateDisplayName = async (e) => {
    e.preventDefault()
    if (!displayName.trim()) {
      showMessage('Display name cannot be empty', true)
      return
    }

    setLoading(true)
    try {
      await user.updateProfile({ displayName: displayName.trim() })
      showMessage('Display name updated successfully')
    } catch (error) {
      showMessage(error.message || 'Failed to update display name', true)
    } finally {
      setLoading(false)
    }
  }

  // Update email
  const handleUpdateEmail = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      showMessage('Email cannot be empty', true)
      return
    }

    setLoading(true)
    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        showMessage('User not authenticated', true)
        return
      }
      await updateEmail(currentUser, email.trim())
      showMessage('Email updated successfully')
    } catch (error) {
      showMessage(error.message || 'Failed to update email', true)
    } finally {
      setLoading(false)
    }
  }

  // Update password
  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (!newPassword || !confirmPassword) {
      showMessage('Both password fields are required', true)
      return
    }

    if (newPassword !== confirmPassword) {
      showMessage('Passwords do not match', true)
      return
    }

    if (newPassword.length < 6) {
      showMessage('Password must be at least 6 characters', true)
      return
    }

    setLoading(true)
    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        showMessage('User not authenticated', true)
        return
      }
      await updatePassword(currentUser, newPassword)
      setNewPassword('')
      setConfirmPassword('')
      showMessage('Password updated successfully')
    } catch (error) {
      showMessage(error.message || 'Failed to update password', true)
    } finally {
      setLoading(false)
    }
  }

  // Handle logout
  const handleLogout = async () => {
    setLoading(true)
    try {
      await logout()
      showMessage('Logged out successfully')
      navigate('/login')
    } catch (error) {
      showMessage(error.message || 'Failed to logout', true)
      setLoading(false)
    }
  }

  // Handle account deletion
  const handleDeleteAccount = async () => {
    setLoading(true)
    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        showMessage('User not authenticated', true)
        return
      }
      // Delete user data from Firestore if applicable
      // await deleteUserData(user.uid)
      
      // Delete auth account
      await deleteUser(currentUser)
      showMessage('Account deleted successfully')
      navigate('/login')
    } catch (error) {
      showMessage(error.message || 'Failed to delete account', true)
      setLoading(false)
    }
  }

  // Handle delete all data
  const handleDeleteData = async () => {
    setLoading(true)
    try {
      // Delete user data from Firestore
      // await deleteUserData(user.uid)
      showMessage('All data deleted successfully')
    } catch (error) {
      showMessage(error.message || 'Failed to delete data', true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="text-sm font-medium text-green-800">✓ {successMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm font-medium text-red-800">✕ {errorMessage}</p>
        </div>
      )}

      {/* Profile Settings Section */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Settings</h2>

          {/* Display Name */}
          <form onSubmit={handleUpdateDisplayName} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white transition-all"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || displayName === (user?.displayName || '')}
                  className="bg-teal-500 hover:bg-teal-600 active:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Update
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Current: {user?.displayName || 'Not set'}</p>
            </div>
          </form>
        </div>

        {/* Email Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white transition-all"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || email === (user?.email || '')}
                  className="bg-teal-500 hover:bg-teal-600 active:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Update
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Current: {user?.email}</p>
            </div>
          </form>
        </div>

        {/* Password Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white transition-all"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white transition-all"
                disabled={loading}
              />
            </div>

            <div className="flex justify-between pt-2">
              <p className="text-xs text-gray-400">Password must be at least 6 characters</p>
              <button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword}
                className="bg-teal-500 hover:bg-teal-600 active:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
            <select
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value)
                showMessage(`Currency changed to ${e.target.value}`)
              }}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="SGD">SGD ($)</option>
              <option value="AUD">AUD ($)</option>
            </select>
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => {
                setTimezone(e.target.value)
                showMessage(`Timezone changed to ${e.target.value}`)
              }}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
            >
              <option value="UTC">UTC</option>
              <option value="GMT+8">GMT+8 (Singapore)</option>
              <option value="EST">EST (Eastern)</option>
              <option value="PST">PST (Pacific)</option>
              <option value="CET">CET (Central Europe)</option>
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value)
                showMessage(`Language changed to ${e.target.value}`)
              }}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
            >
              <option value="English">English</option>
              <option value="Chinese">中文 (Chinese)</option>
              <option value="Spanish">Español (Spanish)</option>
              <option value="French">Français (French)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notification Preferences Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h2>
        <p className="text-sm text-gray-500 mb-4">Manage your email notification preferences</p>
        <div className="space-y-3">
          {/* Transactions */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <p className="font-medium text-gray-900">Transaction Alerts</p>
              <p className="text-sm text-gray-500">Get notified of new transactions</p>
            </div>
            <button
              onClick={() => handleToggleNotification('transactions')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                emailNotifications.transactions ? 'bg-teal-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  emailNotifications.transactions ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Portfolio Changes */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <p className="font-medium text-gray-900">Portfolio Changes</p>
              <p className="text-sm text-gray-500">Notify on significant portfolio changes</p>
            </div>
            <button
              onClick={() => handleToggleNotification('portfolioChanges')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                emailNotifications.portfolioChanges ? 'bg-teal-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  emailNotifications.portfolioChanges ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Price Alerts */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <p className="font-medium text-gray-900">Price Alerts</p>
              <p className="text-sm text-gray-500">Notify when asset prices hit your targets</p>
            </div>
            <button
              onClick={() => handleToggleNotification('alerts')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                emailNotifications.alerts ? 'bg-teal-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  emailNotifications.alerts ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Weekly Report */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <p className="font-medium text-gray-900">Weekly Report</p>
              <p className="text-sm text-gray-500">Receive weekly portfolio summary</p>
            </div>
            <button
              onClick={() => handleToggleNotification('weeklyReport')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                emailNotifications.weeklyReport ? 'bg-teal-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  emailNotifications.weeklyReport ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Security Alerts */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <p className="font-medium text-gray-900">Security Alerts</p>
              <p className="text-sm text-gray-500">Important alerts about account security</p>
            </div>
            <button
              onClick={() => handleToggleNotification('securityAlerts')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                emailNotifications.securityAlerts ? 'bg-teal-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  emailNotifications.securityAlerts ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Security</h2>

        {/* Two-Factor Authentication */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500 mt-1">Add an extra layer of security to your account</p>
            </div>
            <button
              onClick={handleToggle2FA}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                twoFactorEnabled ? 'bg-teal-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  twoFactorEnabled ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {twoFactorEnabled && (
            <p className="text-xs text-green-600 mt-2">✓ Two-factor authentication is enabled</p>
          )}
        </div>

        {/* Active Sessions */}
        <div>
          <p className="font-medium text-gray-900 mb-4">Active Sessions</p>
          <div className="space-y-2">
            {activeSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-900">{session.device}</p>
                  <p className="text-xs text-gray-500">{session.location} • {session.lastActive}</p>
                </div>
                <button
                  onClick={() => handleLogoutSession(session.id)}
                  className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded transition-colors"
                >
                  End
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data & Privacy Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Data & Privacy</h2>
        <p className="text-sm text-gray-500 mb-4">Manage your personal data</p>
        
        <button
          onClick={handleExportData}
          disabled={exportLoading}
          className="w-full bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {exportLoading ? 'Exporting...' : 'Export My Data (JSON)'}
        </button>
        <p className="text-xs text-gray-400 mt-2">Download a copy of your account data for backup or transfer</p>
      </div>

      {/* Danger Zone Section */}
      <div className="border-2 border-red-200 rounded-xl p-6 bg-red-50/50">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
        </div>
        <p className="text-sm text-red-800 mb-4">These actions cannot be undone. Please be careful.</p>

        <div className="space-y-3">
          {/* Delete Data Button */}
          <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-red-200">
            <div>
              <p className="font-medium text-gray-900">Delete All Data</p>
              <p className="text-sm text-gray-500">Delete all your financial data and history</p>
            </div>
            <button
              onClick={() => setDeleteDataConfirm(true)}
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              Delete Data
            </button>
          </div>

          {/* Delete Account Button */}
          <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-red-200">
            <div>
              <p className="font-medium text-gray-900">Delete Account</p>
              <p className="text-sm text-gray-500">Permanently delete your account and all associated data</p>
            </div>
            <button
              onClick={() => setDeleteConfirm(true)}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Data Confirmation Modal */}
      {deleteDataConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Delete All Data?</h3>
            </div>
            <p className="text-gray-600 mb-6">
              This will permanently delete all your financial data and history. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteDataConfirm(false)}
                disabled={loading}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteData}
                disabled={loading}
                className="flex-1 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                {loading ? 'Deleting...' : 'Delete Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Delete Account?</h3>
            </div>
            <p className="text-gray-600 mb-2">
              This will permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <p className="text-sm text-orange-600 font-medium mb-6">
              Please make sure you want to proceed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                disabled={loading}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                {loading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}