"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Eye, ShoppingCart, IndianRupee, CreditCard, Banknote, Loader2, X, ChevronDown, ChevronUp, Receipt } from "lucide-react"
import { getSalesOrders } from "@/app/actions/pos"

type SalesOrder = {
  id: string
  receipt_number: string
  status: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  payment_method: string
  cashier_name: string
  items_count: number
  created_at: string
  pos_order_items: {
    id: string
    product_name: string
    quantity: number
    unit_price: number
    total_price: number
  }[]
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    setLoading(true)
    try {
      const res = await getSalesOrders()
      if (res.success && res.orders) {
        setOrders(res.orders)
      }
    } catch (err) {
      console.error("Failed to load orders:", err)
    } finally {
      setLoading(false)
    }
  }

  const tabs = ["all", "completed", "refunded", "cancelled"]

  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === "all" || order.status === activeTab
    const matchesSearch = !searchQuery ||
      order.receipt_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.cashier_name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  // KPI calculations
  const totalRevenue = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.total_amount || 0), 0)
  const totalOrders = orders.length
  const avgOrderValue = totalOrders > 0 ? totalRevenue / orders.filter(o => o.status === 'completed').length : 0
  const cashOrders = orders.filter(o => o.payment_method === 'cash').length
  const cardOrders = orders.filter(o => o.payment_method === 'card').length

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="h-3.5 w-3.5" />
      case 'card': return <CreditCard className="h-3.5 w-3.5" />
      default: return <IndianRupee className="h-3.5 w-3.5" />
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
      case 'refunded': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sales Orders</h1>
        <p className="text-muted-foreground mt-1">Track POS transactions and B2C sales history.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Revenue</h3>
            <IndianRupee className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : `₹${totalRevenue.toLocaleString()}`}
          </div>
          <p className="text-xs text-muted-foreground mt-1">From completed orders</p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Orders</h3>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : totalOrders}
          </div>
          <p className="text-xs text-muted-foreground mt-1">All time transactions</p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Order Value</h3>
            <Receipt className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : `₹${avgOrderValue.toFixed(0)}`}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Per completed order</p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payment Split</h3>
            <CreditCard className="h-4 w-4 text-violet-500" />
          </div>
          <div className="text-2xl font-bold flex items-center gap-2">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
              <>
                <span className="text-sm font-medium text-muted-foreground"><Banknote className="h-4 w-4 inline mr-1" />{cashOrders}</span>
                <span className="text-xs text-muted-foreground">/</span>
                <span className="text-sm font-medium text-muted-foreground"><CreditCard className="h-4 w-4 inline mr-1" />{cardOrders}</span>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Cash / Card breakdown</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            {tab === 'all' ? `All Orders (${orders.length})` : `${tab} (${orders.filter(o => o.status === tab).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="p-4 flex items-center justify-between border-b">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search by Receipt # or Cashier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 pl-9 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>

        <div className="w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b bg-muted/30">
              <tr className="border-b transition-colors">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-8"></th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Receipt #</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date & Time</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Items</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Cashier</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Payment</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading sales orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-muted-foreground">
                    <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    {searchQuery ? "No orders match your search." : "No sales orders found. Make a sale from POS!"}
                  </td>
                </tr>
              ) : filteredOrders.map((order) => (
                <>
                  <tr
                    key={order.id}
                    className={`border-b transition-colors hover:bg-muted/50 cursor-pointer ${expandedOrder === order.id ? 'bg-muted/30' : ''}`}
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  >
                    <td className="p-4 align-middle">
                      {expandedOrder === order.id
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      }
                    </td>
                    <td className="p-4 align-middle font-medium font-mono text-xs">{order.receipt_number}</td>
                    <td className="p-4 align-middle text-muted-foreground">
                      <div>{new Date(order.created_at).toLocaleDateString()}</div>
                      <div className="text-xs">{new Date(order.created_at).toLocaleTimeString()}</div>
                    </td>
                    <td className="p-4 align-middle">{order.items_count} items</td>
                    <td className="p-4 align-middle text-muted-foreground">{order.cashier_name}</td>
                    <td className="p-4 align-middle">
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-muted text-muted-foreground capitalize">
                        {getPaymentIcon(order.payment_method)}
                        {order.payment_method}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${getStatusStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-right font-semibold">₹{(order.total_amount || 0).toLocaleString()}</td>
                  </tr>
                  {/* Expanded Detail Row */}
                  {expandedOrder === order.id && (
                    <tr key={`${order.id}-detail`} className="border-b bg-muted/10">
                      <td colSpan={8} className="p-0">
                        <div className="px-12 py-4">
                          <h4 className="text-sm font-semibold mb-3">Order Items</h4>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-xs text-muted-foreground">
                                <th className="text-left pb-2 font-medium">Product</th>
                                <th className="text-center pb-2 font-medium">Qty</th>
                                <th className="text-right pb-2 font-medium">Unit Price</th>
                                <th className="text-right pb-2 font-medium">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.pos_order_items?.map((item) => (
                                <tr key={item.id} className="border-t border-dashed">
                                  <td className="py-2 font-medium">{item.product_name}</td>
                                  <td className="py-2 text-center">{item.quantity}</td>
                                  <td className="py-2 text-right text-muted-foreground">₹{(item.unit_price || 0).toLocaleString()}</td>
                                  <td className="py-2 text-right font-medium">₹{(item.total_price || 0).toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t font-semibold">
                                <td colSpan={3} className="py-2 text-right">Grand Total:</td>
                                <td className="py-2 text-right">₹{(order.total_amount || 0).toLocaleString()}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
