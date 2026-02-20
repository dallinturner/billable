'use client'

import { useState } from 'react'
import type { TimeEntry, TaskType } from '@/types/database'
import { formatDuration } from '@/lib/time'

interface EditRequestModalProps {
  entry: TimeEntry
  taskTypes: TaskType[]
  onSubmit: (entryId: string, proposed: {
    proposed_notes: string
    proposed_duration: number | null
    proposed_task_type_id: string | null
  }) => Promise<void>
  onCancel: () => void
}

export default function EditRequestModal({ entry, taskTypes, onSubmit, onCancel }: EditRequestModalProps) {
  const [notes, setNotes] = useState(entry.notes ?? '')
  const [taskTypeId, setTaskTypeId] = useState(entry.task_type_id ?? '')
  const [duration, setDuration] = useState(entry.billable_duration?.toString() ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSubmit(entry.id, {
      proposed_notes: notes,
      proposed_duration: duration ? parseFloat(duration) : null,
      proposed_task_type_id: taskTypeId || null,
    })
    setSaving(false)
  }

  const inputClass = "w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white/30 focus:border-transparent transition"

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md shadow-xl">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Request edit</h2>
          <p className="text-xs text-gray-400 mt-0.5">Changes will be sent to your admin for approval.</p>
        </div>

        {/* Current values */}
        <div className="mx-6 mt-5 bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 space-y-1.5">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Current values</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <span className="text-gray-400 dark:text-gray-500">Task: </span>{entry.task_type?.name ?? '—'}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <span className="text-gray-400 dark:text-gray-500">Duration: </span>
            {entry.billable_duration ? `${entry.billable_duration} hrs` : '—'}
            {entry.exact_duration_minutes ? ` (${formatDuration(entry.exact_duration_minutes)} exact)` : ''}
          </div>
          {entry.notes && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <span className="text-gray-400 dark:text-gray-500">Notes: </span>{entry.notes}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Proposed task type</label>
            <select value={taskTypeId} onChange={(e) => setTaskTypeId(e.target.value)} className={inputClass}>
              <option value="">No change</option>
              {taskTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Proposed billable hours
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className={inputClass}
              placeholder="Leave blank to keep current"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Proposed notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

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
              {saving ? 'Submitting…' : 'Submit request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
