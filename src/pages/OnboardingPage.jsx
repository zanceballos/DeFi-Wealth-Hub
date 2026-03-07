import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'
import { useFirestore } from '../hooks/useFirestore'

const STEPS = [
  { title: 'Welcome', subtitle: "Let's get to know you" },
  { title: 'Your Finances', subtitle: 'Help us understand your financial picture' },
  { title: 'Risk Appetite', subtitle: 'How comfortable are you with risk?' },
]

const RISK_OPTIONS = [
  { value: 'conservative', emoji: '🛡️', label: 'Conservative', desc: 'Safety first, lower returns' },
  { value: 'moderate', emoji: '⚖️', label: 'Moderate', desc: 'Balanced risk and reward' },
  { value: 'aggressive', emoji: '🚀', label: 'Aggressive', desc: 'High risk, high reward' },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuthContext()
  const { update } = useFirestore('users')

  const [step, setStep] = useState(0)
  const [name, setName] = useState(profile?.name || user?.displayName || '')
  const [income, setIncome] = useState('')
  const [expenses, setExpenses] = useState('')
  const [riskProfile, setRiskProfile] = useState('')
  const [saving, setSaving] = useState(false)

  const canNext =
    (step === 0 && name.trim()) ||
    (step === 1 && income !== '' && expenses !== '') ||
    (step === 2 && riskProfile)

  function handleBack() {
    setStep((s) => Math.max(0, s - 1))
  }

  function handleNext() {
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
  }

  async function handleFinish() {
    setSaving(true)
    try {
      await update(user.uid, {
        name: name.trim(),
        monthly_income: Number(income),
        monthly_expenses: Number(expenses),
        risk_profile: riskProfile,
        onboarding_complete: true,
      })
      await refreshProfile()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.error('Onboarding save failed:', err)
      setSaving(false)
    }
  }

  const isLast = step === STEPS.length - 1

  function inputClass(extra = '') {
    return `w-full rounded-xl border border-slate-600 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500 ${extra}`
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: '#0F172A' }}>
      <div className="w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-800/60 p-8 shadow-2xl backdrop-blur-xl">
        {/* Progress bar */}
        <div className="mb-8 flex gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i <= step ? 'bg-teal-500' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Step header */}
        <h2 className="mb-1 text-2xl font-bold text-white">{STEPS[step].title}</h2>
        <p className="mb-8 text-sm text-slate-400">{STEPS[step].subtitle}</p>

        {/* Step content */}
        {step === 0 && (
          <div>
            <label htmlFor="name" className="mb-1.5 block text-xs font-medium tracking-wide text-slate-400 uppercase">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className={inputClass()}
              autoFocus
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label htmlFor="income" className="mb-1.5 block text-xs font-medium tracking-wide text-slate-400 uppercase">
                Monthly Income
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                  SGD
                </span>
                <input
                  id="income"
                  type="number"
                  min="0"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  placeholder="0"
                  className={inputClass('pl-14')}
                  autoFocus
                />
              </div>
            </div>
            <div>
              <label htmlFor="expenses" className="mb-1.5 block text-xs font-medium tracking-wide text-slate-400 uppercase">
                Monthly Expenses
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                  SGD
                </span>
                <input
                  id="expenses"
                  type="number"
                  min="0"
                  value={expenses}
                  onChange={(e) => setExpenses(e.target.value)}
                  placeholder="0"
                  className={inputClass('pl-14')}
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            {RISK_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRiskProfile(opt.value)}
                className={`flex w-full items-center gap-4 rounded-xl border px-4 py-4 text-left transition ${
                  riskProfile === opt.value
                    ? 'border-teal-500 bg-teal-500/10'
                    : 'border-slate-700 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/60'
                }`}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <div>
                  <p className={`text-sm font-semibold ${riskProfile === opt.value ? 'text-teal-300' : 'text-white'}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-slate-400">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 rounded-xl border border-slate-600 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-700"
            >
              Back
            </button>
          )}
          <button
            type="button"
            disabled={!canNext || saving}
            onClick={isLast ? handleFinish : handleNext}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl disabled:pointer-events-none disabled:opacity-50"
            style={{
              backgroundImage: 'linear-gradient(to right, #14B8A6, #06B6D4)',
            }}
          >
            {saving ? 'Saving…' : isLast ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
