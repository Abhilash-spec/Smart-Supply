"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  FileText, 
  Settings, 
  Truck,
  Box,
  MessageSquare,
  BrainCircuit
} from "lucide-react"
import { cn } from "@/lib/utils"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

const ALL_NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, ownerOnly: true },
  { name: "Point of Sale", href: "/pos", icon: ShoppingCart, ownerOnly: false },
  { name: "Inventory", href: "/inventory", icon: Package, ownerOnly: true },
  { name: "Orders", href: "/orders", icon: ShoppingCart, ownerOnly: true },
  { name: "Procurement", href: "/procurement", icon: Box, ownerOnly: true },
  { name: "Invoices", href: "/invoices", icon: FileText, ownerOnly: true },
  { name: "Marketplace", href: "/marketplace", icon: Truck, ownerOnly: true },
  { name: "Customers", href: "/customers", icon: Users, ownerOnly: false },
  { name: "Reports", href: "/reports", icon: FileText, ownerOnly: true },
  { name: "Subscription", href: "/subscription", icon: Package, ownerOnly: true },
  { name: "Staff Management", href: "/staff", icon: Users, ownerOnly: true },
  { name: "Forecasting", href: "/forecasting", icon: BrainCircuit, ownerOnly: true },
  { name: "Copilot", href: "/copilot", icon: MessageSquare, ownerOnly: true },
]

export function Sidebar() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState("admin")

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.user_metadata?.role) {
        setUserRole(data.user.user_metadata.role)
      }
    })
  }, [])

  const visibleNav = ALL_NAV_ITEMS.filter(item => userRole === 'admin' ? true : !item.ownerOnly)

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card px-3 py-4">
      <div className="mb-8 flex items-center px-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-xl mr-2">
          S
        </div>
        <span className="text-xl font-bold tracking-tight">SmartSupply</span>
      </div>

      <nav className="flex-1 space-y-1">
        {visibleNav.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto pt-4 border-t">
        <Link
          href="/settings"
          className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Settings className="mr-3 h-5 w-5 text-muted-foreground group-hover:text-foreground" />
          Settings
        </Link>
      </div>
    </div>
  )
}
