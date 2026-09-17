import { useEffect, useId, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  destructive,
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const reduce = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const id = useId()
  const titleId = `${id}-title`
  const descId = `${id}-desc`
  // Latest values in refs so the focus effect depends on `open` only.
  const onCancelRef = useRef(onCancel)
  const loadingRef = useRef(loading)
  useEffect(() => {
    onCancelRef.current = onCancel
    loadingRef.current = loading
  })
  useLockBodyScroll(open)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loadingRef.current) onCancelRef.current()
      if (e.key === 'Tab' && panelRef.current) {
        const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          (el) => !el.hasAttribute('disabled'),
        )
        if (items.length === 0) {
          e.preventDefault()
          return
        }
        const first = items[0]
        const last = items[items.length - 1]
        const inside = panelRef.current.contains(document.activeElement)
        if (!inside) {
          e.preventDefault()
          first.focus()
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      // Only restore focus to an element that still exists (the trigger may have been deleted).
      if (previous?.isConnected) previous.focus({ preventScroll: true })
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[75] flex items-end justify-center p-4 sm:items-center">
          <motion.button
            type="button"
            tabIndex={-1}
            aria-label="إغلاق"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => !loading && onCancel()}
            className="absolute inset-0 bg-brown/35 backdrop-blur-[2px]"
          />
          <motion.div
            ref={panelRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md rounded-lg border border-line bg-paper p-6 shadow-lift"
          >
            <h2 id={titleId} className="text-lg font-medium text-brown">
              {title}
            </h2>
            {description && (
              <div id={descId} className="mt-2 text-sm text-brown-2">
                {description}
              </div>
            )}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-start">
              <Button ref={cancelRef} variant="outline" onClick={onCancel} disabled={loading}>
                {cancelLabel}
              </Button>
              <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
