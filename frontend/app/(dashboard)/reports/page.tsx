"use client"

import { useState, useEffect } from "react"
import { BarChart3, TrendingUp, Package, AlertTriangle, IndianRupee, ShoppingCart, Loader2, ArrowUpRight, ArrowDownRight, Truck, Receipt } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<any[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [salesOrders, setSalesOrders] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"overview" | "sales" | "purchase" | "products" | "alerts">("overview")

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [productsRes, poRes, salesRes] = await Promise.all([
        supabase.from('products').select('*').order('selling_price', { ascending: false }),
        supabase.from('purchase_orders').select('*').order('created_at', { ascending: false }),
        supabase.from('pos_orders').select('*, pos_order_items(id, product_name, quantity, unit_price, total_price)').order('created_at', { ascending: false }),
      ])

      if (productsRes.data) setProducts(productsRes.data)
      if (poRes.data) setPurchaseOrders(poRes.data)
      if (salesRes.data) setSalesOrders(salesRes.data)
    } catch (err) {
      console.error("Error fetching report data:", err)
    } finally {
      setLoading(false)
    }
  }

  // Compute KPI metrics
  const completedSales = salesOrders.filter(o => o.status === 'completed')
  const totalSalesRevenue = completedSales.reduce((sum, o) => sum + (o.total_amount || 0), 0)
  const totalPurchaseSpend = purchaseOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
  const totalProducts = products.length
  const lowStockItems = products.filter(p => (p.reorder_quantity || 0) <= 5)
  const grossProfit = totalSalesRevenue - totalPurchaseSpend
  const profitMargin = totalSalesRevenue > 0 ? ((grossProfit / totalSalesRevenue) * 100) : 0

  // ---- Sales report data ----
  const salesByDay = (() => {
    const map: Record<string, number> = {}
    completedSales.forEach(o => {
      const day = new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      map[day] = (map[day] || 0) + (o.total_amount || 0)
    })
    return Object.entries(map).slice(-14).map(([name, value]) => ({ name, value }))
  })()
  const maxSalesDay = Math.max(...salesByDay.map(d => d.value), 1)

  // Payment method breakdown
  const paymentBreakdown = (() => {
    const map: Record<string, number> = {}
    completedSales.forEach(o => {
      const method = o.payment_method || 'other'
      map[method] = (map[method] || 0) + (o.total_amount || 0)
    })
    return Object.entries(map).map(([method, amount]) => ({ method, amount, pct: totalSalesRevenue > 0 ? ((amount / totalSalesRevenue) * 100).toFixed(1) : '0' }))
  })()

  // Top selling products
  const topSellingProducts = (() => {
    const map: Record<string, { name: string, qty: number, revenue: number }> = {}
    salesOrders.forEach(o => {
      (o.pos_order_items || []).forEach((item: any) => {
        if (!map[item.product_name]) map[item.product_name] = { name: item.product_name, qty: 0, revenue: 0 }
        map[item.product_name].qty += item.quantity
        map[item.product_name].revenue += item.total_price || 0
      })
    })
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 10)
  })()
  const maxSellingRevenue = Math.max(...topSellingProducts.map(p => p.revenue), 1)

  // ---- Purchase report data ----
  const poByStatus = (() => {
    const map: Record<string, { count: number, amount: number }> = {}
    purchaseOrders.forEach(o => {
      const s = o.status || 'unknown'
      if (!map[s]) map[s] = { count: 0, amount: 0 }
      map[s].count++
      map[s].amount += o.total_amount || 0
    })
    return Object.entries(map).map(([status, data]) => ({ status, ...data }))
  })()

  const poByMonth = (() => {
    const map: Record<string, number> = {}
    purchaseOrders.forEach(o => {
      const month = new Date(o.created_at).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
      map[month] = (map[month] || 0) + (o.total_amount || 0)
    })
    return Object.entries(map).slice(-12).map(([name, value]) => ({ name, value }))
  })()
  const maxPoMonth = Math.max(...poByMonth.map(d => d.value), 1)

  // Top products by selling price
  const topProducts = [...products]
    .sort((a, b) => (b.selling_price || 0) - (a.selling_price || 0))
    .slice(0, 8)

  const statusColorMap: Record<string, string> = {
    pending_approval: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    sent: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
    fully_received: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
        <p className="text-muted-foreground mt-1">Comprehensive overview of your business performance.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sales Revenue</h3>
            <IndianRupee className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : `₹${totalSalesRevenue.toLocaleString()}`}
          </div>
          <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3" /> From {completedSales.length} POS sales
          </p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Purchase Spend</h3>
            <Truck className="h-4 w-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : `₹${totalPurchaseSpend.toLocaleString()}`}
          </div>
          <p className="text-xs text-muted-foreground mt-1">From {purchaseOrders.length} purchase orders</p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Gross Profit</h3>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </div>
          <div className={`text-2xl font-bold ${grossProfit >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : `₹${grossProfit.toLocaleString()}`}
          </div>
          <p className={`text-xs mt-1 flex items-center gap-1 ${profitMargin >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
            {profitMargin >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {profitMargin.toFixed(1)}% margin
          </p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Low Stock Alerts</h3>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
          <div className="text-2xl font-bold text-destructive">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : lowStockItems.length}
          </div>
          <p className="text-xs text-destructive mt-1 flex items-center gap-1">
            {lowStockItems.length > 0 && <ArrowUpRight className="h-3 w-3" />}
            Items at reorder level
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 border-b overflow-x-auto">
        {[
          { key: 'overview' as const, label: 'Overview' },
          { key: 'sales' as const, label: 'Sales Report' },
          { key: 'purchase' as const, label: 'Purchase Report' },
          { key: 'products' as const, label: 'Top Products' },
          { key: 'alerts' as const, label: 'Low Stock Alerts' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Daily Sales */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-lg">Daily Sales Trend</h3>
                <p className="text-sm text-muted-foreground">Last {salesByDay.length} days</p>
              </div>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
            {loading ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : salesByDay.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No sales data yet</div>
            ) : (
              <>
                <div className="h-[200px] w-full flex items-end gap-1 pb-4 pt-4 border-b">
                  {salesByDay.map((day, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end h-full gap-1 group relative">
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-medium px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        ₹{day.value.toLocaleString()}
                      </div>
                      <div
                        className="bg-emerald-500/80 hover:bg-emerald-500 rounded-t-sm transition-all cursor-pointer"
                        style={{ height: `${(day.value / maxSalesDay) * 100}%`, minHeight: '4px' }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                  {salesByDay.map((d, i) => (
                    <span key={i} className="truncate">{d.name}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Purchase Orders by Month */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-lg">Monthly Purchase Spend</h3>
                <p className="text-sm text-muted-foreground">Based on purchase order data</p>
              </div>
              <Truck className="h-5 w-5 text-muted-foreground" />
            </div>
            {loading ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : poByMonth.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No purchase data yet</div>
            ) : (
              <>
                <div className="h-[200px] w-full flex items-end gap-2 pb-4 pt-4 border-b">
                  {poByMonth.map((month, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end h-full gap-1 group relative">
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-medium px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        ₹{month.value.toLocaleString()}
                      </div>
                      <div
                        className="bg-primary/80 hover:bg-primary rounded-t-sm transition-all cursor-pointer"
                        style={{ height: `${(month.value / maxPoMonth) * 100}%`, minHeight: '4px' }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  {poByMonth.map(m => (
                    <span key={m.name}>{m.name}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== SALES REPORT TAB ===== */}
      {activeTab === "sales" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Payment Method Breakdown */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
              <h3 className="font-semibold text-lg mb-4">Payment Method Breakdown</h3>
              {paymentBreakdown.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No sales data</div>
              ) : (
                <div className="space-y-4">
                  {paymentBreakdown.map(({ method, amount, pct }) => (
                    <div key={method}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium capitalize">{method}</span>
                        <span className="text-muted-foreground">₹{amount.toLocaleString()} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Selling Products */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
              <h3 className="font-semibold text-lg mb-4">Top Selling Products</h3>
              {topSellingProducts.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No sales data</div>
              ) : (
                <div className="space-y-3">
                  {topSellingProducts.map((product, i) => (
                    <div key={product.name} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium truncate">{product.name}</span>
                          <span className="text-muted-foreground text-xs ml-2 whitespace-nowrap">{product.qty} sold</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${(product.revenue / maxSellingRevenue) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-semibold w-16 text-right">₹{product.revenue.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sales Table */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
            <div className="p-5 border-b">
              <h3 className="font-semibold text-lg">Recent Sales Transactions</h3>
              <p className="text-sm text-muted-foreground">Last 20 POS sales</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-muted-foreground border-b bg-muted/30">
                  <tr>
                    <th className="h-12 px-4 font-medium">Receipt #</th>
                    <th className="h-12 px-4 font-medium">Date</th>
                    <th className="h-12 px-4 font-medium">Items</th>
                    <th className="h-12 px-4 font-medium">Payment</th>
                    <th className="h-12 px-4 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></td></tr>
                  ) : completedSales.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No completed sales yet.</td></tr>
                  ) : completedSales.slice(0, 20).map(order => (
                    <tr key={order.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 font-mono text-xs font-medium">{order.receipt_number}</td>
                      <td className="p-4 text-muted-foreground">{new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="p-4">{order.pos_order_items?.length || 0} items</td>
                      <td className="p-4 capitalize">{order.payment_method}</td>
                      <td className="p-4 text-right font-semibold">₹{(order.total_amount || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===== PURCHASE REPORT TAB ===== */}
      {activeTab === "purchase" && (
        <div className="space-y-6">
          {/* PO Status Distribution */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
              <h3 className="font-semibold text-lg mb-4">PO Status Distribution</h3>
              {poByStatus.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No purchase orders</div>
              ) : (
                <div className="space-y-4">
                  {poByStatus.map(({ status, count, amount }) => (
                    <div key={status} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColorMap[status] || 'bg-muted text-muted-foreground'}`}>
                          {status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm text-muted-foreground">{count} orders</span>
                      </div>
                      <span className="font-semibold">₹{amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Monthly Purchase Spend Chart */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
              <h3 className="font-semibold text-lg mb-4">Monthly Purchase Trend</h3>
              {poByMonth.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No data</div>
              ) : (
                <>
                  <div className="h-[200px] w-full flex items-end gap-2 pb-4 pt-4 border-b">
                    {poByMonth.map((month, i) => (
                      <div key={i} className="flex-1 flex flex-col justify-end h-full gap-1 group relative">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-medium px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          ₹{month.value.toLocaleString()}
                        </div>
                        <div
                          className="bg-orange-500/80 hover:bg-orange-500 rounded-t-sm transition-all cursor-pointer"
                          style={{ height: `${(month.value / maxPoMonth) * 100}%`, minHeight: '4px' }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    {poByMonth.map(m => (<span key={m.name}>{m.name}</span>))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Purchase Orders Table */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
            <div className="p-5 border-b">
              <h3 className="font-semibold text-lg">Recent Purchase Orders</h3>
              <p className="text-sm text-muted-foreground">Last 20 purchase orders</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-muted-foreground border-b bg-muted/30">
                  <tr>
                    <th className="h-12 px-4 font-medium">PO Number</th>
                    <th className="h-12 px-4 font-medium">Date</th>
                    <th className="h-12 px-4 font-medium">Status</th>
                    <th className="h-12 px-4 font-medium">Currency</th>
                    <th className="h-12 px-4 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></td></tr>
                  ) : purchaseOrders.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No purchase orders yet.</td></tr>
                  ) : purchaseOrders.slice(0, 20).map(po => (
                    <tr key={po.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 font-mono text-xs font-medium">{po.po_number}</td>
                      <td className="p-4 text-muted-foreground">{new Date(po.created_at).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColorMap[po.status] || 'bg-muted text-muted-foreground'}`}>
                          {(po.status || '').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">{po.currency || 'INR'}</td>
                      <td className="p-4 text-right font-semibold">₹{(po.total_amount || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===== TOP PRODUCTS TAB ===== */}
      {activeTab === "products" && (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
          <div className="p-5 border-b">
            <h3 className="font-semibold text-lg">Top Products by Selling Price</h3>
            <p className="text-sm text-muted-foreground">Highest-value items in your catalog</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-muted-foreground border-b bg-muted/30">
                <tr>
                  <th className="h-12 px-4 font-medium">#</th>
                  <th className="h-12 px-4 font-medium">Product Name</th>
                  <th className="h-12 px-4 font-medium">SKU</th>
                  <th className="h-12 px-4 text-right font-medium">Cost Price</th>
                  <th className="h-12 px-4 text-right font-medium">Selling Price</th>
                  <th className="h-12 px-4 text-right font-medium">Margin</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                      Loading...
                    </td>
                  </tr>
                ) : topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No products in catalog yet.
                    </td>
                  </tr>
                ) : topProducts.map((product, i) => {
                  const margin = ((product.selling_price || 0) - (product.cost_price || 0))
                  const marginPct = product.cost_price > 0 ? ((margin / product.cost_price) * 100).toFixed(1) : '—'
                  return (
                    <tr key={product.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 font-medium text-muted-foreground">{i + 1}</td>
                      <td className="p-4 font-medium">{product.name}</td>
                      <td className="p-4 text-muted-foreground font-mono text-xs">{product.sku}</td>
                      <td className="p-4 text-right">₹{(product.cost_price || 0).toLocaleString()}</td>
                      <td className="p-4 text-right font-medium text-primary">₹{(product.selling_price || 0).toLocaleString()}</td>
                      <td className="p-4 text-right">
                        <span className={`text-xs font-semibold ${margin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                          {margin >= 0 ? '+' : ''}₹{margin.toLocaleString()} ({marginPct}%)
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== LOW STOCK ALERTS TAB ===== */}
      {activeTab === "alerts" && (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
          <div className="p-5 border-b">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Low Stock Alerts
            </h3>
            <p className="text-sm text-muted-foreground">Products at or below reorder level (≤ 5 units)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-muted-foreground border-b bg-muted/30">
                <tr>
                  <th className="h-12 px-4 font-medium">Product</th>
                  <th className="h-12 px-4 font-medium">SKU</th>
                  <th className="h-12 px-4 font-medium">Current Stock</th>
                  <th className="h-12 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                      Loading...
                    </td>
                  </tr>
                ) : lowStockItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      All products are well-stocked! No alerts.
                    </td>
                  </tr>
                ) : lowStockItems.map((product) => {
                  const stock = product.reorder_quantity || 0
                  return (
                    <tr key={product.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 font-medium">{product.name}</td>
                      <td className="p-4 text-muted-foreground font-mono text-xs">{product.sku}</td>
                      <td className="p-4 font-bold text-destructive">{stock} units</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          stock === 0
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                        }`}>
                          {stock === 0 ? 'Out of Stock' : 'Low Stock'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
