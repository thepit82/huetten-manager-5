'use client'

import { CheckCircle, XCircle } from 'lucide-react'

interface ToastProps {
  message: string
  type: 'success' | 'error'
}

export default function Toast({ message, type }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${
        type === 'success' ? 'bg-green-600' : 'bg-red-600'
      }`}>
        {type === 'success'
          ? <CheckCircle className="w-5 h-5 flex-shrink-0" />
          : <XCircle className="w-5 h-5 flex-shrink-0" />
        }
        {message}
      </div>
    </div>
  )
}
