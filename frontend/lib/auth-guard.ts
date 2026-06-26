import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { supabaseAdmin } from "@/lib/supabase-admin"

export type AuthContext = {
  userId: string
  email: string
  role: string
  staffType?: string
  tenantId: string
  organizationId?: string
}

/**
 * Centralized server-side authentication guard.
 * Verifies the caller's identity from cookies and resolves their tenant.
 * 
 * @param requiredRole - If provided, enforces that the user has this role.
 *                       Accepts a single role or an array of allowed roles.
 * @throws Error if unauthenticated, unauthorized, or tenant not found.
 */
export async function requireAuth(requiredRole?: string | string[]): Promise<AuthContext> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() { /* read-only in server actions */ }
      }
    }
  )

  // 1. Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("UNAUTHORIZED: Authentication required")
  }

  const role = user.user_metadata?.role || 'admin'
  const staffType = user.user_metadata?.staff_type

  // 2. Enforce role check
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    if (!allowedRoles.includes(role)) {
      throw new Error(`FORBIDDEN: Requires role [${allowedRoles.join(', ')}], but user has role [${role}]`)
    }
  }

  // 3. Resolve tenant (NEVER fall back to "first tenant")
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (userError || !userData?.tenant_id) {
    console.error("Auth Guard Error:", userError)
    throw new Error("FORBIDDEN: User is not associated with any tenant")
  }

  return {
    userId: user.id,
    email: user.email || '',
    role,
    staffType,
    tenantId: userData.tenant_id,
  }
}

/**
 * Verifies that a resource belongs to the caller's tenant.
 * Prevents cross-tenant data access (IDOR / horizontal privilege escalation).
 */
export function assertTenantOwnership(resourceTenantId: string | null | undefined, callerTenantId: string): void {
  if (!resourceTenantId || resourceTenantId !== callerTenantId) {
    throw new Error("FORBIDDEN: Resource does not belong to your organization")
  }
}
