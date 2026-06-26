"use client"

import { useEffect, useState } from "react"
import { Package, Truck, FileText, CheckCircle, Loader2 } from "lucide-react"
import { supabase, ensureDefaultSetup } from "@/lib/supabase"

export default function VendorPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    pending: 0,
    shipped: 0,
    delivered: 0,
    unpaidValue: 0
  })

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    setLoading(true)
    try {
      const { supplierProfileId } = await ensureDefaultSetup()
      if (!supplierProfileId) return

      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('supplier_id', supplierProfileId)
        .order('created_at', { ascending: false })

      // Ignoring PGRST116/42P01 errors gracefully if table doesn't exist
      if (error && error.code !== 'PGRST116' && error.code !== '42P01') throw error

      if (data) {
        setOrders(data)
        
        let pending = 0
        let shipped = 0
        let delivered = 0
        let unpaid = 0
        
        data.forEach(o => {
          const status = o.status?.toLowerCase() || 'pending approval'
          if (status.includes('pending')) pending++
          else if (status.includes('shipped') || status.includes('transit')) shipped++
          else if (status.includes('received') || status.includes('delivered')) delivered++
          
          if (!status.includes('received') && !status.includes('paid')) {
            unpaid += Number(o.total_amount || 0)
          }
        })
        
        setStats({ pending, shipped, delivered, unpaidValue: unpaid })
      }
    } catch (error) {
      console.error("Error fetching vendor orders:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleShipOrder(id: string) {
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .update({ status: 'sent' }) // Maps to schema ENUM 'sent' (shipped)
        .eq('id', id)
      
      if (error) throw error
      await fetchOrders()
    } catch (err) {
      console.error("Failed to update order status", err)
      alert("Failed to update order.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Supplier Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage your incoming orders and product catalog.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 border-l-4 border-l-emerald-500 cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">New Orders</h3>
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.pending}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Pending fulfillment</p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 border-l-4 border-l-blue-500 cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">In Transit</h3>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.shipped}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Out for delivery</p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 border-l-4 border-l-amber-500 cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Unpaid Value</h3>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : `₹${stats.unpaidValue.toLocaleString()}`}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 border-l-4 border-l-purple-500 cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Delivered</h3>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.delivered}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Total completed</p>
        </div>
      </div>
      
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm mt-4">
        <div className="p-6 border-b">
          <h3 className="font-semibold leading-none tracking-tight">Recent Orders from Shops</h3>
        </div>
        <div className="p-0 overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-muted-foreground border-b bg-muted/30">
              <tr>
                <th className="px-6 py-3 font-medium">Order ID</th>
                <th className="px-6 py-3 font-medium">Retailer Shop</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Value</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No orders found.
                  </td>
                </tr>
              ) : orders.map((order) => (
                <tr key={order.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="px-6 py-4 font-medium text-primary">{order.po_number || `PO-${order.id.substring(0,6)}`}</td>
                  <td className="px-6 py-4">{order.organizations?.name || "Unknown Retailer"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                      order.status?.toLowerCase().includes('pending') ? 'bg-amber-100 text-amber-800' :
                      (order.status?.toLowerCase().includes('shipped') || order.status?.toLowerCase() === 'sent') ? 'bg-blue-100 text-blue-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {order.status === 'sent' ? 'Shipped' : (order.status || 'Pending').replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">₹{order.total_amount?.toLocaleString() || 0}</td>
                  <td className="px-6 py-4 text-right">
                    {order.status?.toLowerCase().includes('pending') ? (
                      <button 
                        onClick={() => handleShipOrder(order.id)}
                        className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded hover:bg-primary/90 transition-colors"
                      >
                        Mark Shipped
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">No actions</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
