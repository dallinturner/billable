'use client'

import { useState } from 'react'

type Tab = 'lawyer' | 'admin'

const DEMO_CLIENTS = [
  { name: 'Smith v. Jones', initials: 'SJ' },
  { name: 'Acme Corp', initials: 'AC' },
  { name: 'TechStart Inc', initials: 'TI' },
  { name: 'Chen & Partners', initials: 'CP' },
]

const LAWYER_ENTRIES = [
  { client: 'Smith v. Jones', initials: 'SJ', task: 'Drafting', billed: '0.5 hrs', time: '9:02 AM', status: 'draft' },
  { client: 'Acme Corp', initials: 'AC', task: 'Client Call', billed: '0.3 hrs', time: '10:18 AM', status: 'draft' },
  { client: 'TechStart Inc', initials: 'TI', task: 'Research', billed: '1.0 hrs', time: '2:05 PM', status: 'submitted' },
]

const ADMIN_ENTRIES = [
  { lawyer: 'Sarah Chen', initials: 'SC', client: 'Smith v. Jones', task: 'Drafting', billed: '2.1 hrs', date: 'Feb 26' },
  { lawyer: 'James Park', initials: 'JP', client: 'Acme Corp', task: 'Client Call', billed: '0.5 hrs', date: 'Feb 26' },
  { lawyer: 'Sarah Chen', initials: 'SC', client: 'TechStart Inc', task: 'Research', billed: '3.0 hrs', date: 'Feb 25' },
  { lawyer: 'Marcus Webb', initials: 'MW', client: 'Chen & Partners', task: 'Review', billed: '1.5 hrs', date: 'Feb 25' },
]

export default function DashboardDemo() {
  const [tab, setTab] = useState<Tab>('lawyer')
  const [activeClient, setActiveClient] = useState<typeof DEMO_CLIENTS[0] | null>(null)
  const [elapsed] = useState(7)

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-2xl bg-white">
      {/* Demo tab switcher */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 flex items-center gap-1 py-2">
        <span className="text-xs text-gray-400 mr-3 font-medium">View as:</span>
        {(['lawyer', 'admin'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setActiveClient(null) }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              tab === t
                ? 'bg-gray-950 text-white'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {t === 'lawyer' ? 'Lawyer' : 'Admin'}
          </button>
        ))}
      </div>

      {/* App navbar */}
      <div className="bg-gray-950 h-12 flex items-center px-6 justify-between">
        <div className="flex items-center gap-7">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-white/10 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-white text-sm font-semibold" style={{ letterSpacing: '-0.3px' }}>Billable</span>
          </div>
          <nav className="flex gap-5">
            {tab === 'lawyer' ? (
              <>
                <span className="text-white text-xs font-medium">Hours</span>
                <span className="text-gray-500 text-xs hover:text-gray-300 cursor-pointer transition">Stats</span>
                <span className="text-gray-500 text-xs hover:text-gray-300 cursor-pointer transition">Settings</span>
              </>
            ) : (
              <>
                <span className="text-white text-xs font-medium">Dashboard</span>
                <span className="text-gray-500 text-xs hover:text-gray-300 cursor-pointer transition">Settings</span>
              </>
            )}
          </nav>
        </div>
        <span className="text-gray-500 text-xs">{tab === 'lawyer' ? 'Sarah Chen' : 'Admin'}</span>
      </div>

      {/* Page content */}
      <div className="bg-gray-50" style={{ minHeight: '440px' }}>

        {/* ── Lawyer View ── */}
        {tab === 'lawyer' && (
          <div className="max-w-2xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-gray-900">My hours</h2>
                <p className="text-xs text-gray-400 mt-0.5">Track and manage your billable time</p>
              </div>
              <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Add manually
              </button>
            </div>

            {/* Active timer or client grid */}
            {activeClient ? (
              <div className="mb-5 bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-[10px] font-bold text-gray-500">{activeClient.initials}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{activeClient.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs text-green-600 font-medium">Active</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-mono font-bold text-gray-900">0:{String(elapsed).padStart(2, '0')}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveClient(null)}
                    className="flex-1 text-xs font-semibold bg-gray-950 hover:bg-gray-800 text-white py-2 rounded-lg transition"
                  >
                    Stop timer
                  </button>
                  <button className="text-xs font-medium text-gray-500 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                    Switch client
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Start a timer</p>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  {DEMO_CLIENTS.map((client, i) => (
                    <button
                      key={client.name}
                      onClick={() => setActiveClient(client)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-950 group transition-colors ${i < DEMO_CLIENTS.length - 1 ? 'border-b border-gray-100' : ''}`}
                    >
                      <div className="w-8 h-8 bg-gray-100 group-hover:bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                        <span className="text-[10px] font-bold text-gray-500 group-hover:text-white transition-colors">{client.initials}</span>
                      </div>
                      <span className="flex-1 text-sm font-medium text-gray-800 group-hover:text-white truncate transition-colors">{client.name}</span>
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" /></svg>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit bar */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between mb-5">
              <div>
                <span className="text-sm font-semibold text-gray-900">2 draft entries</span>
                <span className="text-sm text-gray-400"> · 0.8 hrs ready to submit</span>
              </div>
              <button className="bg-gray-950 hover:bg-gray-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">Submit all</button>
            </div>

            {/* Entries */}
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Thursday, February 26, 2026</p>
            <div className="space-y-2">
              {LAWYER_ENTRIES.map((e, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-gray-500">{e.initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-900 truncate">{e.client}</span>
                      {e.status === 'submitted' && (
                        <span className="text-[9px] font-medium text-gray-400 border border-gray-200 rounded-full px-1.5 py-0.5 flex-shrink-0">Submitted</span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{e.task} · {e.time}</p>
                  </div>
                  <span className="text-xs font-bold text-gray-900">{e.billed}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Admin View ── */}
        {tab === 'admin' && (
          <div className="px-6 py-6">
            <div className="mb-5">
              <h2 className="text-base font-bold text-gray-900">Smith & Associates</h2>
              <p className="text-xs text-gray-400 mt-0.5">Review and manage all submitted hours</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Submitted entries', value: '24' },
                { label: 'Billable hours', value: '18.4' },
                { label: 'Lawyers', value: '3' },
                { label: 'Edit requests', value: '1', warn: true },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl p-4 border ${s.warn ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}>
                  <div className={`text-2xl font-bold ${s.warn ? 'text-amber-700' : 'text-gray-900'}`}>{s.value}</div>
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Entries table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 grid gap-4" style={{ gridTemplateColumns: '1fr 1fr 1fr 80px 70px' }}>
                {['Lawyer', 'Client', 'Task type', 'Billed', 'Date'].map(h => (
                  <span key={h} className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{h}</span>
                ))}
              </div>
              {ADMIN_ENTRIES.map((e, i) => (
                <div
                  key={i}
                  className={`px-5 py-3 grid gap-4 items-center hover:bg-gray-50 transition ${i < ADMIN_ENTRIES.length - 1 ? 'border-b border-gray-50' : ''}`}
                  style={{ gridTemplateColumns: '1fr 1fr 1fr 80px 70px' }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                      <span className="text-[8px] font-bold text-gray-500">{e.initials}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-900 truncate">{e.lawyer}</span>
                  </div>
                  <span className="text-xs text-gray-600 truncate">{e.client}</span>
                  <span className="text-xs text-gray-600 truncate">{e.task}</span>
                  <span className="text-xs font-semibold text-gray-900">{e.billed}</span>
                  <span className="text-xs text-gray-400">{e.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
