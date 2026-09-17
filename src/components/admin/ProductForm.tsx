import { useDeferredValue, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useBlocker } from 'react-router-dom'
import { ImageOff, Loader2, Plus, Upload, X } from 'lucide-react'
import type { CategoryId, Product, ProductInput } from '@/types/product'
import { categories } from '@/data/categories'
import { imageStorage, productUploadOptions } from '@/services/images'
import { useToast } from '@/hooks/useToast'
import { cn, pluralize, plurals } from '@/lib/utils'
import { InputField, SelectField, Switch, TextareaField } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { SmartImage } from '@/components/ui/SmartImage'

interface FormValues {
  name: string
  description: string
  price: string
  category: CategoryId
  flowersCount: string
  color: string
  size: string
  /** Main image: an uploaded data URL or a pasted https URL. */
  image: string
  /** Additional images shown as thumbnails (uploaded data URLs and stored URLs). */
  gallery: string[]
  /** Fallback: pasted additional-image URLs, one per line. */
  images: string
  available: boolean
  featured: boolean
  isNew: boolean
  isCategoryCover: boolean
}

type Errors = Partial<Record<keyof FormValues, string>>

const MAX_GALLERY = 6

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
    gallery: (product?.images ?? []).filter((u) => u !== product?.image),
    images: '',
    available: product?.available ?? true,
    featured: product?.featured ?? false,
    isNew: product?.isNew ?? false,
    isCategoryCover: product?.isCategoryCover ?? false,
  }
}

const isUploaded = (value: string) => /^data:image\/(jpeg|png|webp|gif);base64,/.test(value)

function isValidImageUrl(value: string): boolean {
  const v = value.trim()
  // Uploads from imageStorage produce data:image/jpeg URLs.
  if (isUploaded(v)) return true
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

const splitLines = (text: string) =>
  text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

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
  if (!v.image.trim()) errors.image = 'ارفعي صورة أو الصقي رابطاً للصورة الرئيسية'
  else if (!isValidImageUrl(v.image)) errors.image = 'رابط الصورة غير صحيح'
  if (splitLines(v.images).some((u) => !isValidImageUrl(u))) errors.images = 'أحد روابط الصور الإضافية غير صحيح'
  return errors
}

