"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { CreditCard, Search, ArrowUpRight, Loader2, CheckCircle2, XCircle } from "lucide-react"

export default function SuperadminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  async function fetchSubscriptions() {
    try {
      // Assuming a relationship: subscriptions -> tenants
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          tenant:tenants(name, slug),
          plan:subscription_plans(name, tier, price_monthly)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSubscriptions(data || [])
    } catch (err: any) {
      console.error('Error fetching subscriptions:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground mt-1">Manage tenant billing and active plans.</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search subscriptions..."
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b bg-muted/50">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tenant</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Plan</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Cycle</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Gateway</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {loading ? (
                <tr>
                  <td colSpan={6} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-24 text-center text-muted-foreground">
                    No subscriptions found.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-4 align-middle">
                      <div className="font-medium">{sub.tenant?.name || 'Unknown Tenant'}</div>
                      <div className="text-xs text-muted-foreground">{sub.tenant?.slug}</div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-primary" />
                        <span className="font-medium">{sub.plan?.name || 'Unknown Plan'}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      {sub.status === 'active' ? (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Active
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
                          <XCircle className="h-3.5 w-3.5" />
                          {sub.status}
                        </div>
                      )}
                    </td>
                    <td className="p-4 align-middle capitalize">{sub.billing_cycle || 'Monthly'}</td>
                    <td className="p-4 align-middle font-mono text-xs">{sub.gateway || 'razorpay'}</td>
                    <td className="p-4 align-middle text-muted-foreground">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
