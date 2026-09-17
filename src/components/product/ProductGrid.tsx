import type { Product } from '@/types/product'
import { cn } from '@/lib/utils'
import { ProductCard } from './ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'

interface ProductGridProps {
  products: Product[]
  loading?: boolean
  skeletonCount?: number
  columns?: 3 | 4
  className?: string
}

export function ProductGrid({ products, loading, skeletonCount = 8, columns = 4, className }: ProductGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10',
        columns === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3',
        className,
      )}
    >
      {loading
        ? Array.from({ length: skeletonCount }).map((_, i) => <ProductCardSkeleton key={i} />)
        : products.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 2} />)}
    </div>
  )
}
