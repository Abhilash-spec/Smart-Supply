"use client"

import { useEffect, useState } from "react"
import { generateSmartForecast } from "@/app/actions/forecasting"
import { BrainCircuit, AlertTriangle, TrendingDown, Package, Plus, Loader2, Sparkles, RefreshCcw } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ForecastingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [forecasts, setForecasts] = useState<any[]>([])

  const loadForecasts = async () => {
    setLoading(true)
    const res = await generateSmartForecast()
    if (res.success) {
      setForecasts(res.forecasts || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadForecasts()
  }, [])

  const handleCreateDraftPO = async (forecast: any) => {
    // In a full implementation, this would trigger an action to create a PO 
    // and redirect to the PO details page.
    alert(`Creating Draft Purchase Order for ${forecast.suggested_order}x ${forecast.name} (SKU: ${forecast.sku})`)
    router.push('/procurement')
  }

  const criticalItems = forecasts.filter(f => f.risk_level === 'critical' || f.risk_level === 'out_of_stock')
  const totalRiskValue = criticalItems.reduce((sum, f) => sum + (f.potential_lost_revenue || 0), 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BrainCircuit className="h-8 w-8 text-indigo-500" />
            AI Demand Forecasting
          </h1>
          <p className="text-muted-foreground mt-1">Smart replenishment suggestions powered by historical velocity.</p>
        </div>
        <button 
          onClick={loadForecasts}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border shadow-sm rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm disabled:opacity-50"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Analysis
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] border rounded-xl bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
          <p className="text-muted-foreground animate-pulse">Analyzing 30-day velocity vectors...</p>
        </div>
      ) : (
        <>
          {/* Top Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-indigo-100 mb-1">Products at Risk</p>
                  <h3 className="text-4xl font-bold">{criticalItems.length}</h3>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-indigo-100 mt-4 flex items-center gap-1">
                <TrendingDown className="h-4 w-4" /> Requires immediate restock
              </p>
            </div>

            <div className="rounded-xl border bg-card shadow-sm p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-muted-foreground mb-1">Potential Revenue at Risk</p>
                  <h3 className="text-3xl font-bold">₹{totalRiskValue.toLocaleString('en-IN')}</h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">Estimated 7-day loss due to stockouts</p>
            </div>

            <div className="rounded-xl border bg-card shadow-sm p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-muted-foreground mb-1">Total Predictions Generated</p>
                  <h3 className="text-3xl font-bold">{forecasts.length}</h3>
                </div>
                <div className="p-3 bg-slate-100 rounded-lg">
                  <Sparkles className="h-6 w-6 text-slate-600" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">Based on {forecasts.reduce((sum, f) => sum + f.daily_velocity, 0).toFixed(0)} units/day total velocity</p>
            </div>
          </div>

          {/* AI Suggestions Table */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-500" /> Smart Replenishment Advice
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-muted-foreground border-b bg-muted/30">
                  <tr>
                    <th className="h-12 px-6 font-medium">Product</th>
                    <th className="h-12 px-6 font-medium">Risk Level</th>
                    <th className="h-12 px-6 font-medium text-right">Current Stock</th>
                    <th className="h-12 px-6 font-medium text-right">Burn Rate</th>
                    <th className="h-12 px-6 font-medium text-right">Stockout In</th>
                    <th className="h-12 px-6 font-medium text-right text-indigo-600">Suggested Order</th>
                    <th className="h-12 px-6 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {forecasts.map((item) => (
                    <tr key={item.product_id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-1">{item.sku}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          item.risk_level === 'out_of_stock' ? 'bg-red-100 text-red-800' :
                          item.risk_level === 'critical' ? 'bg-orange-100 text-orange-800' :
                          item.risk_level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {item.risk_level.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {item.current_stock}
                      </td>
                      <td className="px-6 py-4 text-right text-muted-foreground">
                        {item.daily_velocity} / day
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.risk_level === 'out_of_stock' ? (
                          <span className="text-red-600 font-medium">Now</span>
                        ) : item.estimated_stockout_days > 365 ? (
                          <span className="text-muted-foreground">&gt;1 yr</span>
                        ) : (
                          <span className={`${item.estimated_stockout_days < 7 ? 'text-orange-600 font-medium' : ''}`}>
                            {item.estimated_stockout_days} days
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-indigo-600">
                        {item.suggested_order > 0 ? `+${item.suggested_order}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.suggested_order > 0 && (
                          <button 
                            onClick={() => handleCreateDraftPO(item)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md text-xs font-semibold transition-colors"
                          >
                            <Plus className="h-3 w-3" /> Create PO
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {forecasts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        No products available for forecasting analysis.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
