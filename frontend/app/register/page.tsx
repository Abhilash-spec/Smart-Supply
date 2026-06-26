"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { 
  Lock, Mail, Store, Package, Eye, EyeOff, User, Phone, MapPin, Building2, 
  FileText, ArrowRight, ArrowLeft, Check, Loader2 
} from "lucide-react"
import Link from "next/link"

type AccountType = "shop" | "vendor"

interface OnboardingData {
  // Step 1: Account Type
  accountType: AccountType
  // Step 2: Credentials
  email: string
  password: string
  confirmPassword: string
  // Step 3: Business Details
  businessName: string
  ownerName: string
  phone: string
  gstNumber: string
  licenseNumber: string
  // Step 4: Address
  address: string
  city: string
  state: string
  country: string
  pincode: string
  // Step 5: Warehouse
  warehouseName: string
  warehouseAddress: string
}

const initialData: OnboardingData = {
  accountType: "shop",
  email: "",
  password: "",
  confirmPassword: "",
  businessName: "",
  ownerName: "",
  phone: "",
  gstNumber: "",
  licenseNumber: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
  warehouseName: "Main Warehouse",
  warehouseAddress: "",
}

const steps = [
  { title: "Account Type", description: "Choose your role" },
  { title: "Credentials", description: "Set up your login" },
  { title: "Business Details", description: "Tell us about your business" },
  { title: "Location", description: "Where are you based?" },
  { title: "Review & Submit", description: "Confirm your details" },
]

