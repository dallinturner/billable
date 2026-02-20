'use client'

import { useState } from 'react'
import { formatDuration } from '@/lib/time'
import type { TimeEntry, TaskType } from '@/types/database'

interface TimeEntryRowProps {
  entry: TimeEntry
  taskTypes: TaskType[]
  billingIncrement: number
  onUpdate: (id: string, updates: Partial<TimeEntry>) => Promise<void>
  onRequestEdit: (entry: TimeEntry) => void
}

export default function TimeEntryRow({
  entry,
  taskTypes,
  billingIncrement: _billingIncrement,
  onUpdate,
  onRequestEdit,
}: TimeEntryRowProps) {
  const [editing, setEditing] = useState(false)
  const [notes, setNotes] = useState(entry.notes ?? '')
  const [taskTypeId, setTaskTypeId] = useState(entry.task_type_id ?? '')
  const [saving, setSaving] = useState(false)

  const isDraft = entry.status === 'draft'

  async function handleSave() {
    setSaving(true)
    await onUpdate(entry.id, {
      notes,
      task_type_id: taskTypeId || null,
    })
    setSaving(false)
    setEditing(false)
  }

  const startTime = new Date(entry.started_at).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  const endTime = entry.ended_at
    ? new Date(entry.ended_at).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : null

  const exactMins = entry.exact_duration_minutes
  const billable = entry.billable_duration

  const inputClass = "w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white/30 focus:border-transparent"

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Client + task type + status */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 dark:text-white text-sm">{entry.client?.name ?? '—'}</span>
            {!editing && (
              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">
                {entry.task_type?.name ?? 'No task type'}
              </span>
            )}
            {entry.status === 'submitted' ? (
              <span className="text-xs bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full">
                Submitted
              </span>
            ) : (
              <span className="text-xs bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-full">
                Draft
              </span>
            )}
          </div>

          {/* Time info */}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 dark:text-gray-500">
            <span>{startTime}{endTime ? ` – ${endTime}` : ''}</span>
            {exactMins != null && <span>{formatDuration(exactMins)} exact</span>}
            {billable != null && (
              <span className="text-gray-900 dark:text-white font-semibold">{billable} hrs billed</span>
            )}
          </div>

          {/* Notes or edit form */}
          {editing ? (
            <div className="mt-3 space-y-2">
              <select value={taskTypeId} onChange={(e) => setTaskTypeId(e.target.value)} className={inputClass}>
                <option value="">No task type</option>
                {taskTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder="Notes…"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-xs bg-gray-950 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-950 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="text-xs bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg transition border border-gray-200 dark:border-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            entry.notes && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{entry.notes}</p>
            )
          )}
        </div>

        {/* Actions */}
        {!editing && (
          <div className="flex-shrink-0">
            {isDraft ? (
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-gray-400 hover:text-gray-900 dark:hover:text-white transition font-medium"
              >
                Edit
              </button>
            ) : (
              <button
                onClick={() => onRequestEdit(entry)}
                className="text-xs text-gray-400 hover:text-gray-900 dark:hover:text-white transition font-medium"
              >
                Request edit
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
