export type UserRole = 'admin' | 'lawyer' | 'individual'
export type EntryStatus = 'draft' | 'submitted'
export type EditRequestStatus = 'pending' | 'approved' | 'denied'

export interface Firm {
  id: string
  name: string
  billing_increment: number
  created_at: string
}

export interface User {
  id: string
  firm_id: string | null
  full_name: string
  role: UserRole
  created_at: string
}

export interface Client {
  id: string
  firm_id: string
  name: string
  is_active: boolean
  created_at: string
}

export interface TaskType {
  id: string
  firm_id: string | null
  name: string
  is_active: boolean
}

export interface TimeEntry {
  id: string
  user_id: string
  client_id: string
  task_type_id: string | null
  started_at: string
  ended_at: string | null
  exact_duration_minutes: number | null
  billable_duration: number | null
  notes: string | null
  status: EntryStatus
  created_at: string
  // joined fields
  client?: Client
  task_type?: TaskType
  user?: User
}

export interface EditRequest {
  id: string
  time_entry_id: string
  requested_by: string
  proposed_notes: string | null
  proposed_duration: number | null
  proposed_task_type_id: string | null
  status: EditRequestStatus
  created_at: string
  // joined fields
  time_entry?: TimeEntry
  proposed_task_type?: TaskType
}
