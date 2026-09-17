import { useMemo } from 'react'
import { ShoppingBag } from 'lucide-react'
import type { ResolvedCartItem } from '@/types/cart'
import { useCart } from '@/hooks/useCart'
import { useProducts } from '@/hooks/useProducts'
import { useToast } from '@/hooks/useToast'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { CartItemRow } from '@/components/cart/CartItemRow'
import { CartSummary } from '@/components/cart/CartSummary'
import { EmptyState } from '@/components/ui/EmptyState'
import { ButtonLink } from '@/components/ui/Button'
import { Petal } from '@/components/ui/Petal'

export default function CartPage() {
  useDocumentMeta('سلتك', 'راجعي اختياراتك من شغف قبل إرسال الطلب عبر واتساب.')
  const { items, setQuantity, removeItem, clear } = useCart()
  const { status, getById } = useProducts()
  const { show } = useToast()

  // Reconcile the stored snapshots with the live catalogue so prices, availability,
  // and the WhatsApp order reflect what the shop sells right now.
  const resolved = useMemo<ResolvedCartItem[]>(
    () =>
      items.map((item) => {
        const live = getById(item.productId)
        if (live) {
          return {
            ...item,
            missing: false,
            product: {
              id: live.id,
              name: live.name,
              price: live.price,
              image: live.image,
              category: live.category,
              available: live.available,
            },
          }
        }
        // While the catalogue is still loading (or failed) keep trusting the snapshot.
        return { ...item, missing: status === 'ready' }
      }),
    [items, getById, status],
  )

  const orderable = useMemo(() => resolved.filter((i) => !i.missing), [resolved])
  const count = orderable.reduce((n, i) => n + i.quantity, 0)
  const subtotal = orderable.reduce((n, i) => n + i.quantity * i.product.price, 0)
  const total = subtotal

  if (items.length === 0) {
    return (
      <div className="container-x py-10 lg:py-16">
        <EmptyState
          titleAs="h1"
          icon={<ShoppingBag className="size-6" aria-hidden />}
          title="سلتك فارغة"
          description="لم تختاري شيئاً من شغف بعد."
          action={<ButtonLink to="/products">اكتشفي المجموعة</ButtonLink>}
        />
      </div>
    )
  }

  return (
    <div className="container-x pt-8 pb-20 sm:pt-12 lg:pt-16 lg:pb-28">
      <header className="max-w-2xl">
        <Petal className="mb-3 size-5 text-rose" />
        <h1 className="h-section">سلتك من شغف</h1>
        <p className="lead mt-3">راجعي اختياراتك قبل إرسال الطلب.</p>
      </header>

      <div className="mt-8 grid gap-8 lg:mt-12 lg:grid-cols-12 lg:gap-12">
        <section aria-label="المنتجات في السلة" className="lg:col-span-7">
          <ul className="divide-y divide-line border-y border-line">
            {resolved.map((item) => (
              <CartItemRow
                key={item.productId}
                item={item}
                onQuantity={(q) => {
                  if (q <= 0) {
                    removeItem(item.productId)
                    show(`أُزيلت ${item.product.name} من السلة`, 'info')
                  } else {
                    setQuantity(item.productId, q)
                  }
                }}
                onRemove={() => {
                  removeItem(item.productId)
                  show(`أُزيلت ${item.product.name} من السلة`, 'info')
                }}
              />
            ))}
          </ul>
        </section>

        <div className="lg:col-span-5">
          <CartSummary
            items={orderable}
            count={count}
            subtotal={subtotal}
            total={total}
            onClear={() => {
              clear()
              show('تم تفريغ السلة', 'info')
            }}
          />
        </div>
      </div>
    </div>
  )
}
