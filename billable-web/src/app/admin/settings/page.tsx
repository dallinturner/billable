'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { useTheme } from '@/components/ThemeProvider'
import { inviteLawyer } from './actions'
import type { Client, TaskType, User, Firm } from '@/types/database'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  )
}

export default function AdminSettingsPage() {
  const supabase = createClient()
  const { theme, toggleTheme } = useTheme()

  const [user, setUser] = useState<User | null>(null)
  const [firm, setFirm] = useState<Firm | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([])
  const [lawyers, setLawyers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const [newClientName, setNewClientName] = useState('')
  const [newTaskName, setNewTaskName] = useState('')
  const [newLawyerEmail, setNewLawyerEmail] = useState('')
  const [newLawyerName, setNewLawyerName] = useState('')
  const [billingIncrement, setBillingIncrement] = useState('0.1')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
    if (!profile) return
    setUser(profile as User)

    const firmId = profile.firm_id

    const [{ data: firmData }, { data: clientsData }, { data: taskTypesData }, { data: lawyersData }] = await Promise.all([
      supabase.from('firms').select('*').eq('id', firmId).single(),
      supabase.from('clients').select('*').eq('firm_id', firmId).order('name'),
      supabase.from('task_types').select('*').eq('firm_id', firmId).order('name'),
      supabase.from('users').select('*').eq('firm_id', firmId).neq('role', 'admin'),
    ])

    const f = firmData as Firm
    setFirm(f)
    setBillingIncrement(f?.billing_increment?.toString() ?? '0.1')
    setClients((clientsData as Client[]) ?? [])
    setTaskTypes((taskTypesData as TaskType[]) ?? [])
    setLawyers((lawyersData as User[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  function flash(msg: string, isError = false) {
    if (isError) { setError(msg); setTimeout(() => setError(null), 4000) }
    else { setSuccess(msg); setTimeout(() => setSuccess(null), 3000) }
  }

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault()
    if (!newClientName.trim() || !firm) return
    setSaving(true)
    const { error } = await supabase.from('clients').insert({ firm_id: firm.id, name: newClientName.trim() })
    if (error) flash(error.message, true)
    else { flash('Client added'); setNewClientName('') }
    await loadData()
    setSaving(false)
  }

  async function handleToggleClient(id: string, current: boolean) {
    await supabase.from('clients').update({ is_active: !current }).eq('id', id)
    await loadData()
  }

  async function handleAddTaskType(e: React.FormEvent) {
    e.preventDefault()
    if (!newTaskName.trim() || !firm) return
    setSaving(true)
    const { error } = await supabase.from('task_types').insert({ firm_id: firm.id, name: newTaskName.trim() })
    if (error) flash(error.message, true)
    else { flash('Task type added'); setNewTaskName('') }
    await loadData()
    setSaving(false)
  }

  async function handleToggleTaskType(id: string, current: boolean) {
    await supabase.from('task_types').update({ is_active: !current }).eq('id', id)
    await loadData()
  }

  async function handleInviteLawyer(e: React.FormEvent) {
    e.preventDefault()
    if (!newLawyerEmail.trim() || !newLawyerName.trim() || !firm) return
    setSaving(true)
    const { error } = await inviteLawyer(newLawyerEmail.trim(), newLawyerName.trim(), firm.id)
    if (error) flash(error, true)
    else {
      flash(`Invite sent to ${newLawyerEmail}`)
      setNewLawyerEmail('')
      setNewLawyerName('')
      await loadData()
    }
    setSaving(false)
  }

  async function handleSaveBillingIncrement(e: React.FormEvent) {
    e.preventDefault()
    if (!firm) return
    setSaving(true)
    const { error } = await supabase
      .from('firms')
      .update({ billing_increment: parseFloat(billingIncrement) })
      .eq('id', firm.id)
    if (error) flash(error.message, true)
    else flash('Billing increment saved')
    setSaving(false)
  }

  const inputClass = "flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white/30 focus:border-transparent transition"
  const btnPrimary = "bg-gray-950 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-950 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition whitespace-nowrap"

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-gray-200 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar userName={user?.full_name} role={user?.role} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your firm setup</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm">{error}</div>
        )}
        {success && (
          <div className="mb-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-700 dark:text-emerald-400 text-sm">{success}</div>
        )}

        <div className="space-y-6">
          {/* Appearance */}
          <Section title="Appearance">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Color theme</p>
                <p className="text-xs text-gray-400 mt-0.5">Choose between light and dark mode</p>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white/30 focus:ring-offset-2 ${
                  theme === 'dark' ? 'bg-gray-950 dark:bg-white' : 'bg-gray-200'
                }`}
                aria-label="Toggle dark mode"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                    theme === 'dark'
                      ? 'translate-x-6 bg-white dark:bg-gray-950'
                      : 'translate-x-1 bg-white'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Currently: <span className="font-medium text-gray-600 dark:text-gray-300">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
            </p>
          </Section>

          {/* Billing increment */}
          <Section title="Billing increment">
            <form onSubmit={handleSaveBillingIncrement} className="flex items-center gap-3">
              <select
                value={billingIncrement}
                onChange={(e) => setBillingIncrement(e.target.value)}
                className={inputClass}
              >
                <option value="0.1">0.1 hour (6-minute increments)</option>
                <option value="0.25">0.25 hour (15-minute increments)</option>
                <option value="0.5">0.5 hour (30-minute increments)</option>
                <option value="1">1.0 hour increments</option>
              </select>
              <button type="submit" disabled={saving} className={btnPrimary}>Save</button>
            </form>
          </Section>

          {/* Clients */}
          <Section title="Clients / Matters">
            <form onSubmit={handleAddClient} className="flex gap-3 mb-5">
              <input
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Client or matter name"
                className={inputClass}
              />
              <button type="submit" disabled={saving || !newClientName.trim()} className={btnPrimary}>Add</button>
            </form>

            <div className="space-y-2">
              {clients.length === 0 && (
                <p className="text-sm text-gray-400">No clients yet.</p>
              )}
              {clients.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span className={`text-sm ${c.is_active ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-600 line-through'}`}>
                    {c.name}
                  </span>
                  <button
                    onClick={() => handleToggleClient(c.id, c.is_active)}
                    className={`text-xs px-3 py-1 rounded-full border font-medium transition ${
                      c.is_active
                        ? 'text-gray-400 border-gray-200 dark:border-gray-700 hover:text-red-600 hover:border-red-200 dark:hover:border-red-500/30'
                        : 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                    }`}
                  >
                    {c.is_active ? 'Deactivate' : 'Reactivate'}
                  </button>
                </div>
              ))}
            </div>
          </Section>

          {/* Task types */}
          <Section title="Task types">
            <form onSubmit={handleAddTaskType} className="flex gap-3 mb-5">
              <input
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="New task type"
                className={inputClass}
              />
              <button type="submit" disabled={saving || !newTaskName.trim()} className={btnPrimary}>Add</button>
            </form>

            <div className="space-y-2">
              {taskTypes.length === 0 && (
                <p className="text-sm text-gray-400">No custom task types. Global defaults apply.</p>
              )}
              {taskTypes.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span className={`text-sm ${t.is_active ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-600 line-through'}`}>
                    {t.name}
                  </span>
                  <button
                    onClick={() => handleToggleTaskType(t.id, t.is_active)}
                    className={`text-xs px-3 py-1 rounded-full border font-medium transition ${
                      t.is_active
                        ? 'text-gray-400 border-gray-200 dark:border-gray-700 hover:text-red-600 hover:border-red-200 dark:hover:border-red-500/30'
                        : 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                    }`}
                  >
                    {t.is_active ? 'Deactivate' : 'Reactivate'}
                  </button>
                </div>
              ))}
            </div>
          </Section>

          {/* Team */}
          <Section title="Team">
            <div className="space-y-3 mb-5">
              {lawyers.length === 0 && (
                <p className="text-sm text-gray-400">No lawyers yet.</p>
              )}
              {lawyers.map((l) => (
                <div key={l.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                      {l.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{l.full_name}</div>
                    <div className="text-xs text-gray-400 capitalize">{l.role}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Invite lawyer</p>
              <form onSubmit={handleInviteLawyer} className="space-y-3">
                <div className="flex gap-3">
                  <input
                    value={newLawyerName}
                    onChange={(e) => setNewLawyerName(e.target.value)}
                    placeholder="Full name"
                    className={inputClass}
                  />
                  <input
                    value={newLawyerEmail}
                    onChange={(e) => setNewLawyerEmail(e.target.value)}
                    type="email"
                    placeholder="Email"
                    className={inputClass}
                  />
                </div>
                <button type="submit" disabled={saving} className={`${btnPrimary} w-full`}>
                  Send invite
                </button>
              </form>
            </div>
          </Section>
        </div>
      </main>
    </div>
  )
}
