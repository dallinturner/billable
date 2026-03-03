'use client'

import { useState, useEffect } from 'react'

type Step = 'idle' | 'running' | 'notes' | 'saved'
type VoiceState = 'idle' | 'recording' | 'done'

const CLIENTS = [
  { id: '1', name: 'Smith v. Jones', initials: 'SJ' },
  { id: '2', name: 'Acme Corp', initials: 'AC' },
  { id: '3', name: 'TechStart Inc', initials: 'TI' },
]

const TASK_TYPES = ['Research', 'Drafting', 'Client Call', 'Court Appearance', 'Document Review']
const FAKE_TRANSCRIPTION = 'Reviewed settlement agreement, drafted response to opposing counsel re: motion to dismiss.'

export default function ExtensionDemo() {
  const [step, setStep] = useState<Step>('idle')
  const [activeClient, setActiveClient] = useState<typeof CLIENTS[0] | null>(null)
  const [pendingSwitch, setPendingSwitch] = useState<typeof CLIENTS[0] | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [taskType, setTaskType] = useState('')
  const [notes, setNotes] = useState('')
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')

  // Timer tick
  useEffect(() => {
    if (step !== 'running') return
    const interval = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(interval)
  }, [step, activeClient])

  // Auto-reset after saved
  useEffect(() => {
    if (step !== 'saved') return
    const t = setTimeout(() => {
      setStep('idle')
      setActiveClient(null)
      setPendingSwitch(null)
      setTaskType('')
      setNotes('')
      setVoiceState('idle')
      setElapsed(0)
    }, 1800)
    return () => clearTimeout(t)
  }, [step])

  // Voice recording simulation
  useEffect(() => {
    if (voiceState !== 'recording') return
    const t = setTimeout(() => {
      setNotes(FAKE_TRANSCRIPTION)
      setVoiceState('done')
    }, 2000)
    return () => clearTimeout(t)
  }, [voiceState])

  function formatElapsed(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  function handleClientClick(client: typeof CLIENTS[0]) {
    setActiveClient(client)
    setElapsed(0)
    setStep('running')
  }

  function handleSwitchTo(client: typeof CLIENTS[0]) {
    setPendingSwitch(client)
    setStep('notes')
  }

  function handleSave() {
    if (pendingSwitch) {
      // Start timer for the switched-to client
      setActiveClient(pendingSwitch)
      setPendingSwitch(null)
      setTaskType('')
      setNotes('')
      setVoiceState('idle')
      setElapsed(0)
      setStep('running')
    } else {
      setStep('saved')
    }
  }

  const otherClients = CLIENTS.filter(c => c.id !== activeClient?.id)

  return (
    <div className="mx-auto" style={{ maxWidth: '700px' }}>
      <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-2xl">

        {/* Title bar */}
        <div className="bg-gray-100 px-4 py-3 flex items-center gap-3 border-b border-gray-200">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 flex items-end gap-1 overflow-hidden">
            <div className="bg-white rounded-t-md px-4 py-1.5 text-xs text-gray-600 border-x border-t border-gray-200 whitespace-nowrap flex-shrink-0">
              Dashboard – Billable
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-3">
          <div className="flex gap-1 text-gray-400 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </div>
          <div className="flex-1 bg-white border border-gray-200 rounded-md px-3 py-1 text-xs text-gray-400">
            billable-three.vercel.app
          </div>
          <div className="flex-shrink-0">
            <div className="w-7 h-7 bg-gray-950 rounded-md flex items-center justify-center ring-2 ring-blue-500 ring-offset-1">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Content: webpage + popup */}
        <div className="flex" style={{ minHeight: '340px' }}>

          {/* Dimmed webpage */}
          <div className="flex-1 bg-gray-50 p-6 select-none pointer-events-none" style={{ opacity: 0.35 }}>
            <div className="max-w-md">
              <div className="h-5 bg-gray-300 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-6" />
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[1,2,3,4].map(i => <div key={i} className="h-16 bg-white border border-gray-200 rounded-xl" />)}
              </div>
              <div className="h-24 bg-white border border-gray-200 rounded-xl" />
            </div>
          </div>

          {/* Extension popup */}
          <div className="flex-shrink-0 border-l border-gray-200 shadow-2xl" style={{ width: '256px' }}>

            {/* Popup header */}
            <div className="bg-gray-950 px-3 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-white/10 rounded flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-white text-xs font-semibold" style={{ letterSpacing: '-0.3px' }}>Billable</span>
              </div>
              <span className="text-gray-500 text-[10px]">Thu, Feb 26</span>
            </div>

            {/* Popup body */}
            <div className="bg-gray-950">

              {/* ── IDLE ── */}
              {step === 'idle' && (
                <div>
                  <div className="px-3 pt-3 pb-1">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Start a timer</p>
                  </div>
                  {CLIENTS.map((client, i) => (
                    <button
                      key={client.id}
                      onClick={() => handleClientClick(client)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-800 group transition-colors text-left ${i < CLIENTS.length - 1 ? 'border-b border-gray-800' : ''}`}
                    >
                      <div className="w-7 h-7 bg-gray-800 group-hover:bg-white/10 rounded-md flex items-center justify-center flex-shrink-0 transition-colors">
                        <span className="text-[9px] font-bold text-gray-400 group-hover:text-white transition-colors">{client.initials}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors truncate">{client.name}</span>
                      <svg className="w-3 h-3 text-gray-600 group-hover:text-gray-300 ml-auto flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  ))}
                  <p className="text-[10px] text-gray-600 text-center py-3">↑ Click a client to start</p>
                </div>
              )}

              {/* ── RUNNING ── */}
              {step === 'running' && activeClient && (
                <div>
                  {/* Active timer card */}
                  <div className="p-3 border-b border-gray-800">
                    <div className="bg-gray-800 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 bg-gray-700 rounded-md flex items-center justify-center flex-shrink-0">
                          <span className="text-[9px] font-bold text-gray-300">{activeClient.initials}</span>
                        </div>
                        <span className="text-xs font-semibold text-white truncate">{activeClient.name}</span>
                        <div className="ml-auto flex items-center gap-1 flex-shrink-0">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                          <span className="text-[9px] text-green-400 font-medium">Active</span>
                        </div>
                      </div>
                      <div className="text-2xl font-mono font-bold text-white mb-2">{formatElapsed(elapsed)}</div>
                      <button
                        onClick={() => setStep('notes')}
                        className="w-full bg-white hover:bg-gray-100 text-gray-950 text-xs font-bold py-1.5 rounded-lg transition"
                      >
                        Stop timer
                      </button>
                    </div>
                  </div>

                  {/* Other clients — switch */}
                  <div className="px-3 pt-2.5 pb-1">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Switch to</p>
                  </div>
                  {otherClients.map((client, i) => (
                    <button
                      key={client.id}
                      onClick={() => handleSwitchTo(client)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-800 group transition-colors text-left ${i < otherClients.length - 1 ? 'border-b border-gray-800' : ''}`}
                    >
                      <div className="w-6 h-6 bg-gray-800 group-hover:bg-white/10 rounded-md flex items-center justify-center flex-shrink-0 transition-colors">
                        <span className="text-[9px] font-bold text-gray-500 group-hover:text-white transition-colors">{client.initials}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-400 group-hover:text-white transition-colors truncate">{client.name}</span>
                      <svg className="w-3 h-3 text-gray-600 group-hover:text-gray-400 ml-auto flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}

              {/* ── NOTES ── */}
              {step === 'notes' && (
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                      {pendingSwitch ? `Notes for ${activeClient?.initials}` : 'Add notes'}
                    </p>
                    {pendingSwitch && (
                      <span className="text-[9px] text-gray-500 flex items-center gap-1">
                        → <span className="text-gray-400 font-medium">{pendingSwitch.name}</span>
                      </span>
                    )}
                  </div>

                  <select
                    value={taskType}
                    onChange={e => setTaskType(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-2 text-xs text-gray-300 mb-2 focus:outline-none"
                  >
                    <option value="">Task type (optional)</option>
                    {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>

                  <div className="relative mb-2">
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="What did you work on?"
                      rows={3}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-2 pr-8 text-xs text-gray-300 placeholder-gray-600 focus:outline-none resize-none"
                    />
                    {/* Mic button */}
                    <button
                      onClick={() => voiceState === 'idle' && setVoiceState('recording')}
                      className={`absolute right-2 bottom-2 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                        voiceState === 'recording'
                          ? 'bg-red-500 animate-pulse'
                          : voiceState === 'done'
                          ? 'bg-green-600'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                      title={voiceState === 'recording' ? 'Recording...' : 'Voice note'}
                    >
                      {voiceState === 'done' ? (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V22H8v2h8v-2h-3v-1.06A9 9 0 0 0 21 12v-2h-2z"/>
                        </svg>
                      )}
                    </button>
                  </div>

                  {voiceState === 'recording' && (
                    <p className="text-[10px] text-red-400 flex items-center gap-1 mb-2">
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                      Recording...
                    </p>
                  )}

                  <button
                    onClick={handleSave}
                    className="w-full bg-white hover:bg-gray-100 text-gray-950 text-xs font-bold py-2 rounded-lg transition"
                  >
                    {pendingSwitch ? `Save & switch to ${pendingSwitch.initials}` : 'Save entry'}
                  </button>
                </div>
              )}

              {/* ── SAVED ── */}
              {step === 'saved' && (
                <div className="p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-white mb-1">Entry logged</p>
                  <p className="text-[10px] text-gray-500">Saved to your dashboard</p>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-sm text-gray-400 mt-4">Try it — click a client to start, switch clients mid-session, or use the mic button</p>
    </div>
  )
}
