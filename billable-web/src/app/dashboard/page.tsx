'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import TimerCard from '@/components/dashboard/TimerCard'
import TimeEntryRow from '@/components/dashboard/TimeEntryRow'
import NotesModal from '@/components/dashboard/NotesModal'
import ManualEntryForm from '@/components/dashboard/ManualEntryForm'
import EditRequestModal from '@/components/dashboard/EditRequestModal'
import { roundToBillingIncrement, groupByDate, formatDate } from '@/lib/time'
import type { Client, TaskType, TimeEntry, User, Firm } from '@/types/database'

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

interface ActiveTimer {
  clientId: string
  startedAt: string
  entryId: string
}

export default function DashboardPage() {
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [firm, setFirm] = useState<Firm | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([])
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null)
  const [pendingEditEntryIds, setPendingEditEntryIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const [showNotesModal, setShowNotesModal] = useState(false)
  const [showManualForm, setShowManualForm] = useState(false)
  const [editRequestEntry, setEditRequestEntry] = useState<TimeEntry | null>(null)
  const [pendingStopEntryId, setPendingStopEntryId] = useState<string | null>(null)
  const [switchingTo, setSwitchingTo] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    const [{ data: profile }, { data: firmData }] = await Promise.all([
      supabase.from('users').select('*').eq('id', authUser.id).single(),
      supabase.from('firms').select('*'),
    ])

    if (!profile) return
    setUser(profile as User)

    const myFirm = (firmData as Firm[])?.find((f) => f.id === profile.firm_id)
    setFirm(myFirm ?? null)

    const [{ data: clientsData }, { data: taskTypesData }, { data: entriesData }, { data: editRequestsData }] = await Promise.all([
      supabase.from('clients').select('*').eq('firm_id', profile.firm_id).eq('is_active', true),
      supabase.from('task_types').select('*').or(`firm_id.eq.${profile.firm_id},firm_id.is.null`).eq('is_active', true),
      supabase
        .from('time_entries')
        .select('*, client:clients(*), task_type:task_types(*)')
        .eq('user_id', authUser.id)
        .order('started_at', { ascending: false }),
      supabase
        .from('edit_requests')
        .select('time_entry_id')
        .eq('requested_by', authUser.id)
        .eq('status', 'pending'),
    ])

    setClients((clientsData as Client[]) ?? [])
    setTaskTypes((taskTypesData as TaskType[]) ?? [])
    setEntries((entriesData as TimeEntry[]) ?? [])
    setPendingEditEntryIds(new Set((editRequestsData ?? []).map((r: { time_entry_id: string }) => r.time_entry_id)))

    const active = (entriesData as TimeEntry[])?.find((e) => !e.ended_at && e.status === 'draft')
    if (active) {
      setActiveTimer({ clientId: active.client_id, startedAt: active.started_at, entryId: active.id })
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  async function startTimer(clientId: string) {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    const { data: entry } = await supabase
      .from('time_entries')
      .insert({
        user_id: authUser.id,
        client_id: clientId,
        started_at: new Date().toISOString(),
        status: 'draft',
      })
      .select('id')
      .single()

    if (entry) {
      setActiveTimer({ clientId, startedAt: new Date().toISOString(), entryId: entry.id })
      await loadData()
    }
  }

  function handleStop() {
    setPendingStopEntryId(activeTimer?.entryId ?? null)
    setShowNotesModal(true)
  }

  function handleSwitch() {
    setPendingStopEntryId(activeTimer?.entryId ?? null)
    setShowNotesModal(true)
    setSwitchingTo('pick')
  }

  async function handleNotesSave(notes: string, taskTypeId: string) {
    if (!pendingStopEntryId || !activeTimer || !firm) return

    const endedAt = new Date().toISOString()
    const startMs = new Date(activeTimer.startedAt).getTime()
    const exactMinutes = (Date.now() - startMs) / 60000
    const billable = roundToBillingIncrement(exactMinutes, firm.billing_increment)

    await supabase
      .from('time_entries')
      .update({
        ended_at: endedAt,
        exact_duration_minutes: exactMinutes,
        billable_duration: billable,
        notes,
        task_type_id: taskTypeId || null,
      })
      .eq('id', pendingStopEntryId)

    setActiveTimer(null)
    setPendingStopEntryId(null)
    setShowNotesModal(false)
    setSwitchingTo(null)
    await loadData()
  }

  async function handleManualEntry(entry: {
    client_id: string
    task_type_id: string
    started_at: string
    ended_at: string
    notes: string
  }) {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser || !firm) return

    const exactMinutes = (new Date(entry.ended_at).getTime() - new Date(entry.started_at).getTime()) / 60000
    const billable = roundToBillingIncrement(exactMinutes, firm.billing_increment)

    await supabase.from('time_entries').insert({
      user_id: authUser.id,
      client_id: entry.client_id,
      task_type_id: entry.task_type_id || null,
      started_at: entry.started_at,
      ended_at: entry.ended_at,
      exact_duration_minutes: exactMinutes,
      billable_duration: billable,
      notes: entry.notes,
      status: 'draft',
    })

    setShowManualForm(false)
    await loadData()
  }

  async function handleUpdateEntry(id: string, updates: Partial<TimeEntry>) {
    await supabase.from('time_entries').update(updates).eq('id', id)
    await loadData()
  }

  async function handleSubmitDrafts() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    await supabase
      .from('time_entries')
      .update({ status: 'submitted' })
      .eq('user_id', authUser.id)
      .eq('status', 'draft')
      .not('ended_at', 'is', null)

    await loadData()
  }

  async function handleEditRequest(
    entryId: string,
    proposed: {
      proposed_notes: string
      proposed_duration: number | null
      proposed_task_type_id: string | null
    }
  ) {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    await supabase.from('edit_requests').insert({
      time_entry_id: entryId,
      requested_by: authUser.id,
      ...proposed,
    })

    setEditRequestEntry(null)
  }

  const activeClient = clients.find((c) => c.id === activeTimer?.clientId)
  const groupedEntries = groupByDate(entries.filter((e) => e.ended_at))
  const draftCount = entries.filter((e) => e.status === 'draft' && e.ended_at).length
  const totalBillable = entries
    .filter((e) => e.status === 'draft' && e.ended_at)
    .reduce((sum, e) => sum + (e.billable_duration ?? 0), 0)

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">My hours</h1>
            <p className="text-sm text-gray-400 mt-0.5">Track and manage your billable time</p>
          </div>
          <button
            onClick={() => setShowManualForm(true)}
            className="flex items-center gap-2 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium px-4 py-2 rounded-lg transition border border-gray-200 dark:border-gray-800"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add manually
          </button>
        </div>

        {/* Active timer */}
        {activeTimer && activeClient && (
          <div className="mb-6">
            <TimerCard
              client={activeClient}
              startedAt={activeTimer.startedAt}
              onStop={handleStop}
              onSwitch={handleSwitch}
            />
          </div>
        )}

        {/* Client picker */}
        {!activeTimer && clients.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Start a timer</p>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              {clients.map((client, i) => (
                <button
                  key={client.id}
                  onClick={() => startTimer(client.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-950 dark:hover:bg-gray-950 group transition-colors ${
                    i < clients.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''
                  }`}
                >
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 group-hover:bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                    <span className="text-[10px] font-bold text-gray-500 group-hover:text-white transition-colors">
                      {getInitials(client.name)}
                    </span>
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-white truncate transition-colors">
                    {client.name}
                  </span>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {clients.length === 0 && (
          <div className="mb-6 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 text-amber-700 dark:text-amber-400 text-sm">
            No clients found. Ask your admin to add clients/matters to get started.
          </div>
        )}

        {/* Submit bar */}
        {draftCount > 0 && (
          <div className="mb-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-gray-900 dark:text-white text-sm font-semibold">
                {draftCount} draft {draftCount === 1 ? 'entry' : 'entries'}
              </span>
              <span className="text-gray-400 text-sm"> · {totalBillable.toFixed(1)} hrs ready to submit</span>
            </div>
            <button
              onClick={handleSubmitDrafts}
              className="bg-gray-950 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-950 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              Submit all
            </button>
          </div>
        )}

        {/* Entries by date */}
        {Object.keys(groupedEntries).length === 0 ? (
          <div className="text-center py-16 text-gray-300 dark:text-gray-700">
            <svg className="w-10 h-10 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm text-gray-400">No time entries yet. Start a timer or add one manually.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedEntries).map(([date, dateEntries]) => (
              <div key={date}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  {formatDate(date)}
                </h3>
                <div className="space-y-2">
                  {dateEntries.map((entry) => (
                    <TimeEntryRow
                      key={entry.id}
                      entry={entry}
                      taskTypes={taskTypes}
                      billingIncrement={firm?.billing_increment ?? 0.1}
                      onUpdate={handleUpdateEntry}
                      onRequestEdit={setEditRequestEntry}
                      hasPendingEdit={pendingEditEntryIds.has(entry.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showNotesModal && (
        <NotesModal
          taskTypes={taskTypes}
          onSave={handleNotesSave}
          onCancel={() => {
            setShowNotesModal(false)
            setSwitchingTo(null)
          }}
          title={switchingTo ? 'Notes for current session' : 'Add notes before stopping'}
        />
      )}

      {showManualForm && (
        <ManualEntryForm
          clients={clients}
          taskTypes={taskTypes}
          billingIncrement={firm?.billing_increment ?? 0.1}
          onSave={handleManualEntry}
          onCancel={() => setShowManualForm(false)}
        />
      )}

      {editRequestEntry && (
        <EditRequestModal
          entry={editRequestEntry}
          taskTypes={taskTypes}
          onSubmit={handleEditRequest}
          onCancel={() => setEditRequestEntry(null)}
        />
      )}

      {switchingTo === 'pick-now' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Switch to which client?</h2>
            <div className="space-y-2">
              {clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => {
                    setSwitchingTo(null)
                    startTimer(client.id)
                  }}
                  className="w-full flex items-center gap-3 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-xl transition"
                >
                  <div className="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-gray-500">{getInitials(client.name)}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{client.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
