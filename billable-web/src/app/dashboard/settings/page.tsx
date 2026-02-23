'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { useTheme } from '@/components/ThemeProvider'
import type { User } from '@/types/database'

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </section>
  )
}

export default function DashboardSettingsPage() {
  const supabase = createClient()
  const { theme, toggleTheme } = useTheme()

  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
    if (!profile) return

    setUser(profile as User)
    setFullName((profile as User).full_name ?? '')
    setEmail(authUser.email ?? null)
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  function flash(msg: string, isError = false) {
    if (isError) { setError(msg); setTimeout(() => setError(null), 4000) }
    else { setSuccess(msg); setTimeout(() => setSuccess(null), 3000) }
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim() || !user) return
    setSaving(true)
    const { error } = await supabase.from('users').update({ full_name: fullName.trim() }).eq('id', user.id)
    if (error) flash(error.message, true)
    else { flash('Name updated'); await loadData() }
    setSaving(false)
  }

  const inputClass = "w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white/30 focus:border-transparent transition"
  const btnPrimary = "bg-gray-950 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-950 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-gray-200 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar userName={user?.full_name} role="individual" />

      {/* Toast notifications */}
      {(error || success) && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
          {error && (
            <div className="bg-red-50 dark:bg-gray-900 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm shadow-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-700 dark:text-emerald-400 text-sm shadow-lg">
              {success}
            </div>
          )}
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your account preferences</p>
        </div>

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

          {/* Profile */}
          <Section title="Profile" description="Update your display name">
            <form onSubmit={handleSaveName} className="flex gap-3">
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className={inputClass}
              />
              <button type="submit" disabled={saving || !fullName.trim()} className={btnPrimary}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </form>
            {email && (
              <p className="text-xs text-gray-400 mt-3">
                Signed in as <span className="font-medium text-gray-600 dark:text-gray-300">{email}</span>
              </p>
            )}
          </Section>
        </div>
      </main>
    </div>
  )
}
