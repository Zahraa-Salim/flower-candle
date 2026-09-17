import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { categories } from '@/data/categories'
import { cn } from '@/lib/utils'
import { useProducts } from '@/hooks/useProducts'
import { SmartImage } from '@/components/ui/SmartImage'

/* Asymmetric layout: the first tile is tall, the last one wide. */
const spans = [
  'lg:col-span-2 lg:row-span-2 aspect-[4/5] lg:aspect-auto',
  'aspect-[4/5] lg:aspect-[4/3]',
  'aspect-[4/5] lg:aspect-[4/3]',
  'col-span-2 aspect-[16/9] lg:col-span-2 lg:aspect-auto',
]

export function Categories() {
  const { products, status } = useProducts()
  // The admin can flag one product per category as its cover; otherwise the curated default is used.
  // While the catalogue loads, show the shimmer frame so the tile does not flash the default first.
  const coverFor = (categoryId: string) => products.find((p) => p.category === categoryId && p.isCategoryCover)?.image
  const loading = status === 'loading'
  return (
    <section aria-labelledby="categories-title" className="pb-16 sm:pb-20 lg:pb-28">
      <div className="container-x">
        <h2 id="categories-title" className="sr-only">
          التصنيفات
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:grid-rows-2 lg:gap-5">
          {categories.map((c, i) => (
            <Link
              key={c.id}
              to={`/products?category=${c.id}`}
              className={cn('group relative block overflow-hidden rounded-md', spans[i] ?? 'aspect-[4/5]')}
              aria-label={`تصفحي ${c.name}`}
            >
              {loading ? (
                <div aria-hidden className="shimmer absolute inset-0 bg-cream" />
              ) : (
                <SmartImage
                  src={coverFor(c.id) ?? c.image}
                  alt=""
                  sizes={i === 0 || i === 3 ? '(min-width: 1024px) 600px, 50vw' : '(min-width: 1024px) 300px, 50vw'}
                  frameClassName="absolute inset-0 size-full"
                  className="transition-transform duration-700 ease-(--ease-soft) lg:group-hover:scale-[1.04]"
                />
              )}
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-brown/65 via-brown/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-ivory sm:p-5 lg:p-6">
                <div>
                  <span className={cn('block font-normal leading-tight', i === 0 ? 'text-2xl sm:text-3xl lg:text-4xl' : 'text-xl sm:text-2xl')}>
                    {c.name}
                  </span>
                  <span className="mt-1 hidden text-sm text-ivory/85 sm:block">{c.description}</span>
                </div>
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-ivory/15 backdrop-blur transition-colors group-hover:bg-ivory group-hover:text-brown">
                  <ArrowLeft className="size-4" aria-hidden />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
