import { Link } from 'react-router-dom'
import { ImageOff, Trash2 } from 'lucide-react'
import type { ResolvedCartItem } from '@/types/cart'
import { categoryName } from '@/data/categories'
import { cn, formatPrice } from '@/lib/utils'
import { SmartImage } from '@/components/ui/SmartImage'
import { QuantityStepper } from '@/components/ui/QuantityStepper'
import { Badge } from '@/components/ui/Badge'

interface CartItemRowProps {
  item: ResolvedCartItem
  onQuantity: (qty: number) => void
  onRemove: () => void
}

export function CartItemRow({ item, onQuantity, onRemove }: CartItemRowProps) {
  const { product, quantity, missing } = item
  const href = `/products/${product.id}`

  // The snapshot never stores uploaded (data URL) photos; the live image arrives via reconciliation,
  // so an empty src only happens while loading or when the product no longer exists.
  const image = product.image ? (
    <SmartImage
      src={product.image}
      alt={product.name}
      sizes="120px"
      frameClassName="size-24 rounded-md sm:size-28"
      className={cn(missing && 'saturate-0 opacity-60')}
    />
  ) : (
    <div aria-hidden className="flex size-24 items-center justify-center rounded-md bg-cream text-muted/60 sm:size-28">
      <ImageOff className="size-6" />
    </div>
  )

  return (
    <li className="flex gap-4 py-5 sm:gap-5">
      {missing ? (
        <div className="shrink-0 rounded-md">{image}</div>
      ) : (
        <Link to={href} className="shrink-0 rounded-md">
          {image}
        </Link>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {missing ? (
              <p className="truncate font-medium text-brown-2">{product.name}</p>
            ) : (
              <Link to={href} className="block truncate font-medium text-brown hover:text-rose-ink">
                {product.name}
              </Link>
            )}
            <p className="mt-0.5 text-xs text-muted">{categoryName(product.category)}</p>
            {missing ? (
              <Badge tone="neutral" className="mt-1.5">
                لم يعد متاحاً في المتجر
              </Badge>
            ) : (
              !product.available && (
                <Badge tone="neutral" className="mt-1.5">
                  غير متوفر حالياً
                </Badge>
              )
            )}
          </div>
          {!missing && (
            <p className="num shrink-0 font-medium text-brown">{formatPrice(product.price * quantity)}</p>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          {missing ? (
            <p className="text-sm text-muted">لن يُضاف إلى الطلب.</p>
          ) : (
            <QuantityStepper size="sm" min={0} value={quantity} onChange={onQuantity} label={`كمية ${product.name}`} />
          )}
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-11 items-center gap-1.5 rounded-md px-2 text-sm text-muted transition-colors hover:bg-danger-soft hover:text-danger"
            aria-label={`إزالة ${product.name} من السلة`}
          >
            <Trash2 className="size-4" aria-hidden />
            <span className="hidden sm:inline">إزالة</span>
          </button>
        </div>
      </div>
    </li>
  )
}
