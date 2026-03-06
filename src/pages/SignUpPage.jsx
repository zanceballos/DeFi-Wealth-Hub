import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Eye, EyeOff, Mail, Lock, User, Loader2 } from 'lucide-react'

export default function SignUpPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading, error: authError, register, loginWithGoogle } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setLocalError('')

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.')
      return
    }
    if (!agreeTerms) {
      setLocalError('Please agree to the Terms of Service.')
      return
    }

    setSubmitting(true)
    await register(email, password, name)
    setSubmitting(false)
  }

  async function handleGoogle() {
    setSubmitting(true)
    await loginWithGoogle()
    setSubmitting(false)
  }

  const loading = submitting || authLoading
  const displayError = localError || authError

  function inputProps(value, onChange) {
    return {
      value,
      onChange: (e) => onChange(e.target.value),
      className:
        'w-full rounded-lg border bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:ring-1',
      style: { borderColor: '#1E3A5F' },
      onFocus: (e) => {
        e.target.style.borderColor = '#00C9B1'
        e.target.style.boxShadow = '0 0 0 3px rgba(0,201,177,0.15)'
      },
      onBlur: (e) => {
        e.target.style.borderColor = '#1E3A5F'
        e.target.style.boxShadow = 'none'
      },
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col lg:flex-row" style={{ background: '#0A0F1E' }}>
      {/* ── Left branding panel ── */}
      <div className="relative flex flex-col items-center justify-center overflow-hidden px-8 py-16 lg:w-1/2 lg:py-0">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -left-1/4 -top-1/4 h-[140%] w-[140%] animate-spin"
            style={{
              background:
                'conic-gradient(from 0deg at 50% 50%, #0A0F1E 0%, #0D2847 25%, #0B4D5C 40%, #0D2847 60%, #0A0F1E 100%)',
              animationDuration: '30s',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 30% 50%, rgba(0,201,177,0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(0,153,255,0.10) 0%, transparent 55%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
            }}
          />
        </div>

        <div className="relative z-10 max-w-md text-center lg:text-left">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-1.5 text-xs font-medium tracking-wider text-teal-300 uppercase">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-400" />
            Secure &amp; Decentralized
          </div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            DeFi{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #00C9B1, #0099FF)' }}
            >
              Wealth Hub
            </span>
          </h1>
          <p className="text-base leading-relaxed sm:text-lg" style={{ color: '#8899AA' }}>
            Create your account and start building your decentralized wealth portfolio today.
          </p>

          <div className="mt-10 flex justify-center gap-8 lg:justify-start">
            {[
              { value: '$2.4B+', label: 'Assets Tracked' },
              { value: '12K+', label: 'Active Users' },
              { value: '99.9%', label: 'Uptime' },
            ].map((stat) => (
              <div key={stat.label} className="text-center lg:text-left">
                <p className="text-xl font-bold text-white sm:text-2xl">{stat.value}</p>
                <p className="text-xs" style={{ color: '#8899AA' }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:w-1/2 lg:py-0">
        <div
          className="w-full max-w-md rounded-2xl border p-8 shadow-2xl backdrop-blur-xl sm:p-10"
          style={{
            background: 'rgba(255,255,255,0.05)',
            borderColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <h2 className="mb-1 text-2xl font-bold text-white">Create your account</h2>
          <p className="mb-8 text-sm" style={{ color: '#8899AA' }}>
            Get started in just a few seconds
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="mb-1.5 block text-xs font-medium tracking-wide text-slate-400 uppercase">
                Full Name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="John Doe"
                  {...inputProps(name, setName)}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium tracking-wide text-slate-400 uppercase">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  {...inputProps(email, setEmail)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium tracking-wide text-slate-400 uppercase">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Min. 6 characters"
                  {...inputProps(password, setPassword)}
                  className="w-full rounded-lg border bg-white/5 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 outline-none transition focus:ring-1"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-medium tracking-wide text-slate-400 uppercase">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  placeholder="Re-enter password"
                  {...inputProps(confirmPassword, setConfirmPassword)}
                  className="w-full rounded-lg border bg-white/5 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 outline-none transition focus:ring-1"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Terms checkbox */}
            <label className="flex cursor-pointer items-start gap-2 text-sm" style={{ color: '#8899AA' }}>
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 rounded border-slate-600 bg-white/5 accent-teal-500"
              />
              <span>
                I agree to the{' '}
                <Link to="/privacy" className="font-medium hover:underline" style={{ color: '#5BB8FF' }}>
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="font-medium hover:underline" style={{ color: '#5BB8FF' }}>
                  Privacy Policy
                </Link>
              </span>
            </label>

            {/* Error */}
            {displayError && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                {displayError}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl disabled:pointer-events-none disabled:opacity-60"
              style={{
                backgroundImage: 'linear-gradient(135deg, #00C9B1, #0099FF)',
                boxShadow: '0 4px 20px rgba(0,153,255,0.25)',
              }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <span className="text-xs" style={{ color: '#8899AA' }}>
              or continue with
            </span>
            <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.1)' }} />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-lg border bg-white/5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:pointer-events-none disabled:opacity-60"
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Login link */}
          <p className="mt-6 text-center text-sm" style={{ color: '#8899AA' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-medium transition hover:underline" style={{ color: '#5BB8FF' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
