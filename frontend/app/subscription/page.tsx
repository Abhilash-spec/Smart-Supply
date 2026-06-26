"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Check, CreditCard, AlertCircle, Loader2, Sparkles, Building, Settings } from "lucide-react"
import { processSubscription, fetchCurrentPlan } from "@/app/actions/billing"

interface Plan {
  id: string
  name: string
  slug: string
  tier: string
  price_monthly: number
  price_yearly: number
  features: Record<string, any>
  limits: Record<string, any>
}

export default function SubscriptionPage() {
  const router = useRouter()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [fetchingPlans, setFetchingPlans] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentStep, setPaymentStep] = useState<'card' | 'processing' | 'success'>('card')
  const [currentSubscription, setCurrentSubscription] = useState<any>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)

  useEffect(() => {
    fetchPlans()
  }, [])

  async function fetchPlans() {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching plans:', error)
    } else {
      setPlans(data || [])
    }
    
    // Get current tenant and active subscription
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
      if (userData?.tenant_id) {
        setTenantId(userData.tenant_id)
        const currentPlanRes = await fetchCurrentPlan(userData.tenant_id)
        if (currentPlanRes.success && currentPlanRes.subscription) {
          setCurrentSubscription(currentPlanRes.subscription)
        }
      }
    }
    
    setFetchingPlans(false)
  }

  const planMeta: Record<string, { description: string; features: string[]; recommended: boolean }> = {
    basic: {
      description: "Perfect for single-branch small shops.",
      features: [
        "1 Branch & 1 Warehouse",
        "Up to 3 Staff Members",
        "5,000 SKU Limit",
        "1,000 Orders/Month",
        "Standard Support",
      ],
      recommended: false,
    },
    pro: {
      description: "For growing retail operations.",
      features: [
        "5 Branches & 3 Warehouses",
        "Up to 15 Staff Members",
        "50,000 SKU Limit",
        "10,000 Orders/Month",
        "AI Demand Forecasting",
        "Tally Integration",
        "Priority Support",
      ],
      recommended: true,
    },
    max: {
      description: "Enterprise scale multi-vendor ops.",
      features: [
        "Unlimited Branches & Warehouses",
        "Unlimited Staff Members",
        "Unlimited SKUs",
        "Unlimited Orders",
        "Custom Domain & Branding",
        "Priority API Access",
        "Dedicated Support",
      ],
      recommended: false,
    },
  }

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan)
    setShowPaymentModal(true)
    setPaymentStep('card')
  }

  const handleSimulatePayment = async () => {
    if (!selectedPlan || !tenantId) return
    setPaymentStep('processing')

    // Simulate payment processing delay
    await new Promise(r => setTimeout(r, 2000))

    // Process subscription via secure server action
    try {
      const res = await processSubscription(tenantId, selectedPlan.id, 'monthly', 'simulated_internal')
      
      if (!res.success) throw new Error(res.message)

      setPaymentStep('success')

      const { data: { user } } = await supabase.auth.getUser()
      const role = user?.user_metadata?.role || 'admin'

      // Wait a moment then redirect
      await new Promise(r => setTimeout(r, 2000))
      if (role === 'vendor') router.push('/vendor')
      else router.push('/')
    } catch (e: any) {
      console.error('Payment error:', e)
      alert('Error: ' + e.message)
      setPaymentStep('card')
    }
  }

  if (fetchingPlans) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Header */}
        <div className="text-center pt-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Choose Your Plan
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Select a Subscription Plan</h1>
          <p className="text-muted-foreground mt-3 text-lg max-w-2xl mx-auto">
            Pick the plan that fits your business. You can upgrade or downgrade anytime.
          </p>
        </div>

        {/* Test Mode Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3 max-w-3xl mx-auto">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-900">Simulated Billing Mode</h4>
            <p className="text-sm text-blue-800 mt-1">
              Live payment gateways are disabled. Subscriptions will be tracked via internal ledger. Use &quot;Select&quot; to test MRR updates.
            </p>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const meta = planMeta[plan.slug] || { description: '', features: [], recommended: false }
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border bg-white p-8 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 ${
                  meta.recommended ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'border-slate-200'
                }`}
              >
                {meta.recommended && (
                  <div className="absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full bg-primary px-4 py-1 text-xs font-semibold text-white tracking-wide">
                    MOST POPULAR
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-2 min-h-[40px]">{meta.description}</p>
                </div>

                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">₹{plan.price_monthly.toLocaleString('en-IN')}</span>
                  <span className="text-sm text-muted-foreground font-medium">/month</span>
                </div>

                <ul className="mb-8 flex-1 space-y-3">
                  {meta.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {currentSubscription?.plan_id === plan.id ? (
                  <button
                    disabled
                    className="w-full h-12 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed"
                  >
                    <Check className="h-4 w-4" />
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={loadingPlan !== null}
                    className={`w-full h-12 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                      meta.recommended
                        ? 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {currentSubscription ? <Settings className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                    {currentSubscription ? `Switch to ${plan.name}` : `Select ${plan.name}`}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Fallback if no plans seeded */}
        {plans.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No subscription plans found.</p>
            <p className="text-sm mt-2">Please run <code className="bg-slate-100 px-2 py-0.5 rounded">003_rls_and_seed.sql</code> in your Supabase SQL Editor.</p>
          </div>
        )}
      </div>

      {/* Payment Modal Overlay */}
      {showPaymentModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
            {paymentStep === 'card' && (
              <div className="p-8">
                <h2 className="text-xl font-bold mb-1">Complete Payment</h2>
                <p className="text-muted-foreground text-sm mb-6">
                  {selectedPlan.name} Plan — ₹{selectedPlan.price_monthly.toLocaleString('en-IN')}/month
                </p>

                {/* Simulated Card Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Card Number</label>
                    <input
                      type="text"
                      defaultValue="4111 1111 1111 1111"
                      readOnly
                      className="w-full h-11 rounded-lg border border-slate-300 bg-slate-50 px-4 text-sm font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Expiry</label>
                      <input
                        type="text"
                        defaultValue="12/28"
                        readOnly
                        className="w-full h-11 rounded-lg border border-slate-300 bg-slate-50 px-4 text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">CVV</label>
                      <input
                        type="text"
                        defaultValue="123"
                        readOnly
                        className="w-full h-11 rounded-lg border border-slate-300 bg-slate-50 px-4 text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Test mode — pre-filled with dummy card. No real charges.
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 h-11 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSimulatePayment}
                    className="flex-1 h-11 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    Pay ₹{selectedPlan.price_monthly.toLocaleString('en-IN')}
                  </button>
                </div>
              </div>
            )}

            {paymentStep === 'processing' && (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <h3 className="text-lg font-bold">Processing Payment...</h3>
                <p className="text-sm text-muted-foreground mt-2">Please wait while we verify your payment.</p>
              </div>
            )}

            {paymentStep === 'success' && (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-emerald-900">Payment Successful!</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Your {selectedPlan.name} plan is now active. Redirecting to your dashboard...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
