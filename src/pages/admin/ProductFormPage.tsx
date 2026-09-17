import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, RefreshCw } from 'lucide-react'
import type { ProductInput } from '@/types/product'
import { useProducts } from '@/hooks/useProducts'
import { useToast } from '@/hooks/useToast'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { ProductForm } from '@/components/admin/ProductForm'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'

export default function ProductFormPage({ mode }: { mode: 'new' | 'edit' }) {
  const { id = '' } = useParams()
  const { status, getById, reload, createProduct, updateProduct } = useProducts()
  const { show } = useToast()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const product = mode === 'edit' ? getById(id) : undefined
  const title = mode === 'new' ? 'إضافة منتج' : 'تعديل المنتج'
  useDocumentMeta(title)

  const loading = mode === 'edit' && status === 'loading'

  const handleSubmit = async (input: ProductInput) => {
    setSubmitting(true)
    try {
      if (mode === 'new') {
        const created = await createProduct(input)
        show(`تم حفظ ${created.name}`)
      } else if (product) {
        await updateProduct(product.id, input)
        show('تم حفظ التغييرات')
      }
      navigate('/admin/products')
    } catch (err) {
      show(err instanceof Error ? err.message : 'تعذّر حفظ المنتج', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="مسار التصفح" className="text-sm text-muted">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link to="/admin/products" className="hover:text-brown">
              المنتجات
            </Link>
          </li>
          <li aria-hidden>
            <ChevronLeft className="size-3.5" />
          </li>
          <li aria-current="page" className="text-brown">
            {title}
          </li>
        </ol>
      </nav>

      <AdminPageHeader title={title} description={product ? product.name : undefined} />

      {loading ? (
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem]" aria-busy>
          <div className="flex flex-col gap-5">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
          <Skeleton className="aspect-[4/5] w-full" />
        </div>
      ) : mode === 'edit' && status === 'error' ? (
        <EmptyState
          title="تعذّر تحميل المنتج"
          description="حدث خطأ أثناء تحميل المنتجات. المنتج لم يُحذف."
          action={
            <Button onClick={() => void reload()} icon={<RefreshCw className="size-4" aria-hidden />}>
              إعادة المحاولة
            </Button>
          }
        />
      ) : mode === 'edit' && !product ? (
        <EmptyState
          title="المنتج غير موجود"
          description="ربما تم حذفه أو تغيّر رابطه."
          action={<ButtonLink to="/admin/products">العودة إلى المنتجات</ButtonLink>}
        />
      ) : (
        <ProductForm
          key={product?.id ?? 'new'}
          product={product}
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/admin/products')}
        />
      )}
    </div>
  )
}
