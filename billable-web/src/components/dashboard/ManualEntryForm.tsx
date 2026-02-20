'use client'

import { useState } from 'react'
import type { Client, TaskType } from '@/types/database'

interface ManualEntryFormProps {
  clients: Client[]
  taskTypes: TaskType[]
  billingIncrement: number
  onSave: (entry: {
    client_id: string
    task_type_id: string
    started_at: string
    ended_at: string
    notes: string
  }) => Promise<void>
  onCancel: () => void
}

export default function ManualEntryForm({
  clients,
  taskTypes,
  onSave,
  onCancel,
}: ManualEntryFormProps) {
  const now = new Date()
  const localDate = now.toISOString().split('T')[0]
  const localTime = now.toTimeString().slice(0, 5)

  const [clientId, setClientId] = useState(clients[0]?.id ?? '')
  const [taskTypeId, setTaskTypeId] = useState(taskTypes[0]?.id ?? '')
  const [date, setDate] = useState(localDate)
  const [startTime, setStartTime] = useState(localTime)
  const [endTime, setEndTime] = useState(localTime)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const startedAt = new Date(`${date}T${startTime}`).toISOString()
    const endedAt = new Date(`${date}T${endTime}`).toISOString()

    if (new Date(endedAt) <= new Date(startedAt)) {
      setError('End time must be after start time.')
      return
    }

    setSaving(true)
    setError(null)
    await onSave({ client_id: clientId, task_type_id: taskTypeId, started_at: startedAt, ended_at: endedAt, notes })
    setSaving(false)
  }

  const inputClass = "w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white/30 focus:border-transparent transition"

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md shadow-xl">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Add manual entry</h2>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Client / Matter</label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} required className={inputClass}>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Task type</label>
            <select value={taskTypeId} onChange={(e) => setTaskTypeId(e.target.value)} className={inputClass}>
              {taskTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Start time</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">End time</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="What did you work on?"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-4 py-3 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold py-2.5 rounded-lg transition border border-gray-200 dark:border-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gray-950 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-950 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition"
            >
              {saving ? 'Saving…' : 'Add entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
