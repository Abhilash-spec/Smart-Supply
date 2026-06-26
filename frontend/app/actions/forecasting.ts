"use server"

import { requireAuth } from "@/lib/auth-guard"
import { supabaseAdmin } from "@/lib/supabase-admin"

// Heuristic constants for the "Smart" Engine
const LEAD_TIME_DAYS = 7;
const SAFETY_STOCK_DAYS = 3;
const BUFFER_MULTIPLIER = 1.5;

export async function generateSmartForecast() {
  try {
    const auth = await requireAuth(['admin', 'staff'])
    const targetTenantId = auth.tenantId

    // 1. Fetch all products for the tenant
    const { data: products, error: pError } = await supabaseAdmin
      .from('products')
      .select('id, name, sku, stock_quantity, min_stock_level, price')
      .eq('tenant_id', targetTenantId)

    if (pError) throw pError

    // 2. Fetch sales data from the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: orders, error: oError } = await supabaseAdmin
      .from('pos_orders')
      .select(`
        id, 
        pos_order_items(product_id, quantity)
      `)
      .eq('tenant_id', targetTenantId)
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgo.toISOString())

    if (oError) throw oError

    // 3. Aggregate sales velocity per product
    const salesMap: Record<string, number> = {}
    
    // Initialize map
    products.forEach((p: any) => salesMap[p.id] = 0)

    // Sum quantities
    orders.forEach((order: any) => {
      order.pos_order_items?.forEach((item: any) => {
        if (salesMap[item.product_id] !== undefined) {
          salesMap[item.product_id] += item.quantity
        }
      })
    })

    // 4. Calculate forecasting metrics
    const forecasts = products.map((product: any) => {
      const unitsSold30d = salesMap[product.id] || 0
      
      // Use real sales data only — no mock/random data in production (HIGH-05 fix)
      const dailyVelocity = unitsSold30d / 30.0
      
      const leadTimeDemand = dailyVelocity * LEAD_TIME_DAYS
      const safetyStock = dailyVelocity * SAFETY_STOCK_DAYS
      const reorderPoint = Math.ceil(leadTimeDemand + safetyStock)
      
      const currentStock = product.stock_quantity
      
      // Determine status risk
      let riskLevel = 'healthy'
      if (currentStock <= 0) riskLevel = 'out_of_stock'
      else if (currentStock <= reorderPoint) riskLevel = 'critical'
      else if (currentStock <= reorderPoint * 1.5) riskLevel = 'warning'

      // Calculate suggested order quantity
      let suggestedOrder = 0
      if (riskLevel === 'critical' || riskLevel === 'out_of_stock') {
        // Target max stock level (Reorder Point * Buffer) minus current stock
        suggestedOrder = Math.ceil((reorderPoint * BUFFER_MULTIPLIER) - currentStock)
        // Ensure we order at least a minimum logical batch
        if (suggestedOrder < 5) suggestedOrder = 10
      }

      return {
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        current_stock: currentStock,
        daily_velocity: Number(dailyVelocity.toFixed(2)),
        reorder_point: reorderPoint,
        suggested_order: suggestedOrder,
        risk_level: riskLevel,
        estimated_stockout_days: dailyVelocity > 0 ? Math.floor(currentStock / dailyVelocity) : 999,
        potential_lost_revenue: riskLevel === 'out_of_stock' ? Number((dailyVelocity * product.price * 7).toFixed(2)) : 0
      }
    })

    // Sort: Out of stock first, then critical, then warning
    const riskWeights: Record<string, number> = { 'out_of_stock': 3, 'critical': 2, 'warning': 1, 'healthy': 0 }
    forecasts.sort((a: any, b: any) => riskWeights[b.risk_level] - riskWeights[a.risk_level] || a.estimated_stockout_days - b.estimated_stockout_days)

    return { success: true, forecasts }

  } catch (error: any) {
    console.error("Forecasting error:", error)
    return { success: false, message: error.message }
  }
}
