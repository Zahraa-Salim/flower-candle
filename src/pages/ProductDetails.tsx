import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, RefreshCw, Share2, ShoppingBag } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { categoryName } from '@/data/categories'
import { cn, formatPrice } from '@/lib/utils'
import { productWhatsappUrl } from '@/lib/whatsapp'
import { shareContent } from '@/lib/share'
import { useProducts } from '@/hooks/useProducts'
import { useCart } from '@/hooks/useCart'
import { MAX_QTY } from '@/context/CartContext'
import { useToast } from '@/hooks/useToast'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { SmartImage } from '@/components/ui/SmartImage'
import { AvailabilityBadge, Badge } from '@/components/ui/Badge'
import { Button, ButtonAnchor, ButtonLink } from '@/components/ui/Button'
import { QuantityStepper } from '@/components/ui/QuantityStepper'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { WhatsAppIcon } from '@/components/ui/BrandIcons'
import { ProductGrid } from '@/components/product/ProductGrid'

function DetailsSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-12" aria-busy>
      <div className="lg:col-span-7">
        <Skeleton className="aspect-[4/5] w-full" />
      </div>
      <div className="flex flex-col gap-4 lg:col-span-5">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  )
}

export default function ProductDetailsPage() {
  const { id = '' } = useParams()
  const { products, status, getById, reload } = useProducts()
  const { addItem, quantityOf } = useCart()
  const { show } = useToast()

  const product = getById(id)
  const [qty, setQty] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  // Reset selection when navigating between products (render-time state adjustment).
  const [lastId, setLastId] = useState(id)
  if (lastId !== id) {
    setLastId(id)
    setQty(1)
    setActiveImage(0)
  }

  useDocumentMeta(product?.name, product?.description)

  const gallery = useMemo(() => {
    if (!product) return []
    const list = [product.image, ...(product.images ?? [])]
    return Array.from(new Set(list))
  }, [product])

  const related = useMemo(
    () => (product ? products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4) : []),
    [products, product],
  )

  const loading = status === 'loading'

  if (loading) {
    return (
      <div className="container-x pt-8 pb-20 lg:pt-12">
        <DetailsSkeleton />
      </div>
    )
  }

  // A failed catalogue load is not "product not found": offer a retry instead.
  if (status === 'error') {
    return (
      <div className="container-x py-10">
        <EmptyState
          title="تعذّر تحميل المنتج"
          description="حدث خطأ أثناء تحميل المنتجات. حاولي مرة أخرى."
          action={
            <Button onClick={() => void reload()} icon={<RefreshCw className="size-4" aria-hidden />}>
              إعادة المحاولة
            </Button>
          }
        />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container-x py-10">
        <EmptyState
          title="لم نجد هذا المنتج"
          description="ربما تغيّر الرابط أو لم يعد المنتج متاحاً."
          action={<ButtonLink to="/products">عرض جميع المنتجات</ButtonLink>}
        />
      </div>
    )
  }

  const inCart = quantityOf(product.id)
  // The cart caps each product at MAX_QTY; only offer what can still be added so the toast is truthful.
  const remaining = Math.max(0, MAX_QTY - inCart)
  const atLimit = remaining === 0
  const stepperMax = Math.max(1, remaining)
  const effectiveQty = Math.min(qty, stepperMax)

  const handleAdd = () => {
    if (!product.available) {
      show('هذا المنتج غير متوفر حالياً', 'info')
      return
    }
    if (atLimit) {
      show(`الحد الأقصى ${MAX_QTY} من هذا المنتج في السلة`, 'info')
      return
    }
    addItem(product, effectiveQty)
    show(
      effectiveQty === 1
        ? `أُضيفت ${product.name} إلى السلة`
        : `أُضيفت ${effectiveQty} × ${product.name} إلى السلة`,
    )
  }

  const handleShare = async () => {
    const result = await shareContent({
      title: `${product.name} — ${siteConfig.name}`,
      text: product.description,
      url: window.location.href,
    })
    if (result === 'copied') show('تم نسخ رابط المنتج')
    else if (result === 'failed') show('تعذّرت مشاركة المنتج', 'error')
  }

  const attributes: { label: string; value: string }[] = [
    product.flowersCount !== undefined ? { label: 'عدد الورود', value: String(product.flowersCount) } : null,
    product.color ? { label: 'اللون', value: product.color } : null,
    product.size ? { label: 'الحجم', value: product.size } : null,
    { label: 'الصناعة', value: product.handmade === false ? 'شبه يدوية' : 'يدوية' },
  ].filter((a): a is { label: string; value: string } => a !== null)

  return (
    <div className="container-x pt-6 pb-20 sm:pt-8 lg:pt-10 lg:pb-28">
      <nav aria-label="مسار التصفح" className="mb-6 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link to="/" className="hover:text-brown">
              الرئيسية
            </Link>
          </li>
          <li aria-hidden>
            <ChevronLeft className="size-3.5" />
          </li>
          <li>
            <Link to="/products" className="hover:text-brown">
              المنتجات
            </Link>
          </li>
          <li aria-hidden>
            <ChevronLeft className="size-3.5" />
          </li>
          <li>
            <Link to={`/products?category=${product.category}`} className="hover:text-brown">
              {categoryName(product.category)}
            </Link>
          </li>
          <li aria-hidden>
            <ChevronLeft className="size-3.5" />
          </li>
          <li aria-current="page" className="text-brown">
            {product.name}
          </li>
        </ol>
      </nav>

      <article className="grid gap-8 lg:grid-cols-12 lg:gap-12">
        {/* Gallery */}
        <div className="lg:col-span-7">
          <SmartImage
            key={gallery[activeImage]}
            src={gallery[activeImage]}
            alt={product.name}
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            frameClassName="aspect-[4/5] rounded-md sm:aspect-square lg:aspect-[4/5]"
            className={cn(!product.available && 'saturate-[0.6]')}
          />
          {gallery.length > 1 && (
            <ul className="mt-3 flex gap-2.5" aria-label="صور المنتج">
              {gallery.map((src, i) => (
                <li key={src}>
                  <button
                    type="button"
                    onClick={() => setActiveImage(i)}
                    aria-label={`عرض الصورة ${i + 1}`}
                    aria-pressed={activeImage === i}
                    className={cn(
                      'block overflow-hidden rounded-sm border-2 transition-colors',
                      activeImage === i ? 'border-rose' : 'border-transparent hover:border-line',
                    )}
                  >
                    <SmartImage src={src} alt="" sizes="88px" frameClassName="size-16 sm:size-20" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Info */}
        <div className="lg:col-span-5">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/products?category=${product.category}`} className="text-sm text-rose-deep hover:underline">
              {categoryName(product.category)}
            </Link>
            {product.isNew && <Badge tone="rose">جديد</Badge>}
            {product.featured && <Badge tone="sage">مميز</Badge>}
          </div>
          <h1 className="mt-2 text-3xl font-normal text-brown sm:text-4xl">{product.name}</h1>
          <div className="mt-4 flex items-center gap-4">
            <p className="num text-2xl font-medium text-brown">{formatPrice(product.price)}</p>
            <AvailabilityBadge available={product.available} />
          </div>

          <p className="lead mt-6">{product.description}</p>

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-y border-line py-5 text-[15px]">
            {attributes.map((a) => (
              <div key={a.label} className="flex justify-between gap-3">
                <dt className="text-muted">{a.label}</dt>
                <dd className="num font-medium text-brown">{a.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <QuantityStepper value={effectiveQty} onChange={setQty} max={stepperMax} />
              <Button
                size="lg"
                onClick={handleAdd}
                disabled={!product.available || atLimit}
                className="min-w-44 flex-1"
                icon={<ShoppingBag className="size-[18px]" aria-hidden />}
              >
                أضيفي إلى السلة
              </Button>
            </div>
            {inCart > 0 && (
              <p className="text-sm text-muted">
                لديك <span className="num">{inCart}</span> من هذا المنتج في{' '}
                <Link to="/cart" className="text-rose-deep underline-offset-4 hover:underline">
                  السلة
                </Link>
                {atLimit ? '، وهو الحد الأقصى.' : '.'}
              </p>
            )}
            {!product.available && (
              <p className="text-sm text-muted">هذه القطعة غير متوفرة حالياً. تواصلي معنا لمعرفة موعد توفرها.</p>
            )}
            <ButtonAnchor
              href={productWhatsappUrl(product)}
              target="_blank"
              rel="noopener noreferrer"
              variant="whatsapp"
              size="lg"
              block
              icon={<WhatsAppIcon className="size-5" />}
            >
              تواصلي عبر واتساب
            </ButtonAnchor>
            <Button variant="ghost" size="lg" block onClick={() => void handleShare()} icon={<Share2 className="size-[18px]" aria-hidden />}>
              مشاركة المنتج
            </Button>
          </div>

          <p className="mt-6 text-xs leading-relaxed text-muted">
            إضافة المنتج إلى السلة لا تحجزه. يتم تأكيد التوفر والتفاصيل عبر واتساب.
          </p>
        </div>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="mt-20 border-t border-line pt-14 lg:mt-28">
          <div className="flex items-end justify-between gap-4">
            <h2 id="related-title" className="h-section">
              قد يعجبك أيضاً
            </h2>
            <Link to={`/products?category=${product.category}`} className="text-sm text-brown-2 hover:text-brown">
              كل {categoryName(product.category)}
            </Link>
          </div>
          <div className="mt-8">
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </div>
  )
}
