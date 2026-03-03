'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import VoiceRecorderCard from '@/components/dashboard/VoiceRecorderCard'
import NotesModal from '@/components/dashboard/NotesModal'
import { getRecordDataByEntry, saveRecordEntry, deleteRecordEntry } from './actions'
import type { Client, TaskType, Firm } from '@/types/database'

function RecordContent() {
  const searchParams = useSearchParams()
  const entryId = searchParams.get('entry')

  const [client, setClient] = useState<Client | null>(null)
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([])
  const [firm, setFirm] = useState<Firm | null>(null)
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Voice recorder state
  const [pendingTranscript, setPendingTranscript] = useState('')
  const [showNotes, setShowNotes] = useState(false)

  const loadData = useCallback(async () => {
    if (!entryId) { setError('No entry specified.'); setLoading(false); return }

    const result = await getRecordDataByEntry(entryId)
    if (result.error) { setError(result.error); setLoading(false); return }

    setClient(result.client)
    setFirm(result.firm)
    setTaskTypes(result.taskTypes)
    setStartedAt(result.startedAt)
    setLoading(false)
  }, [entryId])

  useEffect(() => { loadData() }, [loadData])

  function handleVoiceDone(_entryId: string, _startedAt: string, transcript: string) {
    setPendingTranscript(transcript)
    setShowNotes(true)
  }

  async function handleNotesSave(notes: string, taskTypeId: string) {
    if (!entryId || !startedAt || !firm) return

    await saveRecordEntry(entryId, startedAt, firm.billing_increment, notes, taskTypeId)

    setShowNotes(false)
    setSaved(true)
    // Auto-close after 1.5s if opened as a popup window
    setTimeout(() => { try { window.close() } catch { /* ignore */ } }, 1500)
  }

  async function handleNotesCancel() {
    if (entryId) {
      await deleteRecordEntry(entryId)
    }
    setShowNotes(false)
    setError('Recording discarded.')
  }

  async function handleDiscard() {
    if (entryId) {
      await deleteRecordEntry(entryId)
    }
    try { window.close() } catch { /* ignore */ }
    setError('Recording discarded.')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    )
  }

  if (saved) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-900">Entry saved.</p>
          <p className="text-xs text-gray-400 mt-1">You can close this tab.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-6 h-6 bg-gray-950 rounded-md flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-900 tracking-tight">Billable</span>
        </div>

        {client && !showNotes && (
          <VoiceRecorderCard
            client={client}
            onDone={handleVoiceDone}
            onDiscard={handleDiscard}
            existingEntryId={entryId ?? undefined}
            existingStartedAt={startedAt ?? undefined}
          />
        )}
      </div>

      {showNotes && (
        <NotesModal
          taskTypes={taskTypes}
          onSave={handleNotesSave}
          onCancel={handleNotesCancel}
          title="Add notes"
          initialNotes={pendingTranscript}
        />
      )}
    </div>
  )
}

export default function RecordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    }>
      <RecordContent />
    </Suspense>
  )
}
