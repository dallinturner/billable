'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Firm } from '@/types/database'

export default function BillingPage() {
  const supabase = createClient()
  const router = useRouter()
  const [firm, setFirm] = useState<Firm | null>(null)
  const [loading, setLoading] = useState(true)
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: profile } = await supabase
        .from('users')
        .select('role, firm_id')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      const { data: firmData } = await supabase
        .from('firms')
        .select('*')
        .eq('id', profile.firm_id)
        .single()

      if (!firmData) { setLoading(false); return }

      const f = firmData as Firm
      // If active, they shouldn't be here
      if (f.subscription_status === 'active') {
        router.push('/admin')
        return
      }

      setFirm(f)
      setLoading(false)
    }
    load()
  }, [supabase, router])

  async function handleSubscribe() {
    setRedirecting(true)
    const res = await fetch('/api/stripe/create-checkout', { method: 'POST' })
    const { url } = await res.json()
    if (url) window.location.href = url
    else setRedirecting(false)
  }

  async function handleManageBilling() {
    setRedirecting(true)
    const res = await fetch('/api/stripe/customer-portal', { method: 'POST' })
    const { url } = await res.json()
    if (url) window.location.href = url
    else setRedirecting(false)
  }

  function daysRemaining(trialEndsAt: string) {
    const diff = new Date(trialEndsAt).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    )
  }

  const status = firm?.subscription_status
  const days = firm?.trial_ends_at ? daysRemaining(firm.trial_ends_at) : 0
  const planLabel = firm?.plan_type === 'solo' ? 'Solo — $99/month' : 'Firm — $150/month base + $75/month per lawyer'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 bg-gray-950 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900 tracking-tight">Billable</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">

          {/* Trialing with days remaining */}
          {status === 'trialing' && days > 0 && (
            <>
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-gray-900 mb-1">{days}</div>
                <div className="text-sm text-gray-400">days left in your free trial</div>
              </div>
              <p className="text-sm text-gray-600 mb-6 text-center">
                Add a payment method now to keep access after your trial ends.
              </p>
              <p className="text-xs text-gray-400 text-center mb-6">{planLabel}</p>
              <button
                onClick={handleSubscribe}
                disabled={redirecting}
                className="w-full bg-gray-950 hover:bg-gray-800 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition"
              >
                {redirecting ? 'Redirecting…' : 'Add payment method'}
              </button>
            </>
          )}

          {/* Trial expired */}
          {status === 'trialing' && days === 0 && (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-gray-900 mb-1">Your trial has ended</h2>
                <p className="text-sm text-gray-400">Start a subscription to restore access to Billable.</p>
              </div>
              <p className="text-xs text-gray-400 text-center mb-6">{planLabel}</p>
              <button
                onClick={handleSubscribe}
                disabled={redirecting}
                className="w-full bg-gray-950 hover:bg-gray-800 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition"
              >
                {redirecting ? 'Redirecting…' : 'Start subscription'}
              </button>
            </>
          )}

          {/* Past due */}
          {status === 'past_due' && (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-gray-900 mb-1">Payment failed</h2>
                <p className="text-sm text-gray-400">Update your payment method to restore access.</p>
              </div>
              <button
                onClick={handleManageBilling}
                disabled={redirecting}
                className="w-full bg-gray-950 hover:bg-gray-800 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition"
              >
                {redirecting ? 'Redirecting…' : 'Update payment method'}
              </button>
            </>
          )}

          {/* Canceled */}
          {status === 'canceled' && (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-gray-900 mb-1">Subscription canceled</h2>
                <p className="text-sm text-gray-400">Reactivate to restore access to Billable.</p>
              </div>
              <p className="text-xs text-gray-400 text-center mb-6">{planLabel}</p>
              <button
                onClick={handleSubscribe}
                disabled={redirecting}
                className="w-full bg-gray-950 hover:bg-gray-800 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition"
              >
                {redirecting ? 'Redirecting…' : 'Reactivate subscription'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
