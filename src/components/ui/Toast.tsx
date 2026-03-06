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
// Toast – einfache Inline-Komponente (Default Export für Phase 3)
// Verwendung: import Toast from '@/components/ui/Toast'
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
// useToast – Named Export für Phase 1/2
// Verwendung: import { useToast } from '@/components/ui/Toast'
//
// Unterstützte Aufruf-Varianten:
//   success('Gespeichert')                        ← 1 Arg
//   error('Fehler beim Laden', error.message)     ← 2 Strings (Titel + Detail)
//   warning('Achtung', 'Kein Trip ausgewählt')    ← 2 Strings
//
// WICHTIG: Der 2. Parameter ist IMMER ein string (Detail), KEIN number (duration).
// duration ist intern fest auf 3000ms.
// ─────────────────────────────────────────────────────────────────────────────

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const add = useCallback((message: string, type: ToastType, duration = 3000) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  /**
   * Hilfsfunktion: kombiniert Titel + optionales Detail zu einem Anzeigestring.
   * showError('Fehler beim Laden', error.message)  → "Fehler beim Laden: ..."
   * showError('Fehler beim Laden')                 → "Fehler beim Laden"
   */
  const buildMessage = (msg: string, detail?: string): string =>
    detail ? `${msg}: ${detail}` : msg

  // eslint-disable-next-line react/display-name
  const ToastContainer = useCallback(() => (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium max-w-sm ${colors[t.type]}`}
        >
          <ToastIcon type={t.type} />
          <span className="break-words">{t.message}</span>
        </div>
      ))}
    </div>
  ), [toasts])

  return {
    // Kurz-API – 2. Parameter ist optionaler Detail-String (NICHT duration)
    // Entspricht: showError('Titel', error.message)
    success: (msg: string, detail?: string) => add(buildMessage(msg, detail), 'success'),
    error:   (msg: string, detail?: string) => add(buildMessage(msg, detail), 'error'),
    warning: (msg: string, detail?: string) => add(buildMessage(msg, detail), 'warning'),
    info:    (msg: string, detail?: string) => add(buildMessage(msg, detail), 'info'),

    // Lang-API: showToast('Text', 'success', 5000)
    showToast: add,

    // Render-Komponente für Hook-Nutzer
    ToastContainer,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ToastProvider – Context für layout.tsx
// Verwendung: import { ToastProvider } from '@/components/ui/Toast'
// ─────────────────────────────────────────────────────────────────────────────

interface ToastContextType {
  success: (msg: string, detail?: string) => void
  error:   (msg: string, detail?: string) => void
  warning: (msg: string, detail?: string) => void
  info:    (msg: string, detail?: string) => void
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

// Optional: für Komponenten tief im Baum
export function useToastContext() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToastContext must be used within ToastProvider')
  return ctx
}
