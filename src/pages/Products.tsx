import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { RefreshCw, SlidersHorizontal } from 'lucide-react'
import type { CategoryId, ProductFilters as Filters, SortOption } from '@/types/product'
import { categories } from '@/data/categories'
import { applyFilters, countActiveFilters } from '@/lib/filters'
import { useProducts } from '@/hooks/useProducts'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { ProductGrid } from '@/components/product/ProductGrid'
import { SearchInput } from '@/components/product/SearchInput'
import { CategoryChips, FilterPanel, SortSelect } from '@/components/product/ProductFilters'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { Petal } from '@/components/ui/Petal'

const categoryIds = new Set<string>(categories.map((c) => c.id))
const sortIds = new Set<string>(['featured', 'newest', 'price-asc', 'price-desc'])

function readFilters(params: URLSearchParams): Filters {
  const category = params.get('category')
  const availability = params.get('availability')
  const max = Number(params.get('max'))
  const sort = params.get('sort')
  return {
    query: params.get('q') ?? '',
    category: category && categoryIds.has(category) ? (category as CategoryId) : 'all',
    availability: availability === 'available' || availability === 'unavailable' ? availability : 'all',
    maxPrice: Number.isFinite(max) && max > 0 ? max : null,
    sort: sort && sortIds.has(sort) ? (sort as SortOption) : 'featured',
  }
}

function writeFilters(f: Filters): URLSearchParams {
  const p = new URLSearchParams()
  if (f.query) p.set('q', f.query)
  if (f.category !== 'all') p.set('category', f.category)
  if (f.availability !== 'all') p.set('availability', f.availability)
  if (f.maxPrice !== null) p.set('max', String(f.maxPrice))
  if (f.sort !== 'featured') p.set('sort', f.sort)
  return p
}

export default function ProductsPage() {
  useDocumentMeta('مجموعة شغف', 'اكتشفي القطع المصنوعة يدوياً من شموع الورد والباقات والهدايا.')
  const { products, status, reload } = useProducts()
  const [params, setParams] = useSearchParams()
  const isDesktop = useIsDesktop()
  const [sheetOpen, setSheetOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const filters = useMemo(() => readFilters(params), [params])
  // Local query state keeps typing snappy; the URL updates after a short pause.
  const [query, setQuery] = useState(filters.query)
  // When the URL query changes from outside (back navigation, reset), adopt it during render.
  const [syncedQuery, setSyncedQuery] = useState(filters.query)
  if (filters.query !== syncedQuery) {
    setSyncedQuery(filters.query)
    setQuery(filters.query)
  }

  useEffect(() => {
    if (query === filters.query) return
    const t = window.setTimeout(() => {
      const next = writeFilters({ ...filters, query })
      setParams(next, { replace: true })
    }, 250)
    return () => window.clearTimeout(t)
  }, [query, filters, setParams])

  useEffect(() => {
    if (params.get('focus') === 'search') {
      searchRef.current?.focus()
      const next = new URLSearchParams(params)
      next.delete('focus')
      setParams(next, { replace: true })
    }
  }, [params, setParams])

  const update = useCallback(
    (patch: Partial<Filters>) => {
      setParams(writeFilters({ ...filters, ...patch }), { replace: true })
    },
    [filters, setParams],
  )

  const reset = useCallback(() => {
    setQuery('')
    setParams(new URLSearchParams(), { replace: true })
  }, [setParams])

  const maxPriceBound = useMemo(() => Math.max(10, ...products.map((p) => Math.ceil(p.price))), [products])
  const results = useMemo(() => applyFilters(products, filters), [products, filters])
  const activeCount = countActiveFilters(filters)
  const loading = status === 'loading'

  return (
    <div className="container-x pt-8 pb-20 sm:pt-12 lg:pt-16 lg:pb-28">
      <header className="max-w-2xl">
        <Petal className="mb-3 size-5 text-rose" />
        <h1 className="h-section">مجموعة شغف</h1>
        <p className="lead mt-3">اكتشفي القطع المصنوعة يدوياً، واخترِي التفاصيل التي تشبهك أو تشبه من تحبين.</p>
      </header>

      <div className="mt-8 flex flex-col gap-4 lg:mt-10">
        <SearchInput ref={searchRef} value={query} onChange={setQuery} className="max-w-xl" />
        <CategoryChips value={filters.category} onChange={(category) => update({ category })} />
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[14rem_1fr] lg:gap-12">
        {isDesktop && (
          <aside aria-label="الفلاتر" className="self-start lg:sticky lg:top-24">
            <h2 className="mb-5 text-base font-medium text-brown">الفلاتر</h2>
            <FilterPanel filters={filters} maxPriceBound={maxPriceBound} onChange={update} onReset={reset} />
          </aside>
        )}

        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
            <p className="text-sm text-muted" aria-live="polite">
              {loading ? 'جارٍ التحميل…' : (
                <>
                  <span className="num">{results.length}</span> {results.length === 1 ? 'منتج' : 'منتجات'}
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              {!isDesktop && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSheetOpen(true)}
                  icon={<SlidersHorizontal className="size-4" aria-hidden />}
                  aria-haspopup="dialog"
                >
                  الفلاتر
                  {activeCount > 0 && (
                    <span className="num inline-flex size-5 items-center justify-center rounded-full bg-rose-ink text-[11px] text-paper">
                      {activeCount}
                    </span>
                  )}
                </Button>
              )}
              <SortSelect value={filters.sort} onChange={(sort) => update({ sort })} />
            </div>
          </div>

          <div className="mt-8">
            {status === 'error' ? (
              <EmptyState
                title="حدث خطأ أثناء تحميل المنتجات"
                description="تحققي من اتصالك بالإنترنت ثم أعيدي المحاولة."
                action={
                  <Button onClick={() => void reload()} icon={<RefreshCw className="size-4" aria-hidden />}>
                    إعادة المحاولة
                  </Button>
                }
              />
            ) : !loading && results.length === 0 ? (
              <EmptyState
                title="لم نجد ما تبحثين عنه"
                description="جرّبي كلمة أخرى أو تصفحي المجموعة كاملة."
                action={
                  <ButtonLink to="/products" onClick={reset} variant="outline">
                    عرض جميع المنتجات
                  </ButtonLink>
                }
              />
            ) : (
              <ProductGrid products={results} loading={loading} columns={3} />
            )}
          </div>
        </div>
      </div>

      {!isDesktop && (
        <Drawer
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="الفلاتر"
          side="bottom"
          footer={
            <Button block onClick={() => setSheetOpen(false)}>
              عرض النتائج {!loading && <span className="num">({results.length})</span>}
            </Button>
          }
        >
          <FilterPanel filters={filters} maxPriceBound={maxPriceBound} onChange={update} onReset={reset} />
        </Drawer>
      )}
    </div>
  )
}
