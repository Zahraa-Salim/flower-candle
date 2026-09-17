import type { ReactNode } from 'react'
import { CircleAlert, RefreshCw } from 'lucide-react'
import { EmptyState } from './EmptyState'
import { Button } from './Button'

interface ErrorPanelProps {
  title?: string
  description?: string
  /** Shown (message and stack) in development builds only. */
  error?: unknown
  /** Supplied by the caller: a `ButtonLink` inside the router, a `ButtonAnchor` outside it. */
  homeAction: ReactNode
  onReload?: () => void
  className?: string
}

function describeError(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}\n${error.stack ?? ''}`
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error, null, 2)
  } catch {
    return String(error)
  }
}

/**
 * Arabic error state shared by the route error page and the top-level boundary.
 * Deliberately free of router hooks so it can render when the router itself failed.
 */
export function ErrorPanel({
  title = 'حدث خطأ غير متوقع',
  description = 'نعتذر، حدث خلل أثناء عرض هذه الصفحة. أعيدي تحميل الصفحة أو عودي إلى الرئيسية.',
  error,
  homeAction,
  onReload = () => window.location.reload(),
  className,
}: ErrorPanelProps) {
  return (
    <div className="flex w-full flex-col items-center">
      <EmptyState
        titleAs="h1"
        icon={<CircleAlert className="size-6" aria-hidden />}
        title={title}
        description={description}
        className={className}
        action={
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={onReload} icon={<RefreshCw className="size-4" aria-hidden />}>
              إعادة تحميل الصفحة
            </Button>
            {homeAction}
          </div>
        }
      />
      {/* import.meta.env.DEV is a build-time literal, so this block is dropped from production output. */}
      {import.meta.env.DEV && error !== undefined && (
        <details dir="ltr" className="mx-auto mb-10 w-full max-w-2xl px-4 text-start">
          <summary dir="rtl" className="cursor-pointer text-sm text-muted">
            تفاصيل الخطأ (وضع التطوير)
          </summary>
          <pre className="mt-2 overflow-auto rounded-md bg-cream p-4 text-xs leading-relaxed whitespace-pre-wrap text-brown-2">
            {describeError(error)}
          </pre>
        </details>
      )}
    </div>
  )
}
