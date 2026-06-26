"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { notify } from "@/lib/notifications/service"
import { LowStockAlertEmail } from "@/lib/email/templates/LowStockAlertEmail"
import React from "react"

export async function getPosProducts() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error("Unauthorized")

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    let activeTenantId = userData?.tenant_id
    if (!activeTenantId) {
      const { data: firstTenant } = await supabaseAdmin.from('tenants').select('id').limit(1).single()
      if (firstTenant) activeTenantId = firstTenant.id
      else throw new Error("Tenant not found")
    }

    // Fetch products and their active batches to calculate quantity
    const { data: products, error: prodError } = await supabaseAdmin
      .from('products')
      .select('id, name, sku, selling_price, barcode, status, batches(quantity)')
      .eq('tenant_id', activeTenantId)
      .eq('status', 'active')

    if (prodError) throw prodError

    const formattedProducts = products?.map((p: any) => ({
      ...p,
      quantity: p.batches?.reduce((sum: number, b: any) => sum + (b.quantity || 0), 0) || 0,
      batches: undefined // Remove raw batches from payload
    }))

    return { success: true, products: formattedProducts }
  } catch (error: any) {
    console.error("Error fetching POS products:", error)
    return { success: false, error: error.message }
  }
}

export async function checkoutPosOrder(cartItems: any[], paymentMethod: string, customerPhone?: string, customerName?: string) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error("Unauthorized")

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('tenant_id, organization_id')
      .eq('id', user.id)
      .single()

    let activeTenantId = userData?.tenant_id
    if (!activeTenantId) {
      const { data: firstTenant } = await supabaseAdmin.from('tenants').select('id').limit(1).single()
      if (firstTenant) activeTenantId = firstTenant.id
      else throw new Error("Tenant not found")
    }

    let finalCustomerId = null

    // Handle Customer Details
    if (customerPhone) {
      // Look for existing customer by phone in the customers table
      const { data: existingCustomer } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('tenant_id', activeTenantId)
        .eq('phone', customerPhone)
        .limit(1)
        .maybeSingle()

      if (existingCustomer) {
        finalCustomerId = existingCustomer.id
      } else {
        // Create new customer
        const { data: newCustomer, error: createCustErr } = await supabaseAdmin
          .from('customers')
          .insert({
            tenant_id: activeTenantId,
            first_name: customerName || `Customer ${customerPhone}`,
            phone: customerPhone
          })
          .select('id')
          .single()
        
        if (!createCustErr && newCustomer) {
          finalCustomerId = newCustomer.id
        } else {
          console.error('Customer creation error:', createCustErr)
        }
      }
    }

    const subtotal = cartItems.reduce((acc, item) => acc + (item.selling_price * item.quantity), 0)
    // Simplified tax/discount for MVP
    const totalAmount = subtotal
    
    // Create POS Order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('pos_orders')
      .insert({
        tenant_id: activeTenantId,
        customer_id: finalCustomerId,
        receipt_number: `REC-${Date.now()}`,
        status: 'completed',
        subtotal,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        cashier_id: user.id
      })
      .select('id')
      .single()

    if (orderError) throw orderError

    // Insert Order Items
    const orderItemsPayload = cartItems.map(item => ({
      pos_order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.selling_price,
      total_price: item.selling_price * item.quantity
    }))

    const { error: itemsError } = await supabaseAdmin
      .from('pos_order_items')
      .insert(orderItemsPayload)

    if (itemsError) throw itemsError

    if (itemsError) throw itemsError

    // Deduct Inventory
    for (const item of cartItems) {
      // Find active batches for this product
      const { data: activeBatches } = await supabaseAdmin
        .from('batches')
        .select('id, quantity')
        .eq('product_id', item.id)
        .gt('quantity', 0)
        .order('created_at', { ascending: true })

      let totalRemainingStock = 0;

      if (activeBatches && activeBatches.length > 0) {
        let remainingToDeduct = item.quantity
        for (const batch of activeBatches) {
          const deductAmount = Math.max(0, Math.min(batch.quantity, remainingToDeduct))
          const newQuantity = batch.quantity - deductAmount
          remainingToDeduct -= deductAmount
          totalRemainingStock += newQuantity
          
          if (deductAmount > 0) {
            await supabaseAdmin
              .from('batches')
              .update({ quantity: newQuantity })
              .eq('id', batch.id)
          }
        }
      }

      // Check Low Stock Threshold (e.g., 10 units)
      const THRESHOLD = 10;
      if (totalRemainingStock < THRESHOLD && totalRemainingStock + item.quantity >= THRESHOLD) {
        // Find shop owner to notify
        const { data: orgData } = await supabaseAdmin
          .from('organizations')
          .select('created_by, users!created_by(email)')
          .eq('id', activeTenantId) // Assuming activeTenantId matches org id for this scope, or we notify the POS user
          .single()
          
        const notifyUserId = orgData?.created_by || user.id;
        const notifyUserEmail = orgData?.users ? (Array.isArray(orgData.users) ? orgData.users[0]?.email : (orgData.users as any)?.email) : user.email;

        await notify({
          tenantId: activeTenantId,
          userId: notifyUserId,
          channel: 'both',
          data: { productId: item.id, stock: totalRemainingStock },
          title: `Low Stock Alert: ${item.name}`,
          body: `${item.name} has dropped to ${totalRemainingStock} units. Please reorder.`,
          email: notifyUserEmail ? {
            to: notifyUserEmail,
            subject: `Low Stock Alert: ${item.name}`,
            react: React.createElement(LowStockAlertEmail, {
              productName: item.name,
              sku: item.sku || 'N/A',
              currentQuantity: totalRemainingStock,
              threshold: THRESHOLD
            })
          } : undefined
        });
      }
    }

    return { success: true, orderId: order.id }
  } catch (error: any) {
    console.error("POS Checkout error:", error)
    return { success: false, error: error.message }
  }
}

export async function getSalesOrders() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error("Unauthorized")

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!userData?.tenant_id) throw new Error("Tenant not found")

    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('pos_orders')
      .select(`
        id,
        receipt_number,
        status,
        subtotal,
        tax_amount,
        discount_amount,
        total_amount,
        payment_method,
        cashier_id,
        customer_id,
        created_at,
        pos_order_items (
          id,
          product_name,
          quantity,
          unit_price,
          total_price
        )
      `)
      .eq('tenant_id', userData.tenant_id)
      .order('created_at', { ascending: false })

    if (ordersError) throw ordersError

    // Fetch cashier names
    const cashierIds = Array.from(new Set((orders || []).map((o: any) => o.cashier_id).filter(Boolean)))
    let cashierMap: Record<string, string> = {}
    if (cashierIds.length > 0) {
      const { data: cashiers } = await supabaseAdmin
        .from('users')
        .select('id, display_name, first_name, email')
        .in('id', cashierIds)

      if (cashiers) {
        cashierMap = Object.fromEntries(
          cashiers.map((c: any) => [c.id, c.display_name || c.first_name || c.email?.split('@')[0] || 'Staff'])
        )
      }
    }

    const formattedOrders = (orders || []).map((o: any) => ({
      ...o,
      cashier_name: cashierMap[o.cashier_id] || 'Unknown',
      items_count: o.pos_order_items?.length || 0,
    }))

    return { success: true, orders: formattedOrders }
  } catch (error: any) {
    console.error("Error fetching sales orders:", error)
    return { success: false, error: error.message }
  }
}
