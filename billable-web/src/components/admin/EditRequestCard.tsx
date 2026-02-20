'use client'

import type { EditRequest } from '@/types/database'

interface EditRequestCardProps {
  request: EditRequest
  onApprove: (id: string) => Promise<void>
  onDeny: (id: string) => Promise<void>
}

export default function EditRequestCard({ request, onApprove, onDeny }: EditRequestCardProps) {
  const entry = request.time_entry

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-4">
            <span className="font-semibold text-gray-900 dark:text-white text-sm">
              {entry?.user?.full_name ?? 'Unknown'}
            </span>
            <span className="text-gray-300 dark:text-gray-700">·</span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">{entry?.client?.name ?? '—'}</span>
            <span className="text-xs bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-full">
              Pending
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Current</div>
              <div className="space-y-1 text-gray-500 dark:text-gray-400">
                <div><span className="text-gray-400 dark:text-gray-500">Task: </span>{entry?.task_type?.name ?? '—'}</div>
                <div><span className="text-gray-400 dark:text-gray-500">Duration: </span>{entry?.billable_duration ? `${entry.billable_duration} hrs` : '—'}</div>
                {entry?.notes && <div><span className="text-gray-400 dark:text-gray-500">Notes: </span>{entry.notes}</div>}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Proposed</div>
              <div className="space-y-1 text-gray-900 dark:text-gray-200">
                <div><span className="text-gray-400 dark:text-gray-500">Task: </span>{request.proposed_task_type?.name ?? '—'}</div>
                <div><span className="text-gray-400 dark:text-gray-500">Duration: </span>{request.proposed_duration ? `${request.proposed_duration} hrs` : '—'}</div>
                {request.proposed_notes && <div><span className="text-gray-400 dark:text-gray-500">Notes: </span>{request.proposed_notes}</div>}
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-300 dark:text-gray-600 mt-4">
            Requested {new Date(request.created_at).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric'
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2 flex-shrink-0">
          <button
            onClick={() => onApprove(request.id)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
          >
            Approve
          </button>
          <button
            onClick={() => onDeny(request.id)}
            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 text-xs font-semibold px-4 py-2 rounded-lg transition"
          >
            Deny
          </button>
        </div>
      </div>
    </div>
  )
}
