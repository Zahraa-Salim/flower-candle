import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, CircleAlert, Info, X } from 'lucide-react'
import { useToast, type ToastVariant } from '@/hooks/useToast'
import { cn } from '@/lib/utils'

const icons: Record<ToastVariant, typeof Check> = {
  success: Check,
  info: Info,
  error: CircleAlert,
}

const accents: Record<ToastVariant, string> = {
  success: 'text-sage-ink bg-sage-soft',
  info: 'text-rose-ink bg-blush',
  error: 'text-danger bg-danger-soft',
}

export function ToastViewport() {
  const { toasts, dismiss } = useToast()
  const reduce = useReducedMotion()

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[80] flex flex-col items-center gap-2 px-4 sm:items-start sm:px-6',
        // Inside the admin shell, clear the mobile bottom nav (4rem) so toasts never cover its tabs.
        '[body[data-shell=admin]_&]:bottom-[calc(4.5rem+env(safe-area-inset-bottom))] lg:[body[data-shell=admin]_&]:bottom-4',
      )}
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const Icon = icons[t.variant]
          return (
            <motion.div
              key={t.id}
              layout={!reduce}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-md border border-line bg-paper py-2.5 ps-3 pe-2 shadow-lift"
            >
              <span className={cn('inline-flex size-7 shrink-0 items-center justify-center rounded-full', accents[t.variant])}>
                <Icon className="size-4" aria-hidden />
              </span>
              <p className="flex-1 text-sm text-brown">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="إغلاق التنبيه"
                className="inline-flex size-9 items-center justify-center rounded-sm text-muted hover:bg-cream hover:text-brown"
              >
                <X className="size-4" aria-hidden />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
