'use client'

import type { Client, TaskType, User } from '@/types/database'

export interface Filters {
  lawyerId: string
  clientId: string
  taskTypeId: string
  dateFrom: string
  dateTo: string
}

interface FilterBarProps {
  filters: Filters
  lawyers: User[]
  clients: Client[]
  taskTypes: TaskType[]
  onChange: (filters: Filters) => void
}

export default function FilterBar({ filters, lawyers, clients, taskTypes, onChange }: FilterBarProps) {
  function update(key: keyof Filters, value: string) {
    onChange({ ...filters, [key]: value })
  }

  const selectClass = "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white/30 focus:border-transparent min-w-[140px]"

  const hasFilters = filters.lawyerId || filters.clientId || filters.taskTypeId || filters.dateFrom || filters.dateTo

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <select value={filters.lawyerId} onChange={(e) => update('lawyerId', e.target.value)} className={selectClass}>
        <option value="">All lawyers</option>
        {lawyers.map((l) => (
          <option key={l.id} value={l.id}>{l.full_name}</option>
        ))}
      </select>

      <select value={filters.clientId} onChange={(e) => update('clientId', e.target.value)} className={selectClass}>
        <option value="">All clients</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <select value={filters.taskTypeId} onChange={(e) => update('taskTypeId', e.target.value)} className={selectClass}>
        <option value="">All task types</option>
        {taskTypes.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>

      <input
        type="date"
        value={filters.dateFrom}
        onChange={(e) => update('dateFrom', e.target.value)}
        className={selectClass}
      />

      <input
        type="date"
        value={filters.dateTo}
        onChange={(e) => update('dateTo', e.target.value)}
        className={selectClass}
      />

      {hasFilters && (
        <button
          onClick={() => onChange({ lawyerId: '', clientId: '', taskTypeId: '', dateFrom: '', dateTo: '' })}
          className="text-sm text-gray-400 hover:text-gray-900 dark:hover:text-white transition font-medium"
        >
          Clear
        </button>
      )}
    </div>
  )
}
