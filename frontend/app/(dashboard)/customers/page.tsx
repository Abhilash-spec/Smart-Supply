"use client"

import React, { useState, useEffect } from "react"
import { Users, Plus, Search, Edit2, Trash2, X, Loader2, Phone, Mail, Building, ChevronDown, ChevronUp, ShoppingCart, IndianRupee } from "lucide-react"
import { supabase, ensureDefaultSetup } from "@/lib/supabase"

type Customer = {
  id: string
  name: string
  email: string
  phone: string
  type: string
  status: string
  created_at: string
}

type CustomerOrder = {
  id: string
  receipt_number: string
  total_amount: number
  payment_method: string
  created_at: string
  items_count: number
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Purchase history panel
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null)
  const [customerOrders, setCustomerOrders] = useState<Record<string, CustomerOrder[]>>({})
  const [loadingOrders, setLoadingOrders] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    type: "retail",
    status: "active",
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  async function fetchCustomers() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        const mapped = data.map((cust: any) => ({
          id: cust.id,
          name: `${cust.first_name || ''} ${cust.last_name || ''}`.trim() || 'Unknown',
          email: cust.email || '',
          phone: cust.phone || '',
          type: 'Retail',
          status: 'active',
          created_at: cust.created_at,
        }))
        setCustomers(mapped)
      }
    } catch (err: any) {
      console.error("Error fetching customers:", err)
      setError(err.message || "Failed to load customers.")
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchCustomerOrders(customerId: string) {
    if (customerOrders[customerId]) return // Already cached

    setLoadingOrders(customerId)
    try {
      const { data, error } = await supabase
        .from('pos_orders')
        .select('id, receipt_number, total_amount, payment_method, created_at, pos_order_items(id)')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      const orders: CustomerOrder[] = (data || []).map((o: any) => ({
        id: o.id,
        receipt_number: o.receipt_number,
        total_amount: o.total_amount,
        payment_method: o.payment_method,
        created_at: o.created_at,
        items_count: o.pos_order_items?.length || 0,
      }))

      setCustomerOrders(prev => ({ ...prev, [customerId]: orders }))
    } catch (err) {
      console.error("Error fetching customer orders:", err)
      setCustomerOrders(prev => ({ ...prev, [customerId]: [] }))
    } finally {
      setLoadingOrders(null)
    }
  }

  function toggleCustomerHistory(customerId: string) {
    if (expandedCustomer === customerId) {
      setExpandedCustomer(null)
    } else {
      setExpandedCustomer(customerId)
      fetchCustomerOrders(customerId)
    }
  }

  const openModal = (customer: Customer | null = null) => {
    if (customer) {
      setEditingCustomer(customer)
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        type: customer.type.toLowerCase(),
        status: customer.status,
      })
    } else {
      setEditingCustomer(null)
      setFormData({ name: "", email: "", phone: "", type: "retail", status: "active" })
    }
    setError(null)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const { tenantId } = await ensureDefaultSetup()
      if (!tenantId) throw new Error("Could not resolve tenant")

      if (editingCustomer) {
        if (editingCustomer.id.startsWith('mock-')) {
          setCustomers(prev => prev.map(c => 
            c.id === editingCustomer.id 
              ? { ...c, name: formData.name, email: formData.email, phone: formData.phone, type: formData.type === 'retail' ? 'Retail' : 'Wholesale', status: formData.status }
              : c
          ))
        } else {
          const { error: updateErr } = await supabase
            .from('customers')
            .update({
              first_name: formData.name.split(' ')[0],
              last_name: formData.name.split(' ').slice(1).join(' '),
              email: formData.email,
              phone: formData.phone,
            })
            .eq('id', editingCustomer.id)

          if (updateErr) throw updateErr
          await fetchCustomers()
        }
      } else {
        const { error: insertErr } = await supabase
          .from('customers')
          .insert({
            tenant_id: tenantId,
            first_name: formData.name.split(' ')[0],
            last_name: formData.name.split(' ').slice(1).join(' '),
            email: formData.email,
            phone: formData.phone,
          })

        if (insertErr) {
          console.error('Customer insert error:', insertErr)
          const newCustomer: Customer = {
            id: `local-${Date.now()}`,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            type: formData.type === 'retail' ? 'Retail' : 'Wholesale',
            status: formData.status,
            created_at: new Date().toISOString(),
          }
          setCustomers(prev => [newCustomer, ...prev])
        } else {
          await fetchCustomers()
        }
      }

      setShowModal(false)
    } catch (err: any) {
      setError(err.message || "Failed to save customer")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (customer: Customer) => {
    if (!confirm(`Are you sure you want to delete "${customer.name}"?`)) return

    try {
      if (customer.id.startsWith('mock-') || customer.id.startsWith('local-')) {
        setCustomers(prev => prev.filter(c => c.id !== customer.id))
      } else {
        const { error } = await supabase
          .from('organizations')
          .delete()
          .eq('id', customer.id)

        if (error) {
          if (error.code === '23503') {
            throw new Error("Cannot delete customer because they have existing orders.")
          }
          throw error
        }
        await fetchCustomers()
      }
    } catch (err: any) {
      console.error("Error deleting customer:", err)
      alert(err.message || "Failed to delete customer due to a permissions or constraints error.")
    }
  }

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Management</h1>
          <p className="text-muted-foreground mt-1">Manage your retail and wholesale customers.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Customer
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Customers</h3>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : customers.length}</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active</h3>
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-bold">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : customers.filter(c => c.status === 'active').length}</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Inactive</h3>
            <div className="h-2 w-2 rounded-full bg-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : customers.filter(c => c.status !== 'active').length}</div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-transparent px-3 pl-9 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-muted-foreground border-b bg-muted/30">
              <tr>
                <th className="h-12 px-4 text-left font-medium w-8"></th>
                <th className="h-12 px-4 text-left font-medium">Customer</th>
                <th className="h-12 px-4 text-left font-medium">Email</th>
                <th className="h-12 px-4 text-left font-medium">Phone</th>
                <th className="h-12 px-4 text-left font-medium">Type</th>
                <th className="h-12 px-4 text-left font-medium">Status</th>
                <th className="h-12 px-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Loading customers...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    {searchQuery ? "No customers match your search." : "No customers found. Add your first customer!"}
                  </td>
                </tr>
              ) : filteredCustomers.map((customer) => (
                <React.Fragment key={customer.id}>
                  <tr
                    className={`border-b transition-colors hover:bg-muted/50 cursor-pointer ${expandedCustomer === customer.id ? 'bg-muted/30' : ''}`}
                    onClick={() => toggleCustomerHistory(customer.id)}
                  >
                    <td className="p-4 align-middle">
                      {expandedCustomer === customer.id
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      }
                    </td>
                    <td className="p-4 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {customer.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        {customer.name}
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{customer.email}</td>
                    <td className="p-4 text-muted-foreground">{customer.phone || '—'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        customer.type === 'Wholesale' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300' 
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                      }`}>
                        {customer.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        customer.status === 'active' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {customer.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openModal(customer)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Purchase History Panel */}
                  {expandedCustomer === customer.id && (
                    <tr key={`${customer.id}-history`} className="border-b bg-muted/10">
                      <td colSpan={7} className="p-0">
                        <div className="px-12 py-5">
                          <div className="flex items-center gap-2 mb-4">
                            <ShoppingCart className="h-4 w-4 text-primary" />
                            <h4 className="text-sm font-semibold">Purchase History</h4>
                          </div>

                          {loadingOrders === customer.id ? (
                            <div className="py-6 text-center text-muted-foreground">
                              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                              Loading purchase history...
                            </div>
                          ) : (customerOrders[customer.id] || []).length === 0 ? (
                            <div className="py-6 text-center text-muted-foreground text-sm">
                              <ShoppingCart className="h-6 w-6 mx-auto mb-2 opacity-30" />
                              No purchase history for this customer.
                            </div>
                          ) : (
                            <>
                              {/* Summary */}
                              <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="rounded-lg bg-background border p-3">
                                  <p className="text-xs text-muted-foreground">Total Orders</p>
                                  <p className="text-lg font-bold">{customerOrders[customer.id].length}</p>
                                </div>
                                <div className="rounded-lg bg-background border p-3">
                                  <p className="text-xs text-muted-foreground">Total Spent</p>
                                  <p className="text-lg font-bold text-emerald-600">
                                    ₹{customerOrders[customer.id].reduce((s, o) => s + (o.total_amount || 0), 0).toLocaleString()}
                                  </p>
                                </div>
                                <div className="rounded-lg bg-background border p-3">
                                  <p className="text-xs text-muted-foreground">Avg Order</p>
                                  <p className="text-lg font-bold">
                                    ₹{Math.round(customerOrders[customer.id].reduce((s, o) => s + (o.total_amount || 0), 0) / customerOrders[customer.id].length).toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              {/* Orders table */}
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-xs text-muted-foreground border-b">
                                    <th className="text-left pb-2 font-medium">Receipt #</th>
                                    <th className="text-left pb-2 font-medium">Date</th>
                                    <th className="text-center pb-2 font-medium">Items</th>
                                    <th className="text-left pb-2 font-medium">Payment</th>
                                    <th className="text-right pb-2 font-medium">Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {customerOrders[customer.id].map(order => (
                                    <tr key={order.id} className="border-t border-dashed">
                                      <td className="py-2 font-mono text-xs">{order.receipt_number}</td>
                                      <td className="py-2 text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
                                      <td className="py-2 text-center">{order.items_count}</td>
                                      <td className="py-2 capitalize text-muted-foreground">{order.payment_method}</td>
                                      <td className="py-2 text-right font-medium">₹{(order.total_amount || 0).toLocaleString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold mb-1">{editingCustomer ? "Edit Customer" : "Add New Customer"}</h2>
            <p className="text-sm text-muted-foreground mb-5">
              {editingCustomer ? "Update customer information." : "Add a new retail or wholesale customer."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Customer Name</label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    placeholder="e.g. FreshMart Supermarket"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    placeholder="orders@company.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <option value="retail">Retail</option>
                    <option value="wholesale">Wholesale</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? "Saving..." : editingCustomer ? "Update Customer" : "Add Customer"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
