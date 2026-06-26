"use client"

import { useState, useEffect } from "react"
import { FileText, Plus, CheckCircle2, Clock, AlertCircle, X, ShoppingCart, ShoppingBag, Loader2, Minus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { getProcurementCatalog, createPurchaseOrder, getPurchaseOrders, receivePurchaseOrder } from "@/app/actions/procurement"

type Product = {
  id: string
  name: string
  sku: string
  price: number
  supplierId?: string
}

type CartItem = Product & { quantity: number }

type PurchaseOrder = {
  id: string
  po_number: string
  supplier: string
  itemsCount: number
  total: number
  status: string
  created_at: string
}

export default function ProcurementPage() {
  const [catalog, setCatalog] = useState<Product[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  
  // PO Cart State
  const [cart, setCart] = useState<CartItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCartMobile, setShowCartMobile] = useState(false)
  const [receivingId, setReceivingId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [catalogRes, posRes] = await Promise.all([
        getProcurementCatalog(),
        getPurchaseOrders()
      ])

      if (catalogRes.success) setCatalog(catalogRes.products || [])
      if (posRes.success) setPurchaseOrders(posRes.purchaseOrders || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load procurement data.")
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, { ...product, quantity: 1 }]
    })
    toast.success(`Added ${product.name} to Draft PO`)
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta
        return newQ > 0 ? { ...item, quantity: newQ } : item
      }
      return item
    }))
  }

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return
    setIsSubmitting(true)
    try {
      const res = await createPurchaseOrder(cart)
      if (!res.success) throw new Error(res.error)
      
      toast.success(`Purchase Order ${res.poNumber} submitted!`)
      setCart([])
      fetchData()
      setShowCartMobile(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to submit Purchase Order")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReceiveGoods = async (poId: string) => {
    setReceivingId(poId)
    try {
      const res = await receivePurchaseOrder(poId)
      if (!res?.success) throw new Error(res?.error || "Unknown error occurred")
      toast.success("Goods received successfully! Inventory updated.")
      fetchData()
    } catch (err: any) {
      console.error("Receive Goods Error:", err)
      toast.error(err.message || "Failed to receive goods")
    } finally {
      setReceivingId(null)
    }
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const pendingCount = purchaseOrders.filter(p => ['draft', 'pending_approval', 'sent'].includes(p.status)).length

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Procurement</h1>
          <p className="text-muted-foreground mt-1">Browse B2B catalog and submit Purchase Orders to your suppliers.</p>
        </div>
        <button 
          onClick={() => setShowCartMobile(!showCartMobile)}
          className="lg:hidden flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium"
        >
          <ShoppingCart className="h-4 w-4" />
          Draft PO ({cart.length})
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 shrink-0">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Active Orders</p>
            <h3 className="text-xl font-bold">{pendingCount}</h3>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Received Orders</p>
            <h3 className="text-xl font-bold">{purchaseOrders.filter(p => p.status === 'fully_received').length}</h3>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">B2B Catalog Items</p>
            <h3 className="text-xl font-bold">{catalog.length}</h3>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0 relative">
        {/* Left: Supplier Catalog & History */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 pb-6">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 shrink-0">
            <h3 className="font-semibold leading-none tracking-tight mb-4 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" /> Supplier Catalog
            </h3>
            
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : catalog.length === 0 ? (
              <div className="text-center p-8 bg-muted/30 rounded-lg text-muted-foreground">
                No catalog items found. Ask your supplier to add products.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {catalog.map(product => (
                  <div key={product.id} className="border rounded-lg p-3 hover:border-primary/50 transition-colors bg-background flex flex-col justify-between group">
                    <div>
                      <div className="font-medium text-sm line-clamp-1" title={product.name}>{product.name}</div>
                      <div className="text-xs text-muted-foreground mt-1 font-mono">{product.sku}</div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="font-semibold text-primary">₹{product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      <button 
                        onClick={() => addToCart(product)}
                        className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground h-8 w-8 rounded-full flex items-center justify-center transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-4 border-b">
              <h3 className="font-semibold leading-none tracking-tight">Recent Purchase Orders</h3>
            </div>
            <div className="w-full overflow-x-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b bg-muted/30">
                  <tr className="border-b transition-colors">
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground whitespace-nowrap">PO Number</th>
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground whitespace-nowrap">Status</th>
                    <th className="h-10 px-4 text-right font-medium text-muted-foreground whitespace-nowrap">Total Amount</th>
                    <th className="h-10 px-4 text-right font-medium text-muted-foreground whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0 divide-y">
                  {purchaseOrders.length === 0 && !loading ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-muted-foreground">No purchase orders found.</td>
                    </tr>
                  ) : purchaseOrders.map((po) => (
                    <tr key={po.id} className="transition-colors hover:bg-muted/50 cursor-pointer">
                      <td className="px-4 py-3 font-medium text-primary whitespace-nowrap">{po.po_number}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border capitalize ${
                          po.status === 'fully_received' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          po.status === 'sent' ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400' :
                          'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                        {po.status === 'sent' ? 'Shipped' : po.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium whitespace-nowrap">₹{po.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {po.status === 'sent' && (
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleReceiveGoods(po.id); }}
                            disabled={receivingId === po.id}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            {receivingId === po.id ? <Loader2 className="h-3 w-3 animate-spin inline" /> : "Receive Goods"}
                          </button>
                        )}
                        {po.status === 'fully_received' && (
                          <span className="text-xs text-muted-foreground italic flex items-center justify-end gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Received
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Draft PO / Cart */}
        <div className={`
          fixed inset-y-0 right-0 z-40 w-full max-w-sm bg-card border-l shadow-2xl flex flex-col
          transition-transform duration-300 ease-in-out transform
          lg:relative lg:translate-x-0 lg:w-96 lg:shadow-sm lg:rounded-xl lg:border lg:flex
          ${showCartMobile ? 'translate-x-0' : 'translate-x-full'}
        `}>
          <div className="p-4 border-b bg-muted/30 flex items-center justify-between shrink-0">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Draft Purchase Order
            </h3>
            <button onClick={() => setShowCartMobile(false)} className="lg:hidden p-1 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                <ShoppingCart className="h-12 w-12 opacity-20" />
                <p className="text-sm">No items in Draft PO</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-3 border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm line-clamp-2">{item.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">₹{item.price.toFixed(2)} / unit</div>
                    </div>
                    <div className="flex flex-col items-end justify-between shrink-0">
                      <div className="font-semibold text-sm">₹{(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      <div className="flex items-center gap-2 mt-2 bg-muted rounded-md p-0.5">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-background rounded text-muted-foreground">
                          {item.quantity === 1 ? <Trash2 className="h-3.5 w-3.5 text-destructive" onClick={(e) => { e.preventDefault(); removeFromCart(item.id); }}/> : <Minus className="h-3.5 w-3.5" />}
                        </button>
                        <span className="text-xs font-medium w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-background rounded text-muted-foreground">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-card shrink-0">
            <div className="flex justify-between items-center mb-4 text-sm font-medium text-muted-foreground">
              <span>Total Value</span>
              <span className="text-lg font-bold text-foreground">₹{cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <button 
              onClick={handlePlaceOrder}
              disabled={cart.length === 0 || isSubmitting}
              className="w-full h-11 flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
              {isSubmitting ? "Submitting..." : "Submit Purchase Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