export default function RegisterPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<OnboardingData>(initialData)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (fields: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...fields }))
    setError(null)
  }

  const canAdvance = () => {
    switch (currentStep) {
      case 0: return true // account type always selected
      case 1: 
        if (!data.email || !data.password || !data.confirmPassword) return false
        if (data.password !== data.confirmPassword) return false
        if (data.password.length < 6) return false
        return true
      case 2: return data.businessName.length > 0 && data.ownerName.length > 0 && data.phone.length > 0
      case 3: return data.address.length > 0 && data.city.length > 0 && data.state.length > 0
      case 4: return true
      default: return false
    }
  }

  const handleNext = () => {
    if (currentStep === 1 && data.password !== data.confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    if (currentStep === 1 && data.password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    setError(null)
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
  }

  const handleBack = () => {
    setError(null)
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const role = data.accountType === "shop" ? "admin" : "vendor"

      // 1. Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role,
            business_name: data.businessName,
            owner_name: data.ownerName,
          }
        }
      })

      if (authError) throw authError

      // 2. Create Tenant
      const tenantSlug = data.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      const { data: tenant, error: tenantError } = await supabase.from('tenants').insert({
        name: data.businessName,
        slug: `${tenantSlug}-${Date.now()}`,
        tier: 'starter',
        status: 'active',
        metadata: {
          type: data.accountType,
          gst_number: data.gstNumber,
          license_number: data.licenseNumber,
        }
      }).select('id').single()

      if (tenantError) throw tenantError

      // 3. Create Organization
      const { data: org, error: orgError } = await supabase.from('organizations').insert({
        tenant_id: tenant.id,
        name: data.businessName,
        slug: `${tenantSlug}-org-${Date.now()}`,
        type: data.accountType === "shop" ? "retailer" : "supplier",
        status: 'active',
      }).select('id').single()

      if (orgError) throw orgError

      // 4. Create User record in public.users table
      const { error: userError } = await supabase.from('users').insert({
        id: authData.user?.id,
        tenant_id: tenant.id,
        email: data.email,
        first_name: data.ownerName.split(' ')[0] || data.ownerName,
        last_name: data.ownerName.split(' ').slice(1).join(' ') || '',
        display_name: data.ownerName,
        phone: data.phone,
        status: 'active',
      })

      if (userError) throw userError

      // 5. Create default warehouse
      const { error: whError } = await supabase.from('warehouses').insert({
        tenant_id: tenant.id,
        organization_id: org.id,
        name: data.warehouseName || 'Main Warehouse',
        code: 'WH-01',
        type: 'warehouse',
      })

      if (whError) console.warn('Warehouse creation failed:', whError.message)

      // 6. Create branch
      const { error: branchError } = await supabase.from('branches').insert({
        tenant_id: tenant.id,
        name: `${data.businessName} - HQ`,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        pincode: data.pincode,
        gst_number: data.gstNumber,
        is_headquarters: true,
      })

      if (branchError) console.warn('Branch creation failed:', branchError.message)

      // 7. If vendor, also create supplier profile
      if (data.accountType === "vendor") {
        await supabase.from('supplier_profiles').insert({
          tenant_id: tenant.id,
          organization_id: org.id,
          business_name: data.businessName,
        })
      }

      // 8. Sign in automatically
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (signInError) {
        // If auto-login fails (e.g. email confirmation required), redirect to login
        console.error('Auto-login failed after registration:', signInError)
        router.push("/login")
        return
      }

      // Force route to subscription page after registration to pick a plan
      router.push("/subscription")


    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Panel - Progress Stepper */}
      <div className="hidden lg:flex lg:w-[380px] flex-col bg-slate-50 border-r p-8">
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-lg font-black text-primary-foreground">S</span>
            </div>
            <span className="text-xl font-bold tracking-tight">SmartSupply</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Enterprise Supply Chain Platform</p>
        </div>

        <div className="space-y-1 flex-1">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-3 py-3">
              <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                idx < currentStep ? 'bg-emerald-500 text-white' :
                idx === currentStep ? 'bg-primary text-primary-foreground' :
                'bg-slate-200 text-slate-500'
              }`}>
                {idx < currentStep ? <Check className="h-4 w-4" /> : idx + 1}
              </div>
              <div>
                <p className={`text-sm font-medium ${idx <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t">
          <p className="text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>

      {/* Right Panel - Form Content */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-lg">
          {/* Mobile stepper */}
          <div className="lg:hidden mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Step {currentStep + 1} of {steps.length}</span>
              <Link href="/login" className="text-sm text-primary hover:underline">Sign in instead</Link>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div 
                className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight mb-1">{steps[currentStep].title}</h2>
          <p className="text-sm text-muted-foreground mb-8">{steps[currentStep].description}</p>

          {error && (
            <div className="mb-6 text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-destructive shrink-0" />
              {error}
            </div>
          )}

          {/* ─── Step 0: Account Type ─── */}
          {currentStep === 0 && (
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => update({ accountType: "shop" })}
                className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all ${
                  data.accountType === 'shop' ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`h-14 w-14 rounded-xl flex items-center justify-center ${data.accountType === 'shop' ? 'bg-primary/10' : 'bg-slate-100'}`}>
                  <Store className={`h-7 w-7 ${data.accountType === 'shop' ? 'text-primary' : 'text-slate-400'}`} />
                </div>
                <div className="text-center">
                  <p className="font-semibold">Shop Owner</p>
                  <p className="text-xs text-muted-foreground mt-1">Retail, Pharmacy, Grocery</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => update({ accountType: "vendor" })}
                className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all ${
                  data.accountType === 'vendor' ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`h-14 w-14 rounded-xl flex items-center justify-center ${data.accountType === 'vendor' ? 'bg-primary/10' : 'bg-slate-100'}`}>
                  <Package className={`h-7 w-7 ${data.accountType === 'vendor' ? 'text-primary' : 'text-slate-400'}`} />
                </div>
                <div className="text-center">
                  <p className="font-semibold">Vendor</p>
                  <p className="text-xs text-muted-foreground mt-1">Supplier, Distributor</p>
                </div>
              </button>
            </div>
          )}

          {/* ─── Step 1: Credentials ─── */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={data.email}
                    onChange={(e) => update({ email: e.target.value })}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    placeholder="name@company.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={data.password}
                    onChange={(e) => update({ password: e.target.value })}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2 pl-10 pr-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    placeholder="Min 6 characters"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={data.confirmPassword}
                    onChange={(e) => update({ confirmPassword: e.target.value })}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    placeholder="Re-enter password"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ─── Step 2: Business Details ─── */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{data.accountType === 'shop' ? 'Shop Name' : 'Company Name'} *</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={data.businessName}
                    onChange={(e) => update({ businessName: e.target.value })}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    placeholder={data.accountType === 'shop' ? 'e.g. MedPlus Pharmacy' : 'e.g. PharmaCo Distributors'}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{data.accountType === 'shop' ? 'Owner Name' : 'Contact Person'} *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={data.ownerName}
                    onChange={(e) => update({ ownerName: e.target.value })}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    placeholder="Full name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mobile Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="tel"
                    required
                    value={data.phone}
                    onChange={(e) => update({ phone: e.target.value })}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">GST Number</label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={data.gstNumber}
                      onChange={(e) => update({ gstNumber: e.target.value })}
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">License No.</label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={data.licenseNumber}
                      onChange={(e) => update({ licenseNumber: e.target.value })}
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      placeholder="DL-XX-XXXX"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Step 3: Location ─── */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Address *</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={data.address}
                    onChange={(e) => update({ address: e.target.value })}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    placeholder="Street address"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">City *</label>
                  <input
                    type="text"
                    required
                    value={data.city}
                    onChange={(e) => update({ city: e.target.value })}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2 px-3.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    placeholder="Hyderabad"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">State *</label>
                  <input
                    type="text"
                    required
                    value={data.state}
                    onChange={(e) => update({ state: e.target.value })}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2 px-3.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    placeholder="Telangana"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Country</label>
                  <input
                    type="text"
                    value={data.country}
                    onChange={(e) => update({ country: e.target.value })}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2 px-3.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    placeholder="India"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pincode</label>
                  <input
                    type="text"
                    value={data.pincode}
                    onChange={(e) => update({ pincode: e.target.value })}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2 px-3.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    placeholder="500001"
                  />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <label className="text-sm font-medium">Default Warehouse Name</label>
                <input
                  type="text"
                  value={data.warehouseName}
                  onChange={(e) => update({ warehouseName: e.target.value })}
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  placeholder="Main Warehouse"
                />
              </div>
            </div>
          )}

          {/* ─── Step 4: Review & Submit ─── */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="rounded-xl border bg-slate-50 p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Account Type</span>
                  <span className="text-sm font-medium capitalize">{data.accountType === 'shop' ? '🏪 Shop Owner' : '📦 Vendor'}</span>
                </div>
                <div className="border-t" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm font-medium">{data.email}</span>
                </div>
                <div className="border-t" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Business Name</span>
                  <span className="text-sm font-medium">{data.businessName}</span>
                </div>
                <div className="border-t" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Owner / Contact</span>
                  <span className="text-sm font-medium">{data.ownerName}</span>
                </div>
                <div className="border-t" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Phone</span>
                  <span className="text-sm font-medium">{data.phone}</span>
                </div>
                {data.gstNumber && (
                  <>
                    <div className="border-t" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">GST</span>
                      <span className="text-sm font-medium">{data.gstNumber}</span>
                    </div>
                  </>
                )}
                <div className="border-t" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Location</span>
                  <span className="text-sm font-medium">{data.city}, {data.state}</span>
                </div>
                <div className="border-t" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Warehouse</span>
                  <span className="text-sm font-medium">{data.warehouseName}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                By creating an account, you agree to SmartSupply&apos;s Terms of Service and Privacy Policy.
                You will start on the <strong>Basic (Free Trial)</strong> plan.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 gap-3">
            {currentStep > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 h-10 px-4 rounded-lg border text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canAdvance()}
                className="flex items-center gap-1.5 h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Create Account
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
