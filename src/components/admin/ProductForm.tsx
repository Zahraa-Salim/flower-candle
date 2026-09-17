import { useDeferredValue, useMemo, useState, type FormEvent } from 'react'
import { ImageOff } from 'lucide-react'
import type { CategoryId, Product, ProductInput } from '@/types/product'
import { categories } from '@/data/categories'
import { InputField, SelectField, Switch, TextareaField } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { SmartImage } from '@/components/ui/SmartImage'

interface FormValues {
  name: string
  description: string
  price: string
  category: CategoryId
  flowersCount: string
  color: string
  size: string
  image: string
  images: string
  available: boolean
  featured: boolean
  isNew: boolean
  isCategoryCover: boolean
}

type Errors = Partial<Record<keyof FormValues, string>>

function toValues(product?: Product): FormValues {
  return {
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product ? String(product.price) : '',
    category: product?.category ?? 'bouquets',
    flowersCount: product?.flowersCount !== undefined ? String(product.flowersCount) : '',
    color: product?.color ?? '',
    size: product?.size ?? '',
    image: product?.image ?? '',
    images: (product?.images ?? []).filter((u) => u !== product?.image).join('\n'),
    available: product?.available ?? true,
    featured: product?.featured ?? false,
    isNew: product?.isNew ?? false,
    isCategoryCover: product?.isCategoryCover ?? false,
  }
}

function isValidImageUrl(value: string): boolean {
  const v = value.trim()
  // Site-relative paths are fine; protocol-relative ("//host/x") would load from a third-party host.
  if (v.startsWith('//')) return false
  if (v.startsWith('/')) return true
  try {
    const url = new URL(v)
    // https only: http images are blocked as mixed content once the site is served over TLS.
    return url.protocol === 'https:' && url.hostname.includes('.')
  } catch {
    return false
  }
}

function validate(v: FormValues): Errors {
  const errors: Errors = {}
  if (v.name.trim().length < 2) errors.name = 'اكتبي اسم المنتج (حرفان على الأقل)'
  if (v.description.trim().length < 10) errors.description = 'اكتبي وصفاً أوضح للمنتج (10 أحرف على الأقل)'
  const price = Number(v.price)
  if (v.price.trim() === '' || !Number.isFinite(price) || price <= 0) errors.price = 'أدخلي سعراً صحيحاً أكبر من صفر'
  if (v.flowersCount.trim() !== '') {
    const n = Number(v.flowersCount)
    if (!Number.isInteger(n) || n < 0) errors.flowersCount = 'عدد الورود يجب أن يكون رقماً صحيحاً'
  }
  if (!v.image.trim()) errors.image = 'أضيفي رابط الصورة الرئيسية'
  else if (!isValidImageUrl(v.image)) errors.image = 'رابط الصورة غير صحيح'
  const extra = v.images.split('\n').map((s) => s.trim()).filter(Boolean)
  if (extra.some((u) => !isValidImageUrl(u))) errors.images = 'أحد روابط الصور الإضافية غير صحيح'
  return errors
}

function toInput(v: FormValues): ProductInput {
  const extra = v.images.split('\n').map((s) => s.trim()).filter(Boolean)
  const image = v.image.trim()
  return {
    name: v.name.trim(),
    description: v.description.trim(),
    price: Number(v.price),
    category: v.category,
    image,
    images: Array.from(new Set([image, ...extra])),
    available: v.available,
    featured: v.featured,
    isNew: v.isNew,
    isCategoryCover: v.isCategoryCover,
    flowersCount: v.flowersCount.trim() === '' ? undefined : Number(v.flowersCount),
    color: v.color.trim() || undefined,
    size: v.size.trim() || undefined,
    handmade: true,
  }
}

interface ProductFormProps {
  product?: Product
  submitting?: boolean
  onSubmit: (input: ProductInput) => Promise<void> | void
  onCancel: () => void
}

