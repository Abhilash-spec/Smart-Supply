"use client"

import { useState, useEffect } from "react"
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, ScanBarcode, Loader2, Users, Package } from "lucide-react"
import { getPosProducts, checkoutPosOrder } from "@/app/actions/pos"
import { toast } from "sonner"

export default function VendorPOSPage() {
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer")
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentDetails, setPaymentDetails] = useState({ upiId: '', cardNumber: '', expiry: '', cvv: '', bankAccount: '' })
  
  // Customer Details for Invoice (B2B)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [customerDetails, setCustomerDetails] = useState({ name: '', phone: '', gstNumber: '', company: '' })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    const res = await getPosProducts()
    if (res.success && res.products) {
      setProducts(res.products)
    }
    setLoading(false)
  }

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      // For vendors, default to 10 or 1, maybe just 1 is fine since they can edit
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQuantity }
      }
      return item
    }))
  }

  const setExactQuantity = (id: string, qty: number) => {
    if (isNaN(qty) || qty < 1) qty = 1;
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: qty }
      }
      return item
    }))
  }

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const subtotal = cart.reduce((acc, item) => acc + (item.selling_price * item.quantity), 0)
  const tax = subtotal * 0.18 // Mock 18% GST for B2B
  const total = subtotal + tax

  const handleCheckoutClick = () => {
    if (cart.length === 0) return
    setShowCustomerModal(true)
  }

  const continueToPayment = () => {
    setShowCustomerModal(false)
    if (paymentMethod === 'card' || paymentMethod === 'upi' || paymentMethod === 'bank_transfer') {
      setShowPaymentModal(true)
    } else {
      processCheckout()
    }
  }

  const processCheckout = async () => {
    setCheckingOut(true)
    try {
      if (paymentMethod === 'card' || paymentMethod === 'upi' || paymentMethod === 'bank_transfer') {
        toast.info(`Processing ${paymentMethod.replace('_', ' ').toUpperCase()} payment...`)
        await new Promise(resolve => setTimeout(resolve, 1500))
      }

      // Pass customer details to the backend
      const res = await checkoutPosOrder(cart, paymentMethod, customerDetails.phone, customerDetails.name)
      if (res.success) {
        toast.success(`Payment captured! Bulk Order Successful!`)
        if (customerDetails.phone) {
          toast.success(`B2B Invoice sent via SMS to ${customerDetails.phone}`)
        }
        
        // Dynamically update product stock counts without reloading
        setProducts(prev => prev.map(p => {
          const cartItem = cart.find(c => c.id === p.id)
          if (cartItem) {
            return { ...p, quantity: Math.max(0, p.quantity - cartItem.quantity) }
          }
          return p
        }))

        setCart([]) // Clear cart
        setShowPaymentModal(false)
        setShowCustomerModal(false)
        setPaymentDetails({ upiId: '', cardNumber: '', expiry: '', cvv: '', bankAccount: '' })
        setCustomerDetails({ name: '', phone: '', gstNumber: '', company: '' })
      } else {
        console.error("Checkout failed:", res.error)
        toast.error(`Checkout failed. Make sure migrations are complete.`)
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setCheckingOut(false)
    }
  }

  return (
    <>
      <div className="flex h-[calc(100vh-8rem)] gap-6 overflow-hidden">
      
      {/* LEFT: Product List (Bulk Focus) */}
      <div className="flex-1 flex flex-col h-full bg-card border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b bg-muted/30">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              Vendor Bulk Billing
            </h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products by name, SKU, or scan barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">Loading catalog...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ScanBarcode className="h-12 w-12 mb-4 opacity-20" />
              <p>No products found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  onClick={() => addToCart(product)}
                  className="group flex items-center justify-between border rounded-xl p-4 cursor-pointer hover:border-primary hover:shadow-md transition-all bg-background"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-muted/50 rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base group-hover:text-primary transition-colors">{product.name}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">{product.sku}</span>
                        <span className={`font-medium ${product.quantity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                          {product.quantity > 0 ? `${product.quantity} units in warehouse` : 'Out of stock'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xl text-foreground">₹{Number(product.selling_price || 0).toFixed(2)}</span>
                    <p className="text-xs text-muted-foreground mt-1">per unit</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart & Checkout */}
      <div className="w-[450px] flex flex-col h-full bg-card border rounded-2xl shadow-sm overflow-hidden shrink-0">
        <div className="p-4 border-b bg-slate-900 text-white flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Bulk Order Summary
          </h2>
          <span className="bg-white/20 text-white px-2.5 py-0.5 rounded-full text-xs font-semibold">
            {cart.reduce((acc, item) => acc + item.quantity, 0)} Units Total
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
              <p>Order is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex flex-col border rounded-xl p-4 bg-slate-50/50">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="font-semibold text-sm truncate">{item.name}</h4>
                    <div className="text-muted-foreground text-xs font-mono mt-1">{item.sku}</div>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-destructive/10 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="text-primary font-bold">₹{Number(item.selling_price).toFixed(2)} <span className="text-xs text-muted-foreground font-normal">/ unit</span></div>
                  
                  <div className="flex items-center gap-1 bg-white rounded-lg border shadow-sm p-1">
                    <button onClick={() => updateQuantity(item.id, -10)} className="p-1.5 hover:bg-slate-100 rounded-md text-muted-foreground" title="-10">
                      <Minus className="h-3 w-3" />
                    </button>
                    <input 
                      type="number"
                      value={item.quantity || ''}
                      onChange={(e) => setExactQuantity(item.id, parseInt(e.target.value, 10))}
                      className="w-16 text-center font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-primary rounded-md py-1 border-none"
                      min="1"
                    />
                    <button onClick={() => updateQuantity(item.id, 10)} className="p-1.5 hover:bg-slate-100 rounded-md text-muted-foreground" title="+10">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Footer */}
        <div className="border-t bg-slate-50 p-5 space-y-5">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>GST (18%)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-xl pt-3 border-t mt-3">
              <span>Total Value</span>
              <span className="text-primary">₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${paymentMethod === 'bank_transfer' ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'bg-white hover:bg-slate-100'}`}
              >
                <Banknote className="h-4 w-4" /> Bank Txn
              </button>
              <button 
                onClick={() => setPaymentMethod('credit_account')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${paymentMethod === 'credit_account' ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'bg-white hover:bg-slate-100'}`}
              >
                <CreditCard className="h-4 w-4" /> Credit (Net 30)
              </button>
            </div>
          </div>

          <button
            onClick={handleCheckoutClick}
            disabled={cart.length === 0}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-primary/25"
          >
            Create Bulk Invoice
          </button>
        </div>
      </div>
      </div>

      {/* Customer / B2B Details Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b bg-slate-50">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                B2B Client Details
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Enter buyer details for the tax invoice.</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Company / Shop Name</label>
                <input
                  type="text"
                  placeholder="Retailer Name"
                  value={customerDetails.company}
                  onChange={(e) => setCustomerDetails({...customerDetails, company: e.target.value})}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Contact Person</label>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={customerDetails.name}
                  onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91"
                  value={customerDetails.phone}
                  onChange={(e) => setCustomerDetails({...customerDetails, phone: e.target.value})}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">GSTIN (Optional)</label>
                <input
                  type="text"
                  placeholder="22AAAAA0000A1Z5"
                  value={customerDetails.gstNumber}
                  onChange={(e) => setCustomerDetails({...customerDetails, gstNumber: e.target.value})}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-mono"
                />
              </div>
            </div>

            <div className="p-6 border-t bg-slate-50 flex gap-3 justify-end">
              <button 
                onClick={() => setShowCustomerModal(false)}
                className="px-5 py-2.5 rounded-xl font-medium hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={continueToPayment}
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-sm hover:shadow-md hover:bg-primary/90 transition-all"
              >
                Continue to Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Processing Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b text-center">
              <h2 className="text-xl font-bold">Process Payment</h2>
              <p className="text-sm text-muted-foreground mt-1">Amount due: <span className="font-bold text-foreground">₹{total.toFixed(2)}</span></p>
            </div>
            
            <div className="p-6">
              {paymentMethod === 'bank_transfer' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 text-sm">
                    <p className="font-semibold mb-1">Bank Instructions:</p>
                    <p>Please record the UTR or Transaction Reference number below once the buyer has transferred the funds.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">UTR / Ref Number</label>
                    <input
                      type="text"
                      placeholder="e.g. UTR1234567890"
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-slate-50 flex gap-3 justify-end">
              <button 
                onClick={() => setShowPaymentModal(false)}
                disabled={checkingOut}
                className="px-4 py-2 rounded-xl font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={processCheckout}
                disabled={checkingOut}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50 min-w-[140px] justify-center"
              >
                {checkingOut ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Processing</>
                ) : (
                  'Confirm Order'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
