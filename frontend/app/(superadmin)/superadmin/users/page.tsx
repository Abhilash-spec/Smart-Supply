"use client"

import { useEffect, useState } from "react"
import { Users, Shield, Package, Store, Loader2, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

interface UserItem {
  id: string
  name: string
  email: string
  role: 'admin' | 'vendor' | 'superadmin'
  tenantName: string
  status: string
  joinedAt: string
}

export default function SuperAdminUsersPage() {
  const [loading, setLoading] = useState(true)
  const [userList, setUserList] = useState<UserItem[]>([])
  const [metrics, setMetrics] = useState({
    total: 0,
    shopOwners: 0,
    vendors: 0,
    superAdmins: 0
  })

  useEffect(() => {
    async function fetchUserMetrics() {
      try {
        setLoading(true)
        
        // 1. Fetch real tenants (shops) and organizations (suppliers/vendors)
        const { data: tenants } = await supabase.from('tenants').select('id, name, slug, created_at')
        const { data: organizations } = await supabase.from('organizations').select('id, tenant_id, name, type, created_at')
        
        // 2. Fetch users from public users table (if configured/available)
        const { data: dbUsers, error: usersError } = await supabase
          .from('users')
          .select('*')
        
        let processedUsers: UserItem[] = []

        // If database contains users, process them
        if (dbUsers && dbUsers.length > 0) {
          processedUsers = dbUsers.map((u: any) => {
            const tenant = tenants?.find(t => t.id === u.tenant_id)
            const isVendor = organizations?.some(org => org.tenant_id === u.tenant_id && org.type === 'supplier')
            return {
              id: u.id,
              name: u.display_name || `${u.first_name} ${u.last_name || ''}`,
              email: u.email,
              role: u.metadata?.role || (isVendor ? 'vendor' : 'admin'),
              tenantName: tenant ? tenant.name : 'Platform HQ',
              status: u.status || 'active',
              joinedAt: new Date(u.created_at).toLocaleDateString()
            }
          })
        }

        // If no users in DB, just return empty list. We removed the mock data seeding per request.
        if (processedUsers.length === 0) {
           processedUsers = []
        }

        // 3. Compute Metrics
        const shopOwnersCount = processedUsers.filter(u => u.role === 'admin').length
        const vendorsCount = processedUsers.filter(u => u.role === 'vendor').length
        const superAdminsCount = processedUsers.filter(u => u.role === 'superadmin').length

        setMetrics({
          total: processedUsers.length,
          shopOwners: shopOwnersCount,
          vendors: vendorsCount,
          superAdmins: superAdminsCount
        })

        setUserList(processedUsers)

      } catch (err) {
        console.error("Error loading user metrics:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserMetrics()
  }, [])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Metrics</h1>
          <p className="text-muted-foreground mt-1">Platform-wide overview of active Admins, Shop Owners, and Vendors.</p>
        </div>
        <Link 
          href="/superadmin"
          className="flex items-center gap-2 rounded-lg bg-muted text-muted-foreground border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Console</span>
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Users</h3>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold">
            {loading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : metrics.total}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
        </div>

        {/* Shop Owners */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Shop Owners</h3>
            <Store className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold">
            {loading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : metrics.shopOwners}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Kirana, pharma, grocery stores</p>
        </div>

        {/* Vendors */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Vendors</h3>
            <Package className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold">
            {loading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : metrics.vendors}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Bioactive, FMCG suppliers</p>
        </div>

        {/* Super Admins */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Platform Admins</h3>
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold">
            {loading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : metrics.superAdmins}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Super Admin controllers</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden mt-4">
        <div className="p-4 border-b">
          <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Platform Registered Users
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="border-b bg-muted/30 text-muted-foreground font-medium">
              <tr>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Associated Entity</th>
                <th className="px-6 py-3.5">Date Joined</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                    <span>Loading metrics...</span>
                  </td>
                </tr>
              ) : userList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No users registered in the system database.
                  </td>
                </tr>
              ) : userList.map((user) => (
                <tr key={user.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="px-6 py-4 font-medium flex items-center gap-3 text-primary">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold">
                      {user.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <span>{user.name}</span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                  <td className="px-6 py-4">
                    {user.role === 'superadmin' && (
                      <span className="bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                        Super Admin
                      </span>
                    )}
                    {user.role === 'vendor' && (
                      <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                        Vendor
                      </span>
                    )}
                    {user.role === 'admin' && (
                      <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                        Shop Owner
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{user.tenantName}</td>
                  <td className="px-6 py-4 text-muted-foreground">{user.joinedAt}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      {user.status}
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
