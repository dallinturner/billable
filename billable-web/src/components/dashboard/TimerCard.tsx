'use client'

import { useEffect, useState } from 'react'
import { formatElapsed } from '@/lib/time'
import type { Client } from '@/types/database'

interface TimerCardProps {
  client: Client
  startedAt: string
  onStop: () => void
  onSwitch: () => void
}

export default function TimerCard({ client, startedAt, onStop, onSwitch }: TimerCardProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = new Date(startedAt).getTime()
    const tick = () => {
      setElapsed(Math.floor((Date.now() - start) / 1000))
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [startedAt])

  return (
    <div className="bg-gray-950 rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Billing</p>
          <p className="text-sm font-semibold text-white">{client.name}</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          Live
        </span>
      </div>

      <div className="text-4xl font-mono font-bold text-white tabular-nums tracking-tight mb-6">
        {formatElapsed(elapsed)}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onStop}
          className="flex-1 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold py-2.5 rounded-lg transition"
        >
          Stop
        </button>
        <button
          onClick={onSwitch}
          className="flex-1 bg-white hover:bg-gray-100 text-gray-950 text-sm font-semibold py-2.5 rounded-lg transition"
        >
          Switch client
        </button>
      </div>
    </div>
  )
}
