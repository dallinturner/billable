export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripeClient().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  async function updateFirmByCustomer(customerId: string, updates: Record<string, string | null>) {
    await adminClient.from('firms').update(updates).eq('stripe_customer_id', customerId)
  }

  switch (event.type) {
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const status = sub.status === 'active' ? 'active'
        : sub.status === 'past_due' ? 'past_due'
        : sub.status === 'canceled' ? 'canceled'
        : sub.status === 'trialing' ? 'trialing'
        : null
      await updateFirmByCustomer(sub.customer as string, {
        stripe_subscription_id: sub.id,
        subscription_status: status,
      })
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await updateFirmByCustomer(sub.customer as string, {
        subscription_status: 'canceled',
      })
      break
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.customer) {
        await updateFirmByCustomer(invoice.customer as string, {
          subscription_status: 'past_due',
        })
      }
      break
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId = invoice.parent?.type === 'subscription_details'
        ? (invoice.parent.subscription_details?.subscription as string | undefined) ?? null
        : null
      if (invoice.customer) {
        await updateFirmByCustomer(invoice.customer as string, {
          stripe_subscription_id: subscriptionId,
          subscription_status: 'active',
        })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
