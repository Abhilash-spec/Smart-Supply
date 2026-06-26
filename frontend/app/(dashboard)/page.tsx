"use client"

import { useState, useEffect } from "react"
import { ArrowUpRight, IndianRupee, PackageOpen, ShoppingCart, AlertTriangle, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    productsSold: 0,
    criticalAlerts: 0
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true)
        // Fetch Orders
        const { data: orders } = await supabase
          .from('purchase_orders')
          .select('*, organizations(name)')
          .order('created_at', { ascending: false })
          .limit(50)

        // Fetch Products for alerts
        const { data: products } = await supabase
          .from('products')
          .select('*')

        if (orders) {
          const revenue = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
          const productsSold = orders.length * 15 // Mock calculation based on orders
          setStats(prev => ({
            ...prev,
            revenue,
            orders: orders.length,
            productsSold
          }))
          setRecentOrders(orders.slice(0, 5))
        }

        if (products) {
          const alerts = products.filter(p => (p.stock_quantity || 0) <= (p.reorder_level || 5)).length
          setStats(prev => ({ ...prev, criticalAlerts: alerts }))
        }

      } catch (error) {
        console.error("Dashboard fetch error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your retail business today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Revenue */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Revenue</h3>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : `₹${stats.revenue.toLocaleString('en-IN')}`}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 text-emerald-500">
            <ArrowUpRight className="h-3 w-3" /> Based on total orders
          </p>
        </div>

        {/* Orders */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Sales Orders</h3>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.orders}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 text-emerald-500">
            <ArrowUpRight className="h-3 w-3" /> Active POs created
          </p>
        </div>

        {/* Products Sold */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Items Ordered</h3>
            <PackageOpen className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.productsSold}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 text-emerald-500">
            <ArrowUpRight className="h-3 w-3" /> Estimated throughput
          </p>
        </div>

        {/* Alerts */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Critical Alerts</h3>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-destructive">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.criticalAlerts}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 text-destructive">
            <ArrowUpRight className="h-3 w-3" /> Items low in stock
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Chart Placeholder */}
        <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-col space-y-1.5 pb-4">
            <h3 className="font-semibold leading-none tracking-tight">Overview</h3>
          </div>
          <div className="h-[300px] w-full flex items-end gap-2 pb-4 pt-8 border-b">
            {/* Simple CSS Bar Chart Mock */}
            {[40, 70, 45, 90, 65, 85, 110, 60, 80, 50, 75, 100].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end h-full gap-2">
                <div 
                  className="bg-primary/80 hover:bg-primary rounded-t-sm transition-all cursor-pointer" 
                  style={{ height: `${height}%` }}
                ></div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
          </div>
        </div>

        {/* Recent Orders List */}
        <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-col space-y-1.5 pb-4">
            <h3 className="font-semibold leading-none tracking-tight">Recent Purchase Orders</h3>
            <p className="text-sm text-muted-foreground">You made {stats.orders} POs in total.</p>
          </div>
          <div className="space-y-8 mt-4">
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No recent orders found.</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{order.organizations?.name || "Unknown Supplier"}</p>
                    <p className="text-sm text-muted-foreground">{order.po_number || `PO-${order.id.substring(0,8)}`}</p>
                  </div>
                  <div className="ml-auto font-medium">₹{Number(order.total_amount || 0).toLocaleString('en-IN')}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
