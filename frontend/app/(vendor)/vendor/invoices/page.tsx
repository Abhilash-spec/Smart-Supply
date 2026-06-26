"use client"

import { useEffect, useState } from "react"
import { FileText, Loader2, DollarSign, Clock, CheckCircle2, AlertTriangle, Download, Plus, X } from "lucide-react"
import { getVendorInvoices } from "@/app/actions/vendor"

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

export default function VendorInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchInvoices()
  }, [])

  async function fetchInvoices() {
    setLoading(true)
    try {
      const res = await getVendorInvoices()
      if (res.success && res.invoices) {
        setInvoices(res.invoices)
      } else {
        setInvoices([])
      }
    } catch (err) {
      console.error("Error fetching invoices:", err)
    } finally {
      setLoading(false)
    }
  }

  const generateInvoice = async () => {
    setGenerating(true)
    try {
      // Find a PO without a derived invoice (simulate generating a new one)
      const newInv: Invoice = {
        id: `gen-${Date.now()}`,
        invoice_number: `INV-${String(2026000 + invoices.length + 1).padStart(7, '0')}`,
        purchase_orders: { po_number: `PO-Manual-${Date.now().toString().slice(-6)}` },
        amount_due: Math.floor(Math.random() * 50000) + 5000,
        total_amount: Math.floor(Math.random() * 50000) + 5000,
        status: "pending",
        created_at: new Date().toISOString(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }
      setInvoices(prev => [newInv, ...prev])
      setShowModal(false)
    } catch (err) {
      console.error("Error generating invoice:", err)
    } finally {
      setGenerating(false)
    }
  }

  const totalPending = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.amount_due || i.total_amount || 0), 0)
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total_amount || 0), 0)
  const totalOverdue = invoices.filter(i => new Date(i.due_date) < new Date() && i.status !== 'paid').reduce((s, i) => s + (i.amount_due || i.total_amount || 0), 0)

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1">Track payment status for your orders and generate invoices.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Generate Invoice
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Paid</h3>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : `₹${totalPaid.toLocaleString()}`}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{invoices.filter(i => i.status === 'paid').length} invoices</p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pending</h3>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : `₹${totalPending.toLocaleString()}`}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{invoices.filter(i => i.status !== 'paid').length} invoices</p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Overdue</h3>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : `₹${totalOverdue.toLocaleString()}`}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{invoices.filter(i => new Date(i.due_date) < new Date() && i.status !== 'paid').length} invoices</p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> All Invoices
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-muted-foreground border-b bg-muted/30">
              <tr>
                <th className="px-6 py-3.5 font-medium">Invoice #</th>
                <th className="px-6 py-3.5 font-medium">PO Number</th>
                <th className="px-6 py-3.5 font-medium">Issued</th>
                <th className="px-6 py-3.5 font-medium">Due Date</th>
                <th className="px-6 py-3.5 font-medium">Status</th>
                <th className="px-6 py-3.5 font-medium text-right">Amount</th>
                <th className="px-6 py-3.5 font-medium text-right">Actions</th>
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
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No invoices yet. Wait for Shop to submit orders.
                  </td>
                </tr>
              ) : invoices.map((inv) => (
                <tr key={inv.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="px-6 py-4 font-medium text-primary">{inv.invoice_number}</td>
                  <td className="px-6 py-4 text-muted-foreground">{inv.purchase_orders?.po_number || 'N/A'}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(inv.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(inv.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadge(inv.status)}`}>
                      {inv.status || 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">₹{(inv.amount_due || inv.total_amount || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-xs text-primary hover:underline font-medium flex items-center gap-1 ml-auto">
                      <Download className="h-3 w-3" /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold mb-2">Generate Invoice</h2>
            <p className="text-sm text-muted-foreground mb-6">
              This will create a new invoice record based on your recent orders. In production, this would link to specific purchase orders.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={generateInvoice}
                disabled={generating}
                className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {generating ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
