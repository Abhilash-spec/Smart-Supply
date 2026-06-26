"use server"

import { getProcurementContext } from './procurement'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function getShopInvoices() {
  try {
    const ctx = await getProcurementContext()

    const { data: invoices, error } = await supabaseAdmin
      .from('invoices')
      .select('*, purchase_orders(po_number)')
      .eq('organization_id', ctx.orgId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, invoices }
  } catch (error: any) {
    console.error("Error fetching shop invoices:", error)
    return { success: false, error: error.message }
  }
}
