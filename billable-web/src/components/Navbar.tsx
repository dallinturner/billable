'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NavbarProps {
  userName?: string
  role?: string
}

export default function Navbar({ userName, role }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <header className="bg-gray-950 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href={role === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white/10 rounded-md flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-semibold text-white tracking-tight">Billable</span>
          </Link>

          {role === 'admin' && (
            <nav className="flex items-center gap-6">
              <Link href="/admin" className="text-sm text-gray-400 hover:text-white transition">
                Dashboard
              </Link>
              <Link href="/admin/settings" className="text-sm text-gray-400 hover:text-white transition">
                Settings
              </Link>
            </nav>
          )}

          {role === 'individual' && (
            <nav className="flex items-center gap-6">
              <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">
                Dashboard
              </Link>
              <Link href="/dashboard/settings" className="text-sm text-gray-400 hover:text-white transition">
                Settings
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-5">
          {userName && (
            <span className="text-sm text-gray-500 hidden sm:block">{userName}</span>
          )}
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
