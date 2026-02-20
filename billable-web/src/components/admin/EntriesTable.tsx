'use client'

import { formatDuration } from '@/lib/time'
import type { TimeEntry } from '@/types/database'

interface EntriesTableProps {
  entries: TimeEntry[]
}

export default function EntriesTable({ entries }: EntriesTableProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-16 text-gray-300 dark:text-gray-700 text-sm">
        No submitted entries match your filters.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-gray-100 dark:border-gray-800">
            <th className="pb-3 pr-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Date</th>
            <th className="pb-3 pr-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Lawyer</th>
            <th className="pb-3 pr-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Client</th>
            <th className="pb-3 pr-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Task type</th>
            <th className="pb-3 pr-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Notes</th>
            <th className="pb-3 pr-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Exact</th>
            <th className="pb-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Billable</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {entries.map((entry) => {
            const date = new Date(entry.started_at).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric'
            })
            return (
              <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                <td className="py-3 pr-4 text-gray-400 whitespace-nowrap">{date}</td>
                <td className="py-3 pr-4 text-gray-900 dark:text-white font-medium whitespace-nowrap">
                  {entry.user?.full_name ?? '—'}
                </td>
                <td className="py-3 pr-4 text-gray-900 dark:text-white">{entry.client?.name ?? '—'}</td>
                <td className="py-3 pr-4">
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">
                    {entry.task_type?.name ?? 'None'}
                  </span>
                </td>
                <td className="py-3 pr-4 text-gray-400 max-w-xs">
                  <span className="truncate block text-xs">{entry.notes ?? '—'}</span>
                </td>
                <td className="py-3 pr-4 text-gray-400 text-right whitespace-nowrap text-xs">
                  {entry.exact_duration_minutes != null ? formatDuration(entry.exact_duration_minutes) : '—'}
                </td>
                <td className="py-3 text-gray-900 dark:text-white font-semibold text-right whitespace-nowrap">
                  {entry.billable_duration != null ? `${entry.billable_duration} hrs` : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-gray-200 dark:border-gray-700">
            <td colSpan={5} className="pt-3 text-xs text-gray-400">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </td>
            <td className="pt-3 text-right text-gray-400 text-xs">
              {entries.reduce((s, e) => s + (e.exact_duration_minutes ?? 0), 0).toFixed(0)}m
            </td>
            <td className="pt-3 text-right text-gray-900 dark:text-white font-bold text-sm">
              {entries.reduce((s, e) => s + (e.billable_duration ?? 0), 0).toFixed(1)} hrs
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
