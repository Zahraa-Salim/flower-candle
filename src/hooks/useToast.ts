import { createContext, useContext } from 'react'

export type ToastVariant = 'success' | 'info' | 'error'

export interface Toast {
  id: number
  message: string
  variant: ToastVariant
}

export interface ToastContextValue {
  toasts: Toast[]
  show: (message: string, variant?: ToastVariant) => void
  dismiss: (id: number) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
