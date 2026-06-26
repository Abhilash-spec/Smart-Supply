"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { getTenantDetails } from "@/app/actions/superadmin"
import { updateTenantStatus } from "@/app/actions/billing"
import { ArrowLeft, Building, CreditCard, ShieldAlert, Users, Calendar, Activity, CheckCircle2, XCircle, Loader2 } from "lucide-react"

export default function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const unwrappedParams = use(params)
  const tenantId = unwrappedParams.id

  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    async function loadTenant() {
      setLoading(true)
      const res = await getTenantDetails(tenantId)
      if (res.success) {
        setData(res)
      } else {
        alert("Failed to load tenant details: " + res.message)
      }
      setLoading(false)
    }
    loadTenant()
  }, [tenantId])

  const handleToggleStatus = async () => {
    if (!data?.tenant) return
    const isCurrentlyActive = data.tenant.status === 'active'
    const newStatus = isCurrentlyActive ? 'suspended' : 'active'
    
    if (newStatus === 'suspended') {
      if (!confirm(`Are you sure you want to suspend "${data.tenant.name}"? Users will be immediately locked out.`)) return
    }

    setUpdating(true)
    const res = await updateTenantStatus(tenantId, newStatus)
    if (res.success) {
      setData({ ...data, tenant: { ...data.tenant, status: newStatus } })
    } else {
      alert("Error: " + res.message)
    }
    setUpdating(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data?.tenant) {
    return <div>Tenant not found.</div>
  }

  const { tenant, subscription, users } = data
  const isSuspended = tenant.status === 'suspended'

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isSuspended 
                ? 'bg-destructive/10 text-destructive' 
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
            }`}>
              {tenant.status}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 font-mono text-sm">Tenant ID: {tenant.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" /> Organization Profile
              </h2>
            </div>
            <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Type</p>
                <p className="font-medium capitalize mt-1">{tenant.type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Slug</p>
                <p className="font-mono text-sm mt-1">{tenant.slug}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created On</p>
                <p className="font-medium flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {new Date(tenant.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="font-medium flex items-center gap-2 mt-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {users} active members
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" /> Active Subscription
              </h2>
            </div>
            <div className="p-6">
              {subscription ? (
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold capitalize text-primary">{subscription.plan?.name || tenant.tier} Plan</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Billed {subscription.billing_cycle} via {subscription.payment_gateway}
                    </p>
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium">Period: {new Date(subscription.current_period_start).toLocaleDateString()} — {new Date(subscription.current_period_end).toLocaleDateString()}</p>
                      <p className="text-sm font-medium">Gateway ID: <span className="font-mono text-xs font-normal text-muted-foreground">{subscription.gateway_subscription_id}</span></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold">₹{subscription.plan?.price_monthly?.toLocaleString('en-IN') || 0}</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>No active subscription found.</p>
                  <p className="text-sm">Tenant is currently using the default tier limits.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-destructive" /> Danger Zone
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-1">{isSuspended ? 'Activate Tenant' : 'Suspend Tenant'}</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  {isSuspended 
                    ? 'Restore access to the platform for all users under this tenant.' 
                    : 'Immediately lock out all users associated with this tenant.'}
                </p>
                <button
                  onClick={handleToggleStatus}
                  disabled={updating}
                  className={`w-full flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium transition-colors ${
                    isSuspended
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : 'bg-destructive/10 text-destructive hover:bg-destructive hover:text-white'
                  }`}
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : isSuspended ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  {isSuspended ? 'Reactivate Tenant' : 'Suspend Tenant'}
                </button>
              </div>

              <div className="pt-4 border-t border-dashed">
                <h4 className="font-medium text-sm mb-1">Force Password Reset</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Require all staff members of this tenant to reset their passwords on next login.
                </p>
                <button className="w-full h-10 rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors">
                  Trigger Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
