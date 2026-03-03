'use server'

import { getStripeClient } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export async function initializeBilling(firmId: string, firmName: string, planType: 'firm' | 'solo') {
  try {
    const customer = await getStripeClient().customers.create({
      name: firmName,
      metadata: { firm_id: firmId },
    })

    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 30)

    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('firms')
      .update({
        stripe_customer_id: customer.id,
        subscription_status: 'trialing',
        trial_ends_at: trialEndsAt.toISOString(),
        plan_type: planType,
      })
      .eq('id', firmId)

    if (error) return { error: error.message }
    return { error: null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unexpected error' }
  }
}
