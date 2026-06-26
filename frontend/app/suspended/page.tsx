import { ShieldAlert, Mail } from "lucide-react"

export default function SuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border p-8 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="h-8 w-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Account Suspended</h1>
        
        <p className="text-slate-600 mb-8">
          Your organization's access to the SmartSupply platform has been temporarily suspended. 
          This may be due to an unpaid invoice, policy violation, or administrative action.
        </p>
        
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-left mb-8">
          <h3 className="font-semibold text-sm mb-2">What happens now?</h3>
          <ul className="text-sm text-slate-600 space-y-2">
            <li>• POS and Storefront operations are paused.</li>
            <li>• API access is disabled.</li>
            <li>• Your data remains safely encrypted and stored.</li>
          </ul>
        </div>
        
        <a 
          href="mailto:support@smartsupply.com"
          className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
        >
          <Mail className="h-4 w-4" />
          Contact Support
        </a>
      </div>
    </div>
  )
}
