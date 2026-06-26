"use client"

import { useState, useEffect } from "react"
import { ShieldAlert, ShieldCheck, Activity, Search, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

type LoginAttempt = {
  id: string
  email: string
  ip_address: string
  user_agent: string
  success: boolean
  failure_reason: string | null
  created_at: string
}

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<LoginAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLogs()
  }, [])

  async function fetchLogs() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('login_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
        throw error
      }
      
      if (data) {
        setLogs(data)
      }
    } catch (err: any) {
      console.error("Error fetching logs:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(log => 
    (log.email && log.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (log.ip_address && log.ip_address.includes(searchQuery))
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-primary/5 rounded-xl p-6 border border-primary/20">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">System Logs</h1>
          <p className="text-muted-foreground mt-1">Monitor recent login attempts and security events across the platform.</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search by email or IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-full border border-input bg-background px-4 pl-10 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20">
          <h2 className="font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Recent Login Attempts
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-muted-foreground border-b bg-muted/30">
              <tr>
                <th className="px-6 py-3.5 font-medium">Date & Time</th>
                <th className="px-6 py-3.5 font-medium">Email</th>
                <th className="px-6 py-3.5 font-medium">IP Address</th>
                <th className="px-6 py-3.5 font-medium">Status</th>
                <th className="px-6 py-3.5 font-medium">User Agent</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading system logs...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-destructive">
                    Failed to load logs: {error}
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No login attempts recorded yet.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {log.email || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                      {log.ip_address}
                    </td>
                    <td className="px-6 py-4">
                      {log.success ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <ShieldCheck className="h-3.5 w-3.5" /> Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                          <ShieldAlert className="h-3.5 w-3.5" /> Failed
                          {log.failure_reason && <span className="ml-1 opacity-75">({log.failure_reason})</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs max-w-[200px] truncate" title={log.user_agent}>
                      {log.user_agent}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
