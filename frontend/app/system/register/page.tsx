"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Lock, Eye, EyeOff, Mail, ShieldAlert, User } from "lucide-react"
import Link from "next/link"

export default function SystemRegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: "superadmin",
            first_name: name.split(' ')[0] || '',
            last_name: name.split(' ').slice(1).join(' ') || '',
            display_name: name,
          }
        }
      })

      if (signUpError) throw signUpError

      // Wait a moment for the auto-confirm trigger
      await new Promise(r => setTimeout(r, 1000))

      // Then log in to make sure
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      router.push("/superadmin")
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
              <ShieldAlert className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">System Registration</h1>
          <p className="text-sm text-zinc-400">Create a new System Admin account</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300" htmlFor="register-name">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                  <input
                    id="register-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2 pl-10 text-sm text-zinc-100 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:border-transparent placeholder:text-zinc-500"
                    placeholder="Jane Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300" htmlFor="register-email">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                  <input
                    id="register-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2 pl-10 text-sm text-zinc-100 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:border-transparent placeholder:text-zinc-500"
                    placeholder="sysadmin@smartsupply.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-zinc-300" htmlFor="register-password">Password</label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2 pl-10 pr-10 text-sm text-zinc-100 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:border-transparent placeholder:text-zinc-500"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="text-sm font-medium text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-red-500 hover:shadow-lg disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? "Registering..." : "Create Account"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-zinc-500">Already have an account? </span>
            <Link href="/system/login" className="font-semibold text-red-500 hover:underline">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
