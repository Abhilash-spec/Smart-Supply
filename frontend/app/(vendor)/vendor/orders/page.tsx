"use client"

import { useEffect, useState } from "react"
import { ShoppingCart, Loader2, Truck, CheckCircle2, Clock, Package, Filter, Search, AlertCircle } from "lucide-react"
import { supabase, ensureDefaultSetup } from "@/lib/supabase"
import { updatePurchaseOrderStatus, getVendorOrders } from "@/app/actions/vendor"

type Order = {
  id: string
  po_number: string
  status: string
  total_amount: number
  created_at: string
  organization_id: string
  organizations?: { name: string }
}

const STATUS_OPTIONS = ["All", "Pending Approval", "Approved", "Shipped", "Delivered", "Received"]

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [hasNewAlert, setHasNewAlert] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    setLoading(true)
    try {
      const res = await getVendorOrders()
      if (!res.success) throw new Error(res.error)
      
      if (res.orders) {
        setOrders(res.orders)
        // Simple alert check: if any order is "pending_approval" or "sent", show alert
        setHasNewAlert(res.orders.some((o: any) => o.status === 'pending_approval' || o.status === 'sent'))
      }
    } catch (err) {
      console.error("Error fetching vendor orders:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusUpdate(id: string, newStatus: string) {
    setUpdatingId(id)
    try {
      const res = await updatePurchaseOrderStatus(id, newStatus)
      if (!res.success) throw new Error(res.error)

      await fetchOrders()
    } catch (err) {
      console.error("Failed to update order status:", err)
      alert("Failed to update order status.")
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredOrders = orders.filter(order => {
    let matchesFilter = false;
    const s = (order.status || "").toLowerCase();
    
    if (activeFilter === "All") matchesFilter = true;
    else if (activeFilter === "Pending Approval") matchesFilter = s.includes("pending");
    else if (activeFilter === "Approved") matchesFilter = s === "approved";
    else if (activeFilter === "Shipped") matchesFilter = s.includes("sent");
    else if (activeFilter === "Delivered" || activeFilter === "Received") matchesFilter = s.includes("received");
    else matchesFilter = s.includes(activeFilter.toLowerCase());

    const matchesSearch = searchQuery === "" || 
      (order.po_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const stats = {
    pending: orders.filter(o => (o.status || '').toLowerCase().includes('pending')).length,
    approved: orders.filter(o => (o.status || '').toLowerCase() === 'approved').length,
    shipped: orders.filter(o => (o.status || '').toLowerCase().includes('sent')).length,
    delivered: orders.filter(o => (o.status || '').toLowerCase().includes('fully_received') || (o.status || '').toLowerCase().includes('partially_received')).length,
  }

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || ''
    if (s.includes('pending')) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
    if (s === 'approved') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
    if (s.includes('sent')) return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300'
    if (s.includes('received')) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
    return 'bg-muted text-muted-foreground'
  }

  const getNextAction = (status: string): { label: string; newStatus: string } | null => {
    const s = status?.toLowerCase() || ''
    if (s.includes('pending')) return { label: 'Approve', newStatus: 'approved' }
    if (s === 'approved') return { label: 'Mark Shipped', newStatus: 'sent' }
    if (s.includes('sent')) return { label: 'Mark Delivered', newStatus: 'fully_received' }
    return null
  }

  return (
    <div className="flex flex-col gap-6">
      {hasNewAlert && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-amber-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-700 font-medium">
                You have new purchase orders pending approval! Check the table below.
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Received Orders</h1>
        <p className="text-muted-foreground mt-1">Manage incoming purchase orders from retail shops.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pending</h3>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.pending}</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Approved</h3>
            <Package className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.approved}</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Shipped</h3>
            <Truck className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.shipped}</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Delivered</h3>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.delivered}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_OPTIONS.map(status => (
            <button
              key={status}
              onClick={() => setActiveFilter(status)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeFilter === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-accent text-muted-foreground hover:text-foreground'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search by PO number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-transparent px-3 pl-9 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-muted-foreground border-b bg-muted/30">
              <tr>
                <th className="px-6 py-3.5 font-medium">PO Number</th>
                <th className="px-6 py-3.5 font-medium">Shop Owner</th>
                <th className="px-6 py-3.5 font-medium">Date</th>
                <th className="px-6 py-3.5 font-medium">Status</th>
                <th className="px-6 py-3.5 font-medium text-right">Amount</th>
                <th className="px-6 py-3.5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No orders found{activeFilter !== "All" ? ` with status "${activeFilter}"` : ""}.
                  </td>
                </tr>
              ) : filteredOrders.map((order) => {
                const action = getNextAction(order.status)
                return (
                  <tr key={order.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="px-6 py-4 font-medium text-primary">
                      {order.po_number || `PO-${order.id.substring(0, 8)}`}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {order.organizations?.name || 'Unknown Shop'}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadge(order.status)}`}>
                        {order.status === 'sent' ? 'Shipped' : (order.status || 'Pending').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">₹{(order.total_amount || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      {action ? (
                        <button
                          onClick={() => handleStatusUpdate(order.id, action.newStatus)}
                          disabled={updatingId === order.id}
                          className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium"
                        >
                          {updatingId === order.id ? (
                            <Loader2 className="h-3 w-3 animate-spin inline" />
                          ) : action.label}
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Completed</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
