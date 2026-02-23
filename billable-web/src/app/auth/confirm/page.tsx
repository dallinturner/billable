'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ConfirmPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const hash = window.location.hash
    if (!hash) { router.push('/auth/login'); return }

    const params = new URLSearchParams(hash.slice(1))
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (!accessToken || !refreshToken) { router.push('/auth/login'); return }

    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) { router.push('/auth/login'); return }
        router.push('/dashboard')
      })
  }, [router, supabase.auth])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-gray-200 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
    </div>
  )
}
