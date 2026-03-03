'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatElapsed } from '@/lib/time'
import type { Client } from '@/types/database'

interface VoiceRecorderCardProps {
  client: Client
  onDone: (entryId: string, startedAt: string, transcript: string) => void
  onDiscard: () => void
  // When provided, skip entry creation (entry was already created by the caller)
  existingEntryId?: string
  existingStartedAt?: string
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function VoiceRecorderCard({ client, onDone, onDiscard, existingEntryId, existingStartedAt }: VoiceRecorderCardProps) {
  const supabase = createClient()
  const [elapsed, setElapsed] = useState(0)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [entryId, setEntryId] = useState<string | null>(existingEntryId ?? null)
  // Track whether WE created the entry (so we own cleanup on discard)
  const ownedEntryRef = useRef(!existingEntryId)

  const startedAtRef = useRef(existingStartedAt ?? '')
  const transcriptRef = useRef('')
  const isRecordingRef = useRef(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let mounted = true

    async function init() {
      let resolvedEntryId = existingEntryId ?? null
      let resolvedStartedAt = existingStartedAt ?? ''

      // Only create a new entry if one wasn't passed in
      if (!resolvedEntryId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !mounted) return

        resolvedStartedAt = new Date().toISOString()
        startedAtRef.current = resolvedStartedAt

        const { data: entry } = await supabase
          .from('time_entries')
          .insert({ user_id: user.id, client_id: client.id, started_at: resolvedStartedAt, status: 'draft' })
          .select('id')
          .single()

        if (!entry || !mounted) return
        resolvedEntryId = entry.id
        setEntryId(entry.id)
      } else {
        startedAtRef.current = resolvedStartedAt
      }

      // Start elapsed timer
      const startMs = new Date(resolvedStartedAt).getTime()
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startMs) / 1000))
      }, 1000)

      // Start speech recognition
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any
      const SR = w.SpeechRecognition || w.webkitSpeechRecognition
      if (!SR) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition: any = new SR()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let finalText = ''
        let interimText = ''
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript + ' '
          } else {
            interimText += event.results[i][0].transcript
          }
        }
        transcriptRef.current = finalText
        setLiveTranscript(finalText + interimText)
      }

      // Restart on timeout to handle Chrome's ~60s limit
      recognition.onend = () => {
        if (isRecordingRef.current) {
          try { recognition.start() } catch { /* ignore restart errors */ }
        }
      }

      recognition.start()
      recognitionRef.current = recognition
    }

    init()

    return () => {
      mounted = false
      isRecordingRef.current = false
      recognitionRef.current?.stop()
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleStop() {
    isRecordingRef.current = false
    recognitionRef.current?.stop()
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (entryId) {
      onDone(entryId, startedAtRef.current, transcriptRef.current.trim())
    }
  }

  async function handleDiscard() {
    isRecordingRef.current = false
    recognitionRef.current?.stop()
    if (intervalRef.current) clearInterval(intervalRef.current)
    // Only delete the entry if we created it (not if it was passed in from outside)
    if (ownedEntryRef.current && entryId) {
      await supabase.from('time_entries').delete().eq('id', entryId)
    }
    onDiscard()
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-500/30 rounded-xl overflow-hidden">
      {/* Header row */}
      <div className="px-4 py-3 border-b border-red-100 dark:border-red-500/20 flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
            {getInitials(client.name)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse inline-block" />
            Recording
          </p>
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{client.name}</p>
        </div>
        <div className="text-lg font-mono font-bold text-gray-900 dark:text-white tabular-nums">
          {formatElapsed(elapsed)}
        </div>
      </div>

      {/* Live transcript */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 min-h-[48px] max-h-20 overflow-y-auto">
        {liveTranscript ? (
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{liveTranscript}</p>
        ) : (
          <p className="text-xs text-gray-300 dark:text-gray-600 italic">Listening… start speaking</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-4 py-3">
        <button
          onClick={handleDiscard}
          className="flex-1 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-semibold py-2 rounded-lg transition border border-gray-200 dark:border-gray-700"
        >
          Discard
        </button>
        <button
          onClick={handleStop}
          className="flex-1 bg-gray-950 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-950 text-white text-xs font-semibold py-2 rounded-lg transition"
        >
          Stop & Save
        </button>
      </div>
    </div>
  )
}
