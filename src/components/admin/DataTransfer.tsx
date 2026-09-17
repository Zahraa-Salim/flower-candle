import { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { useSiteContent } from '@/hooks/useSiteContent'
import { useToast } from '@/hooks/useToast'
import { pluralize, plurals } from '@/lib/utils'
import { backupFileName, buildBackup, downloadText, parseBackup, type BackupFile } from '@/services/backup'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Dialog'

/** Dashboard card: export the catalogue + hero images as JSON, or import a backup (replaces everything). */
export function DataTransfer() {
  const { products, status, replaceAll } = useProducts()
  const { content, replaceContent } = useSiteContent()
  const { show } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<BackupFile | null>(null)
  const [busy, setBusy] = useState(false)

  const onExport = () => {
    try {
      downloadText(backupFileName(), JSON.stringify(buildBackup(products, content), null, 2))
      show('تم تنزيل النسخة الاحتياطية')
    } catch {
      show('تعذّر إنشاء النسخة الاحتياطية', 'error')
    }
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    try {
      setPending(parseBackup(await file.text()))
    } catch (err) {
      show(err instanceof Error ? err.message : 'الملف ليس نسخة احتياطية صالحة.', 'error')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const onConfirmImport = async () => {
    if (!pending) return
    setBusy(true)
    try {
      await replaceAll(pending.products)
      await replaceContent(pending.siteContent)
      show(`تم استيراد ${pluralize(pending.products.length, plurals.product)}`)
      setPending(null)
    } catch (err) {
      show(err instanceof Error ? err.message : 'تعذّر استيراد النسخة الاحتياطية', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-labelledby="backup-title" className="rounded-md border border-line bg-paper p-5">
      <h2 id="backup-title" className="text-lg font-medium text-brown">
        النسخ الاحتياطي
      </h2>
      <p className="mt-1 max-w-prose text-xs leading-relaxed text-muted">
        البيانات محفوظة في هذا المتصفح فقط. صدّري نسخة قبل مسح بيانات الموقع أو لنقلها إلى جهاز آخر. الاستيراد يستبدل
        كل المنتجات وصور الواجهة.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          icon={<Download className="size-4" aria-hidden />}
          onClick={onExport}
          disabled={busy || status !== 'ready'}
        >
          تصدير البيانات
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label="اختيار ملف النسخة الاحتياطية"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
        <Button size="sm" variant="ghost" icon={<Upload className="size-4" aria-hidden />} onClick={() => inputRef.current?.click()} disabled={busy}>
          استيراد
        </Button>
      </div>

      <ConfirmDialog
        open={pending !== null}
        title="استيراد النسخة الاحتياطية؟"
        description={
          pending ? (
            <>
              سيتم استبدال كل البيانات الحالية بـ <strong className="font-medium text-brown">{pluralize(pending.products.length, plurals.product)}</strong>{' '}
              وصور الواجهة من الملف. لا يمكن التراجع عن هذا الإجراء.
            </>
          ) : null
        }
        confirmLabel="استيراد"
        destructive
        loading={busy}
        onConfirm={() => void onConfirmImport()}
        onCancel={() => !busy && setPending(null)}
      />
    </section>
  )
}
