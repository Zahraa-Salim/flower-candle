import { Link } from 'react-router-dom'
import type { ResolvedCartItem } from '@/types/cart'
import { formatPrice } from '@/lib/utils'
import { cartWhatsappUrl } from '@/lib/whatsapp'
import { ButtonAnchor } from '@/components/ui/Button'
import { WhatsAppIcon } from '@/components/ui/BrandIcons'

interface CartSummaryProps {
  /** Only items that still exist in the catalogue; removed products are excluded upstream. */
  items: ResolvedCartItem[]
  subtotal: number
  total: number
  count: number
  onClear: () => void
}

export function CartSummary({ items, subtotal, total, count, onClear }: CartSummaryProps) {
  return (
    <aside aria-label="ملخص الطلب" className="rounded-md border border-line bg-paper p-5 sm:p-6 lg:sticky lg:top-24">
      <h2 className="text-lg font-medium text-brown">ملخص الطلب</h2>
      <dl className="mt-4 flex flex-col gap-2.5 text-[15px]">
        <div className="flex justify-between text-brown-2">
          <dt>
            المجموع الفرعي <span className="num text-muted">({count})</span>
          </dt>
          <dd className="num">{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex justify-between border-t border-line pt-3 text-base font-medium text-brown">
          <dt>المجموع</dt>
          <dd className="num">{formatPrice(total)}</dd>
        </div>
      </dl>

      {items.length > 0 ? (
        <ButtonAnchor
          href={cartWhatsappUrl(items, total)}
          target="_blank"
          rel="noopener noreferrer"
          variant="whatsapp"
          size="lg"
          block
          className="mt-6"
          icon={<WhatsAppIcon className="size-5" />}
        >
          إرسال الطلب عبر واتساب
        </ButtonAnchor>
      ) : (
        <p className="mt-6 rounded-md bg-cream px-4 py-3 text-center text-sm text-brown-2">
          لم يعد أي من هذه المنتجات متاحاً. أزيليها أو اكتشفي المجموعة من جديد.
        </p>
      )}
      <p className="mt-3 text-center text-xs leading-relaxed text-muted">
        سيتم تأكيد التوفر والتفاصيل معك عبر واتساب.
      </p>

      <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-sm">
        <Link to="/products" className="text-brown-2 underline-offset-4 hover:text-brown hover:underline">
          متابعة التسوق
        </Link>
        <button type="button" onClick={onClear} className="text-muted underline-offset-4 hover:text-danger hover:underline">
          تفريغ السلة
        </button>
      </div>
    </aside>
  )
}
