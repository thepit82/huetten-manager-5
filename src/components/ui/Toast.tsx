'use client'

import { useState, useCallback, createContext, useContext } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Typen
// ─────────────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

// ─────────────────────────────────────────────────────────────────────────────
// Icon-Helper
// ─────────────────────────────────────────────────────────────────────────────

function ToastIcon({ type }: { type: ToastType }) {
  const cls = 'w-5 h-5 flex-shrink-0'
  if (type === 'success') return <CheckCircle className={cls} />
  if (type === 'error')   return <XCircle className={cls} />
  if (type === 'warning') return <AlertTriangle className={cls} />
  return <Info className={cls} />
}

const colors: Record<ToastType, string> = {
  success: 'bg-green-600',
  error:   'bg-red-600',
  warning: 'bg-amber-500',
  info:    'bg-blue-600',
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast – einfache Inline-Komponente
// Verwendung: import Toast from '@/components/ui/Toast'  ← Default Export (Phase 3)
//   {toast && <Toast message={toast.message} type={toast.type} />}
// ─────────────────────────────────────────────────────────────────────────────

interface ToastProps {
  message: string
  type: ToastType
}

function Toast({ message, type }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${colors[type]}`}>
        <ToastIcon type={type} />
        {message}
      </div>
    </div>
  )
}

export default Toast       // import Toast from '@/components/ui/Toast'

// ─────────────────────────────────────────────────────────────────────────────
// useToast – Hook mit vollständiger API
// Verwendung: import { useToast } from '@/components/ui/Toast'  ← Named Export (Phase 1/2)
//   const { success, error, warning, info, showToast, ToastContainer } = useToast()
// ─────────────────────────────────────────────────────────────────────────────

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const add = useCallback((message: string, type: ToastType, duration = 3000) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  // eslint-disable-next-line react/display-name
  const ToastContainer = useCallback(() => (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${colors[t.type]}`}
        >
          <ToastIcon type={t.type} />
          {t.message}
        </div>
      ))}
    </div>
  ), [toasts])

  return {
    // Kurz-API →  success('Gespeichert')
    success: (msg: string, duration?: number) => add(msg, 'success', duration),
    error:   (msg: string, duration?: number) => add(msg, 'error',   duration),
    warning: (msg: string, duration?: number) => add(msg, 'warning', duration),
    info:    (msg: string, duration?: number) => add(msg, 'info',    duration),
    // Lang-API →  showToast('Text', 'success')
    showToast: add,
    ToastContainer,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ToastProvider – Context-basiert für layout.tsx
// Verwendung: import { ToastProvider } from '@/components/ui/Toast'
//   <ToastProvider><App /></ToastProvider>
// ─────────────────────────────────────────────────────────────────────────────

interface ToastContextType {
  success: (msg: string, duration?: number) => void
  error:   (msg: string, duration?: number) => void
  warning: (msg: string, duration?: number) => void
  info:    (msg: string, duration?: number) => void
  showToast: (msg: string, type: ToastType, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast()
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <toast.ToastContainer />
    </ToastContext.Provider>
  )
}

// Optional: useToastContext für Komponenten tief im Baum
export function useToastContext() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToastContext must be used within ToastProvider')
  return ctx
}
