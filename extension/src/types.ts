export interface TimerState {
  clientId: string
  clientName: string
  entryId: string
  startedAt: string // ISO string
}

export interface Client {
  id: string
  name: string
  is_active: boolean
}

export interface TaskType {
  id: string
  name: string
}

export interface Firm {
  id: string
  billing_increment: number
}
