import { forwardRef, useId, type InputHTMLAttributes } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string
  onChange: (value: string) => void
  label?: string
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { value, onChange, label = 'البحث عن منتج', className, placeholder = 'ابحثي عن منتج...', ...rest },
  ref,
) {
  const id = useId()
  return (
    <div className={cn('relative', className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search className="pointer-events-none absolute top-1/2 start-3.5 size-[18px] -translate-y-1/2 text-muted" aria-hidden />
      <input
        ref={ref}
        id={id}
        type="search"
        inputMode="search"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'h-12 w-full rounded-md border border-line-strong bg-paper ps-11 pe-11 text-brown placeholder:text-muted',
          'transition-[border-color,box-shadow] duration-200 hover:border-muted',
          'focus:outline-none focus:border-rose-ink focus:ring-3 focus:ring-rose/15',
          '[&::-webkit-search-cancel-button]:hidden',
        )}
        {...rest}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="مسح البحث"
          className="absolute top-1/2 end-1.5 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-sm text-muted hover:bg-cream hover:text-brown"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  )
})
