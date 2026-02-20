import React, { useState, useEffect, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import { supabase } from './supabase'
import type { TimerState, Client, Firm } from './types'
import './popup.css'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roundToBillingIncrement(exactMinutes: number, incrementHours: number): number {
  const incrementMinutes = incrementHours * 60
  const increments = Math.ceil(exactMinutes / incrementMinutes)
  return Math.round(increments * incrementHours * 10) / 10
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

// ─── Timer storage ────────────────────────────────────────────────────────────

function getTimerState(): Promise<TimerState | null> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_TIMER' }, (r) => resolve(r?.timerState ?? null))
  })
}
function setTimerStateRemote(state: TimerState): Promise<void> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'SET_TIMER', payload: state }, () => resolve())
  })
}
function clearTimerState(): Promise<void> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'CLEAR_TIMER' }, () => resolve())
  })
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronRight() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
    </svg>
  )
}

function ChevronLeft() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

// ─── Shell ────────────────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-64 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xl shadow-black/10">
      {children}
    </div>
  )
}

function Header({ right }: { right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-950 border-b border-gray-800">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-white/10 rounded-md flex items-center justify-center">
          <ClockIcon />
        </div>
        <span className="text-sm font-semibold text-white tracking-tight">Billable</span>
      </div>
      {right}
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

type View = 'loading' | 'login' | 'clients' | 'timer' | 'notes'

export default function App() {
  const [view, setView] = useState<View>('loading')
  const [clients, setClients] = useState<Client[]>([])
  const [firm, setFirm] = useState<Firm | null>(null)
  const [timer, setTimer] = useState<TimerState | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [notes, setNotes] = useState('')
  const [taskTypes, setTaskTypes] = useState<{ id: string; name: string }[]>([])
  const [taskTypeId, setTaskTypeId] = useState('')

  const init = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setView('login'); return }

    const { data: profile } = await supabase
      .from('users').select('firm_id').eq('id', session.user.id).single()
    if (!profile?.firm_id) { setView('login'); return }

    const firmId = profile.firm_id
    const [{ data: firmData }, { data: clientsData }, { data: taskTypesData }] = await Promise.all([
      supabase.from('firms').select('id, billing_increment').eq('id', firmId).single(),
      supabase.from('clients').select('id, name').eq('firm_id', firmId).eq('is_active', true).order('name'),
      supabase.from('task_types').select('id, name').or(`firm_id.eq.${firmId},firm_id.is.null`).eq('is_active', true),
    ])

    setFirm(firmData as Firm)
    setClients((clientsData as Client[]) ?? [])
    setTaskTypes((taskTypesData as { id: string; name: string }[]) ?? [])
    if (taskTypesData?.[0]) setTaskTypeId(taskTypesData[0].id)

    const persisted = await getTimerState()
    if (persisted) { setTimer(persisted); setView('timer') }
    else setView('clients')
  }, [])

  useEffect(() => { init() }, [init])

  useEffect(() => {
    if (view !== 'timer' || !timer) return
    const start = new Date(timer.startedAt).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [view, timer])

  async function startTimer(client: Client) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const startedAt = new Date().toISOString()
    const { data: entry } = await supabase.from('time_entries').insert({
      user_id: session.user.id, client_id: client.id, started_at: startedAt, status: 'draft',
    }).select('id').single()
    if (!entry) return
    const state: TimerState = { clientId: client.id, clientName: client.name, entryId: entry.id, startedAt }
    await setTimerStateRemote(state)
    setTimer(state)
    setView('timer')
  }

  async function stopTimer() {
    if (!timer || !firm) return
    const endedAt = new Date().toISOString()
    const exactMinutes = (new Date(endedAt).getTime() - new Date(timer.startedAt).getTime()) / 60000
    const billable = roundToBillingIncrement(exactMinutes, firm.billing_increment)
    await supabase.from('time_entries').update({
      ended_at: endedAt, exact_duration_minutes: exactMinutes,
      billable_duration: billable, notes, task_type_id: taskTypeId || null,
    }).eq('id', timer.entryId)
    await clearTimerState()
    setTimer(null)
    setNotes('')
    setView('clients')
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (view === 'loading') {
    return (
      <Shell>
        <Header />
        <div className="flex items-center justify-center py-10">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
        </div>
      </Shell>
    )
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  if (view === 'login') {
    return <LoginView onSuccess={init} />
  }

  // ── Timer running ─────────────────────────────────────────────────────────
  if (view === 'timer' && timer) {
    return (
      <Shell>
        <Header
          right={
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Live
            </span>
          }
        />
        <div className="px-4 py-4">
          {/* Client initials + name */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-gray-600">{getInitials(timer.clientName)}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Billing</p>
              <p className="text-sm font-semibold text-gray-900 truncate">{timer.clientName}</p>
            </div>
          </div>

          {/* Timer */}
          <div className="bg-gray-950 rounded-lg px-4 py-3 mb-3 text-center">
            <div className="text-2xl font-mono font-bold text-white tabular-nums tracking-tight">
              {formatElapsed(elapsed)}
            </div>
          </div>

          <button
            onClick={() => { setNotes(''); setView('notes') }}
            className="w-full bg-gray-950 hover:bg-gray-800 text-white text-xs font-semibold py-2.5 rounded-lg tracking-wide transition-colors"
          >
            Stop & Save
          </button>
        </div>
      </Shell>
    )
  }

  // ── Notes ─────────────────────────────────────────────────────────────────
  if (view === 'notes') {
    return (
      <Shell>
        <Header
          right={
            <button
              onClick={() => setView('timer')}
              className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft />
              Back
            </button>
          }
        />

        <div className="px-4 py-3 space-y-3">
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Task type</label>
            <select
              value={taskTypeId}
              onChange={(e) => setTaskTypeId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              {taskTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
              placeholder="What did you work on?"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setView('timer')}
              className="flex-1 border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs font-semibold py-2 rounded-lg tracking-wide transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={stopTimer}
              className="flex-1 bg-gray-950 hover:bg-gray-800 text-white text-xs font-semibold py-2 rounded-lg tracking-wide transition-colors"
            >
              Save entry
            </button>
          </div>
        </div>
      </Shell>
    )
  }

  // ── Client list ───────────────────────────────────────────────────────────
  return (
    <Shell>
      <Header
        right={
          <a
            href={`${process.env.WEBAPP_URL}/dashboard`}
            target="_blank" rel="noreferrer"
            className="text-xs font-medium text-gray-400 hover:text-white transition-colors"
          >
            Dashboard →
          </a>
        }
      />

      <div>
        <div className="px-4 pt-3 pb-1">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Select client</p>
        </div>

        {clients.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-gray-400 mb-1">No active clients.</p>
            <a
              href={`${process.env.WEBAPP_URL}/admin/settings`}
              target="_blank" rel="noreferrer"
              className="text-xs font-semibold text-gray-900 hover:underline"
            >
              Add clients →
            </a>
          </div>
        ) : (
          <div className="py-1">
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => startTimer(client)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-950 group transition-colors"
              >
                <div className="w-7 h-7 bg-gray-100 group-hover:bg-white/10 rounded-md flex items-center justify-center flex-shrink-0 transition-colors">
                  <span className="text-[10px] font-bold text-gray-500 group-hover:text-white transition-colors">
                    {getInitials(client.name)}
                  </span>
                </div>
                <span className="flex-1 text-sm font-medium text-gray-800 group-hover:text-white truncate transition-colors">
                  {client.name}
                </span>
                <ChevronRight />
              </button>
            ))}
          </div>
        )}

        <div className="px-4 py-2.5 border-t border-gray-100">
          <p className="text-[10px] text-gray-300 text-center">
            {clients.length} {clients.length === 1 ? 'client' : 'clients'}
          </p>
        </div>
      </div>
    </Shell>
  )
}

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginView({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    onSuccess()
  }

  return (
    <Shell>
      <Header />
      <div className="px-4 py-4">
        <p className="text-xs text-gray-400 mb-3">Sign in to track time.</p>
        <form onSubmit={handleLogin} className="space-y-2.5">
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="you@lawfirm.com"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-950 hover:bg-gray-800 disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded-lg tracking-wide transition-colors mt-1"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </Shell>
  )
}

// Mount
const root = createRoot(document.getElementById('root')!)
root.render(<App />)
