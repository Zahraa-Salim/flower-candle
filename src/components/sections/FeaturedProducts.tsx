import { Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { ProductGrid } from '@/components/product/ProductGrid'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Button } from '@/components/ui/Button'

export function FeaturedProducts() {
  const { products, status, reload } = useProducts()
  const featured = products.filter((p) => p.featured).slice(0, 4)
  const fallback = products.slice(0, 4)
  const list = featured.length >= 4 ? featured : [...featured, ...fallback.filter((p) => !featured.includes(p))].slice(0, 4)

  return (
    <section aria-labelledby="featured-title" className="section-y">
      <div className="container-x">
        <SectionHeading
          id="featured-title"
          title="من شغف"
          lead="قطع مختارة بعناية، كل واحدة منها صُنعت يدوياً لتحمل شيئاً من الدفء."
          action={
            <Link to="/products" className="group inline-flex h-11 items-center gap-2 text-brown-2 hover:text-brown">
              كل المنتجات
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" aria-hidden />
            </Link>
          }
        />
        <div className="mt-10 lg:mt-12">
          {status === 'error' ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <p className="text-brown-2">تعذّر تحميل المنتجات الآن.</p>
              <Button variant="outline" onClick={() => void reload()} icon={<RefreshCw className="size-4" aria-hidden />}>
                إعادة المحاولة
              </Button>
            </div>
          ) : (
            <ProductGrid products={list} loading={status !== 'ready'} skeletonCount={4} />
          )}
        </div>
      </div>
    </section>
  )
}
