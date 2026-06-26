import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// A utility to ensure we have a default tenant and organization 
// for our mock CRUD operations to work (since foreign keys are NOT NULL).
// Uses .maybeSingle() to avoid PGRST116 errors on empty results,
// and gracefully handles RLS-blocked inserts by retrying the select.
export async function ensureDefaultSetup() {
  try {
    // 1. Check for Tenant
    let { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .limit(1)
      .maybeSingle()
    
    if (!tenant) {
      // Try to create one — may fail due to RLS
      const { data: newTenant, error } = await supabase.from('tenants').insert({
        name: 'SmartSupply Default Tenant',
        slug: 'default-tenant',
        tier: 'starter',
        status: 'active'
      }).select('id').maybeSingle()
      
      if (!error && newTenant) {
        tenant = newTenant
      } else {
        // INSERT failed (RLS or duplicate) — retry select in case another session created it
        console.warn('Tenant insert failed (likely RLS), retrying select...', error?.message)
        const { data: retryTenant } = await supabase
          .from('tenants')
          .select('id')
          .limit(1)
          .maybeSingle()
        tenant = retryTenant
      }
    }

    if (!tenant?.id) {
      console.error('No tenant found and unable to create one. Check Supabase RLS policies on the tenants table.')
      return { tenantId: null, orgId: null, supplierId: null }
    }

    // 2. Check for Organization (Retailer)
    let { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('type', 'retailer')
      .limit(1)
      .maybeSingle()
    
    if (!org) {
      const { data: newOrg, error } = await supabase.from('organizations').insert({
        tenant_id: tenant.id,
        name: 'SmartSupply Default Org',
        slug: 'default-org',
        type: 'retailer',
        status: 'active'
      }).select('id').maybeSingle()
      
      if (!error && newOrg) {
        org = newOrg
      } else {
        console.warn('Org insert failed, retrying select...', error?.message)
        const { data: retryOrg } = await supabase
          .from('organizations')
          .select('id')
          .limit(1)
          .maybeSingle()
        org = retryOrg
      }
    }

    // 3. Check for Supplier (for Purchase Orders)
    let { data: supplier } = await supabase
      .from('organizations')
      .select('id')
      .eq('type', 'supplier')
      .limit(1)
      .maybeSingle()
    
    if (!supplier) {
      const { data: newSupplier, error } = await supabase.from('organizations').insert({
        tenant_id: tenant.id,
        name: 'Global Pharma Distributors',
        slug: 'global-pharma-distributors',
        type: 'supplier',
        status: 'active'
      }).select('id').maybeSingle()
      
      if (!error && newSupplier) {
        supplier = newSupplier
      } else {
        console.warn('Supplier insert failed, retrying select...', error?.message)
        const { data: retrySupplier } = await supabase
          .from('organizations')
          .select('id')
          .eq('type', 'supplier')
          .limit(1)
          .maybeSingle()
        supplier = retrySupplier
      }
    }

    // 4. Ensure Supplier Profile exists
    let { data: supplierProfile } = await supabase
      .from('supplier_profiles')
      .select('id')
      .eq('organization_id', supplier?.id)
      .limit(1)
      .maybeSingle()

    if (!supplierProfile && supplier?.id) {
      const { data: newProfile } = await supabase.from('supplier_profiles').insert({
        tenant_id: tenant.id,
        organization_id: supplier.id,
        business_name: 'Global Pharma Distributors',
      }).select('id').maybeSingle()
      
      supplierProfile = newProfile || null
    }

    // 5. Ensure Warehouse exists
    let { data: warehouse } = await supabase
      .from('warehouses')
      .select('id')
      .eq('organization_id', org?.id)
      .limit(1)
      .maybeSingle()

    if (!warehouse && org?.id) {
      const { data: newWarehouse } = await supabase.from('warehouses').insert({
        tenant_id: tenant.id,
        organization_id: org.id,
        name: 'Main Retail Storefront',
        code: 'MAIN-01',
        type: 'store'
      }).select('id').maybeSingle()

      warehouse = newWarehouse || null
    }

    return { 
      tenantId: tenant?.id, 
      orgId: org?.id, 
      supplierId: supplier?.id,
      supplierProfileId: supplierProfile?.id,
      warehouseId: warehouse?.id
    }
  } catch (err) {
    console.error('Error ensuring default setup:', err)
    return { tenantId: null, orgId: null, supplierId: null, supplierProfileId: null, warehouseId: null }
  }
}
