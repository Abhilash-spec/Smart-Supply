"use client"

import { useState, useEffect } from "react"
import { Search, Star, ShoppingCart, ArrowRight, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

type MarketplaceProduct = {
  id: string
  name: string
  selling_price: number
  reorder_quantity: number
  organizations?: { name: string }
}

export default function MarketplacePage() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, organizations(name)')
          .limit(20)
        
        if (error && error.code !== 'PGRST116' && error.code !== '42P01') throw error
        if (data) setProducts(data)
      } catch (err) {
        console.error("Error fetching marketplace products:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-primary/5 rounded-xl p-6 border border-primary/20">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">B2B Marketplace</h1>
          <p className="text-muted-foreground mt-1">Discover millions of products from verified suppliers.</p>
        </div>
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search products, brands, suppliers..."
            className="h-11 w-full rounded-full border border-input bg-background px-4 pl-10 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {['All Categories', 'Grocery', 'Pharmacy', 'Electronics', 'Hardware', 'FMCG', 'Apparel', 'Automotive'].map((cat, i) => (
          <button key={cat} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent'}`}>
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No products found in the marketplace.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-2">
          {products.map((product) => (
            <div key={product.id} className="group rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col hover:border-primary/50 transition-colors">
              <div className="aspect-square bg-muted/30 relative flex items-center justify-center border-b">
                <div className="text-muted-foreground/50 font-medium text-lg">Image</div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">by {product.organizations?.name || "Unknown Supplier"}</p>
                
                <div className="flex items-center gap-1 mt-2">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-medium">4.5</span>
                  <span className="text-xs text-muted-foreground">(0)</span>
                </div>
                
                <div className="mt-auto pt-4 flex items-end justify-between">
                  <div>
                    <div className="text-xl font-bold">₹{(product.selling_price || 0).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">MOQ: {product.reorder_quantity || 10} units</div>
                  </div>
                  <button className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                    <ShoppingCart className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && products.length > 0 && (
        <div className="flex justify-center mt-4">
          <button className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors">
            View all products <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
