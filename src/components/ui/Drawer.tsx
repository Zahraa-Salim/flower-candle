import { useEffect, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'
import { cn } from '@/lib/utils'

export type DrawerSide = 'start' | 'bottom'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  side?: DrawerSide
  children: ReactNode
  footer?: ReactNode
  className?: string
}

/**
 * Accessible slide-in panel. `side="start"` slides in from the reading start
 * (right in RTL); `side="bottom"` is a mobile bottom sheet.
 */
export function Drawer({ open, onClose, title, side = 'start', children, footer, className }: DrawerProps) {
  const reduce = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef<HTMLElement | null>(null)
  // Keep the latest handler in a ref so the focus effect only runs when `open` changes,
  // not on every parent render (inline `onClose` props would otherwise re-run it and steal focus).
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })
  useLockBodyScroll(open)

  useEffect(() => {
    if (!open) return
    restoreFocus.current = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const focusable = panel?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    focusable?.focus({ preventScroll: true })

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
      if (e.key === 'Tab' && panel) {
        const items = Array.from(
          panel.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
        ).filter((el) => !el.hasAttribute('disabled'))
        if (items.length === 0) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
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
      const previous = restoreFocus.current
      if (previous?.isConnected) previous.focus({ preventScroll: true })
    }
  }, [open])

  const isBottom = side === 'bottom'
  const hidden = reduce ? { opacity: 0 } : isBottom ? { y: '100%' } : { x: '100%' }
  const shown = reduce ? { opacity: 1 } : isBottom ? { y: 0 } : { x: 0 }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70]" role="presentation">
          <motion.button
            type="button"
            aria-label="إغلاق"
            tabIndex={-1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-brown/35 backdrop-blur-[2px]"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={hidden}
            animate={shown}
            exit={hidden}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'absolute flex flex-col bg-ivory shadow-lift',
              isBottom
                ? 'inset-x-0 bottom-0 max-h-[88dvh] rounded-t-2xl pb-[env(safe-area-inset-bottom)]'
                : 'inset-y-0 start-0 w-[min(88vw,22rem)]',
              className,
            )}
          >
            {isBottom && <span aria-hidden className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line" />}
            <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
              <h2 className="text-lg font-medium">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق"
                className="inline-flex size-11 items-center justify-center rounded-md text-brown-2 hover:bg-brown/5"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-5">{children}</div>
            {footer && <div className="border-t border-line bg-ivory px-5 py-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
