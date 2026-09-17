import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Petal } from './Petal'

interface SectionHeadingProps {
  title: string
  lead?: string
  action?: ReactNode
  align?: 'start' | 'center'
  as?: 'h1' | 'h2'
  /** Id for the heading element, so a parent section can reference it with aria-labelledby. */
  id?: string
  className?: string
}

export function SectionHeading({ title, lead, action, align = 'start', as: Tag = 'h2', id, className }: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'sm:flex-col sm:items-center sm:text-center',
        className,
      )}
    >
      <div className={cn('max-w-xl', align === 'center' && 'mx-auto text-center')}>
        <Petal className={cn('mb-3 size-5 text-rose', align === 'center' && 'mx-auto')} />
        <Tag id={id} className="h-section">
          {title}
        </Tag>
        {lead && <p className="lead mt-3">{lead}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
