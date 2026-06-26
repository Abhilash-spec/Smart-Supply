"use client"

import { AuthGuard } from "@/components/auth/AuthGuard"
import { Shield, LogOut, LayoutDashboard, Building2, Users, Settings, Menu, X, Activity } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Overview", href: "/superadmin", icon: LayoutDashboard },
  { name: "Tenants (Shops)", href: "/superadmin/tenants", icon: Building2 },
  { name: "Subscriptions", href: "/superadmin/subscriptions", icon: Activity },
  { name: "User Management", href: "/superadmin/users", icon: Users },
  { name: "System Logs", href: "/superadmin/logs", icon: Activity },
  { name: "Platform Settings", href: "/superadmin/settings", icon: Settings },
]

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const NavLinks = () => (
    <nav className="space-y-1">
      {navigation.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-slate-100 text-slate-900 font-semibold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon className={cn("h-4 w-4", isActive ? "text-slate-900" : "text-slate-500")} />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <AuthGuard allowedRoles={['superadmin']}>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex w-64 flex-col border-r bg-white text-slate-900">
          <div className="flex h-16 items-center px-6 border-b border-slate-200">
            <Shield className="mr-2 h-6 w-6 text-primary" />
            <span className="text-lg font-bold">SmartSupply<span className="text-primary text-xs ml-1 uppercase">HQ</span></span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            <NavLinks />
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-64 bg-white text-slate-900 flex flex-col shadow-2xl">
              <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200">
                <div className="flex items-center">
                  <Shield className="mr-2 h-6 w-6 text-primary" />
                  <span className="text-lg font-bold">SmartSupply<span className="text-primary text-xs ml-1 uppercase">HQ</span></span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-slate-500 hover:text-slate-900">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 flex-1 overflow-y-auto">
                <NavLinks />
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-16 items-center justify-between border-b px-6">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSidebarOpen(true)} 
                className="md:hidden text-muted-foreground hover:text-foreground"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-lg font-semibold">Super Admin Console</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium hidden sm:inline">Logged in as Super Admin</span>
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
