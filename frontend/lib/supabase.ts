import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// A utility to ensure we have a default tenant and organization 
// Uses .maybeSingle() to avoid PGRST116 errors on empty results
export async function ensureDefaultSetup() {
  try {
    // 1. Check for Tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .limit(1)
      .maybeSingle()
    
    // 2. Check for Organization (Retailer)
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('type', 'retailer')
      .limit(1)
      .maybeSingle()
    
    // 3. Check for Supplier (for Purchase Orders)
    const { data: supplier } = await supabase
      .from('organizations')
      .select('id')
      .eq('type', 'supplier')
      .limit(1)
      .maybeSingle()
    
    // 4. Ensure Supplier Profile exists
    const { data: supplierProfile } = await supabase
      .from('supplier_profiles')
      .select('id')
      .eq('organization_id', supplier?.id)
      .limit(1)
      .maybeSingle()

    // 5. Ensure Warehouse exists
    const { data: warehouse } = await supabase
      .from('warehouses')
      .select('id')
      .eq('organization_id', org?.id)
      .limit(1)
      .maybeSingle()

    return { 
      tenantId: tenant?.id || null, 
      orgId: org?.id || null, 
      supplierId: supplier?.id || null,
      supplierProfileId: supplierProfile?.id || null,
      warehouseId: warehouse?.id || null
    }
  } catch (err) {
    console.error('Error ensuring default setup:', err)
    return { tenantId: null, orgId: null, supplierId: null, supplierProfileId: null, warehouseId: null }
  }
}
