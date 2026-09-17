import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { EmptyState } from '@/components/ui/EmptyState'
import { ButtonLink } from '@/components/ui/Button'

export default function NotFoundPage() {
  useDocumentMeta('الصفحة غير موجودة')
  return (
    <div className="container-x py-10 lg:py-20">
      <EmptyState
        titleAs="h1"
        title="هذه الصفحة غير موجودة"
        description="ربما تغيّر الرابط أو كُتب بشكل غير صحيح."
        action={<ButtonLink to="/">العودة إلى الرئيسية</ButtonLink>}
      />
    </div>
  )
}
