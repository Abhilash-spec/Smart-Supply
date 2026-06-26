"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Store, Activity, Database, Users, IndianRupee, Loader2, ArrowUpRight, TrendingUp } from "lucide-react"
import { getPlatformStats } from "@/app/actions/superadmin"

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    mrr: 0,
    activePaidSubscriptions: 0,
    totalShops: 0,
    totalSuppliers: 0
  })
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      setLoading(true)
      const res = await getPlatformStats()
      if (res.success && res.stats) {
        setStats(res.stats)
        setTenants(res.tenants || [])
      }
      setLoading(false)
    }

    loadStats()
  }, [])

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
        <p className="text-muted-foreground mt-1">Global metrics across all tenants and suppliers.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* MRR Card */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 cursor-pointer hover:border-primary transition-colors">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Monthly Recurring Revenue</h3>
            <IndianRupee className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : formatCurrency(stats.mrr)}
          </div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-emerald-500" /> Active paid: {stats.activePaidSubscriptions}
          </p>
        </div>

        {/* Shops Card */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 cursor-pointer hover:border-primary transition-colors">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Shops (Tenants)</h3>
            <Store className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.totalShops}
          </div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3 text-emerald-500" /> Active on platform
          </p>
        </div>

        {/* Suppliers Card */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 cursor-pointer hover:border-primary transition-colors">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Active Suppliers</h3>
            <Database className="h-4 w-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.totalSuppliers}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Registered vendors</p>
        </div>

        {/* Health Card */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Platform Health</h3>
            <Activity className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-500">99.99%</div>
          <p className="text-xs text-muted-foreground mt-1">All systems operational</p>
        </div>
      </div>
      
      {/* Tenants Table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm mt-4">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Active Tenants
          </h2>
          <button className="text-sm text-primary hover:underline font-medium">View All</button>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-muted-foreground border-b bg-muted/30">
              <tr>
                <th className="h-12 px-6 font-medium">Tenant Name</th>
                <th className="h-12 px-6 font-medium">Slug</th>
                <th className="h-12 px-6 font-medium">Plan Tier</th>
                <th className="h-12 px-6 font-medium">Type</th>
                <th className="h-12 px-6 font-medium">Status</th>
                <th className="h-12 px-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Loading tenants...
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No tenants found on the platform.
                  </td>
                </tr>
              ) : tenants.map((tenant) => (
                <tr key={tenant.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="px-6 py-4 font-medium">{tenant.name}</td>
                  <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{tenant.slug}</td>
                  <td className="px-6 py-4">
                    <span className="capitalize font-semibold text-primary">{tenant.tier || 'basic'}</span>
                  </td>
                  <td className="px-6 py-4 capitalize">{tenant.type}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      tenant.status === 'active' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                    }`}>
                      {tenant.status || 'active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/superadmin/tenants/${tenant.id}`} className="text-primary hover:underline text-xs font-medium px-3 py-1.5 rounded-md hover:bg-primary/10 transition-colors">
                      Manage
                    </Link>
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
