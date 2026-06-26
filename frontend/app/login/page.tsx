"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Lock, Eye, EyeOff, Mail } from "lucide-react"
import Link from "next/link"
import Silk from "@/components/Silk"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        // Attempt to log failure silently (fails if RLS isn't configured for inserts)
        try {
          await supabase.from('login_attempts').insert({
            email,
            ip_address: '127.0.0.1', 
            user_agent: window.navigator.userAgent,
            success: false,
            failure_reason: error.message
          })
        } catch (e) {
          // Ignore RLS errors
        }
        
        throw error
      }

      // Attempt to log success silently
      try {
        await supabase.from('login_attempts').insert({
          email,
          ip_address: '127.0.0.1', 
          user_agent: window.navigator.userAgent,
          success: true
        })
      } catch (e) {
        // Ignore RLS errors
      }

      // Route based on role
      const role = data.user?.user_metadata?.role || 'admin'
      
      if (role === 'superadmin') {
        window.location.href = "/superadmin"
      } else if (role === 'vendor') {
        window.location.href = "/vendor"
      } else if (role === 'staff') {
        const staffType = data.user?.user_metadata?.staff_type
        window.location.href = staffType === 'vendor' ? "/vendor/pos" : "/pos"
      } else {
        window.location.href = "/" // Default admin dashboard
      }

    } catch (err: any) {
      setError(err.message || "Invalid credentials.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ─── Left Panel: Floating Animations ─── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center login-gradient">
        {/* Silk Background */}
        <div className="absolute inset-0 z-0">
          <Silk
            speed={5}
            scale={1}
            color="#5227FF"
            noiseIntensity={1.5}
            rotation={0}
          />
        </div>

        {/* Center Brand Text */}
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
          <div className="mt-8 flex items-center justify-center gap-6 text-blue-200/50 text-xs font-medium uppercase tracking-widest">
            <span>Inventory</span>
            <span className="h-1 w-1 rounded-full bg-blue-200/30" />
            <span>Procurement</span>
            <span className="h-1 w-1 rounded-full bg-blue-200/30" />
            <span>Analytics</span>
          </div>
        </div>
      </div>

      {/* ─── Right Panel: Login Form ─── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile brand header (hidden on lg) */}
          <div className="lg:hidden mb-10 text-center">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-black text-primary">S</span>
              </div>
              <span className="text-2xl font-black tracking-tight">SmartSupply</span>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Welcome Back</h2>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2 ml-[52px]">Sign in to your SmartSupply account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="login-email">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2 pl-10 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent shadow-sm"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium" htmlFor="login-password">Password</label>
                  <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    id="login-password"
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
            </div>

            {error && (
              <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-destructive flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Signing in...
                </span>
              ) : "Sign In"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Register here
            </Link>
          </div>

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
        .login-mesh {
          background: 
            radial-gradient(ellipse at 20% 50%, rgba(88, 101, 242, 0.25) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(236, 72, 189, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 60% 80%, rgba(53, 237, 126, 0.08) 0%, transparent 50%);
          animation: meshShift 12s ease-in-out infinite alternate;
        }
        @keyframes meshShift {
          0% { opacity: 0.8; transform: scale(1) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.05) translate(-10px, 5px); }
          100% { opacity: 0.85; transform: scale(1.02) translate(5px, -5px); }
        }

        .login-icon-bubble {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.15);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .login-icon-bubble-blue { background: rgba(88, 101, 242, 0.35); }
        .login-icon-bubble-magenta { background: rgba(236, 72, 189, 0.3); }
        .login-icon-bubble-green { background: rgba(53, 237, 126, 0.25); }
        .login-icon-bubble-purple { background: rgba(139, 92, 246, 0.3); }
        .login-icon-bubble-teal { background: rgba(20, 184, 166, 0.3); }

        .login-float {
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        .login-float-1 { animation: floatUp 6s ease-in-out infinite; }
        .login-float-2 { animation: floatDiag 7s ease-in-out infinite 0.5s; }
        .login-float-3 { animation: floatUp 8s ease-in-out infinite 1s; }
        .login-float-4 { animation: floatDiag 6.5s ease-in-out infinite 1.5s; }
        .login-float-5 { animation: floatUp 7.5s ease-in-out infinite 2s; }
        .login-float-6 { animation: floatDiag 9s ease-in-out infinite 0.3s; }

        @keyframes floatUp {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }
        @keyframes floatDiag {
          0%, 100% { transform: translate(0px, 0px) rotate(0deg); }
          33% { transform: translate(10px, -15px) rotate(-2deg); }
          66% { transform: translate(-5px, -10px) rotate(2deg); }
        }

        .login-spin-slow {
          animation: spinSlow 12s linear infinite;
        }
        @keyframes spinSlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .login-orbit-1 {
          animation: orbitPulse 8s ease-in-out infinite;
        }
        .login-orbit-2 {
          animation: orbitPulse 10s ease-in-out infinite 2s;
        }
        @keyframes orbitPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.05); opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}
