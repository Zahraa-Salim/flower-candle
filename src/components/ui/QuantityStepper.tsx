import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuantityStepperProps {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  size?: 'sm' | 'md'
  label?: string
  className?: string
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 20,
  size = 'md',
  label = 'الكمية',
  className,
}: QuantityStepperProps) {
  const btn = cn(
    'inline-flex items-center justify-center text-brown transition-colors hover:bg-brown/5 disabled:opacity-40 disabled:hover:bg-transparent',
    // Both sizes keep a 44px hit area; `sm` only tightens the typography.
    'size-11',
  )
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('inline-flex items-center rounded-md border border-line bg-paper', className)}
    >
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="تقليل الكمية">
        <Minus className="size-4" aria-hidden />
      </button>
      <span
        aria-live="polite"
        className={cn('num min-w-8 text-center font-medium text-brown', size === 'md' ? 'text-base' : 'text-sm')}
      >
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="زيادة الكمية">
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  )
}
