"use client"

import { useState } from "react"
import { Settings, Bell, Shield, Globe, Save, ToggleLeft, ToggleRight, Loader2, Check } from "lucide-react"

export default function PlatformSettingsPage() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Platform Settings State
  const [platformName, setPlatformName] = useState("SmartSupply AI")
  const [platformTagline, setPlatformTagline] = useState("Enterprise supply chain intelligence")
  const [defaultTier, setDefaultTier] = useState("starter")
  const [maxTenantsPerPlan, setMaxTenantsPerPlan] = useState("50")

  // Feature Flags
  const [features, setFeatures] = useState({
    aiCopilot: true,
    marketplace: true,
    multiWarehouse: false,
    advancedAnalytics: true,
    batchTracking: false,
    supplierPortal: true,
  })

  // Notification Settings
  const [notifications, setNotifications] = useState({
    newTenantEmail: true,
    systemAlerts: true,
    weeklyReport: false,
    usageAlerts: true,
  })

  const toggleFeature = (key: keyof typeof features) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    // Simulate save delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const ToggleSwitch = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-primary' : 'bg-muted'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
          <p className="text-muted-foreground mt-1">Configure global platform behavior, features, and notifications.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 shadow-sm"
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
          ) : saved ? (
            <><Check className="h-4 w-4" /> Saved!</>
          ) : (
            <><Save className="h-4 w-4" /> Save Changes</>
          )}
        </button>
      </div>

      {/* General Settings */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="p-6 border-b flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">General</h2>
            <p className="text-xs text-muted-foreground">Platform branding and default configurations</p>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Platform Name</label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tagline</label>
              <input
                type="text"
                value={platformTagline}
                onChange={(e) => setPlatformTagline(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Tenant Tier</label>
              <select
                value={defaultTier}
                onChange={(e) => setDefaultTier(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Tenants per Plan</label>
              <input
                type="number"
                value={maxTenantsPerPlan}
                onChange={(e) => setMaxTenantsPerPlan(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Feature Flags */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="p-6 border-b flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Feature Flags</h2>
            <p className="text-xs text-muted-foreground">Enable or disable platform-wide features</p>
          </div>
        </div>
        <div className="divide-y">
          {[
            { key: 'aiCopilot' as const, label: 'AI Copilot', desc: 'Demand forecasting and smart inventory suggestions' },
            { key: 'marketplace' as const, label: 'B2B Marketplace', desc: 'Allow tenants to browse and order from supplier catalogs' },
            { key: 'multiWarehouse' as const, label: 'Multi-Warehouse', desc: 'Support for managing multiple warehouse locations' },
            { key: 'advancedAnalytics' as const, label: 'Advanced Analytics', desc: 'Detailed reports, custom dashboards, and export tools' },
            { key: 'batchTracking' as const, label: 'Batch & Expiry Tracking', desc: 'Track product batches with expiry date alerts' },
            { key: 'supplierPortal' as const, label: 'Supplier Portal', desc: 'Allow suppliers to manage catalogs and view orders' },
          ].map((feature) => (
            <div key={feature.key} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium">{feature.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{feature.desc}</p>
              </div>
              <ToggleSwitch enabled={features[feature.key]} onToggle={() => toggleFeature(feature.key)} />
            </div>
          ))}
        </div>
      </div>

      {/* Notification Controls */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="p-6 border-b flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Notifications</h2>
            <p className="text-xs text-muted-foreground">System notification preferences for admins</p>
          </div>
        </div>
        <div className="divide-y">
          {[
            { key: 'newTenantEmail' as const, label: 'New Tenant Registration', desc: 'Email when a new shop signs up on the platform' },
            { key: 'systemAlerts' as const, label: 'System Health Alerts', desc: 'Notifications for downtime, errors, and performance issues' },
            { key: 'weeklyReport' as const, label: 'Weekly Platform Report', desc: 'Automated weekly summary of platform activity' },
            { key: 'usageAlerts' as const, label: 'Usage Threshold Alerts', desc: 'Alert when tenants approach plan limits' },
          ].map((notif) => (
            <div key={notif.key} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium">{notif.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{notif.desc}</p>
              </div>
              <ToggleSwitch enabled={notifications[notif.key]} onToggle={() => toggleNotification(notif.key)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
