'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Modal (Basis-Overlay)
// Verwendung:
//   import Modal from '@/components/ui/Modal'          ← Default Export (Phase 3)
//   import { Modal } from '@/components/ui/Modal'      ← Named Export  (Phase 1/2)
// ─────────────────────────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

function Modal({ open, title, onClose, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const widthClass = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[size]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${widthClass} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-[#1E3A5F]">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

export default Modal       // import Modal from '@/components/ui/Modal'
export { Modal }           // import { Modal } from '@/components/ui/Modal'

// ─────────────────────────────────────────────────────────────────────────────
// ConfirmModal
// Verwendung:
//   import { ConfirmModal } from '@/components/ui/Modal'   ← Named Export (Phase 1/2)
// ─────────────────────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Bestätigen',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal open={open} title={title} onClose={onCancel} size="sm">
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 min-h-[44px]"
        >
          Abbrechen
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 text-sm font-medium text-white rounded-lg min-h-[44px] ${
            danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
