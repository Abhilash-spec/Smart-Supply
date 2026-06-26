"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, Search, Menu, Moon, Sun, LogOut, User, ChevronDown, Settings, UserCircle, Receipt } from "lucide-react"
import { useTheme } from "next-themes"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export function Header() {
  const { setTheme, theme } = useTheme()
  const router = useRouter()
  
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
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
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUserEmail(session.user.email || null)
        const { data: userData } = await supabase.from('users').select('role').eq('id', session.user.id).single()
        if (userData) setUserRole(userData.role)
      }
    }
    getUser()
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
    // Poll every 30 seconds for new notifications
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

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b bg-background px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-muted-foreground hover:text-foreground">
          <Menu className="h-6 w-6" />
        </button>
        <div className="relative hidden sm:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search products, orders, POs..."
            className="h-9 w-64 rounded-md border border-input bg-transparent px-3 pl-9 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute top-2 h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifMenuRef}>
          <button 
            onClick={() => {
              const newState = !showNotifications;
              setShowNotifications(newState)
              setShowUserMenu(false)
              if (newState && unreadCount > 0) {
                // Optionally mark all as read when opening
              }
            }}
            className={`relative rounded-full p-2 transition-colors ${showNotifications ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border bg-card text-card-foreground shadow-lg animate-in fade-in zoom-in-95 duration-200 z-50">
              <div className="sticky top-0 px-4 py-3 border-b bg-muted/95 backdrop-blur flex justify-between items-center z-10">
                <h3 className="font-semibold text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={() => markAsRead()} className="text-xs text-primary hover:underline">
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="divide-y">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    No new notifications.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-4 transition-colors ${!notif.is_read ? 'bg-primary/5' : ''}`}
                      onClick={() => !notif.is_read && markAsRead(notif.id)}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <p className={`text-sm ${!notif.is_read ? 'font-semibold' : 'font-medium'}`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {new Date(notif.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
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
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User className="h-4 w-4" />
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-xs font-semibold leading-none">{userEmail ? userEmail.split('@')[0] : 'User'}</span>
              <span className="text-[10px] text-muted-foreground uppercase mt-0.5">{userRole || 'Shop'}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-card text-card-foreground shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
              <div className="px-4 py-3 border-b bg-muted/30">
                <p className="text-sm font-medium truncate">{userEmail || 'Loading...'}</p>
                <p className="text-xs text-muted-foreground capitalize mt-0.5">{userRole || 'Role Unknown'}</p>
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
  )
}
