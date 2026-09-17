import { siteConfig } from '@/config/site'
import type { CartItem } from '@/types/cart'
import type { Product } from '@/types/product'
import { formatPrice } from './utils'

/** Build a wa.me URL with a correctly encoded message. */
export function whatsappUrl(message?: string, number = siteConfig.whatsappNumber): string {
  const base = `https://wa.me/${number}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

export function productInquiryMessage(product: Pick<Product, 'name' | 'price'>): string {
  return `مرحباً، أنا مهتمة بـ ${product.name} بسعر ${formatPrice(product.price)}. هل المنتج متوفر؟`
}

export function productWhatsappUrl(product: Pick<Product, 'name' | 'price'>): string {
  return whatsappUrl(productInquiryMessage(product))
}

type OrderLine = Pick<CartItem, 'quantity'> & { product: Pick<CartItem['product'], 'name' | 'price' | 'available'> }

export function cartOrderMessage(items: OrderLine[], total: number): string {
  const lines = items.map((item) => {
    const line = `• ${item.product.name} × ${item.quantity} — ${formatPrice(item.product.price * item.quantity)}`
    // The shop needs to see out-of-stock lines at a glance; the customer already saw the badge.
    return item.product.available ? line : `${line} (غير متوفر حالياً)`
  })
  return [
    `مرحباً ${siteConfig.name}،`,
    '',
    'أود الاستفسار عن الطلب التالي:',
    '',
    ...lines,
    '',
    `المجموع: ${formatPrice(total)}`,
    '',
    'هل المنتجات متوفرة؟',
    '',
    'شكراً',
  ].join('\n')
}

export function cartWhatsappUrl(items: OrderLine[], total: number): string {
  return whatsappUrl(cartOrderMessage(items, total))
}

export function generalWhatsappUrl(): string {
  return whatsappUrl(`مرحباً ${siteConfig.name}، وجدت شيئاً أعجبني وأود معرفة التفاصيل والتوفر.`)
}
