"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Filter, Edit2, Trash2, X, Loader2, MoreHorizontal, PackagePlus, ArrowRight } from "lucide-react"
import { supabase, ensureDefaultSetup } from "@/lib/supabase"
import { getInventoryProducts, addProductBatch } from "@/app/actions/inventory"
import { toast } from "sonner"

type Product = {
  id: string
  sku: string
  name: string
  category: string
  stock: number
  status: string
  price: number
  cost_price: number
  batches: any[]
}

export default function InventoryPage() {
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // Product Form State
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    price: "",
    cost_price: "",
  })

  // Batch Form State
  const [batchData, setBatchData] = useState({
    batchNumber: "",
    mfgDate: "",
    expDate: "",
    quantity: "0",
    costPrice: "",
    sellingPrice: ""
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null)
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openMenuId])

  async function fetchProducts() {
    setLoading(true)
    const res = await getInventoryProducts()
    if (res.success && res.products) {
      setItems(res.products)
    }
    setLoading(false)
  }

  const openCreateModal = () => {
    setEditingProduct(null)
    setFormData({ name: "", sku: "", price: "", cost_price: "" })
    setShowModal(true)
    setOpenMenuId(null)
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      sku: product.sku,
      price: product.price.toString(),
      cost_price: product.cost_price.toString(),
    })
    setShowModal(true)
    setOpenMenuId(null)
  }

  const openAddBatchModal = (product: Product) => {
    setSelectedProduct(product)
    setBatchData({
      batchNumber: `BAT-${Date.now()}`,
      mfgDate: "",
      expDate: "",
      quantity: "0",
      costPrice: product.cost_price.toString(),
      sellingPrice: product.price.toString()
    })
    setShowBatchModal(true)
    setOpenMenuId(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (editingProduct) {
        const { error } = await supabase.from('products').update({
          name: formData.name,
          sku: formData.sku,
          selling_price: parseFloat(formData.price) || 0,
          cost_price: parseFloat(formData.cost_price) || 0,
          updated_at: new Date().toISOString(),
        }).eq('id', editingProduct.id)
        if (error) throw error
      } else {
        const { tenantId, orgId } = await ensureDefaultSetup()
        if (!tenantId || !orgId) throw new Error("No tenant/org found.")

        const { error } = await supabase.from('products').insert({
          tenant_id: tenantId,
          organization_id: orgId,
          name: formData.name,
          sku: formData.sku || `SKU-${Date.now()}`,
          selling_price: parseFloat(formData.price) || 0,
          cost_price: parseFloat(formData.cost_price) || 0,
        })
        if (error) throw error
      }
      toast.success("Product saved successfully")
      await fetchProducts()
      setShowModal(false)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAddBatch(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProduct) return
    setIsSubmitting(true)
    try {
      const res = await addProductBatch(selectedProduct.id, {
        batchNumber: batchData.batchNumber,
        mfgDate: batchData.mfgDate,
        expDate: batchData.expDate,
        quantity: parseInt(batchData.quantity) || 0,
        costPrice: parseFloat(batchData.costPrice) || 0,
        sellingPrice: parseFloat(batchData.sellingPrice) || 0
      })
      if (!res.success) throw new Error(res.error)
      toast.success("Batch added successfully!")
      await fetchProducts()
      setShowBatchModal(false)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return
    try {
      setLoading(true)
      const { error } = await supabase.from('products').delete().eq('id', product.id)
      if (error) throw error
      toast.success("Product deleted")
      await fetchProducts()
    } catch (error: any) {
      toast.error("Failed to delete product.")
      setLoading(false)
    }
  }

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">Manage your product catalog and batch stock levels.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="p-4 flex items-center justify-between border-b gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-transparent px-3 pl-9 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="text-sm text-muted-foreground hidden sm:block">
            {filteredItems.length} product{filteredItems.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">SKU</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Product Name</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Total Stock</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Cost</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Price</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Loading inventory...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    {searchQuery ? "No products match your search." : "No products found. Add a product to get started."}
                  </td>
                </tr>
              ) : filteredItems.map((item) => (
                <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle font-medium font-mono text-xs">{item.sku}</td>
                  <td className="p-4 align-middle font-medium">
                    {item.name}
                    {item.batches?.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {item.batches.length} batch(es)
                      </div>
                    )}
                  </td>
                  <td className="p-4 align-middle font-bold">{item.stock} units</td>
                  <td className="p-4 align-middle">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                      item.status === 'In Stock' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300' :
                      item.status === 'Low Stock' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300' :
                      'bg-destructive/10 text-destructive dark:bg-destructive/20'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 align-middle text-right text-muted-foreground">₹{item.cost_price.toLocaleString()}</td>
                  <td className="p-4 align-middle text-right font-medium">₹{item.price.toLocaleString()}</td>
                  <td className="p-4 align-middle text-right">
                    <div className="relative inline-block">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === item.id ? null : item.id) }}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {openMenuId === item.id && (
                        <div className="absolute right-0 z-50 mt-1 w-48 rounded-md border bg-popover text-popover-foreground shadow-md outline-none">
                          <button 
                            onClick={() => openAddBatchModal(item)}
                            className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground gap-2 font-medium text-emerald-600"
                          >
                            <PackagePlus className="h-4 w-4" />
                            Add Stock Batch
                          </button>
                          <div className="h-px bg-muted my-1"></div>
                          <button 
                            onClick={() => openEditModal(item)}
                            className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground gap-2"
                          >
                            <Edit2 className="h-4 w-4" />
                            Edit Product
                          </button>
                          <button 
                            onClick={() => handleDelete(item)}
                            className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground text-destructive gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Product
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRODUCT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="font-semibold text-lg">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Name *</label>
                <input 
                  required 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full h-10 px-3 rounded-lg border bg-background" 
                  placeholder="e.g. Organic Parboiled Rice"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">SKU (Optional)</label>
                <input 
                  value={formData.sku}
                  onChange={e => setFormData({...formData, sku: e.target.value})}
                  className="w-full h-10 px-3 rounded-lg border bg-background font-mono text-sm" 
                  placeholder="Leave blank to auto-generate"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cost Price</label>
                  <input 
                    type="number" step="0.01" min="0" required 
                    value={formData.cost_price}
                    onChange={e => setFormData({...formData, cost_price: e.target.value})}
                    className="w-full h-10 px-3 rounded-lg border bg-background" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Selling Price *</label>
                  <input 
                    type="number" step="0.01" min="0" required 
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    className="w-full h-10 px-3 rounded-lg border bg-background" 
                  />
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-xl font-medium hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BATCH MODAL */}
      {showBatchModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-emerald-50 dark:bg-emerald-950/20">
              <div>
                <h2 className="font-semibold text-lg text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <PackagePlus className="h-5 w-5" /> Receive Stock
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedProduct.name}</p>
              </div>
              <button onClick={() => setShowBatchModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddBatch} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity Received *</label>
                  <input 
                    type="number" required min="1"
                    value={batchData.quantity}
                    onChange={e => setBatchData({...batchData, quantity: e.target.value})}
                    className="w-full h-10 px-3 rounded-lg border bg-background text-emerald-600 font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Batch Number</label>
                  <input 
                    required 
                    value={batchData.batchNumber}
                    onChange={e => setBatchData({...batchData, batchNumber: e.target.value})}
                    className="w-full h-10 px-3 rounded-lg border bg-background font-mono text-xs" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-b py-4 my-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Cost Price</label>
                  <input 
                    type="number" step="0.01" min="0" required 
                    value={batchData.costPrice}
                    onChange={e => setBatchData({...batchData, costPrice: e.target.value})}
                    className="w-full h-10 px-3 rounded-lg border bg-background" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">New Selling Price</label>
                  <input 
                    type="number" step="0.01" min="0" required 
                    value={batchData.sellingPrice}
                    onChange={e => setBatchData({...batchData, sellingPrice: e.target.value})}
                    className="w-full h-10 px-3 rounded-lg border bg-background" 
                  />
                </div>
                <div className="col-span-2 text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowRight className="h-3 w-3" /> Note: This will update the primary product price.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mfg Date (Optional)</label>
                  <input 
                    type="date"
                    value={batchData.mfgDate}
                    onChange={e => setBatchData({...batchData, mfgDate: e.target.value})}
                    className="w-full h-10 px-3 rounded-lg border bg-background" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Exp Date (Optional)</label>
                  <input 
                    type="date"
                    value={batchData.expDate}
                    onChange={e => setBatchData({...batchData, expDate: e.target.value})}
                    className="w-full h-10 px-3 rounded-lg border bg-background" 
                  />
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowBatchModal(false)} className="flex-1 px-4 py-2 border rounded-xl font-medium hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50">
                  {isSubmitting ? 'Receiving...' : 'Add Stock Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
