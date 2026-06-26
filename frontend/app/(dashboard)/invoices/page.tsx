"use client"

import { useEffect, useState } from "react"
import { FileText, Loader2, Download, Receipt, ExternalLink, Calendar, Search, Filter } from "lucide-react"
import { getShopInvoices } from "@/app/actions/invoices"

type Invoice = {
  id: string
  invoice_number: string
  status: string
  amount_due: number
  total_amount: number
  due_date: string
  created_at: string
  purchase_orders?: { po_number: string }
}

const STATUS_OPTIONS = ["All", "Draft", "Sent", "Paid", "Overdue"]

export default function ShopInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchInvoices()
  }, [])

  async function fetchInvoices() {
    setLoading(true)
    try {
      const res = await getShopInvoices()
      if (res.success && res.invoices) {
        setInvoices(res.invoices)
      }
    } catch (err) {
      console.error("Error fetching shop invoices:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesFilter = activeFilter === "All" || (invoice.status || "").toLowerCase().includes(activeFilter.toLowerCase())
    const matchesSearch = searchQuery === "" || 
      (invoice.invoice_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (invoice.purchase_orders?.po_number || "").toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const stats = {
    total: invoices.length,
    unpaid: invoices.filter(i => i.status !== 'paid').length,
    overdue: invoices.filter(i => new Date(i.due_date) < new Date() && i.status !== 'paid').length,
  }

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || ''
    if (s.includes('draft')) return 'bg-muted text-muted-foreground'
    if (s.includes('sent') || s.includes('pending')) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
    if (s.includes('paid')) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
    if (s.includes('overdue')) return 'bg-destructive/10 text-destructive'
    return 'bg-muted text-muted-foreground'
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
        <p className="text-muted-foreground mt-1">Manage vendor invoices and accounts payable.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Invoices</h3>
            <FileText className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.total}</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Unpaid</h3>
            <Receipt className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.unpaid}</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 border-l-4 border-l-destructive">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Overdue</h3>
            <Calendar className="h-4 w-4 text-destructive" />
          </div>
          <div className="text-2xl font-bold text-destructive">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.overdue}</div>
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
            placeholder="Search by Invoice or PO..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-transparent px-3 pl-9 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-muted-foreground border-b bg-muted/30">
              <tr>
                <th className="px-6 py-3.5 font-medium">Invoice Number</th>
                <th className="px-6 py-3.5 font-medium">Related PO</th>
                <th className="px-6 py-3.5 font-medium">Date</th>
                <th className="px-6 py-3.5 font-medium">Due Date</th>
                <th className="px-6 py-3.5 font-medium">Status</th>
                <th className="px-6 py-3.5 font-medium text-right">Amount</th>
                <th className="px-6 py-3.5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Loading invoices...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No invoices found{activeFilter !== "All" ? ` with status "${activeFilter}"` : ""}.
                  </td>
                </tr>
              ) : filteredInvoices.map((invoice) => {
                return (
                  <tr key={invoice.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="px-6 py-4 font-medium text-primary flex items-center gap-2">
                      <FileText className="h-4 w-4 opacity-50" />
                      {invoice.invoice_number || `INV-${invoice.id.substring(0, 8)}`}
                    </td>
                    <td className="px-6 py-4 font-medium text-muted-foreground">
                      {invoice.purchase_orders?.po_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(invoice.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(invoice.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide ${getStatusBadge(invoice.status)}`}>
                        {invoice.status || 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold">₹{(invoice.amount_due || invoice.total_amount || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-muted-foreground hover:text-primary transition-colors p-2" title="Download PDF">
                        <Download className="h-4 w-4 inline" />
                      </button>
                      <button className="text-muted-foreground hover:text-primary transition-colors p-2" title="View Details">
                        <ExternalLink className="h-4 w-4 inline" />
                      </button>
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
