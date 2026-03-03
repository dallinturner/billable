'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { roundToBillingIncrement } from '@/lib/time'
import type { Client, TaskType, Firm } from '@/types/database'

export async function getRecordData(clientId: string): Promise<{
  client: Client | null
  firm: Firm | null
  taskTypes: TaskType[]
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { client: null, firm: null, taskTypes: [], error: 'Not signed in.' }

  const { data: profile } = await supabase.from('users').select('firm_id').eq('id', user.id).single()
  if (!profile?.firm_id) return { client: null, firm: null, taskTypes: [], error: `Profile not found. uid=${user.id}` }

  // Use admin client to bypass RLS for the initial data load —
  // the user is already authenticated above; we validate firm ownership below.
  const admin = createAdminClient()

  const [{ data: clientData }, { data: firmData }, { data: taskTypesData }] = await Promise.all([
    admin.from('clients').select('*').eq('id', clientId).single(),
    admin.from('firms').select('*').eq('id', profile.firm_id).single(),
    admin.from('task_types').select('*').or(`firm_id.eq.${profile.firm_id},firm_id.is.null`).eq('is_active', true),
  ])

  if (!clientData) return { client: null, firm: null, taskTypes: [], error: `Client not found. uid=${user.id} firm=${profile.firm_id} clientId=${clientId}` }

  // Validate the client belongs to this user's firm
  if ((clientData as Client).firm_id !== profile.firm_id) {
    return { client: null, firm: null, taskTypes: [], error: 'Not authorized.' }
  }

  return {
    client: clientData as Client,
    firm: firmData as Firm,
    taskTypes: (taskTypesData as TaskType[]) ?? [],
    error: null,
  }
}

// ─── Entry-based flow (used by extension popup window) ────────────────────────
// The extension creates the time entry with its own auth, then passes ?entry=ID
// to the /record page. These server actions use the admin client so they work
// regardless of which user is logged in on the browser.

export async function getRecordDataByEntry(entryId: string): Promise<{
  client: Client | null
  firm: Firm | null
  taskTypes: TaskType[]
  startedAt: string | null
  error: string | null
}> {
  const admin = createAdminClient()

  const { data: entry } = await admin
    .from('time_entries')
    .select('client_id, started_at, user_id')
    .eq('id', entryId)
    .single()

  if (!entry) return { client: null, firm: null, taskTypes: [], startedAt: null, error: 'Entry not found.' }

  const { data: userProfile } = await admin
    .from('users')
    .select('firm_id')
    .eq('id', entry.user_id)
    .single()

  if (!userProfile?.firm_id) return { client: null, firm: null, taskTypes: [], startedAt: null, error: 'User profile not found.' }

  const [{ data: clientData }, { data: firmData }, { data: taskTypesData }] = await Promise.all([
    admin.from('clients').select('*').eq('id', entry.client_id).single(),
    admin.from('firms').select('*').eq('id', userProfile.firm_id).single(),
    admin.from('task_types').select('*').or(`firm_id.eq.${userProfile.firm_id},firm_id.is.null`).eq('is_active', true),
  ])

  if (!clientData) return { client: null, firm: null, taskTypes: [], startedAt: null, error: 'Client not found.' }

  return {
    client: clientData as Client,
    firm: firmData as Firm,
    taskTypes: (taskTypesData as TaskType[]) ?? [],
    startedAt: entry.started_at,
    error: null,
  }
}

export async function saveRecordEntry(
  entryId: string,
  startedAt: string,
  billingIncrement: number,
  notes: string,
  taskTypeId: string,
): Promise<{ error: string | null }> {
  const admin = createAdminClient()
  const endedAt = new Date().toISOString()
  const exactMinutes = (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000
  const billable = roundToBillingIncrement(exactMinutes, billingIncrement)

  const { error } = await admin
    .from('time_entries')
    .update({
      ended_at: endedAt,
      exact_duration_minutes: exactMinutes,
      billable_duration: billable,
      notes,
      task_type_id: taskTypeId || null,
    })
    .eq('id', entryId)

  return { error: error?.message ?? null }
}

export async function deleteRecordEntry(entryId: string): Promise<void> {
  const admin = createAdminClient()
  await admin.from('time_entries').delete().eq('id', entryId)
}
