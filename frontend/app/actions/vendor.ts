"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"
import { requireAuth, assertTenantOwnership } from "@/lib/auth-guard"
import { AddCatalogItemSchema, UpdateCatalogItemSchema, UUIDParam, POStatusSchema } from "@/lib/validation"
import { notify } from "@/lib/notifications/service"
import { POStatusEmail } from "@/lib/email/templates/POStatusEmail"
import React from "react"

export async function getVendorCatalog() {
  try {
    const auth = await requireAuth(['vendor', 'admin', 'staff'])

    // Find supplier profile for this tenant
    const { data: supplierProfile } = await supabaseAdmin
      .from('supplier_profiles')
      .select('id')
      .eq('tenant_id', auth.tenantId)
      .limit(1)
      .maybeSingle()

    if (!supplierProfile) {
      return { success: true, products: [], tenantId: auth.tenantId, supplierProfileId: null }
    }

    const { data: products, error } = await supabaseAdmin
      .from('supplier_products')
      .select(`
        id,
        product_name,
        sku,
        is_active,
        created_at,
        supplier_pricing (
          price,
          currency,
          min_quantity
        )
      `)
      .eq('supplier_id', supplierProfile.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (error) throw error

    const formattedProducts = products.map((p: any) => {
      const activePricing = p.supplier_pricing?.[0] || { price: 0 }
      return {
        id: p.id,
        sku: p.sku || 'N/A',
        name: p.product_name,
        price: activePricing.price,
        status: p.is_active ? 'active' : 'inactive',
        created_at: p.created_at
      }
    })

    return { success: true, products: formattedProducts, supplierProfileId: supplierProfile.id, tenantId: auth.tenantId }
  } catch (error: any) {
    console.error("Error fetching vendor catalog:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Add a new item to the vendor's catalog.
 * SECURITY: Authenticated + validates inputs + tenant-scoped.
 */
export async function addVendorCatalogItem(payload: {
  tenantId: string,
  supplierId: string,
  name: string,
  sku: string,
  price: number
}) {
  try {
    const auth = await requireAuth(['vendor', 'admin'])

    // Validate inputs
    AddCatalogItemSchema.parse({ name: payload.name, sku: payload.sku, price: payload.price })

    // Enforce tenant ownership — caller can only add to their own tenant
    assertTenantOwnership(payload.tenantId, auth.tenantId)

    // 1. Insert product
    const { data: product, error: prodError } = await supabaseAdmin
      .from('supplier_products')
      .insert({
        tenant_id: auth.tenantId,
        supplier_id: payload.supplierId,
        product_name: payload.name,
        sku: payload.sku,
        is_active: true
      })
      .select('id')
      .single()

    if (prodError) throw prodError

    // 2. Insert pricing
    const { error: priceError } = await supabaseAdmin
      .from('supplier_pricing')
      .insert({
        tenant_id: auth.tenantId,
        supplier_product_id: product.id,
        price: payload.price,
        currency: 'INR',
        min_quantity: 1,
        is_active: true
      })

    if (priceError) throw priceError

    return { success: true }
  } catch (error: any) {
    console.error("Error adding vendor catalog item:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Update an existing vendor catalog item.
 * SECURITY: Authenticated + validates inputs + verifies item ownership.
 */
export async function updateVendorCatalogItem(id: string, payload: { name: string, sku: string, price: number }) {
  try {
    const auth = await requireAuth(['vendor', 'admin'])
    const validatedId = UUIDParam.parse(id)
    UpdateCatalogItemSchema.parse(payload)

    // Verify ownership: the product must belong to the caller's tenant
    const { data: existing } = await supabaseAdmin
      .from('supplier_products')
      .select('tenant_id')
      .eq('id', validatedId)
      .single()

    assertTenantOwnership(existing?.tenant_id, auth.tenantId)

    const { error: prodError } = await supabaseAdmin
      .from('supplier_products')
      .update({
        product_name: payload.name,
        sku: payload.sku,
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedId)

    if (prodError) throw prodError

    const { error: priceError } = await supabaseAdmin
      .from('supplier_pricing')
      .update({
        price: payload.price,
        updated_at: new Date().toISOString()
      })
      .eq('supplier_product_id', validatedId)

    if (priceError) throw priceError

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Soft-delete a vendor catalog item.
 * SECURITY: Authenticated + verifies item ownership.
 */
export async function deleteVendorCatalogItem(id: string) {
  try {
    const auth = await requireAuth(['vendor', 'admin'])
    const validatedId = UUIDParam.parse(id)

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('supplier_products')
      .select('tenant_id')
      .eq('id', validatedId)
      .single()

    assertTenantOwnership(existing?.tenant_id, auth.tenantId)

    const { error } = await supabaseAdmin
      .from('supplier_products')
      .update({ is_deleted: true, is_active: false })
      .eq('id', validatedId)

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Update a purchase order's status (approve, reject, ship, etc.)
 * SECURITY: Authenticated + validates status enum + notifies shop owner.
 */
export async function updatePurchaseOrderStatus(id: string, newStatus: string) {
  try {
    const auth = await requireAuth(['vendor', 'admin'])
    const validatedId = UUIDParam.parse(id)
    const validatedStatus = POStatusSchema.parse(newStatus)

    const { data: po, error: fetchError } = await supabaseAdmin
      .from('purchase_orders')
      .select('*')
      .eq('id', validatedId)
      .single()

    if (fetchError) throw fetchError

    // 1. Update PO Status
    const { error: updateError } = await supabaseAdmin
      .from('purchase_orders')
      .update({ status: validatedStatus, updated_at: new Date().toISOString() })
      .eq('id', validatedId)

    if (updateError) throw updateError

    // 2. If approved, generate an Invoice
    if (validatedStatus === 'approved') {
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 30)

      const { error: invoiceError } = await supabaseAdmin
        .from('invoices')
        .insert({
          tenant_id: po.tenant_id,
          organization_id: po.organization_id,
          invoice_number: invoiceNumber,
          type: 'purchase',
          po_id: po.id,
          buyer_details: { organization_id: po.organization_id },
          seller_details: { supplier_id: po.supplier_id },
          status: 'draft',
          subtotal: po.subtotal,
          total_amount: po.total_amount,
          amount_due: po.total_amount,
          currency: po.currency,
          due_date: dueDate.toISOString()
        })

      if (invoiceError) {
        console.error("Failed to generate invoice:", invoiceError)
      }
    }

    // 3. Notify Shop Owner
    const { data: shopOrg } = await supabaseAdmin
      .from('organizations')
      .select('name, created_by, users!created_by(email)')
      .eq('id', po.organization_id)
      .single()

    const { data: vendorOrg } = await supabaseAdmin
      .from('organizations')
      .select('name')
      .eq('id', po.supplier_id)
      .single()

    if (shopOrg && shopOrg.users) {
      const shopUser = Array.isArray(shopOrg.users) ? shopOrg.users[0] : shopOrg.users;
      await notify({
        tenantId: po.tenant_id,
        userId: shopOrg.created_by,
        channel: 'both',
        data: {
          poNumber: po.po_number,
          newStatus: validatedStatus
        },
        title: `Purchase Order Update: ${po.po_number}`,
        body: `Your purchase order status has been updated to: ${validatedStatus}`,
        email: shopUser?.email ? {
          to: shopUser.email,
          subject: `Purchase Order Update: ${po.po_number}`,
          react: React.createElement(POStatusEmail, {
            poNumber: po.po_number,
            vendorName: vendorOrg?.name || 'Your Vendor',
            status: validatedStatus
          })
        } : undefined
      });
    }

    return { success: true }
  } catch (error: any) {
    console.error("Failed to update PO status:", error)
    return { success: false, error: error.message }
  }
}

export async function getVendorOrders() {
  try {
    const auth = await requireAuth(['vendor', 'admin', 'staff'])

    const { data: supplierProfile } = await supabaseAdmin
      .from('supplier_profiles')
      .select('id')
      .eq('tenant_id', auth.tenantId)
      .limit(1)
      .maybeSingle()

    if (!supplierProfile) {
      return { success: true, orders: [] }
    }

    const { data: orders, error } = await supabaseAdmin
      .from('purchase_orders')
      .select('*, organizations(name)')
      .eq('supplier_id', supplierProfile.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, orders }
  } catch (error: any) {
    console.error("Error fetching vendor orders:", error)
    return { success: false, error: error.message }
  }
}

export async function getVendorInvoices() {
  try {
    const auth = await requireAuth(['vendor', 'admin', 'staff'])

    const { data: supplierProfile } = await supabaseAdmin
      .from('supplier_profiles')
      .select('id')
      .eq('tenant_id', auth.tenantId)
      .limit(1)
      .maybeSingle()

    if (!supplierProfile) {
      return { success: true, invoices: [] }
    }

    const { data: invoices, error } = await supabaseAdmin
      .from('invoices')
      .select('*, purchase_orders(po_number)')
      .eq('seller_details->>supplier_id', supplierProfile.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, invoices }
  } catch (error: any) {
    console.error("Error fetching vendor invoices:", error)
    return { success: false, error: error.message }
  }
}