export function ProductForm({ product, submitting, onSubmit, onCancel }: ProductFormProps) {
  const [values, setValues] = useState<FormValues>(() => toValues(product))
  const [errors, setErrors] = useState<Errors>({})
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({})

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (touched[key]) setErrors(validate({ ...values, [key]: value }))
  }
  const blur = (key: keyof FormValues) => {
    setTouched((t) => ({ ...t, [key]: true }))
    setErrors(validate(values))
  }

  // Defer the preview so typing a URL does not fire a network request per keystroke.
  const previewSrc = useDeferredValue(values.image.trim())
  const previewOk = useMemo(() => previewSrc !== '' && isValidImageUrl(previewSrc), [previewSrc])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const errs = validate(values)
    setErrors(errs)
    setTouched({ name: true, description: true, price: true, flowersCount: true, image: true, images: true })
    if (Object.keys(errs).length > 0) {
      const firstKey = Object.keys(errs)[0]
      document.querySelector<HTMLElement>(`[name="${firstKey}"]`)?.focus()
      return
    }
    await onSubmit(toInput(values))
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-5">
        <InputField
          label="اسم المنتج"
          name="name"
          required
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          onBlur={() => blur('name')}
          error={touched.name ? errors.name : undefined}
          placeholder="مثال: باقة الورد الوردية"
          maxLength={80}
        />
        <TextareaField
          label="الوصف"
          name="description"
          required
          rows={4}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          onBlur={() => blur('description')}
          error={touched.description ? errors.description : undefined}
          placeholder="وصف قصير يشرح القطعة ولمن تناسب."
          maxLength={400}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <InputField
            label="السعر بالدولار"
            name="price"
            required
            type="number"
            inputMode="decimal"
            min={0}
            step="0.5"
            dir="ltr"
            className="[&_input]:text-start"
            value={values.price}
            onChange={(e) => set('price', e.target.value)}
            onBlur={() => blur('price')}
            error={touched.price ? errors.price : undefined}
            placeholder="25"
          />
          <SelectField
            label="التصنيف"
            name="category"
            required
            value={values.category}
            onChange={(e) => set('category', e.target.value as CategoryId)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <InputField
            label="عدد الورود"
            name="flowersCount"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            dir="ltr"
            className="[&_input]:text-start"
            value={values.flowersCount}
            onChange={(e) => set('flowersCount', e.target.value)}
            onBlur={() => blur('flowersCount')}
            error={touched.flowersCount ? errors.flowersCount : undefined}
            placeholder="7"
          />
          <InputField label="اللون" name="color" value={values.color} onChange={(e) => set('color', e.target.value)} placeholder="وردي" maxLength={40} />
          <InputField label="الحجم" name="size" value={values.size} onChange={(e) => set('size', e.target.value)} placeholder="متوسط" maxLength={40} />
        </div>

        <InputField
          label="رابط الصورة الرئيسية"
          name="image"
          required
          type="url"
          dir="ltr"
          className="[&_input]:text-start"
          value={values.image}
          onChange={(e) => set('image', e.target.value)}
          onBlur={() => blur('image')}
          error={touched.image ? errors.image : undefined}
          hint="سيتم استبدال الروابط لاحقاً برفع مباشر إلى التخزين."
          placeholder="https://…"
        />
        <TextareaField
          label="صور إضافية"
          name="images"
          rows={3}
          dir="ltr"
          className="[&_textarea]:text-start"
          value={values.images}
          onChange={(e) => set('images', e.target.value)}
          onBlur={() => blur('images')}
          error={touched.images ? errors.images : undefined}
          hint="رابط واحد في كل سطر."
          placeholder={'https://…\nhttps://…'}
        />
      </div>

      <aside className="flex flex-col gap-6 lg:sticky lg:top-10 lg:self-start">
        <div className="max-w-xs lg:max-w-none">
          <p className="mb-2 text-sm font-medium text-brown">معاينة الصورة</p>
          {previewOk ? (
            <SmartImage src={previewSrc} alt="معاينة صورة المنتج" sizes="320px" frameClassName="aspect-[4/5] rounded-md" />
          ) : (
            <div className="flex aspect-[4/5] items-center justify-center rounded-md border border-dashed border-line bg-cream text-muted">
              <ImageOff className="size-6" aria-hidden />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 rounded-md border border-line bg-paper p-4">
          <Switch label="متوفر" description="يظهر كمتوفر للطلب" checked={values.available} onChange={(v) => set('available', v)} />
          <Switch label="مميز" description="يظهر في قسم «من شغف»" checked={values.featured} onChange={(v) => set('featured', v)} />
          <Switch label="منتج جديد" description="يحمل شارة «جديد»" checked={values.isNew} onChange={(v) => set('isNew', v)} />
          <Switch
            label="غلاف التصنيف"
            description="تظهر صورته في مربع التصنيف على الصفحة الرئيسية (منتج واحد لكل تصنيف)"
            checked={values.isCategoryCover}
            onChange={(v) => set('isCategoryCover', v)}
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <Button type="submit" loading={submitting} block>
            حفظ المنتج
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting} block>
            إلغاء
          </Button>
        </div>
      </aside>
    </form>
  )
}
