import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ImageIcon, Package, Pencil, Plus, RefreshCw, Star, Trash2 } from 'lucide-react'
import type { AvailabilityFilter, CategoryId, Product } from '@/types/product'
import { categories, categoryName } from '@/data/categories'
import { matchesQuery } from '@/lib/filters'
import { cn, formatPrice } from '@/lib/utils'
import { useProducts } from '@/hooks/useProducts'
import { useToast } from '@/hooks/useToast'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { SearchInput } from '@/components/product/SearchInput'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Field'
import { SmartImage } from '@/components/ui/SmartImage'
import { AvailabilityBadge, Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'

const availabilityOptions: { value: AvailabilityFilter; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'available', label: 'متوفر' },
  { value: 'unavailable', label: 'غير متوفر' },
]

export default function AdminProductsPage() {
  useDocumentMeta('إدارة المنتجات')
  const { products, status, reload, updateProduct, deleteProduct } = useProducts()
  const { show } = useToast()

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryId | 'all'>('all')
  const [availability, setAvailability] = useState<AvailabilityFilter>('all')
  // Ids with a write in flight. A set, so concurrent toggles on different rows don't clear each other.
  const [pending, setPending] = useState<ReadonlySet<string>>(() => new Set())
  const [toDelete, setToDelete] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const setPendingFor = (id: string, on: boolean) =>
    setPending((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  const list = useMemo(
    () =>
      products.filter((p) => {
        if (category !== 'all' && p.category !== category) return false
        if (availability === 'available' && !p.available) return false
        if (availability === 'unavailable' && p.available) return false
        return matchesQuery(p, query)
      }),
    [products, category, availability, query],
  )

  const loading = status === 'loading'

  const toggle = async (p: Product, field: 'available' | 'featured' | 'isCategoryCover') => {
    if (pending.has(p.id)) return
    setPendingFor(p.id, true)
    try {
      await updateProduct(p.id, { [field]: !p[field] })
      show(
        field === 'available'
          ? p.available
            ? `تم وضع ${p.name} كغير متوفر`
            : `تم وضع ${p.name} كمتوفر`
          : field === 'featured'
            ? p.featured
              ? `أُزيل ${p.name} من المميز`
              : `أُضيف ${p.name} إلى المميز`
            : p.isCategoryCover
              ? `لم يعد ${p.name} غلاف تصنيف ${categoryName(p.category)}`
              : `أصبح ${p.name} غلاف تصنيف ${categoryName(p.category)}`,
      )
    } catch {
      show('تعذّر حفظ التغيير', 'error')
    } finally {
      setPendingFor(p.id, false)
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteProduct(toDelete.id)
      show(`تم حذف ${toDelete.name}`, 'info')
      setToDelete(null)
      // The row that opened the dialog is gone, so give focus a deterministic home.
      setTimeout(() => rootRef.current?.focus({ preventScroll: true }), 0)
    } catch {
      show('تعذّر حذف المنتج', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const filtersActive = query !== '' || category !== 'all' || availability !== 'all'

  return (
    <div ref={rootRef} tabIndex={-1} className="flex flex-col gap-6 outline-none">
      <AdminPageHeader
        title="المنتجات"
        description={status === 'ready' ? `${products.length} منتج في المتجر` : undefined}
        action={
          <ButtonLink to="/admin/products/new" icon={<Plus className="size-4" aria-hidden />} className="hidden sm:inline-flex">
            إضافة منتج
          </ButtonLink>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput value={query} onChange={setQuery} className="lg:max-w-sm lg:flex-1" placeholder="ابحثي بالاسم أو الوصف…" />
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          <select
            aria-label="التصنيف"
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryId | 'all')}
            className="h-11 shrink-0 rounded-md border border-line-strong bg-paper px-3 text-sm text-brown focus:border-rose-ink focus:outline-none focus:ring-3 focus:ring-rose/15"
          >
            <option value="all">كل التصنيفات</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div role="group" aria-label="التوفر" className="flex shrink-0 rounded-md border border-line-strong bg-paper p-0.5">
            {availabilityOptions.map((o) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={availability === o.value}
                onClick={() => setAvailability(o.value)}
                className={cn(
                  'h-10 rounded-sm px-3 text-sm transition-colors',
                  availability === o.value ? 'bg-brown text-ivory' : 'text-brown-2 hover:text-brown',
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {status === 'error' ? (
        <EmptyState
          title="تعذّر تحميل المنتجات"
          action={
            <Button onClick={() => void reload()} icon={<RefreshCw className="size-4" aria-hidden />}>
              إعادة المحاولة
            </Button>
          }
        />
      ) : loading ? (
        <div className="flex flex-col gap-3" aria-busy>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Package className="size-6" aria-hidden />}
          title={filtersActive ? 'لا توجد نتائج مطابقة' : 'لا توجد منتجات بعد'}
          description={filtersActive ? 'جرّبي كلمة أخرى أو أزيلي الفلاتر.' : 'ابدئي بإضافة أول منتج إلى المتجر.'}
          action={
            filtersActive ? (
              <Button
                variant="outline"
                onClick={() => {
                  setQuery('')
                  setCategory('all')
                  setAvailability('all')
                }}
              >
                إزالة الفلاتر
              </Button>
            ) : (
              <ButtonLink to="/admin/products/new" icon={<Plus className="size-4" aria-hidden />}>
                إضافة منتج
              </ButtonLink>
            )
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-md border border-line bg-paper lg:block">
            {/* Fixed layout: the product column takes the remaining width and truncates, instead of the
                description's full text setting the table's minimum width. */}
            <table className="w-full table-fixed text-sm">
              <thead className="bg-cream/70 text-xs text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 text-start font-medium">المنتج</th>
                  <th scope="col" className="w-24 px-4 py-3 text-start font-medium">التصنيف</th>
                  <th scope="col" className="w-20 px-4 py-3 text-start font-medium">السعر</th>
                  <th scope="col" className="w-20 px-4 py-3 text-start font-medium">متوفر</th>
                  <th scope="col" className="w-16 px-4 py-3 text-start font-medium">مميز</th>
                  <th scope="col" className="w-16 px-4 py-3 text-start font-medium">الغلاف</th>
                  <th scope="col" className="w-28 px-4 py-3 text-end font-medium">
                    <span className="sr-only">إجراءات</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.map((p) => (
                  <tr key={p.id} className={cn('transition-colors hover:bg-cream/40', pending.has(p.id) && 'opacity-60')}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <SmartImage src={p.image} alt="" sizes="48px" frameClassName="size-12 shrink-0 rounded-sm" />
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 truncate font-medium text-brown">
                            {p.name}
                            {p.isNew && <Badge tone="rose">جديد</Badge>}
                          </p>
                          <p className="truncate text-xs text-muted">{p.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-brown-2">{categoryName(p.category)}</td>
                    <td className="num px-4 py-3 text-start font-medium text-brown">{formatPrice(p.price)}</td>
                    <td className="px-4 py-3">
                      <Switch label={`توفر ${p.name}`} checked={p.available} onChange={() => void toggle(p, 'available')} disabled={pending.has(p.id)} className="[&_label]:sr-only" />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => void toggle(p, 'featured')}
                        disabled={pending.has(p.id)}
                        aria-pressed={p.featured}
                        aria-label={p.featured ? `إزالة ${p.name} من المميز` : `تمييز ${p.name}`}
                        className={cn(
                          'inline-flex size-11 items-center justify-center rounded-md transition-colors',
                          p.featured ? 'text-rose-ink hover:bg-blush' : 'text-muted hover:bg-cream hover:text-brown',
                        )}
                      >
                        <Star className={cn('size-[18px]', p.featured && 'fill-current')} aria-hidden />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => void toggle(p, 'isCategoryCover')}
                        disabled={pending.has(p.id)}
                        aria-pressed={Boolean(p.isCategoryCover)}
                        aria-label={
                          p.isCategoryCover
                            ? `إزالة ${p.name} كغلاف للتصنيف`
                            : `جعل ${p.name} غلاف تصنيف ${categoryName(p.category)}`
                        }
                        title={p.isCategoryCover ? 'غلاف التصنيف على الصفحة الرئيسية' : 'جعله غلاف التصنيف'}
                        className={cn(
                          'inline-flex size-11 items-center justify-center rounded-md transition-colors',
                          p.isCategoryCover ? 'bg-blush text-rose-ink' : 'text-muted hover:bg-cream hover:text-brown',
                        )}
                      >
                        <ImageIcon className="size-[18px]" aria-hidden />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/admin/products/${p.id}/edit`}
                          aria-label={`تعديل ${p.name}`}
                          className="inline-flex size-11 items-center justify-center rounded-md text-brown-2 hover:bg-cream hover:text-brown"
                        >
                          <Pencil className="size-[18px]" aria-hidden />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setToDelete(p)}
                          aria-label={`حذف ${p.name}`}
                          className="inline-flex size-11 items-center justify-center rounded-md text-brown-2 hover:bg-danger-soft hover:text-danger"
                        >
                          <Trash2 className="size-[18px]" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="flex flex-col gap-3 lg:hidden">
            {list.map((p) => (
              <li key={p.id} className={cn('rounded-md border border-line bg-paper p-4', pending.has(p.id) && 'opacity-60')}>
                <div className="flex gap-3">
                  <SmartImage src={p.image} alt="" sizes="72px" frameClassName="size-18 shrink-0 rounded-sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-medium text-brown">{p.name}</p>
                      <p className="num shrink-0 font-medium text-brown">{formatPrice(p.price)}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{categoryName(p.category)}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <AvailabilityBadge available={p.available} />
                      {p.featured && <Badge tone="sage">مميز</Badge>}
                      {p.isNew && <Badge tone="rose">جديد</Badge>}
                      {p.isCategoryCover && <Badge tone="neutral">غلاف التصنيف</Badge>}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => void toggle(p, 'available')} disabled={pending.has(p.id)}>
                      {p.available ? 'وضع كغير متوفر' : 'وضع كمتوفر'}
                    </Button>
                    <button
                      type="button"
                      onClick={() => void toggle(p, 'featured')}
                      disabled={pending.has(p.id)}
                      aria-pressed={p.featured}
                      aria-label={p.featured ? `إزالة ${p.name} من المميز` : `تمييز ${p.name}`}
                      className={cn('inline-flex size-11 items-center justify-center rounded-md', p.featured ? 'text-rose-ink' : 'text-muted')}
                    >
                      <Star className={cn('size-[18px]', p.featured && 'fill-current')} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggle(p, 'isCategoryCover')}
                      disabled={pending.has(p.id)}
                      aria-pressed={Boolean(p.isCategoryCover)}
                      aria-label={
                        p.isCategoryCover
                          ? `إزالة ${p.name} كغلاف للتصنيف`
                          : `جعل ${p.name} غلاف تصنيف ${categoryName(p.category)}`
                      }
                      className={cn('inline-flex size-11 items-center justify-center rounded-md', p.isCategoryCover ? 'bg-blush text-rose-ink' : 'text-muted')}
                    >
                      <ImageIcon className="size-[18px]" aria-hidden />
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <Link
                      to={`/admin/products/${p.id}/edit`}
                      aria-label={`تعديل ${p.name}`}
                      className="inline-flex size-11 items-center justify-center rounded-md text-brown-2 hover:bg-cream"
                    >
                      <Pencil className="size-[18px]" aria-hidden />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setToDelete(p)}
                      aria-label={`حذف ${p.name}`}
                      className="inline-flex size-11 items-center justify-center rounded-md text-brown-2 hover:bg-danger-soft hover:text-danger"
                    >
                      <Trash2 className="size-[18px]" aria-hidden />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Floating add button on mobile */}
      <Link
        to="/admin/products/new"
        aria-label="إضافة منتج"
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] end-4 z-30 inline-flex size-14 items-center justify-center rounded-full bg-brown text-ivory shadow-lift transition-transform active:scale-95 sm:hidden"
      >
        <Plus className="size-6" aria-hidden />
      </Link>

      <ConfirmDialog
        open={toDelete !== null}
        title="حذف المنتج؟"
        description={
          toDelete ? (
            <>
              سيتم حذف <strong className="font-medium text-brown">{toDelete.name}</strong> نهائياً. لا يمكن التراجع عن هذا الإجراء.
            </>
          ) : null
        }
        confirmLabel="حذف"
        destructive
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => !deleting && setToDelete(null)}
      />
    </div>
  )
}
