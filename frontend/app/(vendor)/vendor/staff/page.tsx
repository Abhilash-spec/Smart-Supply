"use client"

import { useState, useEffect } from "react"
import { Plus, UserCog, Mail, Shield, Check, Trash2, Edit2, X, KeySquare } from "lucide-react"
import { createStaffMember, getStaffMembers, deleteStaffMember, updateStaffMember, updateStaffPassword } from "@/app/actions/staff"

export default function VendorStaffManagementPage() {
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [staffList, setStaffList] = useState<any[]>([])
  const [isLoadingStaff, setIsLoadingStaff] = useState(true)

  const [editingStaff, setEditingStaff] = useState<any>(null)
  const [resettingPasswordFor, setResettingPasswordFor] = useState<any>(null)
  const [newPassword, setNewPassword] = useState("")

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    canApproveOrders: false,
    canIssueInvoices: false
  })

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    setIsLoadingStaff(true)
    const res = await getStaffMembers()
    if (res.success && res.staff) {
      setStaffList(res.staff)
    }
    setIsLoadingStaff(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      if (editingStaff) {
        const res = await updateStaffMember(editingStaff.id, {
          firstName: formData.firstName,
          lastName: formData.lastName
        })
        if (!res.success) throw new Error(res.error || "Unknown error")
        setSuccess(true)
        setEditingStaff(null)
      } else {
        const res = await createStaffMember({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          staffType: "vendor",
          permissions: {
            canApproveOrders: formData.canApproveOrders,
            canIssueInvoices: formData.canIssueInvoices
          }
        })

        if (!res.success) {
          throw new Error(res.error || "Unknown error occurred")
        }
        setSuccess(true)
        setIsAdding(false)
      }
      setFormData({ firstName: "", lastName: "", email: "", password: "", canApproveOrders: false, canIssueInvoices: false })
      await fetchStaff() // Refresh list
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await updateStaffPassword(resettingPasswordFor.id, newPassword)
      if (!res.success) throw new Error(res.error || "Failed to reset password")
      setSuccess(true)
      setResettingPasswordFor(null)
      setNewPassword("")
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return
    
    try {
      const res = await deleteStaffMember(id)
      if (!res.success) throw new Error(res.error)
      await fetchStaff()
    } catch (e: any) {
      alert("Failed to delete: " + e.message)
    }
  }

  const startEditing = (staff: any) => {
    setEditingStaff(staff)
    setFormData({
      firstName: staff.first_name || "",
      lastName: staff.last_name || "",
      email: staff.email || "",
      password: "",
      canApproveOrders: false,
      canIssueInvoices: false
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management (Vendor)</h1>
          <p className="text-muted-foreground mt-1">Manage bulk billing access for your employees.</p>
        </div>
        <button
          onClick={() => {
            setIsAdding(!isAdding)
            setEditingStaff(null)
          }}
          className="bg-primary text-primary-foreground flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
        >
          {isAdding ? "Cancel" : <><Plus className="h-4 w-4" /> Add Staff</>}
        </button>
      </div>

      {success && (
        <div className="bg-green-500/10 text-green-600 border border-green-500/20 p-4 rounded-xl flex items-center gap-2">
          <Check className="h-5 w-5" />
          <span className="font-medium">Staff member saved successfully!</span>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 p-4 rounded-xl flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Editing Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg relative">
            <button
              onClick={() => setEditingStaff(null)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <UserCog className="h-5 w-5 text-primary" />
              Edit Staff Account
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Name</label>
                  <input
                    required
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Name</label>
                  <input
                    required
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border bg-background"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address (Read Only)</label>
                <input
                  disabled
                  type="email"
                  value={formData.email}
                  className="w-full h-10 px-3 rounded-lg border bg-muted text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resettingPasswordFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg relative">
            <button
              onClick={() => { setResettingPasswordFor(null); setNewPassword("") }}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <KeySquare className="h-5 w-5 text-primary" />
              Reset Staff Password
            </h2>
            <p className="text-sm text-muted-foreground mb-6">Enter a new password for {resettingPasswordFor.first_name} {resettingPasswordFor.last_name}.</p>
            <form onSubmit={handlePasswordReset} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <input
                  required
                  type="password"
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border bg-background"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setResettingPasswordFor(null); setNewPassword("") }}
                  className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAdding && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            Create New Staff Account
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <input
                  required
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border bg-background"
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <input
                  required
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border bg-background"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address (Login ID)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-10 pl-9 pr-3 rounded-lg border bg-background"
                    placeholder="john@yourvendor.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <input
                  required
                  type="password"
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border bg-background"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="border-t pt-6 space-y-4">
              <h3 className="text-sm font-semibold">Bulk Billing Permissions</h3>
              <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.canApproveOrders}
                  onChange={(e) => setFormData({ ...formData, canApproveOrders: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <div>
                  <div className="font-medium text-sm">Approve B2B Orders</div>
                  <div className="text-xs text-muted-foreground">Staff can approve incoming orders from shops.</div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.canIssueInvoices}
                  onChange={(e) => setFormData({ ...formData, canIssueInvoices: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <div>
                  <div className="font-medium text-sm">Issue Invoices</div>
                  <div className="text-xs text-muted-foreground">Staff can generate and send invoices for bulk orders.</div>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Account"}
              </button>
            </div>
          </form>
        </div>
      )}

      {!isAdding && (
        <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
          {isLoadingStaff ? (
            <div className="p-8 text-center text-muted-foreground">Loading staff...</div>
          ) : staffList.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <UserCog className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-foreground mb-1">No staff members yet</h3>
              <p className="text-sm">Create staff accounts so your employees can bill bulk orders.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Name</th>
                    <th className="px-6 py-4 font-semibold">Email / Login ID</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {staffList.map((staff) => (
                    <tr key={staff.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        {staff.first_name} {staff.last_name}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{staff.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                          {staff.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex items-center justify-end gap-2">
                           <button onClick={() => setResettingPasswordFor(staff)} title="Reset Password" className="text-amber-500 hover:text-amber-600 transition-colors p-2 hover:bg-amber-50 rounded-lg">
                             <KeySquare className="h-4 w-4" />
                           </button>
                           <button onClick={() => startEditing(staff)} className="text-primary hover:text-primary/80 transition-colors p-2 hover:bg-primary/10 rounded-lg">
                             <Edit2 className="h-4 w-4" />
                           </button>
                           <button onClick={() => handleDelete(staff.id)} className="text-destructive hover:text-destructive/80 transition-colors p-2 hover:bg-destructive/10 rounded-lg">
                             <Trash2 className="h-4 w-4" />
                           </button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
