"use client"

import { useState, useEffect } from "react"
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, ScanBarcode, Loader2, Users } from "lucide-react"
import { getPosProducts, checkoutPosOrder } from "@/app/actions/pos"
import { toast } from "sonner"

export default function ShopPOSPage() {
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [paymentDetails, setPaymentDetails] = useState({ upiId: '', cardNumber: '', expiry: '', cvv: '' })
  
  // Customer Details for SMS Invoice
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [customerDetails, setCustomerDetails] = useState({ name: '', phone: '' })

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
    if (product.quantity <= 0) {
      toast.error(`${product.name} is out of stock!`)
      return
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        if (existing.quantity >= product.quantity) {
          toast.error(`Cannot add more than available stock (${product.quantity})`)
          return prev
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        let newQuantity = item.quantity + delta
        if (newQuantity > item.quantity && newQuantity > (products.find(p => p.id === id)?.quantity || 0)) {
           toast.error(`Cannot exceed available stock`)
           return item
        }
        newQuantity = Math.max(1, newQuantity)
        return { ...item, quantity: newQuantity }
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
  const tax = subtotal * 0.05 // Mock 5% tax
  const total = subtotal + tax

  const handleCheckoutClick = () => {
    if (cart.length === 0) return
    setShowCustomerModal(true)
  }

  const continueToPayment = () => {
    setShowCustomerModal(false)
    if (paymentMethod === 'card' || paymentMethod === 'upi') {
      setShowPaymentModal(true)
    } else {
      processCheckout()
    }
  }

  const processCheckout = async () => {
    setCheckingOut(true)
    try {
      if (paymentMethod === 'card' || paymentMethod === 'upi') {
        toast.info(`Processing ${paymentMethod.toUpperCase()} payment...`)
        await new Promise(resolve => setTimeout(resolve, 1500))
      }

      // Pass customer details to the backend
      const res = await checkoutPosOrder(cart, paymentMethod, customerDetails.phone, customerDetails.name)
      if (res.success) {
        toast.success(`Payment captured! Checkout Successful!`)
        if (customerDetails.phone) {
          toast.success(`Invoice sent via SMS to ${customerDetails.phone}`)
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
        setPaymentDetails({ upiId: '', cardNumber: '', expiry: '', cvv: '' })
        setCustomerDetails({ name: '', phone: '' })
        setShowSuccessModal(true) // Show success pop-up
      } else {
        console.error("Checkout failed:", res.error)
        toast.error(`Checkout failed: ${res.error || 'Server error'}`)
      }
    } catch (e: any) {
      toast.error(e.message || "An unexpected error occurred.")
    } finally {
      setCheckingOut(false)
    }
  }

  return (
    <>
      <div className="flex h-[calc(100vh-8rem)] gap-6 overflow-hidden">
      
      {/* LEFT: Product Grid */}
      <div className="flex-1 flex flex-col h-full bg-card border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/30">
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  onClick={() => addToCart(product)}
                  className="group relative border rounded-xl p-4 cursor-pointer hover:border-primary hover:shadow-md transition-all bg-background flex flex-col h-full"
                >
                  <div className="aspect-square bg-muted/30 rounded-lg mb-3 flex items-center justify-center">
                    <span className="text-4xl">📦</span>
                  </div>
                  <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">{product.name}</h3>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>{product.sku}</span>
                    <span className={`font-medium ${product.quantity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                      {product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock'}
                    </span>
                  </div>
                  <div className="mt-auto">
                    <span className="font-bold text-lg">₹{Number(product.selling_price || 0).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart & Checkout */}
      <div className="w-[400px] flex flex-col h-full bg-card border rounded-2xl shadow-sm overflow-hidden shrink-0">
        <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Current Order
          </h2>
          <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-semibold">
            {cart.reduce((acc, item) => acc + item.quantity, 0)} Items
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 border rounded-xl p-3 bg-background">
                <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center shrink-0">
                  📦
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{item.name}</h4>
                  <div className="text-primary font-semibold text-sm">₹{Number(item.selling_price).toFixed(2)}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-2 bg-muted rounded-lg border p-0.5">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-background rounded-md">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs font-medium w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-background rounded-md">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Footer */}
        <div className="border-t bg-muted/10 p-4 space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax (5%)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span className="text-primary">₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => setPaymentMethod('cash')}
                className={`flex items-center justify-center gap-1 py-2 rounded-xl border text-sm font-medium transition-all ${paymentMethod === 'cash' ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-background hover:bg-muted'}`}
              >
                <Banknote className="h-4 w-4" /> Cash
              </button>
              <button 
                onClick={() => setPaymentMethod('card')}
                className={`flex items-center justify-center gap-1 py-2 rounded-xl border text-sm font-medium transition-all ${paymentMethod === 'card' ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-background hover:bg-muted'}`}
              >
                <CreditCard className="h-4 w-4" /> Card
              </button>
              <button 
                onClick={() => setPaymentMethod('upi')}
                className={`flex items-center justify-center gap-1 py-2 rounded-xl border text-sm font-medium transition-all ${paymentMethod === 'upi' ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-background hover:bg-muted'}`}
              >
                <ScanBarcode className="h-4 w-4" /> UPI
              </button>
            </div>
          </div>

          <button 
            disabled={cart.length === 0 || checkingOut}
            onClick={handleCheckoutClick}
            className="w-full bg-primary text-primary-foreground font-bold text-lg py-4 rounded-xl shadow-md hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {checkingOut ? "Processing..." : `Charge ₹${total.toFixed(2)}`}
          </button>
        </div>
      </div>

    </div>

      {/* Customer Details Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" /> Customer Details
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Enter details to send the digital receipt via SMS.</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Customer Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={customerDetails.name}
                  onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Mobile Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={customerDetails.phone}
                  onChange={(e) => setCustomerDetails({...customerDetails, phone: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                />
              </div>
            </div>
            
            <div className="p-6 border-t bg-muted/30 flex gap-3">
              <button 
                onClick={continueToPayment}
                className="flex-1 py-3 rounded-xl border border-input font-medium hover:bg-accent transition-colors"
              >
                Skip
              </button>
              <button 
                onClick={continueToPayment}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium shadow-md hover:bg-primary/90 transition-colors"
              >
                Proceed to Pay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Gateway Simulation Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-background rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-primary p-6 text-primary-foreground">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {paymentMethod === 'card' ? <CreditCard className="h-6 w-6" /> : <ScanBarcode className="h-6 w-6" />}
                {paymentMethod === 'card' ? 'Secure Card Payment' : 'UPI Payment'}
              </h2>
              <p className="opacity-90 mt-1">Amount Due: <span className="font-bold text-xl">₹{total.toFixed(2)}</span></p>
            </div>
            
            <div className="p-6 space-y-4">
              {paymentMethod === 'card' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">Card Number</label>
                    <input 
                      type="text" 
                      placeholder="0000 0000 0000 0000" 
                      maxLength={16}
                      className="w-full border rounded-lg px-3 py-2 bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono tracking-widest"
                      value={paymentDetails.cardNumber}
                      onChange={(e) => setPaymentDetails({...paymentDetails, cardNumber: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase text-muted-foreground">Expiry (MM/YY)</label>
                      <input 
                        type="text" 
                        placeholder="MM/YY" 
                        maxLength={5}
                        className="w-full border rounded-lg px-3 py-2 bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono"
                        value={paymentDetails.expiry}
                        onChange={(e) => setPaymentDetails({...paymentDetails, expiry: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase text-muted-foreground">CVV</label>
                      <input 
                        type="password" 
                        placeholder="***" 
                        maxLength={4}
                        className="w-full border rounded-lg px-3 py-2 bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono"
                        value={paymentDetails.cvv}
                        onChange={(e) => setPaymentDetails({...paymentDetails, cvv: e.target.value})}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Enter UPI ID</label>
                  <input 
                    type="text" 
                    placeholder="user@bankname" 
                    className="w-full border rounded-lg px-3 py-2 bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                    value={paymentDetails.upiId}
                    onChange={(e) => setPaymentDetails({...paymentDetails, upiId: e.target.value})}
                  />
                  <div className="mt-4 flex justify-center py-4 bg-muted/20 rounded-xl border-2 border-dashed border-muted">
                    <ScanBarcode className="h-24 w-24 opacity-30" />
                  </div>
                  <p className="text-center text-xs text-muted-foreground mt-2">Scan QR or enter UPI ID above</p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t mt-6">
                <button 
                  disabled={checkingOut}
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  disabled={checkingOut}
                  onClick={processCheckout}
                  className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 font-bold shadow-sm transition-colors flex items-center justify-center"
                >
                  {checkingOut ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Pay Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card text-card-foreground p-8 rounded-2xl w-full max-w-sm shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
              <Banknote className="h-10 w-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Payment Successful!</h3>
            <p className="text-muted-foreground mb-8">
              The order has been processed and receipt is generated.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-md active:scale-[0.98]"
            >
              Start New Sale
            </button>
          </div>
        </div>
      )}
    </>
  )
}
