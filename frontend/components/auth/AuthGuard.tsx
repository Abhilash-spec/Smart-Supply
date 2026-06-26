"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export function AuthGuard({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        router.push("/login")
        return
      }

      const role = session.user?.user_metadata?.role || 'admin'
      
      if (!allowedRoles.includes(role)) {
        // Redirect to their proper dashboard
        if (role === 'superadmin') router.push("/superadmin")
        else if (role === 'vendor') router.push("/vendor")
        else router.push("/")
        return
      }

      // Check if the user's tenant is suspended (skip for superadmins)
      if (role !== 'superadmin') {
        const { data: userData } = await supabase
          .from('users')
          .select('tenant_id, tenants(status)')
          .eq('id', session.user.id)
          .single()

        // @ts-ignore - Supabase join typing
        if (userData?.tenants?.status === 'suspended') {
          router.push("/suspended")
          return
        }
      }

      setAuthorized(true)
      setLoading(false)
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push("/login")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, allowedRoles])

  if (loading || !authorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Verifying access...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
