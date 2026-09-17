import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'rose' | 'sage' | 'neutral' | 'brown' | 'danger'

const tones: Record<Tone, string> = {
  rose: 'bg-blush text-rose-ink',
  sage: 'bg-sage-soft text-sage-ink',
  neutral: 'bg-cream text-brown-2',
  brown: 'bg-brown text-ivory',
  danger: 'bg-danger-soft text-danger',
}

export function Badge({
  tone = 'neutral',
  className,
  children,
  dot,
}: {
  tone?: Tone
  className?: string
  children: ReactNode
  /** Small leading dot; pairs color with a shape so state is not color-only. */
  dot?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-medium leading-5',
        tones[tone],
        className,
      )}
    >
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

export function AvailabilityBadge({ available, className }: { available: boolean; className?: string }) {
  return (
    <Badge tone={available ? 'sage' : 'neutral'} dot className={className}>
      {available ? 'متوفر' : 'غير متوفر حالياً'}
    </Badge>
  )
}