function toInput(v: FormValues): ProductInput {
  const image = v.image.trim()
  const extras = Array.from(new Set([...v.gallery, ...splitLines(v.images)])).filter((u) => u !== image)
  return {
    name: v.name.trim(),
    description: v.description.trim(),
    price: Number(v.price),
    category: v.category,
    image,
    images: extras,
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
  const { show } = useToast()
  const [values, setValues] = useState<FormValues>(() => toValues(product))
  const [errors, setErrors] = useState<Errors>({})
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({})
  const [uploadingMain, setUploadingMain] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const mainInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  // Unsaved-changes guard: compare by value (gallery is an array, so reference equality would always be dirty).
  const initialJson = useMemo(() => JSON.stringify(toValues(product)), [product])
  const dirty = useMemo(() => JSON.stringify(values) !== initialJson, [values, initialJson])
  // `submitting` is committed before the page navigates after a successful save, so the save itself is never blocked.
  const blocker = useBlocker(dirty && !submitting)
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

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
  const mainUploaded = isUploaded(values.image)

  const uploadError = (err: unknown) => show(err instanceof Error ? err.message : 'تعذّر رفع الصورة', 'error')

  const onMainFile = async (file: File | undefined) => {
    if (!file) return
    setUploadingMain(true)
    try {
      const url = await imageStorage.upload(file, productUploadOptions)
      setValues((prev) => ({ ...prev, image: url }))
      setTouched((t) => ({ ...t, image: true }))
      setErrors((e) => ({ ...e, image: undefined }))
    } catch (err) {
      uploadError(err)
    } finally {
      setUploadingMain(false)
      if (mainInputRef.current) mainInputRef.current.value = ''
    }
  }

  const onGalleryFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const room = MAX_GALLERY - values.gallery.length
    const picked = Array.from(files).slice(0, Math.max(0, room))
    if (picked.length < files.length) show(`الحد الأقصى ${MAX_GALLERY} صور إضافية`, 'info')
    if (picked.length === 0) return
    setUploadingGallery(true)
    try {
      const urls: string[] = []
      for (const file of picked) urls.push(await imageStorage.upload(file, productUploadOptions))
      setValues((prev) => ({ ...prev, gallery: [...prev.gallery, ...urls].slice(0, MAX_GALLERY) }))
    } catch (err) {
      uploadError(err)
    } finally {
      setUploadingGallery(false)
      if (galleryInputRef.current) galleryInputRef.current.value = ''
    }
  }

  const removeGalleryItem = (index: number) =>
    setValues((prev) => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== index) }))

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

  const busy = submitting || uploadingMain || uploadingGallery

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

        {/* Main image: upload (preferred) or paste a link */}
        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium text-brown">
            الصورة الرئيسية
            <span className="text-rose-ink ms-1" aria-hidden>
              *
            </span>
          </legend>
          <div className="flex gap-4">
            <div className="w-28 shrink-0 sm:w-32">
              {previewOk ? (
                <SmartImage src={previewSrc} alt="معاينة صورة المنتج" sizes="128px" frameClassName="aspect-[4/5] rounded-md" />
              ) : (
                <div className="flex aspect-[4/5] items-center justify-center rounded-md border border-dashed border-line-strong bg-cream text-muted">
                  <ImageOff className="size-6" aria-hidden />
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={mainInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  aria-label="اختيار ملف الصورة الرئيسية"
                  onChange={(e) => void onMainFile(e.target.files?.[0])}
                />
                <Button
                  size="sm"
                  variant="outline"
                  loading={uploadingMain}
                  icon={<Upload className="size-4" aria-hidden />}
                  onClick={() => mainInputRef.current?.click()}
                >
                  رفع صورة
                </Button>
                {values.image && (
                  <Button size="sm" variant="ghost" icon={<X className="size-4" aria-hidden />} onClick={() => set('image', '')}>
                    إزالة
                  </Button>
                )}
                {mainUploaded && <Badge tone="sage">صورة مرفوعة</Badge>}
              </div>
              {mainUploaded ? (
                <p className="text-xs text-muted">تُصغَّر الصورة إلى 1200px بصيغة JPEG وتُحفظ في هذا المتصفح.</p>
              ) : (
                <InputField
                  label="أو الصقي رابطاً"
                  name="image"
                  type="url"
                  dir="ltr"
                  className="[&_input]:text-start"
                  value={values.image}
                  onChange={(e) => set('image', e.target.value)}
                  onBlur={() => blur('image')}
                  error={touched.image ? errors.image : undefined}
                  placeholder="https://…"
                />
              )}
            </div>
          </div>
        </fieldset>

        {/* Additional images: thumbnails + multi-upload, with a paste fallback */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-brown">
            صور إضافية{' '}
            <span className="num text-xs font-normal text-muted">
              ({pluralize(values.gallery.length, plurals.image)} من {MAX_GALLERY})
            </span>
          </p>
          <ul className="flex flex-wrap gap-3" aria-label="الصور الإضافية">
            {values.gallery.map((src, i) => (
              <li key={`${i}-${src.length}`} className="relative">
                <SmartImage src={src} alt={`صورة إضافية ${i + 1}`} sizes="96px" frameClassName="size-24 rounded-md" />
                <button
                  type="button"
                  onClick={() => removeGalleryItem(i)}
                  aria-label={`إزالة الصورة الإضافية ${i + 1}`}
                  className={cn(
                    'absolute -top-2 -end-2 inline-flex size-8 items-center justify-center rounded-full border border-line-strong bg-paper text-brown-2 shadow-whisper',
                    "before:absolute before:-inset-1.5 before:content-['']", // 44px hit area
                    'hover:bg-danger-soft hover:text-danger',
                  )}
                >
                  <X className="size-4" aria-hidden />
                </button>
              </li>
            ))}
            {values.gallery.length < MAX_GALLERY && (
              <li>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  aria-label="اختيار صور إضافية"
                  onChange={(e) => void onGalleryFiles(e.target.files)}
                />
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={uploadingGallery}
                  className="flex size-24 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-line-strong bg-cream text-xs text-muted transition-colors hover:border-rose-ink hover:text-rose-ink disabled:opacity-50"
                >
                  {uploadingGallery ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Plus className="size-5" aria-hidden />}
                  <span>{uploadingGallery ? 'جارٍ الرفع…' : 'إضافة'}</span>
                </button>
              </li>
            )}
          </ul>
          <TextareaField
            label="أو الصقي روابط"
            name="images"
            rows={2}
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
      </div>

      <aside className="flex flex-col gap-6 lg:sticky lg:top-10 lg:self-start">
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
          <Button type="submit" loading={submitting} disabled={busy} block>
            حفظ المنتج
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting} block>
            إلغاء
          </Button>
        </div>
      </aside>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="مغادرة دون حفظ؟"
        description="لديك تغييرات غير محفوظة. إذا غادرتِ الآن ستفقدين هذه التغييرات."
        confirmLabel="مغادرة"
        cancelLabel="البقاء"
        destructive
        onConfirm={() => {
          if (blocker.state === 'blocked') blocker.proceed()
        }}
        onCancel={() => {
          if (blocker.state === 'blocked') blocker.reset()
        }}
      />
    </form>
  )
}
