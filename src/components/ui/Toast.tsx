'use client'

import { useState, useCallback } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'

// ── Einfache Toast-Komponente (Default Export) ─────────────────────────────

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  message: string
  type: ToastType
}

export default function Toast({ message, type }: ToastProps) {
  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="w-5 h-5 flex-shrink-0" />,
    error:   <XCircle className="w-5 h-5 flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 flex-shrink-0" />,
    info:    <Info className="w-5 h-5 flex-shrink-0" />,
  }
  const colors: Record<ToastType, string> = {
    success: 'bg-green-600',
    error:   'bg-red-600',
    warning: 'bg-amber-500',
    info:    'bg-blue-600',
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${colors[type]}`}>
        {icons[type]}
        {message}
      </div>
    </div>
  )
}

// ── useToast Hook (Named Export) – für Phase-1/2-Kompatibilität ────────────

interface ToastState {
  message: string
  type: ToastType
  id: number
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'success', duration = 3000) => {
    const id = Date.now()
    setToasts(prev => [...prev, { message, type, id }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const ToastContainer = () => (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${
            t.type === 'success' ? 'bg-green-600' :
            t.type === 'error'   ? 'bg-red-600' :
            t.type === 'warning' ? 'bg-amber-500' : 'bg-blue-600'
          }`}
        >
          {t.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
          {t.type === 'error'   && <XCircle className="w-5 h-5 flex-shrink-0" />}
          {t.type === 'warning' && <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          {t.type === 'info'    && <Info className="w-5 h-5 flex-shrink-0" />}
          {t.message}
        </div>
      ))}
    </div>
  )

  return { showToast, ToastContainer }
}
