"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"
import { requireAuth } from "@/lib/auth-guard"
import { ProcessSubscriptionSchema, TenantStatusSchema, UUIDParam } from "@/lib/validation"

/**
 * Process a subscription upgrade/downgrade.
 * SECURITY: Authenticated users can only change their OWN tenant's plan.
 * Superadmins can change any tenant's plan by passing a tenantId override.
 */
export async function processSubscription(
  tenantIdOverride: string | null,
  planId: string,
  billingCycle: 'monthly' | 'yearly',
  gateway: string = 'simulated_internal'
) {
  try {
    // 1. Authenticate
    const auth = await requireAuth()

    // 2. Validate inputs
    const validated = ProcessSubscriptionSchema.parse({ planId, billingCycle, gateway })

    // 3. Determine target tenant (users can only modify their own)
    let targetTenantId = auth.tenantId
    if (tenantIdOverride && tenantIdOverride !== auth.tenantId) {
      // Only superadmins can modify other tenants
      if (auth.role !== 'superadmin') {
        throw new Error("FORBIDDEN: Cannot modify another tenant's subscription")
      }
      targetTenantId = UUIDParam.parse(tenantIdOverride)
    }

    // 4. Fetch plan details
    const { data: plan, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('id', validated.planId)
      .single()

    if (planError || !plan) throw new Error("Plan not found")

    // 5. Check for existing active subscription
    const { data: activeSub } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('tenant_id', targetTenantId)
      .eq('status', 'active')
      .single()

    const startDate = new Date()
    const endDate = new Date()
    if (validated.billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1)
    } else {
      endDate.setMonth(endDate.getMonth() + 1)
    }

    // 6. Deactivate current if exists
    if (activeSub) {
      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('id', activeSub.id)

      await supabaseAdmin
        .from('subscription_history')
        .insert({
          subscription_id: activeSub.id,
          from_plan_id: activeSub.plan_id,
          to_plan_id: validated.planId,
          gateway: validated.gateway,
        })
    }

    // 7. Create new subscription
    const { data: newSub, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        tenant_id: targetTenantId,
        plan_id: validated.planId,
        status: 'active',
        billing_cycle: validated.billingCycle,
        payment_gateway: validated.gateway,
        gateway_subscription_id: `simulated_${Date.now()}`,
        current_period_start: startDate.toISOString(),
        current_period_end: endDate.toISOString(),
      })
      .select()
      .single()

    if (subError) throw subError

    // 8. Update tenant tier
    const { error: tenantError } = await supabaseAdmin
      .from('tenants')
      .update({ tier: plan.tier })
      .eq('id', targetTenantId)

    if (tenantError) throw tenantError

    return { success: true, message: "Subscription upgraded successfully", subscription: newSub }
  } catch (error: any) {
    console.error("Subscription processing error:", error)
    return { success: false, message: error.message }
  }
}

/**
 * Fetch the current active subscription for a tenant.
 * SECURITY: Users can only view their own plan. Superadmins can view any.
 */
export async function fetchCurrentPlan(tenantIdOverride?: string) {
  try {
    const auth = await requireAuth()

    let targetTenantId = auth.tenantId
    if (tenantIdOverride && tenantIdOverride !== auth.tenantId) {
      if (auth.role !== 'superadmin') {
        throw new Error("FORBIDDEN: Cannot view another tenant's subscription")
      }
      targetTenantId = UUIDParam.parse(tenantIdOverride)
    }

    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('tenant_id', targetTenantId)
      .eq('status', 'active')
      .maybeSingle()

    if (error && error.code !== 'PGRST116') throw error
    return { success: true, subscription: data }
  } catch (error: any) {
    console.error("Fetch plan error:", error)
    return { success: false, message: error.message }
  }
}

/**
 * Update a tenant's status (active/suspended).
 * SECURITY: Only superadmins can suspend/activate tenants.
 */
export async function updateTenantStatus(tenantId: string, status: 'active' | 'suspended') {
  try {
    // Enforce superadmin role
    await requireAuth('superadmin')

    // Validate inputs
    const validatedId = UUIDParam.parse(tenantId)
    const validatedStatus = TenantStatusSchema.parse(status)

    const { error } = await supabaseAdmin
      .from('tenants')
      .update({ status: validatedStatus })
      .eq('id', validatedId)

    if (error) throw error

    return { success: true, message: `Tenant successfully ${validatedStatus}` }
  } catch (error: any) {
    console.error("Tenant update error:", error)
    return { success: false, message: error.message }
  }
}
