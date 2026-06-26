"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"
import { requireAuth } from "@/lib/auth-guard"
import { notify } from "@/lib/notifications/service"
import { PurchaseOrderEmail } from "@/lib/email/templates/PurchaseOrderEmail"
import { POStatusEmail } from "@/lib/email/templates/POStatusEmail"
import React from "react"

// Secure helper to get procurement context from authenticated user
export async function getProcurementContext() {
  const auth = await requireAuth(['admin', 'staff'])

  if (!auth.organizationId) {
    // Resolve org from tenant
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('tenant_id', auth.tenantId)
      .limit(1)
      .single()

    if (!org) throw new Error("Organization not found for this tenant")
    auth.organizationId = org.id
  }

  // Find a supplier profile (for this tenant's context)
  const { data: supplierProfile } = await supabaseAdmin
    .from('supplier_profiles')
    .select('id, business_name')
    .eq('tenant_id', auth.tenantId)
    .limit(1)
    .maybeSingle()

  // Find a default warehouse
  const { data: warehouse } = await supabaseAdmin
    .from('warehouses')
    .select('id')
    .eq('organization_id', auth.organizationId)
    .limit(1)
    .maybeSingle()

  return {
    tenantId: auth.tenantId,
    orgId: auth.organizationId,
    supplierId: supplierProfile?.id,
    warehouseId: warehouse?.id
  }
}

