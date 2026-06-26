"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"
import { requireAuth } from "@/lib/auth-guard"
import { UUIDParam } from "@/lib/validation"

/**
 * Fetch global platform statistics for the Super Admin dashboard.
 * SECURITY: Only superadmins can access platform-wide metrics.
 */
export async function getPlatformStats() {
  try {
    await requireAuth('superadmin')

    // Attempt to query the MRR view
    const { data: mrrData, error: mrrError } = await supabaseAdmin
      .from('vw_platform_mrr')
      .select('*')
      .maybeSingle()

    let current_mrr = 0
    let active_paid = 0

    if (mrrError) {
      console.warn("View vw_platform_mrr might not exist, falling back to manual aggregation")
      const { data: subs } = await supabaseAdmin
        .from('subscriptions')
        .select('*, plan:subscription_plans(price_monthly)')
        .eq('status', 'active')

      if (subs) {
        subs.forEach((sub: any) => {
          if (sub.plan?.price_monthly) {
            current_mrr += sub.plan.price_monthly
            if (sub.plan.price_monthly > 0) active_paid++
          }
        })
      }
    } else if (mrrData) {
      current_mrr = mrrData.current_mrr
      active_paid = mrrData.active_paid_subscriptions
    }

    const { count: shopsCount } = await supabaseAdmin
      .from('tenants')
      .select('*', { count: 'exact', head: true })

    const { count: suppliersCount } = await supabaseAdmin
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'supplier')

    const { data: tenantsList, error: tenantsError } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (tenantsError) throw tenantsError

    return {
      success: true,
      stats: {
        mrr: current_mrr,
        activePaidSubscriptions: active_paid,
        totalShops: shopsCount || 0,
        totalSuppliers: suppliersCount || 0,
      },
      tenants: tenantsList || []
    }
  } catch (error: any) {
    console.error("Superadmin stats error:", error)
    return { success: false, message: error.message }
  }
}

/**
 * Fetch detailed information about a specific tenant.
 * SECURITY: Only superadmins can view any tenant's details.
 */
export async function getTenantDetails(tenantId: string) {
  try {
    await requireAuth('superadmin')
    const validatedId = UUIDParam.parse(tenantId)

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .eq('id', validatedId)
      .single()

    if (tenantError) throw tenantError

    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('tenant_id', validatedId)
      .eq('status', 'active')
      .maybeSingle()

    const { count: userCount } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', validatedId)

    return {
      success: true,
      tenant,
      subscription,
      users: userCount || 0
    }
  } catch (error: any) {
    console.error("Fetch tenant details error:", error)
    return { success: false, message: error.message }
  }
}

/**
 * Fetch global billing history across all tenants.
 * SECURITY: Only superadmins can view the platform ledger.
 */
export async function getBillingHistory() {
  try {
    await requireAuth('superadmin')

    const { data: history, error } = await supabaseAdmin
      .from('subscription_history')
      .select('*, subscription:subscriptions(tenant_id, tenants(name))')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    return { success: true, history: history || [] }
  } catch (error: any) {
    console.error("Fetch billing history error:", error)
    return { success: false, message: error.message }
  }
}
