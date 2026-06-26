"use client"

import { AuthGuard } from "@/components/auth/AuthGuard"
import { Package, LogOut, LayoutDashboard, ShoppingCart, BookOpen, FileText, Menu, X, Bell, Users, User, ChevronDown, Settings, UserCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"

const ALL_NAV_ITEMS = [
  { name: "Dashboard", href: "/vendor", icon: LayoutDashboard, ownerOnly: true },
  { name: "Bulk Billing (POS)", href: "/vendor/pos", icon: Package, ownerOnly: false },
  { name: "Received Orders", href: "/vendor/orders", icon: ShoppingCart, ownerOnly: true },
  { name: "My Catalog", href: "/vendor/catalog", icon: BookOpen, ownerOnly: true },
  { name: "Invoices", href: "/vendor/invoices", icon: FileText, ownerOnly: false },
  { name: "Staff Management", href: "/vendor/staff", icon: Users, ownerOnly: true },
]

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userRole, setUserRole] = useState("vendor")
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const userMenuRef = useRef<HTMLDivElement>(null)
  const notifMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Close dropdowns when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserEmail(data.user.email || null)
        if (data.user.user_metadata?.role) {
          setUserRole(data.user.user_metadata.role)
        }
      }
    })
  }, [])

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch('/api/notifications')
        if (res.ok) {
          const data = await res.json()
          setNotifications(data.notifications || [])
          setUnreadCount((data.notifications || []).filter((n: any) => !n.is_read).length)
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err)
      }
    }
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const markAsRead = async (id?: string) => {
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id })
      })
      if (id) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)
      }
    } catch (err) {
      console.error("Failed to mark as read", err)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const NavLinks = () => {
    const visibleNav = ALL_NAV_ITEMS.filter(item => userRole === 'vendor' ? true : !item.ownerOnly)
    
    return (
      <nav className="space-y-1">
        {visibleNav.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-50 text-emerald-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn("h-4 w-4", isActive ? "text-emerald-600" : "text-slate-400")} />
              {item.name}
            </Link>
          )
        })}
      </nav>
    )
  }

  return (
    <AuthGuard allowedRoles={['vendor', 'staff']}>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex w-64 flex-col border-r bg-white text-slate-900">
          <div className="flex h-16 items-center px-6 border-b border-slate-200">
            <Package className="mr-2 h-6 w-6 text-emerald-600" />
            <span className="text-lg font-bold">Supplier Portal</span>
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
                  <Package className="mr-2 h-6 w-6 text-emerald-600" />
                  <span className="text-lg font-bold">Supplier Portal</span>
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
              <h1 className="text-lg font-semibold">Vendor Dashboard</h1>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              
              {/* Notifications */}
              <div className="relative" ref={notifMenuRef}>
                <button 
                  onClick={() => {
                    const newState = !showNotifications;
                    setShowNotifications(newState)
                    setShowUserMenu(false)
                  }}
                  className={`relative rounded-full p-2 transition-colors ${showNotifications ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white text-slate-900 shadow-lg animate-in fade-in zoom-in-95 duration-200 z-50">
                    <div className="sticky top-0 px-4 py-3 border-b border-slate-100 bg-white/95 backdrop-blur flex justify-between items-center z-10">
                      <h3 className="font-semibold text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={() => markAsRead()} className="text-xs text-emerald-600 hover:underline">
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-slate-500">
                          <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                          No new notifications.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id} 
                            className={`p-4 transition-colors cursor-pointer ${!notif.is_read ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
                            onClick={() => !notif.is_read && markAsRead(notif.id)}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <p className={`text-sm ${!notif.is_read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                                {notif.title}
                              </p>
                              <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                {new Date(notif.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {notif.body}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile */}
              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={() => {
                    setShowUserMenu(!showUserMenu)
                    setShowNotifications(false)
                  }}
                  className={`flex items-center gap-2 rounded-full border pl-1 pr-3 py-1 transition-all ${showUserMenu ? 'bg-muted ring-2 ring-primary/20' : 'hover:bg-muted'}`}
                >
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-xs font-semibold leading-none">{userEmail ? userEmail.split('@')[0] : 'Vendor'}</span>
                    <span className="text-[10px] text-muted-foreground uppercase mt-0.5">{userRole || 'Supplier'}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-card text-card-foreground shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                    <div className="px-4 py-3 border-b bg-muted/30">
                      <p className="text-sm font-medium truncate">{userEmail || 'Loading...'}</p>
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">{userRole || 'Vendor'}</p>
                    </div>
                    <div className="p-1">
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left">
                        <UserCircle className="h-4 w-4 text-muted-foreground" />
                        My Profile
                      </button>
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        Settings
                      </button>
                      <div className="h-px bg-border my-1" />
                      <button 
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-destructive/10 text-destructive transition-colors text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