export async function getProcurementCatalog() {
  try {
    const ctx = await getProcurementContext()
    
    // For demo purposes, we fetch ALL active supplier products globally so that
    // any product added by the vendor account shows up for the shop immediately.
    const { data: products, error } = await supabaseAdmin
      .from('supplier_products')
      .select(`
        id,
        product_name,
        sku,
        supplier_id,
        supplier_pricing (
          price
        )
      `)
      .eq('is_active', true)
      .eq('is_deleted', false)

    if (error) throw error

    const catalog = products.map((p: any) => ({
      id: p.id,
      name: p.product_name,
      sku: p.sku || 'N/A',
      price: p.supplier_pricing?.[0]?.price || 0,
      supplierId: p.supplier_id
    }))

    return { success: true, products: catalog }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createPurchaseOrder(cart: { id: string, name: string, price: number, quantity: number, supplierId?: string }[]) {
  try {
    const ctx = await getProcurementContext()
    
    // For MVP, we'll assume all items in the cart belong to the same supplier,
    // so we grab the supplierId from the first item, or fallback to context.
    const targetSupplierId = cart[0]?.supplierId || ctx.supplierId
    
    if (!targetSupplierId || !ctx.warehouseId) throw new Error("Missing supplier or warehouse setup.")

    // Calculate totals
    const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
    const poNumber = `PO-${Date.now().toString().slice(-6)}`

    // 1. Create PO
    const { data: po, error: poError } = await supabaseAdmin
      .from('purchase_orders')
      .insert({
        tenant_id: ctx.tenantId,
        organization_id: ctx.orgId,
        supplier_id: targetSupplierId,
        warehouse_id: ctx.warehouseId,
        po_number: poNumber,
        status: 'pending_approval', // Requires vendor approval
        subtotal: totalAmount,
        total_amount: totalAmount,
        currency: 'INR'
      })
      .select('id')
      .single()

    if (poError) throw poError

    // 2. Create PO Items
    const poItems = cart.map(item => ({
      tenant_id: ctx.tenantId,
      po_id: po.id,
      supplier_product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      total_amount: item.price * item.quantity
    }))

    const { error: itemsError } = await supabaseAdmin
      .from('purchase_order_items')
      .insert(poItems)

    if (itemsError) throw itemsError

    // 3. Notify Vendor
    const { data: vendorOrg } = await supabaseAdmin
      .from('organizations')
      .select('name, created_by, users!created_by(email)')
      .eq('id', targetSupplierId)
      .single()

    const { data: shopOrg } = await supabaseAdmin
      .from('organizations')
      .select('name')
      .eq('id', ctx.orgId)
      .single()

    if (vendorOrg && vendorOrg.users) {
      const vendorUser = Array.isArray(vendorOrg.users) ? vendorOrg.users[0] : vendorOrg.users;
      await notify({
        tenantId: ctx.tenantId, // Vendor might be in a different tenant in a real multi-tenant setup, but we use shop's tenant for now
        userId: vendorOrg.created_by,
        channel: 'both',
        title: `New Purchase Order: ${poNumber}`,
        body: `You received a new order for ${cart.length} items from ${shopOrg?.name || 'a shop'}.`,
        email: vendorUser?.email ? {
          to: vendorUser.email,
          subject: `New Purchase Order ${poNumber}`,
          react: React.createElement(PurchaseOrderEmail, {
            poNumber,
            shopName: shopOrg?.name || 'SmartSupply Shop',
            totalAmount,
            itemsCount: cart.length,
            expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
          })
        } : undefined
      });
    }

    return { success: true, poNumber }
  } catch (error: any) {
    console.error("Create PO Error:", error)
    return { success: false, error: error.message }
  }
}

export async function getPurchaseOrders() {
  try {
    const ctx = await getProcurementContext()
    
    const { data: pos, error } = await supabaseAdmin
      .from('purchase_orders')
      .select(`
        id,
        po_number,
        status,
        total_amount,
        created_at,
        supplier_profiles(business_name),
        purchase_order_items(id)
      `)
      .eq('organization_id', ctx.orgId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const formatted = pos.map((po: any) => ({
      id: po.id,
      po_number: po.po_number,
      supplier: po.supplier_profiles?.business_name || 'Unknown Supplier',
      status: po.status,
      total: po.total_amount,
      itemsCount: po.purchase_order_items?.length || 0,
      created_at: po.created_at
    }))

    return { success: true, purchaseOrders: formatted }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function receivePurchaseOrder(poId: string) {
  try {
    const ctx = await getProcurementContext()

    // 1. Fetch PO and its items
    const { data: po, error: poError } = await supabaseAdmin
      .from('purchase_orders')
      .select('*, purchase_order_items(*)')
      .eq('id', poId)
      .eq('organization_id', ctx.orgId)
      .single()

    if (poError || !po) throw new Error("Purchase Order not found or unauthorized")

    if (po.status === 'fully_received') {
      return { success: true, message: "Already received" }
    }

    // 2. Process each item to update/insert products and batches
    for (const item of po.purchase_order_items) {
      // Find existing product by SKU + tenant_id
      let productId = item.product_id

      if (!productId) {
        // First try to match by SKU
        if (item.sku) {
          const { data: skuMatch } = await supabaseAdmin
            .from('products')
            .select('id')
            .eq('tenant_id', ctx.tenantId)
            .eq('sku', item.sku)
            .maybeSingle()
          
          if (skuMatch) productId = skuMatch.id
        }

        // If still not found, try to match by exact name (case-insensitive)
        if (!productId && item.product_name) {
          const { data: nameMatch } = await supabaseAdmin
            .from('products')
            .select('id')
            .eq('tenant_id', ctx.tenantId)
            .ilike('name', item.product_name)
            .limit(1)
            .maybeSingle()
            
          if (nameMatch) productId = nameMatch.id
        }
      }

      // If product doesn't exist in shop, create it
      if (!productId) {
        const { data: newProd, error: createProdError } = await supabaseAdmin
          .from('products')
          .insert({
            tenant_id: ctx.tenantId,
            organization_id: ctx.orgId,
            name: item.product_name,
            sku: item.sku || `SKU-${Date.now()}`,
            selling_price: item.unit_price * 1.2, // Default 20% markup
            status: 'active'
          })
          .select('id')
          .single()

        if (createProdError) throw createProdError
        productId = newProd.id
      }

      // Create a batch for inventory
      const { error: batchError } = await supabaseAdmin
        .from('batches')
        .insert({
          tenant_id: ctx.tenantId,
          product_id: productId,
          batch_number: `BATCH-${po.po_number}-${item.sku || 'NOSKU'}-${item.id.substring(0,8)}`,
          quantity: item.quantity,
          cost_price: item.unit_price,
          status: 'active'
        })

      if (batchError) throw batchError
    }

    // 4. Update PO status
    const { error: updateError } = await supabaseAdmin
      .from('purchase_orders')
      .update({ status: 'fully_received' })
      .eq('id', poId)

    if (updateError) throw updateError

    // 5. Notify Vendor that goods were received
    const { data: vendorOrg } = await supabaseAdmin
      .from('organizations')
      .select('name, created_by, users!created_by(email)')
      .eq('id', po.supplier_id)
      .single()

    if (vendorOrg && vendorOrg.users) {
      const vendorUser = Array.isArray(vendorOrg.users) ? vendorOrg.users[0] : vendorOrg.users;
      await notify({
        tenantId: ctx.tenantId,
        userId: vendorOrg.created_by,
        data: {
          poNumber: po.po_number
        },
        channel: 'both',
        title: `Goods Received for ${po.po_number}`,
        body: `The shop has successfully received the goods for purchase order ${po.po_number}.`,
        email: vendorUser?.email ? {
          to: vendorUser.email,
          subject: `Goods Received: ${po.po_number}`,
          react: React.createElement(POStatusEmail, {
            poNumber: po.po_number,
            vendorName: vendorOrg.name,
            status: 'fully_received'
          })
        } : undefined
      });
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error receiving purchase order:", error)
    return { success: false, error: error.message }
  }
}
