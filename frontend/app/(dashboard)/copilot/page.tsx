"use client"

import { useState } from "react"
import { Send, Bot, Sparkles, TrendingUp, Package, AlertTriangle, Loader2 } from "lucide-react"

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: React.ReactNode
}

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your SmartSupply AI Copilot. I've analyzed your recent sales data and detected a few anomalies. How can I help you today?"
    }
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  const handleSend = (text: string) => {
    if (!text.trim()) return

    const newMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    setMessages(prev => [...prev, newMsg])
    setInput("")
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      let responseContent: React.ReactNode = "I understand. I can help you with that. Let me analyze the data..."

      if (text.toLowerCase().includes("anomaly") || text.toLowerCase().includes("anomalies")) {
        responseContent = (
          <div className="space-y-3">
            <p>I noticed an unusual spike in demand for two specific items over the last 48 hours:</p>
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <div className="flex items-center gap-2 text-destructive font-medium text-sm mb-1">
                <AlertTriangle className="h-4 w-4" /> Paracetamol 500mg
              </div>
              <p className="text-xs text-foreground">Sales are up 340%. Current stock will deplete in 1.2 days at this rate. You are 15 units below minimum safe level.</p>
            </div>
            <p>Would you like me to generate a Purchase Order to restock this from your primary supplier?</p>
          </div>
        )
      } else if (text.toLowerCase().includes("forecast")) {
        responseContent = "Based on historical trends, we expect a 25% increase in FMCG sales next week due to the upcoming festival. Make sure to stock up on essentials."
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: responseContent }])
      setIsTyping(false)
    }, 1500)
  }

  const tryPrompt = (prompt: string) => {
    handleSend(prompt)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between pb-4 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Supply Chain Copilot <Sparkles className="h-5 w-5 text-primary" />
          </h1>
          <p className="text-muted-foreground mt-1">Your AI assistant for demand forecasting and inventory optimization.</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden mt-4 gap-6">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-accent border' : 'bg-primary'}`}>
                  {msg.role === 'user' ? <span className="text-xs font-medium">JD</span> : <Bot className="h-5 w-5 text-primary-foreground" />}
                </div>
                <div className={`${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-card border rounded-tl-sm'} rounded-2xl p-4 max-w-[80%] shadow-sm text-sm`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="bg-card border rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-card border-t">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(input); }} 
              className="relative"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Copilot about sales forecasts, supplier ratings, or inventory health..."
                className="w-full rounded-full border border-input bg-background px-4 py-3 pr-12 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isTyping}
                className="absolute right-2 top-2 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Suggested Actions Sidebar */}
        <div className="hidden lg:flex w-80 flex-col gap-4">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Forecast Insights
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <p className="text-muted-foreground"><strong className="text-foreground">Festival season approaching.</strong> Expect 25% increase in FMCG demand next week.</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                <p className="text-muted-foreground"><strong className="text-foreground">Price drop alert.</strong> 'Global Pharma' reduced prices on antibiotics by 12%.</p>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-sm flex-1">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Try Asking
            </h3>
            <div className="space-y-2">
              {["Generate a demand forecast for next month.", "Which suppliers have the best delivery times?", "Identify dead stock in my inventory.", "Draft an RFQ for 500 units of Cement."].map((prompt, i) => (
                <button 
                  key={i} 
                  onClick={() => tryPrompt(prompt)}
                  className="w-full text-left text-xs bg-muted/50 hover:bg-accent hover:text-accent-foreground p-3 rounded-md transition-colors border border-transparent hover:border-border"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
