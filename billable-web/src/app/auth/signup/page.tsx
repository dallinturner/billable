'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type AccountType = 'individual' | 'firm'

export default function SignupPage() {
  const [accountType, setAccountType] = useState<AccountType>('individual')
  const [fullName, setFullName] = useState('')
  const [firmName, setFirmName] = useState('')
  const [billingIncrement, setBillingIncrement] = useState('0.1')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })

    if (authError || !authData.user) {
      setError(authError?.message ?? 'Signup failed')
      setLoading(false)
      return
    }

    const userId = authData.user.id

    const { error: signupError } = await supabase.rpc('handle_signup', {
      p_user_id: userId,
      p_full_name: fullName,
      p_role: accountType === 'firm' ? 'admin' : 'individual',
      p_firm_name: accountType === 'firm' ? firmName : `${fullName}'s Practice`,
      p_billing_increment: parseFloat(billingIncrement),
    })

    if (signupError) {
      setError('Failed to create account: ' + signupError.message)
      setLoading(false)
      return
    }

    if (accountType === 'firm') {
      router.push('/admin')
    } else {
      router.push('/dashboard')
    }
  }

  const inputClass = "w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white/30 focus:border-transparent transition"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 bg-gray-950 dark:bg-white/10 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Billable</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Create your account</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm">
          {/* Account type selector */}
          <div className="flex gap-1.5 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setAccountType('individual')}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${
                accountType === 'individual'
                  ? 'bg-gray-950 text-white dark:bg-white dark:text-gray-950'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Individual
            </button>
            <button
              type="button"
              onClick={() => setAccountType('firm')}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${
                accountType === 'firm'
                  ? 'bg-gray-950 text-white dark:bg-white dark:text-gray-950'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Law Firm
            </button>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Your full name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className={inputClass} placeholder="Jane Smith" />
            </div>

            {accountType === 'firm' && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Firm name</label>
                <input type="text" value={firmName} onChange={(e) => setFirmName(e.target.value)} required className={inputClass} placeholder="Smith & Associates" />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Billing increment</label>
              <select value={billingIncrement} onChange={(e) => setBillingIncrement(e.target.value)} className={inputClass}>
                <option value="0.1">0.1 hour (6-minute increments)</option>
                <option value="0.25">0.25 hour (15-minute increments)</option>
                <option value="0.5">0.5 hour (30-minute increments)</option>
                <option value="1">1.0 hour increments</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} placeholder="you@lawfirm.com" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className={inputClass} placeholder="••••••••" />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-4 py-3 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-950 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-950 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm transition mt-2"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-gray-900 dark:text-white font-semibold hover:underline transition">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
