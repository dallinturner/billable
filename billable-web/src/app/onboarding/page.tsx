'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { inviteLawyer } from '@/app/admin/settings/actions'
import type { Firm } from '@/types/database'

type Step = 1 | 2 | 3

interface AddedClient {
  id: string
  name: string
}

interface SentInvite {
  name: string
  email: string
  sent: boolean
}

const inputClass = 'w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white/30 focus:border-transparent transition'
const btnPrimary = 'w-full bg-gray-950 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-950 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition'
const btnSecondary = 'w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 disabled:opacity-40 text-gray-900 dark:text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<Step>(1)
  const [firm, setFirm] = useState<Firm | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Step 1
  const [firmName, setFirmName] = useState('')
  const [billingIncrement, setBillingIncrement] = useState('0.1')

  // Step 2
  const [newClientName, setNewClientName] = useState('')
  const [addedClients, setAddedClients] = useState<AddedClient[]>([])

  // Step 3
  const [lawyerName, setLawyerName] = useState('')
  const [lawyerEmail, setLawyerEmail] = useState('')
  const [sentInvites, setSentInvites] = useState<SentInvite[]>([])

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
    if (!profile) return

    const { data: firmData } = await supabase.from('firms').select('*').eq('id', profile.firm_id).single()
    if (!firmData) return

    const f = firmData as Firm
    setFirm(f)
    setFirmName(f.name)
    setBillingIncrement(f.billing_increment?.toString() ?? '0.1')
    setLoading(false)
  }, [supabase, router])

  useEffect(() => { loadData() }, [loadData])

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault()
    if (!firm || !firmName.trim()) return
    setSaving(true)
    await supabase.from('firms').update({
      name: firmName.trim(),
      billing_increment: parseFloat(billingIncrement),
    }).eq('id', firm.id)
    setSaving(false)
    setStep(2)
  }

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault()
    if (!newClientName.trim() || !firm) return
    setSaving(true)
    const { data } = await supabase
      .from('clients')
      .insert({ firm_id: firm.id, name: newClientName.trim() })
      .select('id, name')
      .single()
    if (data) {
      setAddedClients(prev => [...prev, data as AddedClient])
      setNewClientName('')
    }
    setSaving(false)
  }

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!lawyerName.trim() || !lawyerEmail.trim() || !firm) return
    setSaving(true)
    const result = await inviteLawyer(lawyerEmail.trim(), lawyerName.trim(), firm.id).catch((err: Error) => ({ error: err.message }))
    setSentInvites(prev => [...prev, {
      name: lawyerName.trim(),
      email: lawyerEmail.trim(),
      sent: !result.error,
    }])
    setLawyerName('')
    setLawyerEmail('')
    setSaving(false)
  }

  async function handleFinish() {
    if (!firm) return
    setSaving(true)
    await supabase.from('firms').update({ onboarding_complete: true }).eq('id', firm.id)
    router.push('/admin')
  }

  const steps = [
    { n: 1, label: 'Firm setup' },
    { n: 2, label: 'Clients' },
    { n: 3, label: 'Team' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-gray-200 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center pt-16 px-4 pb-16">
      {/* Wordmark */}
      <div className="flex items-center gap-2 mb-12">
        <div className="w-7 h-7 bg-gray-950 dark:bg-white rounded-md flex items-center justify-center">
          <svg className="w-4 h-4 text-white dark:text-gray-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span className="font-semibold text-gray-900 dark:text-white text-lg" style={{ letterSpacing: '-0.3px' }}>Billable</span>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-10">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step > s.n
                  ? 'bg-gray-950 dark:bg-white text-white dark:text-gray-950'
                  : step === s.n
                  ? 'bg-gray-950 dark:bg-white text-white dark:text-gray-950'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-400'
              }`}>
                {step > s.n ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : s.n}
              </div>
              <span className={`text-sm hidden sm:block transition-colors ${
                step === s.n ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-400'
              }`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-px mx-1 transition-colors ${step > s.n ? 'bg-gray-950 dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="w-full max-w-md">

        {/* Step 1: Firm setup */}
        {step === 1 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Set up your firm</h1>
            <p className="text-sm text-gray-400 mb-6">Confirm your firm name and how you bill time.</p>
            <form onSubmit={handleStep1} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Firm name</label>
                <input
                  autoFocus
                  value={firmName}
                  onChange={e => setFirmName(e.target.value)}
                  placeholder="e.g. Smith & Associates"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Billing increment</label>
                <select
                  value={billingIncrement}
                  onChange={e => setBillingIncrement(e.target.value)}
                  className={inputClass}
                >
                  <option value="0.1">0.1 hour — 6-minute increments</option>
                  <option value="0.25">0.25 hour — 15-minute increments</option>
                  <option value="0.5">0.5 hour — 30-minute increments</option>
                  <option value="1">1.0 hour increments</option>
                </select>
              </div>
              <button type="submit" disabled={saving || !firmName.trim()} className={`${btnPrimary} mt-2`}>
                Continue
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Add clients */}
        {step === 2 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Add your clients</h1>
            <p className="text-sm text-gray-400 mb-6">Add the clients or matters your lawyers will bill time to. You can add more any time in Settings.</p>
            <form onSubmit={handleAddClient} className="flex gap-2 mb-4">
              <input
                autoFocus
                value={newClientName}
                onChange={e => setNewClientName(e.target.value)}
                placeholder="Client or matter name"
                className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white/30 focus:border-transparent transition"
              />
              <button
                type="submit"
                disabled={saving || !newClientName.trim()}
                className="bg-gray-950 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-950 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition whitespace-nowrap"
              >
                Add
              </button>
            </form>

            {addedClients.length > 0 && (
              <div className="space-y-1.5 mb-6">
                {addedClients.map(c => (
                  <div key={c.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 py-1.5 px-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {c.name}
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setStep(3)} className={btnPrimary}>
              {addedClients.length > 0 ? 'Continue' : 'Skip for now'}
            </button>
          </div>
        )}

        {/* Step 3: Invite lawyers */}
        {step === 3 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Invite your team</h1>
            <p className="text-sm text-gray-400 mb-6">Send invite emails to your lawyers. They'll get a link to set their password and log in. You can invite more later in Settings.</p>

            <form onSubmit={handleSendInvite} className="space-y-3 mb-4">
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={lawyerName}
                  onChange={e => setLawyerName(e.target.value)}
                  placeholder="Full name"
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white/30 focus:border-transparent transition"
                />
                <input
                  value={lawyerEmail}
                  onChange={e => setLawyerEmail(e.target.value)}
                  type="email"
                  placeholder="Email"
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white/30 focus:border-transparent transition"
                />
              </div>
              <button
                type="submit"
                disabled={saving || !lawyerName.trim() || !lawyerEmail.trim()}
                className={btnSecondary}
              >
                Send invite
              </button>
            </form>

            {sentInvites.length > 0 && (
              <div className="space-y-1.5 mb-6">
                {sentInvites.map((inv, i) => (
                  <div key={i} className={`flex items-center gap-2 text-sm py-1.5 px-3 rounded-lg ${
                    inv.sent
                      ? 'text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800'
                      : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10'
                  }`}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      {inv.sent
                        ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        : <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      }
                    </svg>
                    <span className="truncate">{inv.name} — {inv.email}</span>
                    {!inv.sent && <span className="ml-auto text-xs flex-shrink-0">Failed</span>}
                  </div>
                ))}
              </div>
            )}

            <button onClick={handleFinish} disabled={saving} className={btnPrimary}>
              {sentInvites.length > 0 ? 'Finish setup' : 'Skip for now'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
