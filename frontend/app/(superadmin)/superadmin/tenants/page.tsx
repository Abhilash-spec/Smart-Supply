"use client"

import { useEffect, useState } from "react"
import { Store, Loader2, Plus, Edit2, Trash2, X, AlertTriangle, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

interface Tenant {
  id: string
  name: string
  slug: string
  tier: 'starter' | 'growth' | 'enterprise'
  status: 'active' | 'suspended' | 'cancelled' | 'trial'
  created_at: string
}

export default function SuperAdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [formName, setFormName] = useState("")
  const [formSlug, setFormSlug] = useState("")
  const [formTier, setFormTier] = useState<'starter' | 'growth' | 'enterprise'>("starter")
  const [formStatus, setFormStatus] = useState<'active' | 'suspended' | 'cancelled' | 'trial'>("active")
  const [submitting, setSubmitting] = useState(false)

  // Fetch Tenants
  async function fetchTenants() {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchErr } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchErr) throw fetchErr
      setTenants(data || [])
    } catch (err: any) {
      setError(err.message || "Failed to load tenants.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTenants()
  }, [])

  // Open Create/Edit modal
  const openModal = (tenant: Tenant | null = null) => {
    if (tenant) {
      setEditingTenant(tenant)
      setFormName(tenant.name)
      setFormSlug(tenant.slug)
      setFormTier(tenant.tier)
      setFormStatus(tenant.status)
    } else {
      setEditingTenant(null)
      setFormName("")
      setFormSlug("")
      setFormTier("starter")
      setFormStatus("active")
    }
    setIsModalOpen(true)
  }

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      if (editingTenant) {
        // Update
        const { error: updateErr } = await supabase
          .from('tenants')
          .update({
            name: formName,
            slug: formSlug,
            tier: formTier,
            status: formStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTenant.id)

        if (updateErr) throw updateErr
      } else {
        // Insert
        const { error: insertErr } = await supabase
          .from('tenants')
          .insert({
            name: formName,
            slug: formSlug || formName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            tier: formTier,
            status: formStatus
          })

        if (insertErr) throw insertErr
      }

      setIsModalOpen(false)
      fetchTenants()
    } catch (err: any) {
      setError(err.message || "Failed to save tenant. Ensure slug is unique.")
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tenant? All associated organizations, products, and users will be removed.")) return

    try {
      setLoading(true)
      const { error: deleteErr } = await supabase
        .from('tenants')
        .delete()
        .eq('id', id)

      if (deleteErr) throw deleteErr
      fetchTenants()
    } catch (err: any) {
      setError(err.message || "Failed to delete tenant.")
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants (Shops)</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage tenant organizations (kiranas, pharmacies, grocery chains) registered on the platform.</p>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/superadmin"
            className="flex items-center gap-2 rounded-lg border bg-card hover:bg-muted px-4 py-2 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Link>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-xs font-bold uppercase transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Tenant</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 flex items-center gap-3 text-destructive text-sm leading-relaxed">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tenants Table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-muted/30">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" /> Active Shops
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs font-medium uppercase text-muted-foreground border-b bg-muted/50">
              <tr>
                <th className="px-6 py-3.5">Shop Name</th>
                <th className="px-6 py-3.5">Slug identifier</th>
                <th className="px-6 py-3.5">Tier Plan</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Date Created</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground bg-muted/10">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    <span>Loading Shops...</span>
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground bg-muted/10">
                    No shops/tenants found. Create one using the 'Add Tenant' button.
                  </td>
                </tr>
              ) : tenants.map((tenant) => (
                <tr key={tenant.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-semibold flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold">
                      {tenant.name[0]}
                    </div>
                    <span>{tenant.name}</span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{tenant.slug}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      tenant.tier === 'enterprise' 
                        ? 'bg-purple-500/10 border-purple-500/20 text-purple-600' 
                        : tenant.tier === 'growth' 
                          ? 'bg-blue-500/10 border-blue-500/20 text-blue-600' 
                          : 'bg-slate-500/10 border-slate-500/20 text-slate-600'
                    }`}>
                      {tenant.tier}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
                      tenant.status === 'active' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' 
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-600'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${tenant.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      {tenant.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                    {new Date(tenant.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button
                      onClick={() => openModal(tenant)}
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit Tenant"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tenant.id)}
                      className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive hover:text-destructive/80 transition-colors"
                      title="Delete Tenant"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-background border rounded-xl p-6 shadow-xl relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              {editingTenant ? "Edit Tenant Shop" : "Add Tenant Shop"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Shop Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value)
                    if (!editingTenant) {
                      setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"))
                    }
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  placeholder="e.g. Kirana Master"
                />
              </div>

              {/* Slug */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Slug Identifier</label>
                <input
                  type="text"
                  required
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  placeholder="e.g. kirana-master"
                />
              </div>

              {/* Plan Tier */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Subscription Tier</label>
                <select
                  value={formTier}
                  onChange={(e) => setFormTier(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="starter">Starter Plan</option>
                  <option value="growth">Growth Plan</option>
                  <option value="enterprise">Enterprise Plan</option>
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="suspended">Suspended</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border bg-background hover:bg-muted px-4 py-2 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Tenant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
