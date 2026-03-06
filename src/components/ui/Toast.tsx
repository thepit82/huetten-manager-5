'use client'

import { useState, useCallback } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'

// ── Typen ──────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

// ── Einfache Toast-Komponente (Default Export) ─────────────────────────────

interface ToastProps {
  message: string
  type: ToastType
}

export default function Toast({ message, type }: ToastProps) {
  const colors: Record<ToastType, string> = {
    success: 'bg-green-600',
    error:   'bg-red-600',
    warning: 'bg-amber-500',
    info:    'bg-blue-600',
  }
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${colors[type]}`}>
        <ToastIcon type={type} />
        {message}
      </div>
    </div>
  )
}

// ── Internes Icon-Helper ───────────────────────────────────────────────────

function ToastIcon({ type }: { type: ToastType }) {
  const cls = 'w-5 h-5 flex-shrink-0'
  if (type === 'success') return <CheckCircle className={cls} />
  if (type === 'error')   return <XCircle className={cls} />
  if (type === 'warning') return <AlertTriangle className={cls} />
  return <Info className={cls} />
}

// ── useToast Hook (Named Export) ───────────────────────────────────────────
// API:  const { success, error, warning, info, ToastContainer } = useToast()
// Auch: const { showToast, ToastContainer } = useToast()  (Abwärtskompatibilität)

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const add = useCallback((message: string, type: ToastType, duration = 3000) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const colors: Record<ToastType, string> = {
    success: 'bg-green-600',
    error:   'bg-red-600',
    warning: 'bg-amber-500',
    info:    'bg-blue-600',
  }

  const ToastContainer = useCallback(() => (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${colors[t.type]}`}>
          <ToastIcon type={t.type} />
          {t.message}
        </div>
      ))}
    </div>
  ), [toasts]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // Kurz-API  →  success('Gespeichert')
    success: (msg: string, duration?: number) => add(msg, 'success', duration),
    error:   (msg: string, duration?: number) => add(msg, 'error',   duration),
    warning: (msg: string, duration?: number) => add(msg, 'warning', duration),
    info:    (msg: string, duration?: number) => add(msg, 'info',    duration),
    // Lang-API  →  showToast('Gespeichert', 'success')
    showToast: add,
    ToastContainer,
  }
}
