import { memo } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import type { Product } from '@/types/product'
import { categoryName } from '@/data/categories'
import { formatPrice, cn } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'
import { useToast } from '@/hooks/useToast'
import { SmartImage } from '@/components/ui/SmartImage'
import { Badge } from '@/components/ui/Badge'

interface ProductCardProps {
  product: Product
  priority?: boolean
}

export const ProductCard = memo(function ProductCard({ product, priority }: ProductCardProps) {
  const { addItem } = useCart()
  const { show } = useToast()
  const href = `/products/${product.id}`

  const quickAdd = () => {
    if (!product.available) {
      show('هذا المنتج غير متوفر حالياً', 'info')
      return
    }
    addItem(product, 1)
    show(`أُضيفت ${product.name} إلى السلة`)
  }

  return (
    <article className="group flex flex-col">
      <div className="relative">
        {/* Decorative duplicate of the name link below; keeps the whole image tappable. */}
        <Link to={href} tabIndex={-1} aria-hidden className="block rounded-md">
          <SmartImage
            src={product.image}
            alt=""
            priority={priority}
            sizes="(min-width: 1024px) 25vw, 50vw"
            frameClassName="aspect-[4/5] rounded-md"
            className={cn(
              'transition-transform duration-700 ease-(--ease-soft) lg:group-hover:scale-[1.035]',
              !product.available && 'saturate-[0.55] opacity-80',
            )}
          />
        </Link>

        {(product.isNew || product.featured || !product.available) && (
          <div className="pointer-events-none absolute top-2.5 start-2.5 flex flex-col items-start gap-1.5">
            {!product.available && <Badge tone="neutral">غير متوفر</Badge>}
            {product.available && product.isNew && <Badge tone="rose">جديد</Badge>}
            {product.available && !product.isNew && product.featured && <Badge tone="sage">مميز</Badge>}
          </div>
        )}

        <button
          type="button"
          onClick={quickAdd}
          aria-label={product.available ? `أضيفي ${product.name} إلى السلة` : `${product.name} غير متوفر`}
          className={cn(
            'absolute bottom-2.5 end-2.5 inline-flex size-11 items-center justify-center rounded-full bg-paper/95 text-brown shadow-whisper backdrop-blur',
            'transition-[opacity,transform,background-color,color] duration-300 hover:bg-brown hover:text-ivory active:scale-95',
            // Hide until hover only on devices that can hover; touch screens at desktop widths keep it visible.
            'lg:[@media(hover:hover)]:translate-y-1 lg:[@media(hover:hover)]:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:focus-visible:translate-y-0 lg:focus-visible:opacity-100',
          )}
        >
          <ShoppingBag className="size-[18px]" aria-hidden />
        </button>
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-medium sm:text-base">
            <Link
              to={href}
              className="text-brown transition-colors hover:text-rose-ink"
              aria-label={`${product.name}، ${formatPrice(product.price)}${product.available ? '' : '، غير متوفر حالياً'}`}
            >
              {product.name}
            </Link>
          </h3>
          <p className="mt-0.5 text-xs text-muted">{categoryName(product.category)}</p>
        </div>
        <p className="num shrink-0 text-[15px] font-medium text-brown sm:text-base">{formatPrice(product.price)}</p>
      </div>
    </article>
  )
})
