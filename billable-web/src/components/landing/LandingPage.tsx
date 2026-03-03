'use client'

import Link from 'next/link'
import ExtensionDemo from './ExtensionDemo'
import DashboardDemo from './DashboardDemo'

function PhoneFrame({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div
      className="relative mx-auto flex-shrink-0"
      style={{
        width: '200px',
        height: '400px',
        background: dark ? '#0a0a0a' : '#1a1a1a',
        borderRadius: '36px',
        padding: '10px',
        border: '2px solid #2a2a2a',
        boxShadow: '0 0 0 1px #111, 0 32px 64px rgba(0,0,0,0.5)',
      }}
    >
      {/* Side buttons */}
      <div style={{ position: 'absolute', left: '-3px', top: '72px', width: '3px', height: '24px', background: '#2a2a2a', borderRadius: '2px 0 0 2px' }} />
      <div style={{ position: 'absolute', left: '-3px', top: '106px', width: '3px', height: '24px', background: '#2a2a2a', borderRadius: '2px 0 0 2px' }} />
      <div style={{ position: 'absolute', right: '-3px', top: '90px', width: '3px', height: '40px', background: '#2a2a2a', borderRadius: '0 2px 2px 0' }} />
      {/* Screen */}
      <div
        style={{
          background: dark ? '#000' : '#fff',
          borderRadius: '28px',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Dynamic island */}
        <div style={{
          position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)',
          width: '80px', height: '22px', background: '#000', borderRadius: '16px', zIndex: 10,
        }} />
        {children}
      </div>
    </div>
  )
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span className="text-sm text-gray-600">{children}</span>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="bg-white text-gray-900" style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}>

      {/* ── 1. Navbar ── */}
      <header className="bg-gray-950">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white/10 rounded-md flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-semibold text-white" style={{ letterSpacing: '-0.3px' }}>Billable</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/auth/login" className="text-sm text-gray-400 hover:text-white transition">
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="bg-white hover:bg-gray-100 text-gray-950 text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              Get started →
            </Link>
          </div>
        </div>
      </header>

      {/* ── 2. Hero ── */}
      <section className="py-24 px-6 text-center border-b border-gray-100">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Billable for lawyers</p>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-950 leading-tight mb-6" style={{ letterSpacing: '-1.5px' }}>
            Stop losing<br />billable hours.
          </h1>
          <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto leading-relaxed">
            Billable lives in your browser and on your phone. One click to start a timer, one tap to stop — every phone call, email, and client conversation gets logged.
          </p>
          <div className="flex items-center justify-center gap-4 mb-5">
            <Link
              href="/auth/signup"
              className="bg-gray-950 hover:bg-gray-800 text-white font-semibold px-6 py-3 rounded-xl transition text-sm"
            >
              Start free trial →
            </Link>
            <Link href="/auth/login" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition">
              Sign in
            </Link>
          </div>
          <p className="text-xs text-gray-400">No credit card required · Takes 2 minutes to set up</p>
        </div>
      </section>

      {/* ── 3. Extension Demo ── */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Browser extension</p>
            <h2 className="text-3xl font-bold text-gray-950 mb-3" style={{ letterSpacing: '-0.5px' }}>
              Always one click away.
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              The Billable extension sits in your browser toolbar. Click a client to start timing. Click stop when you're done. Add a note — or dictate one.
            </p>
          </div>
          <ExtensionDemo />
        </div>
      </section>

      {/* ── 4. Problem stat ── */}
      <section className="bg-gray-950 py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-2xl sm:text-3xl font-bold text-white leading-snug" style={{ letterSpacing: '-0.5px' }}>
            The average lawyer loses{' '}
            <span className="text-gray-300">1–2 billable hours per day</span>{' '}
            to poor time tracking.
          </p>
          <p className="text-gray-500 mt-4 text-lg">That's $50,000+ in lost revenue every year.</p>
        </div>
      </section>

      {/* ── 5. Dashboard Demo ── */}
      <section className="py-20 px-6 border-b border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Web app</p>
            <h2 className="text-3xl font-bold text-gray-950 mb-3" style={{ letterSpacing: '-0.5px' }}>
              Your hours, fully in control.
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Every lawyer gets a personal dashboard. Every firm gets an admin view. Toggle between them below.
            </p>
          </div>
          <DashboardDemo />
        </div>
      </section>

      {/* ── 6. Mobile ── */}
      <section className="bg-gray-950 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Mobile app</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ letterSpacing: '-0.75px' }}>
              Track time from anywhere.
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto text-lg">
              The Billable mobile app puts a timer in your pocket — and on your lock screen. Start tracking from a call before you even unlock your phone.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-12 sm:gap-20">

            {/* iPhone app */}
            <div className="flex flex-col items-center gap-5">
              <PhoneFrame>
                {/* App content */}
                <div className="pt-10 h-full bg-white flex flex-col">
                  {/* Mini navbar */}
                  <div className="bg-gray-950 px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 bg-white/10 rounded flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <span className="text-white text-[10px] font-semibold" style={{ letterSpacing: '-0.3px' }}>Billable</span>
                    </div>
                    <span className="text-gray-500 text-[9px]">Sarah Chen</span>
                  </div>
                  {/* Content */}
                  <div className="flex-1 bg-gray-50 p-3">
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Start a timer</p>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-3">
                      {['Smith v. Jones', 'Acme Corp', 'TechStart'].map((c, i) => (
                        <div key={c} className={`flex items-center gap-1.5 px-2.5 py-2 ${i < 2 ? 'border-b border-gray-100' : ''}`}>
                          <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                            <span className="text-[7px] font-bold text-gray-500">{c.slice(0,2).toUpperCase()}</span>
                          </div>
                          <span className="text-[9px] font-medium text-gray-800 truncate">{c}</span>
                          <svg className="w-2.5 h-2.5 text-gray-300 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" /></svg>
                        </div>
                      ))}
                    </div>
                    {/* Active timer card */}
                    <div className="bg-gray-950 rounded-lg p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-4 h-4 bg-gray-800 rounded flex items-center justify-center">
                          <span className="text-[6px] font-bold text-gray-400">AC</span>
                        </div>
                        <span className="text-[9px] text-white font-semibold">Acme Corp</span>
                        <div className="ml-auto flex items-center gap-1">
                          <span className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
                          <span className="text-[8px] text-green-400">Active</span>
                        </div>
                      </div>
                      <div className="text-lg font-mono font-bold text-white mb-1.5">0:42</div>
                      <button className="w-full bg-white text-gray-950 text-[9px] font-bold py-1.5 rounded-md">Stop timer</button>
                    </div>
                  </div>
                  {/* Bottom nav */}
                  <div className="bg-white border-t border-gray-100 px-4 py-2 flex justify-around">
                    {['Hours', 'Stats', 'Settings'].map((item, i) => (
                      <div key={item} className="flex flex-col items-center gap-0.5">
                        <div className={`w-4 h-4 rounded ${i === 0 ? 'bg-gray-950' : 'bg-gray-200'}`} />
                        <span className={`text-[7px] font-medium ${i === 0 ? 'text-gray-950' : 'text-gray-400'}`}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </PhoneFrame>
              <div className="text-center">
                <p className="text-white text-sm font-semibold">iOS App</p>
                <p className="text-gray-500 text-xs mt-0.5">Track from your phone</p>
              </div>
            </div>

            {/* Lock screen */}
            <div className="flex flex-col items-center gap-5">
              <PhoneFrame dark>
                <div className="h-full flex flex-col" style={{ background: 'linear-gradient(160deg, #0f0f1a 0%, #0a0a0f 100%)' }}>
                  <div className="pt-10 px-4 pb-4 flex-1 flex flex-col">
                    {/* Lock screen time */}
                    <div className="text-center mb-6 mt-2">
                      <p className="text-gray-600 text-[9px] font-medium mb-0.5">Thursday, February 26</p>
                      <p className="text-white font-bold" style={{ fontSize: '42px', letterSpacing: '-2px', lineHeight: 1 }}>9:41</p>
                    </div>

                    {/* Billable lock screen widget */}
                    <div
                      className="rounded-2xl p-3 mb-3"
                      style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-4 h-4 bg-white/15 rounded flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <span className="text-white/60 text-[9px] font-semibold uppercase tracking-wider">Billable</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-white text-[10px] font-semibold">Smith v. Jones</p>
                          <p className="text-white/50 text-[8px] mt-0.5">Drafting · Active</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-mono font-bold text-sm">1:24</p>
                          <div className="flex items-center gap-1 justify-end mt-0.5">
                            <span className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-green-400 text-[8px]">Running</span>
                          </div>
                        </div>
                      </div>
                      <button className="w-full text-[9px] font-bold py-1.5 rounded-lg text-gray-950" style={{ background: 'rgba(255,255,255,0.9)' }}>
                        Stop timer
                      </button>
                    </div>

                    {/* Notification-style quick start */}
                    <div
                      className="rounded-xl p-2.5"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <p className="text-white/40 text-[8px] mb-1.5 font-medium">Quick start</p>
                      <div className="flex gap-1.5">
                        {['SJ', 'AC', 'TI'].map(init => (
                          <div key={init} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
                              <span className="text-[8px] font-bold text-white/60">{init}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Home indicator */}
                  <div className="flex justify-center pb-2">
                    <div className="w-24 h-1 bg-white/20 rounded-full" />
                  </div>
                </div>
              </PhoneFrame>
              <div className="text-center">
                <p className="text-white text-sm font-semibold">Lock Screen Widget</p>
                <p className="text-gray-500 text-xs mt-0.5">Start before you unlock</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 7. For the whole firm ── */}
      <section className="py-20 px-6 border-b border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Admin dashboard</p>
              <h2 className="text-3xl font-bold text-gray-950 mb-4" style={{ letterSpacing: '-0.5px' }}>
                Built for the whole firm.
              </h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                One admin account manages the whole firm. Set up clients and task types, invite your lawyers, and review every hour submitted — all in one place.
              </p>
              <Link
                href="/auth/signup"
                className="inline-flex bg-gray-950 hover:bg-gray-800 text-white font-semibold px-5 py-2.5 rounded-xl transition text-sm"
              >
                Set up your firm →
              </Link>
            </div>
            <div className="space-y-4">
              {[
                { title: 'Firm-wide visibility', desc: 'See every submitted hour across all lawyers, filterable by person, client, task, and date.' },
                { title: 'Invite your team', desc: 'Send invite emails directly from the dashboard. Lawyers get a link and are set up in seconds.' },
                { title: 'Edit request flow', desc: 'Lawyers can request changes to submitted entries. You approve or deny — full audit trail.' },
                { title: 'Per-lawyer reporting', desc: 'Track individual lawyer productivity and billable output over time.' },
              ].map(item => (
                <div key={item.title} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-gray-950 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. How it works ── */}
      <section className="py-20 px-6 bg-gray-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Setup</p>
            <h2 className="text-3xl font-bold text-gray-950" style={{ letterSpacing: '-0.5px' }}>Up and running in minutes.</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                n: '1',
                title: 'Create your firm',
                desc: 'Sign up, add your clients and task types, set your billing increment. Takes about 2 minutes.',
              },
              {
                n: '2',
                title: 'Invite your lawyers',
                desc: 'Send invite emails from the admin dashboard. Lawyers get a link and log in instantly — no extra setup.',
              },
              {
                n: '3',
                title: 'Start tracking',
                desc: 'Install the browser extension, click a client to start a timer, stop when done. Hours sync to your dashboard automatically.',
              },
            ].map(step => (
              <div key={step.n} className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="w-8 h-8 bg-gray-950 text-white rounded-full flex items-center justify-center text-sm font-bold mb-4">
                  {step.n}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. Features strip ── */}
      <section className="py-16 px-6 border-b border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                title: 'Voice notes',
                desc: 'Describe the work in your own words. Billable transcribes it using your browser\'s built-in speech recognition — free, no third-party service.',
              },
              {
                title: 'Auto-rounded hours',
                desc: 'Time is automatically rounded up to your firm\'s billing increment — 6-minute, 15-minute, or custom. No math, no mistakes.',
              },
              {
                title: 'Works offline',
                desc: 'The extension keeps running even if your connection drops. Everything syncs when you\'re back online.',
              },
            ].map(f => (
              <div key={f.title} className="p-6 border border-gray-200 rounded-2xl">
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 10. Bottom CTA ── */}
      <section className="bg-gray-950 py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ letterSpacing: '-0.75px' }}>
            Ready to stop losing revenue?
          </h2>
          <p className="text-gray-400 mb-8 text-lg">
            Join law firms that track every billable minute — without the friction.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex bg-white hover:bg-gray-100 text-gray-950 font-semibold px-8 py-3.5 rounded-xl transition text-sm"
          >
            Get started free →
          </Link>
          <p className="text-gray-600 text-xs mt-4">No credit card required</p>
        </div>
      </section>

      {/* ── 11. Footer ── */}
      <footer className="bg-gray-950 border-t border-gray-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-white/10 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-gray-400 text-sm font-medium" style={{ letterSpacing: '-0.3px' }}>Billable</span>
            <span className="text-gray-700 text-sm ml-2">© 2026</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/auth/login" className="text-sm text-gray-500 hover:text-white transition">Sign in</Link>
            <Link href="/auth/signup" className="text-sm text-gray-500 hover:text-white transition">Sign up</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
