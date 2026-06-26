"use client"

import { useEffect, useState } from "react"
import { ShoppingBag, Loader2, Plus, Edit2, Trash2, X, AlertTriangle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { getVendorCatalog, addVendorCatalogItem, updateVendorCatalogItem, deleteVendorCatalogItem } from "@/app/actions/vendor"

interface Product {
  id: string
  sku: string
  name: string
  price: number
  status: string
  created_at: string
}

export default function VendorCatalogPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Context State
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [supplierId, setSupplierId] = useState<string | null>(null)
  
  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formName, setFormName] = useState("")
  const [formSku, setFormSku] = useState("")
  const [formPrice, setFormPrice] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Fetch Products
  async function fetchProducts() {
    try {
      setLoading(true)
      setError(null)

      const res = await getVendorCatalog()
      if (!res.success) throw new Error(res.error)
      
      setProducts(res.products || [])
      setTenantId(res.tenantId || null)
      setSupplierId(res.supplierProfileId || null)
    } catch (err: any) {
      setError(err.message || "Failed to load supplier catalog.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // Open Create/Edit modal
  const openModal = (product: Product | null = null) => {
    if (product) {
      setEditingProduct(product)
      setFormName(product.name)
      setFormSku(product.sku)
      setFormPrice(product.price.toString())
    } else {
      setEditingProduct(null)
      setFormName("")
      setFormSku("")
      setFormPrice("")
    }
    setIsModalOpen(true)
  }

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      if (editingProduct) {
        // Update
        const res = await updateVendorCatalogItem(editingProduct.id, {
          name: formName,
          sku: formSku,
          price: parseFloat(formPrice) || 0
        })
        if (!res.success) throw new Error(res.error)
        toast.success("Product updated successfully")
      } else {
        // Insert
        if (!tenantId || !supplierId) throw new Error("Could not detect Supplier context. Contact Admin.")
        
        const res = await addVendorCatalogItem({
          tenantId,
          supplierId,
          name: formName,
          sku: formSku || `SKU-${Date.now()}`,
          price: parseFloat(formPrice) || 0
        })
        if (!res.success) throw new Error(res.error)
        toast.success("Product added to catalog")
      }

      setIsModalOpen(false)
      fetchProducts()
    } catch (err: any) {
      setError(err.message || "Failed to save product.")
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this product from your supplier catalog?")) return

    try {
      setLoading(true)
      const res = await deleteVendorCatalogItem(id)
      if (!res.success) throw new Error(res.error)
      
      toast.success("Product removed")
      fetchProducts()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete product.")
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Product Catalog</h1>
          <p className="text-muted-foreground mt-1">Manage active supplier products and price sheets offered to retail buyers.</p>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/vendor"
            className="flex items-center gap-2 rounded-lg bg-muted text-muted-foreground border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Link>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-sm font-medium transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 flex items-center gap-3 text-destructive text-sm">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Catalog Table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden mt-4">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" /> B2B Catalog Items
          </h3>
          <span className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
            {products.length} Products
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="border-b bg-muted/30 text-muted-foreground font-medium">
              <tr>
                <th className="px-6 py-3.5">Product Name</th>
                <th className="px-6 py-3.5">SKU Code</th>
                <th className="px-6 py-3.5 text-right">B2B Price (INR)</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-primary" />
                    Loading your catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">Your catalog is empty.</p>
                    <p className="text-sm text-muted-foreground mt-1">Add your first product to start taking B2B orders.</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{product.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{product.sku}</td>
                    <td className="px-6 py-4 text-right font-semibold">₹{product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openModal(product)}
                          className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-lg">{editingProduct ? "Edit Product" : "Add Catalog Item"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Name *</label>
                <input 
                  required
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="e.g., Bulk Paracetamol 500mg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">SKU (Optional)</label>
                <input 
                  type="text"
                  value={formSku}
                  onChange={(e) => setFormSku(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border bg-background text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Leave blank to auto-generate"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">B2B Price (₹) *</label>
                <input 
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="0.00"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-10 border rounded-lg font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 h-10 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
