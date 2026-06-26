"use client"

import { useEffect, useState } from "react"
import { getBillingHistory } from "@/app/actions/superadmin"
import { CreditCard, Receipt, Loader2, ArrowRightLeft } from "lucide-react"

export default function BillingHistoryPage() {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true)
      const res = await getBillingHistory()
      if (res.success && res.history) {
        setHistory(res.history)
      }
      setLoading(false)
    }
    fetchHistory()
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Transactions</h1>
        <p className="text-muted-foreground mt-1">Global subscription history and revenue ledger.</p>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" /> Platform Ledger
          </h2>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-muted-foreground border-b bg-muted/30">
              <tr>
                <th className="h-12 px-6 font-medium">Date</th>
                <th className="h-12 px-6 font-medium">Tenant Name</th>
                <th className="h-12 px-6 font-medium">Transaction Type</th>
                <th className="h-12 px-6 font-medium">Gateway</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading billing history...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No billing history found.
                  </td>
                </tr>
              ) : history.map((record) => (
                <tr key={record.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(record.created_at).toLocaleDateString()} {new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {record.subscription?.tenants?.name || 'Unknown Tenant'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span className="bg-muted px-2 py-0.5 rounded">{record.from_plan_id ? 'Upgrade/Downgrade' : 'New Subscription'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize">
                      {record.gateway || 'Simulated'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
