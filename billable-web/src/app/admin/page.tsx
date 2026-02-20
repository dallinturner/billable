'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import FilterBar, { type Filters } from '@/components/admin/FilterBar'
import EntriesTable from '@/components/admin/EntriesTable'
import EditRequestCard from '@/components/admin/EditRequestCard'
import type { Client, TaskType, TimeEntry, User, Firm, EditRequest } from '@/types/database'

export default function AdminPage() {
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [firm, setFirm] = useState<Firm | null>(null)
  const [lawyers, setLawyers] = useState<User[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([])
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [editRequests, setEditRequests] = useState<EditRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'entries' | 'requests'>('entries')

  const [filters, setFilters] = useState<Filters>({
    lawyerId: '',
    clientId: '',
    taskTypeId: '',
    dateFrom: '',
    dateTo: '',
  })

  const loadData = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (!profile) return
    setUser(profile as User)

    const firmId = profile.firm_id

    const { data: lawyersData } = await supabase.from('users').select('*').eq('firm_id', firmId)
    const lawyerIds = ((lawyersData as User[]) ?? []).map((l) => l.id)

    const [
      { data: firmData },
      { data: clientsData },
      { data: taskTypesData },
      { data: entriesData },
      { data: editRequestsData },
    ] = await Promise.all([
      supabase.from('firms').select('*').eq('id', firmId).single(),
      supabase.from('clients').select('*').eq('firm_id', firmId),
      supabase.from('task_types').select('*').or(`firm_id.eq.${firmId},firm_id.is.null`).eq('is_active', true),
      lawyerIds.length > 0
        ? supabase
            .from('time_entries')
            .select('*, client:clients(*), task_type:task_types(*), user:users(*)')
            .eq('status', 'submitted')
            .in('user_id', lawyerIds)
            .order('started_at', { ascending: false })
        : Promise.resolve({ data: [] }),
      supabase
        .from('edit_requests')
        .select('*, time_entry:time_entries(*, client:clients(*), task_type:task_types(*), user:users(*)), proposed_task_type:task_types(*)')
        .eq('status', 'pending'),
    ])

    setFirm(firmData as Firm)
    setLawyers((lawyersData as User[]) ?? [])
    setClients((clientsData as Client[]) ?? [])
    setTaskTypes((taskTypesData as TaskType[]) ?? [])
    setEntries((entriesData as TimeEntry[]) ?? [])
    setEditRequests((editRequestsData as EditRequest[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  async function handleApproveRequest(requestId: string) {
    const req = editRequests.find((r) => r.id === requestId)
    if (!req) return

    const updates: Record<string, string | number | null> = {}
    if (req.proposed_notes !== null) updates.notes = req.proposed_notes
    if (req.proposed_duration !== null) updates.billable_duration = req.proposed_duration
    if (req.proposed_task_type_id !== null) updates.task_type_id = req.proposed_task_type_id

    await Promise.all([
      supabase.from('time_entries').update(updates).eq('id', req.time_entry_id),
      supabase.from('edit_requests').update({ status: 'approved' }).eq('id', requestId),
    ])

    await loadData()
  }

  async function handleDenyRequest(requestId: string) {
    await supabase.from('edit_requests').update({ status: 'denied' }).eq('id', requestId)
    await loadData()
  }

  const filteredEntries = entries.filter((e) => {
    if (filters.lawyerId && e.user_id !== filters.lawyerId) return false
    if (filters.clientId && e.client_id !== filters.clientId) return false
    if (filters.taskTypeId && e.task_type_id !== filters.taskTypeId) return false
    if (filters.dateFrom && e.started_at < filters.dateFrom) return false
    if (filters.dateTo && e.started_at > filters.dateTo + 'T23:59:59') return false
    return true
  })

  const totalBillable = filteredEntries.reduce((s, e) => s + (e.billable_duration ?? 0), 0)
  const pendingRequestCount = editRequests.length

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{firm?.name ?? 'Admin Dashboard'}</h1>
          <p className="text-sm text-gray-400 mt-0.5">Review and manage all submitted hours</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{filteredEntries.length}</div>
            <div className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-wider">Submitted entries</div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalBillable.toFixed(1)}</div>
            <div className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-wider">Billable hours</div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{lawyers.length}</div>
            <div className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-wider">Lawyers</div>
          </div>
          <div className={`border rounded-xl p-5 ${
            pendingRequestCount > 0
              ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
          }`}>
            <div className={`text-2xl font-bold ${pendingRequestCount > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
              {pendingRequestCount}
            </div>
            <div className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-wider">Edit requests</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800 mb-6">
          <button
            onClick={() => setActiveTab('entries')}
            className={`px-4 py-2.5 text-sm font-semibold transition border-b-2 -mb-px ${
              activeTab === 'entries'
                ? 'border-gray-950 dark:border-white text-gray-950 dark:text-white'
                : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Entries
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition border-b-2 -mb-px ${
              activeTab === 'requests'
                ? 'border-gray-950 dark:border-white text-gray-950 dark:text-white'
                : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Edit requests
            {pendingRequestCount > 0 && (
              <span className="bg-amber-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {pendingRequestCount}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'entries' && (
          <div className="space-y-4">
            <FilterBar
              filters={filters}
              lawyers={lawyers.filter(l => l.role !== 'admin')}
              clients={clients}
              taskTypes={taskTypes}
              onChange={setFilters}
            />
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <EntriesTable entries={filteredEntries} />
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-3">
            {editRequests.length === 0 ? (
              <div className="text-center py-16 text-gray-300 dark:text-gray-700 text-sm">
                No pending edit requests.
              </div>
            ) : (
              editRequests.map((req) => (
                <EditRequestCard
                  key={req.id}
                  request={req}
                  onApprove={handleApproveRequest}
                  onDeny={handleDenyRequest}
                />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
