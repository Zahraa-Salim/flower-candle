import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Petal } from './Petal'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
  /** Use `h1` when the empty state is the whole page (404, empty cart). */
  titleAs?: 'h1' | 'h2'
  className?: string
}

export function EmptyState({ title, description, action, icon, titleAs: Tag = 'h2', className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center px-4 py-16 text-center sm:py-20', className)}>
      <div className="mb-5 inline-flex size-14 items-center justify-center rounded-full bg-blush text-rose-ink">
        {icon ?? <Petal className="size-6" />}
      </div>
      <Tag className="h-sub">{title}</Tag>
      {description && <p className="mt-2 max-w-sm text-brown-2">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
