import { useId } from 'react'
import type { AvailabilityFilter, CategoryId, ProductFilters as Filters, SortOption } from '@/types/product'
import { categories } from '@/data/categories'
import { cn, formatPrice } from '@/lib/utils'
import { controlClass } from '@/components/ui/Field'

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'featured', label: 'المميز أولاً' },
  { value: 'newest', label: 'الأحدث' },
  { value: 'price-asc', label: 'السعر: من الأقل' },
  { value: 'price-desc', label: 'السعر: من الأعلى' },
]

const availabilityOptions: { value: AvailabilityFilter; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'available', label: 'متوفر' },
  { value: 'unavailable', label: 'غير متوفر' },
]

export function CategoryChips({
  value,
  onChange,
  className,
}: {
  value: CategoryId | 'all'
  onChange: (next: CategoryId | 'all') => void
  className?: string
}) {
  const items: { id: CategoryId | 'all'; name: string }[] = [{ id: 'all', name: 'الكل' }, ...categories]
  return (
    <div className={cn('scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0', className)} role="group" aria-label="التصنيفات">
      {items.map((c) => {
        const active = value === c.id
        return (
          <button
            key={c.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(c.id)}
            className={cn(
              'h-11 shrink-0 rounded-full border px-4 text-sm transition-colors',
              active
                ? 'border-brown bg-brown text-ivory'
                : 'border-line bg-paper text-brown-2 hover:border-brown/30 hover:text-brown',
            )}
          >
            {c.name}
          </button>
        )
      })}
    </div>
  )
}

export function SortSelect({
  value,
  onChange,
  className,
}: {
  value: SortOption
  onChange: (next: SortOption) => void
  className?: string
}) {
  const id = useId()
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <label htmlFor={id} className="shrink-0 text-sm text-muted">
        ترتيب
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className={cn(controlClass, 'h-10 border-line pe-9 text-sm appearance-none bg-no-repeat')}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%237B706A' stroke-width='1.5' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
          backgroundPosition: 'left 0.75rem center',
        }}
      >
        {sortOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

interface FilterPanelProps {
  filters: Filters
  maxPriceBound: number
  onChange: (patch: Partial<Filters>) => void
  onReset: () => void
}

/** Availability + price controls, shared by the desktop sidebar and the mobile sheet. */
export function FilterPanel({ filters, maxPriceBound, onChange, onReset }: FilterPanelProps) {
  const sliderId = useId()
  // Clamp so a URL value outside the catalogue range (or a bound that is still loading) never desyncs the thumb from its label.
  const current = Math.min(Math.max(filters.maxPrice ?? maxPriceBound, 5), maxPriceBound)
  return (
    <div className="flex flex-col gap-7">
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-brown">التوفر</legend>
        <div className="flex flex-col gap-1">
          {availabilityOptions.map((o) => (
            <label key={o.value} className="flex min-h-10 cursor-pointer items-center gap-3 text-[15px] text-brown-2 has-checked:text-brown">
              <input
                type="radio"
                name="availability"
                value={o.value}
                checked={filters.availability === o.value}
                onChange={() => onChange({ availability: o.value })}
                className="size-4 accent-rose-deep"
              />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <label htmlFor={sliderId} className="text-sm font-medium text-brown">
            الحد الأقصى للسعر
          </label>
          <span className="num text-sm text-brown-2">{formatPrice(current)}</span>
        </div>
        <input
          id={sliderId}
          type="range"
          min={5}
          max={maxPriceBound}
          step={1}
          value={current}
          onChange={(e) => {
            const v = Number(e.target.value)
            onChange({ maxPrice: v >= maxPriceBound ? null : v })
          }}
          className="w-full accent-rose-deep"
          aria-valuetext={formatPrice(current)}
        />
        <div className="mt-1 flex justify-between text-xs text-muted">
          <span className="num">{formatPrice(5)}</span>
          <span className="num">{formatPrice(maxPriceBound)}</span>
        </div>
      </div>

      <button type="button" onClick={onReset} className="self-start text-sm text-rose-deep underline-offset-4 hover:underline">
        إعادة ضبط الفلاتر
      </button>
    </div>
  )
}
