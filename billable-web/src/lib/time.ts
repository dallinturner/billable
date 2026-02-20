/**
 * Round minutes up to the nearest billing increment.
 * e.g. 13 minutes at 0.1hr (6 min) increments → ceil(13/6)*0.1 = 0.3 hours
 */
export function roundToBillingIncrement(
  exactMinutes: number,
  incrementHours: number
): number {
  const incrementMinutes = incrementHours * 60
  const increments = Math.ceil(exactMinutes / incrementMinutes)
  return Math.round(increments * incrementHours * 10) / 10
}

/**
 * Format a duration in minutes to "Xh Ym" or "Ym" string.
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

/**
 * Format elapsed seconds to "H:MM:SS".
 */
export function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Group time entries by date (YYYY-MM-DD).
 */
export function groupByDate<T extends { started_at: string }>(
  entries: T[]
): Record<string, T[]> {
  return entries.reduce((acc, entry) => {
    const date = entry.started_at.split('T')[0]
    if (!acc[date]) acc[date] = []
    acc[date].push(entry)
    return acc
  }, {} as Record<string, T[]>)
}

/**
 * Format a date string as "Monday, February 19, 2026"
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
