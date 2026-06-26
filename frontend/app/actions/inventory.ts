"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function getInventoryProducts() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error("Unauthorized")

    // Fetch user tenant
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!userData?.tenant_id) throw new Error("Tenant not found")

    // Fetch products and their batches
    const { data: products, error: prodError } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        batches (
          id,
          batch_number,
          quantity,
          expiry_date,
          cost_price
        )
      `)
      .eq('tenant_id', userData.tenant_id)

    if (prodError) throw prodError

    // Map to calculate total stock
    const formattedProducts = products.map((p: any) => {
      const activeBatches = p.batches || []
      const totalStock = activeBatches.reduce((sum: number, b: any) => sum + (b.quantity || 0), 0)
      
      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category_id || "Uncategorized",
        stock: totalStock,
        status: totalStock > 10 ? "In Stock" : (totalStock > 0 ? "Low Stock" : "Out of Stock"),
        price: p.selling_price || 0,
        cost_price: p.cost_price || 0,
        batches: activeBatches
      }
    })

    return { success: true, products: formattedProducts }
  } catch (error: any) {
    console.error("Error fetching inventory products:", error)
    return { success: false, error: error.message }
  }
}

export async function addProductBatch(productId: string, payload: {
  batchNumber: string,
  mfgDate: string,
  expDate: string,
  quantity: number,
  costPrice: number,
  sellingPrice: number
}) {
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

    // Insert batch
    const { error: batchError } = await supabaseAdmin
      .from('batches')
      .insert({
        tenant_id: userData.tenant_id,
        product_id: productId,
        batch_number: payload.batchNumber,
        manufacturing_date: payload.mfgDate || null,
        expiry_date: payload.expDate || null,
        quantity: payload.quantity,
        cost_price: payload.costPrice,
        status: 'active'
      })

    if (batchError) throw batchError

    // Also update product cost/selling price for latest batch
    await supabaseAdmin
      .from('products')
      .update({
        cost_price: payload.costPrice,
        selling_price: payload.sellingPrice
      })
      .eq('id', productId)

    return { success: true }
  } catch (error: any) {
    console.error("Error adding product batch:", error)
    return { success: false, error: error.message }
  }
}
