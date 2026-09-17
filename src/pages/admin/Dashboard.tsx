import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, RefreshCw } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { categoryName } from '@/data/categories'
import { cn, formatDate, formatPrice } from '@/lib/utils'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { HeroImagesEditor } from '@/components/admin/HeroImagesEditor'
import { Button, ButtonLink } from '@/components/ui/Button'
import { SmartImage } from '@/components/ui/SmartImage'
import { AvailabilityBadge, Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'

export default function AdminDashboardPage() {
  useDocumentMeta('لوحة التحكم')
  const { products, status, reload } = useProducts()
  const loading = status === 'loading'

  const stats = [
    { label: 'إجمالي المنتجات', value: products.length },
    { label: 'متوفر', value: products.filter((p) => p.available).length },
    { label: 'غير متوفر', value: products.filter((p) => !p.available).length },
    { label: 'مميز', value: products.filter((p) => p.featured).length },
  ]

  const recent = [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="لوحة التحكم"
        description="نظرة سريعة على المتجر."
        action={
          <ButtonLink to="/admin/products/new" icon={<Plus className="size-4" aria-hidden />}>
            إضافة منتج
          </ButtonLink>
        }
      />

      {status === 'error' ? (
        <div className="flex flex-col items-start gap-3 rounded-md border border-line bg-paper p-5">
          <p className="text-brown-2">تعذّر تحميل البيانات.</p>
          <Button variant="outline" size="sm" onClick={() => void reload()} icon={<RefreshCw className="size-4" aria-hidden />}>
            إعادة المحاولة
          </Button>
        </div>
      ) : (
        <dl className="grid grid-cols-2 rounded-md border border-line bg-paper sm:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={cn(
                'border-line px-5 py-5',
                i < 2 && 'border-b sm:border-b-0',
                i % 2 === 0 ? 'border-e' : i !== 3 && 'sm:border-e',
              )}
            >
              <dt className="text-xs text-muted">{s.label}</dt>
              <dd className="num mt-1 text-3xl font-light text-brown">
                {loading ? <Skeleton className="h-9 w-12" /> : s.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <HeroImagesEditor />

      <section aria-labelledby="recent-title">
        <div className="flex items-center justify-between">
          <h2 id="recent-title" className="text-lg font-medium text-brown">
            أحدث المنتجات
          </h2>
          <Link to="/admin/products" className="inline-flex h-10 items-center gap-1.5 text-sm text-brown-2 hover:text-brown">
            كل المنتجات
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
        </div>
        <ul className="mt-3 divide-y divide-line rounded-md border border-line bg-paper">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="size-14 shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="mt-2 h-3 w-1/5" />
                  </div>
                </li>
              ))
            : recent.map((p) => (
                <li key={p.id}>
                  <Link to={`/admin/products/${p.id}/edit`} className="flex items-center gap-4 p-4 transition-colors hover:bg-cream/60">
                    <SmartImage src={p.image} alt="" sizes="56px" frameClassName="size-14 shrink-0 rounded-sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-brown">{p.name}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {categoryName(p.category)} · <span className="num">{formatDate(p.createdAt)}</span>
                      </p>
                    </div>
                    <div className="hidden items-center gap-2 sm:flex">
                      {p.featured && <Badge tone="sage">مميز</Badge>}
                      <AvailabilityBadge available={p.available} />
                    </div>
                    <p className="num shrink-0 font-medium text-brown">{formatPrice(p.price)}</p>
                  </Link>
                </li>
              ))}
          {status === 'ready' && recent.length === 0 && (
            <li className="p-6 text-center text-sm text-muted">لا توجد منتجات بعد.</li>
          )}
        </ul>
      </section>
    </div>
  )
}
