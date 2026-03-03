export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BASE = 'https://billable-three.vercel.app'

async function stripePost(path: string, params: Record<string, string>) {
  const key = process.env.STRIPE_SECRET_KEY!
  const body = new URLSearchParams(params).toString()
  const res = await fetch(`https://api.stripe.com${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key.trim()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    cache: 'no-store',
  })
  return res.json()
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('role, firm_id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { data: firm } = await supabase
      .from('firms')
      .select('id, name, stripe_customer_id, plan_type')
      .eq('id', profile.firm_id)
      .single()

    if (!firm) {
      return NextResponse.json({ error: 'Firm not found' }, { status: 404 })
    }

    // Create Stripe customer on-the-fly if missing
    let stripeCustomerId = firm.stripe_customer_id
    if (!stripeCustomerId) {
      const customer = await stripePost('/v1/customers', {
        name: firm.name,
        'metadata[firm_id]': firm.id,
      })
      if (customer.error) return NextResponse.json({ error: customer.error.message }, { status: 500 })
      stripeCustomerId = customer.id
      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + 30)
      await createAdminClient()
        .from('firms')
        .update({
          stripe_customer_id: stripeCustomerId,
          subscription_status: 'trialing',
          trial_ends_at: trialEndsAt.toISOString(),
          plan_type: firm.plan_type ?? 'firm',
        })
        .eq('id', firm.id)
    }

    const { data: lawyers } = await supabase
      .from('users')
      .select('id')
      .eq('firm_id', firm.id)
      .neq('role', 'admin')

    const lawyerCount = Math.max(1, (lawyers ?? []).length)

    const params: Record<string, string> = {
      mode: 'subscription',
      customer: stripeCustomerId,
      success_url: `${BASE}/admin/settings?billing=success`,
      cancel_url: `${BASE}/billing`,
    }

    if (firm.plan_type === 'solo') {
      params['line_items[0][price]'] = process.env.STRIPE_SOLO_PRICE_ID!
      params['line_items[0][quantity]'] = '1'
    } else {
      params['line_items[0][price]'] = process.env.STRIPE_FIRM_BASE_PRICE_ID!
      params['line_items[0][quantity]'] = '1'
      params['line_items[1][price]'] = process.env.STRIPE_FIRM_SEAT_PRICE_ID!
      params['line_items[1][quantity]'] = String(lawyerCount)
    }

    const session = await stripePost('/v1/checkout/sessions', params)
    if (session.error) return NextResponse.json({ error: session.error.message }, { status: 500 })

    return NextResponse.json({ url: session.url })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
