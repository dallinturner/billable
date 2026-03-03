'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function stripeGet(path: string) {
  const res = await fetch(`https://api.stripe.com${path}`, {
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY!.trim()}` },
    cache: 'no-store',
  })
  return res.json()
}

async function stripePost(path: string, params: Record<string, string>) {
  const res = await fetch(`https://api.stripe.com${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY!.trim()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params).toString(),
    cache: 'no-store',
  })
  return res.json()
}

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
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName, firm_id: firmId, role: 'lawyer' },
      redirectTo: 'https://billable-three.vercel.app/auth/confirm',
    })

    if (error) return { error: error.message }

    const { error: profileError } = await adminClient.from('users').insert({
      id: data.user.id,
      firm_id: firmId,
      full_name: fullName,
      role: 'lawyer',
    })

    if (profileError) return { error: profileError.message }

    // If the firm has an active Stripe subscription, increment the seat quantity
    const { data: firm } = await adminClient
      .from('firms')
      .select('stripe_subscription_id, subscription_status')
      .eq('id', firmId)
      .single()

    if (firm?.subscription_status === 'active' && firm.stripe_subscription_id) {
      const subscription = await stripeGet(`/v1/subscriptions/${firm.stripe_subscription_id}`)
      const seatItem = subscription.items?.data?.find(
        (item: { price: { id: string }; id: string; quantity: number }) =>
          item.price.id === process.env.STRIPE_FIRM_SEAT_PRICE_ID?.trim()
      )
      if (seatItem) {
        await stripePost(`/v1/subscription_items/${seatItem.id}`, {
          quantity: String((seatItem.quantity ?? 1) + 1),
        })
      }
    }

    return { error: null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unexpected error' }
  }
}
