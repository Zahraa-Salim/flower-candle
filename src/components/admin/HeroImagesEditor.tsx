import { useRef, useState } from 'react'
import { RotateCcw, Upload } from 'lucide-react'
import type { HeroSlot } from '@/types/site'
import { useSiteContent } from '@/hooks/useSiteContent'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/Button'
import { SmartImage } from '@/components/ui/SmartImage'
import { Badge } from '@/components/ui/Badge'

const slots: { id: HeroSlot; label: string; hint: string; aspect: string }[] = [
  { id: 'main', label: 'الصورة الرئيسية', hint: 'الصورة الكبيرة في واجهة الموقع. الأفضل صورة عمودية 4:5.', aspect: 'aspect-[4/5]' },
  { id: 'detail', label: 'الصورة الثانوية', hint: 'الصورة الصغيرة أسفل الرئيسية. الأفضل صورة مربعة.', aspect: 'aspect-square' },
]

function HeroSlotCard({ slot, label, hint, aspect }: { slot: HeroSlot; label: string; hint: string; aspect: string }) {
  const { content, isCustomHero, setHeroImage, resetHeroImage } = useSiteContent()
  const { show } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const custom = isCustomHero(slot)

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    try {
      await setHeroImage(slot, file)
      show(`تم تحديث ${label}`)
    } catch (err) {
      show(err instanceof Error ? err.message : 'تعذّر رفع الصورة', 'error')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const onReset = async () => {
    setBusy(true)
    try {
      await resetHeroImage(slot)
      show(`تمت استعادة ${label} الافتراضية`, 'info')
    } catch {
      show('تعذّرت استعادة الصورة', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="flex gap-4 rounded-md border border-line bg-paper p-4">
      <SmartImage src={content.hero[slot]} alt="" sizes="160px" frameClassName={`w-28 shrink-0 rounded-sm sm:w-32 ${aspect}`} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-brown">{label}</p>
          {custom ? <Badge tone="sage">صورة مخصصة</Badge> : <Badge tone="neutral">الافتراضية</Badge>}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted">{hint}</p>
        <div className="mt-auto flex flex-wrap gap-2 pt-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label={`اختيار ملف ${label}`}
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          <Button
            size="sm"
            variant="outline"
            loading={busy}
            icon={<Upload className="size-4" aria-hidden />}
            onClick={() => inputRef.current?.click()}
          >
            رفع صورة
          </Button>
          {custom && (
            <Button size="sm" variant="ghost" disabled={busy} icon={<RotateCcw className="size-4" aria-hidden />} onClick={() => void onReset()}>
              استعادة الافتراضية
            </Button>
          )}
        </div>
      </div>
    </li>
  )
}

/** Dashboard section: replace the two home-page hero photographs. */
export function HeroImagesEditor() {
  return (
    <section aria-labelledby="hero-images-title">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="hero-images-title" className="text-lg font-medium text-brown">
            صور الواجهة الرئيسية
          </h2>
          <p className="mt-0.5 text-xs text-muted">تُصغَّر الصور تلقائياً عند الرفع. تُحفظ في هذا المتصفح حتى يتم ربط التخزين السحابي.</p>
        </div>
      </div>
      <ul className="mt-3 grid gap-3 lg:grid-cols-2">
        {slots.map((s) => (
          <HeroSlotCard key={s.id} slot={s.id} label={s.label} hint={s.hint} aspect={s.aspect} />
        ))}
      </ul>
    </section>
  )
}
