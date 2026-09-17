import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ToastContext, type Toast, type ToastVariant } from '@/hooks/useToast'

const DURATION = 2800
const MAX_VISIBLE = 3

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)
  // Auto-dismiss timers by toast id, so they can be cleared on manual dismiss and on unmount.
  const timers = useRef(new Map<number, number>())

  const clearTimer = useCallback((id: number) => {
    const handle = timers.current.get(id)
    if (handle !== undefined) {
      window.clearTimeout(handle)
      timers.current.delete(id)
    }
  }, [])

  const dismiss = useCallback(
    (id: number) => {
      clearTimer(id)
      setToasts((list) => list.filter((t) => t.id !== id))
    },
    [clearTimer],
  )

  const show = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      const id = ++counter.current
      setToasts((list) => {
        const next = [...list, { id, message, variant }]
        // Evicted toasts no longer need their timers.
        const evicted = next.slice(0, Math.max(0, next.length - MAX_VISIBLE))
        evicted.forEach((t) => clearTimer(t.id))
        return next.slice(-MAX_VISIBLE)
      })
      timers.current.set(
        id,
        window.setTimeout(() => dismiss(id), DURATION),
      )
    },
    [dismiss, clearTimer],
  )

  useEffect(() => {
    const map = timers.current
    return () => {
      map.forEach((handle) => window.clearTimeout(handle))
      map.clear()
    }
  }, [])

  const value = useMemo(() => ({ toasts, show, dismiss }), [toasts, show, dismiss])

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}
