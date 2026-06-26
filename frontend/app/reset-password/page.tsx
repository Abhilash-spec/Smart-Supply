"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import Prism from "@/components/ui/prism"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Verify that the user has a valid session (from the email magic link)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      // If there's no session, they probably didn't come from a reset link
      if (!session) {
        // We don't strictly redirect here because sometimes the hash takes a second to process
        // But if they try to update password without a session, it will fail.
      }
    })
  }, [])

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setSuccess(true)
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/login")
      }, 3000)

    } catch (err: any) {
      setError(err.message || "Failed to update password. Your reset link may have expired.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ─── Left Panel: Floating Animations ─── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center login-gradient">
        <div className="absolute inset-0 z-0">
          <Prism
            height={3.5}
            baseWidth={5.5}
            animationType="rotate"
            glow={1}
            noise={0.5}
            transparent
            scale={3.6}
            hueShift={0}
            colorFrequency={1}
            hoverStrength={2}
            inertia={0.05}
            bloom={1}
            timeScale={0.5}
          />
        </div>

        <div className="relative z-10 text-center px-12 max-w-lg">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
              <span className="text-2xl font-black text-white">S</span>
            </div>
          </div>
          <h1 className="text-4xl xl:text-5xl font-black text-white tracking-tight leading-tight">
            Smart<span className="text-[#35ed7e]">Supply</span> AI
          </h1>
          <p className="mt-4 text-lg text-blue-100/70 leading-relaxed">
            Enterprise supply chain intelligence for modern retail businesses
          </p>
        </div>
      </div>

      {/* ─── Right Panel: Form ─── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 bg-background">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Create New Password</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Please enter your new password below.
            </p>
          </div>

          {success ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900 p-6 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900 mb-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-50 mb-2">Password Updated!</h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-6">
                Your password has been successfully changed.
              </p>
              <Link 
                href="/login" 
                className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-emerald-700 active:scale-[0.98]"
              >
                Continue to Login <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="new-password">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2 pl-10 pr-10 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent shadow-sm"
                      placeholder="••••••••"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="confirm-password">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2 pl-10 pr-10 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent shadow-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-destructive flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg disabled:opacity-50 active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    Updating...
                  </span>
                ) : "Reset Password"}
              </button>
            </form>
          )}

          <div className="mt-10 pt-6 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Secured by Supabase Auth · SmartSupply AI © 2026
            </p>
          </div>
        </div>
      </div>

      {/* Inline styles for floating animations */}
      <style jsx>{`
        .login-gradient {
          background: linear-gradient(135deg, #0a0d3a 0%, #1a1060 30%, #0f1a5c 60%, #0a0d3a 100%);
        }
      `}</style>
    </div>
  )
}
