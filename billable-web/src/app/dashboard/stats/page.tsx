'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import type { TimeEntry, User } from '@/types/database'

type Range = 'week' | 'month' | '3months' | 'all'

function getRangeStart(range: Range): Date | null {
  const now = new Date()
  if (range === 'week') {
    const d = new Date(now)
    d.setDate(d.getDate() - d.getDay())
    d.setHours(0, 0, 0, 0)
    return d
  }
  if (range === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }
  if (range === '3months') {
    return new Date(now.getFullYear(), now.getMonth() - 3, 1)
  }
  return null
}

export default function StatsPage() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<Range>('month')

  const loadData = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
    if (!profile) return
    setUser(profile as User)

    const { data: entriesData } = await supabase
      .from('time_entries')
      .select('*, client:clients(*), task_type:task_types(*)')
      .eq('user_id', authUser.id)
      .not('ended_at', 'is', null)
      .order('started_at', { ascending: true })

    setEntries((entriesData as TimeEntry[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  const rangeStart = getRangeStart(range)
  const filtered = entries.filter(e =>
    rangeStart ? new Date(e.started_at) >= rangeStart : true
  )

  const totalHours = filtered.reduce((sum, e) => sum + (e.billable_duration ?? 0), 0)
  const totalEntries = filtered.length
  const uniqueClients = new Set(filtered.map(e => e.client_id)).size

  // Hours by client
  const byClient: Record<string, number> = {}
  for (const e of filtered) {
    const name = (e.client as { name: string } | undefined)?.name ?? 'Unknown'
    byClient[name] = (byClient[name] ?? 0) + (e.billable_duration ?? 0)
  }
  const clientRows = Object.entries(byClient).sort((a, b) => b[1] - a[1])
  const maxClientHours = clientRows[0]?.[1] ?? 1

  // Hours by task type
  const byTask: Record<string, number> = {}
  for (const e of filtered) {
    const name = (e.task_type as { name: string } | undefined)?.name ?? 'Uncategorized'
    byTask[name] = (byTask[name] ?? 0) + (e.billable_duration ?? 0)
  }
  const taskRows = Object.entries(byTask).sort((a, b) => b[1] - a[1])
  const maxTaskHours = taskRows[0]?.[1] ?? 1

  // Last 8 weeks
  const weeklyData = Array.from({ length: 8 }, (_, i) => {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() - (7 - i) * 7)
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)
    const hours = entries
      .filter(e => {
        const d = new Date(e.started_at)
        return d >= weekStart && d < weekEnd
      })
      .reduce((sum, e) => sum + (e.billable_duration ?? 0), 0)
    const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const isCurrentWeek = i === 7
    return { label, hours, isCurrentWeek }
  })
  const maxWeeklyHours = Math.max(...weeklyData.map(w => w.hours), 0.1)

  const rangeOptions: { value: Range; label: string }[] = [
    { value: 'week', label: 'This week' },
    { value: 'month', label: 'This month' },
    { value: '3months', label: '3 months' },
    { value: 'all', label: 'All time' },
  ]

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

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Stats</h1>
            <p className="text-sm text-gray-400 mt-0.5">Your billable hours at a glance</p>
          </div>
          <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-1">
            {rangeOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={`text-xs font-medium px-3 py-1.5 rounded-md transition ${
                  range === opt.value
                    ? 'bg-gray-950 dark:bg-white text-white dark:text-gray-950'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Billed</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalHours.toFixed(1)}</p>
            <p className="text-xs text-gray-400 mt-0.5">hours</p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Entries</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalEntries}</p>
            <p className="text-xs text-gray-400 mt-0.5">sessions</p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Clients</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{uniqueClients}</p>
            <p className="text-xs text-gray-400 mt-0.5">active</p>
          </div>
        </div>

        {/* Weekly chart */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 mb-6">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-5">Weekly hours (last 8 weeks)</p>
          <div className="flex items-end gap-2" style={{ height: '96px' }}>
            {weeklyData.map((w, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
                  <div
                    className={`w-full rounded-sm transition-all ${
                      w.isCurrentWeek
                        ? 'bg-gray-950 dark:bg-white'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                    style={{ height: `${Math.max((w.hours / maxWeeklyHours) * 80, w.hours > 0 ? 3 : 0)}px` }}
                    title={`${w.label}: ${w.hours.toFixed(1)} hrs`}
                  />
                </div>
                <span className="text-[9px] text-gray-400 leading-none whitespace-nowrap">{w.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hours by client */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Hours by client</p>
          </div>
          <div className="p-5">
            {clientRows.length === 0 ? (
              <p className="text-sm text-gray-400">No data for this period.</p>
            ) : (
              <div className="space-y-4">
                {clientRows.map(([name, hours]) => (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate mr-4">{name}</span>
                      <span className="text-sm text-gray-400 flex-shrink-0">{hours.toFixed(1)} hrs</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-950 dark:bg-white rounded-full transition-all"
                        style={{ width: `${(hours / maxClientHours) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Hours by task type */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Hours by task type</p>
          </div>
          <div className="p-5">
            {taskRows.length === 0 ? (
              <p className="text-sm text-gray-400">No data for this period.</p>
            ) : (
              <div className="space-y-4">
                {taskRows.map(([name, hours]) => (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate mr-4">{name}</span>
                      <span className="text-sm text-gray-400 flex-shrink-0">{hours.toFixed(1)} hrs</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-950 dark:bg-white rounded-full transition-all"
                        style={{ width: `${(hours / maxTaskHours) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
