'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function inviteLawyer(email: string, fullName: string, firmId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
      .from('users')
      .select('role, firm_id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin' || profile.firm_id !== firmId) {
      return { error: 'Not authorized' }
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName, firm_id: firmId, role: 'lawyer' },
      redirectTo: 'https://billable-three.vercel.app/auth/callback',
    })

    if (error) return { error: error.message }
    return { error: null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unexpected error' }
  }
}
