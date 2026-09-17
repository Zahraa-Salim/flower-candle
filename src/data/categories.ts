import type { Category } from '@/types/product'
import { images } from './images'

export const categories: Category[] = [
  {
    id: 'bouquets',
    name: 'باقات',
    description: 'باقات من شموع الورد، منسّقة يدوياً لتُهدى.',
    image: images.catBouquets,
  },
  {
    id: 'roses',
    name: 'ورود',
    description: 'وردة واحدة تكفي أحياناً لتقول كل شيء.',
    image: images.catRoses,
  },
  {
    id: 'gifts',
    name: 'هدايا',
    description: 'قطع صغيرة مغلّفة بعناية لكل مناسبة.',
    image: images.catGifts,
  },
  {
    id: 'favors',
    name: 'توزيعات',
    description: 'تشكيلات للأعراس والاحتفالات والضيافة.',
    image: images.catFavors,
  },
]

export const categoryMap: Record<string, Category> = Object.fromEntries(
  categories.map((c) => [c.id, c]),
)

export function categoryName(id: string): string {
  return categoryMap[id]?.name ?? id
}
