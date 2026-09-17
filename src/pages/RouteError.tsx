import { useEffect } from 'react'
import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { storageKeys } from '@/config/site'
import { hasRecentChunkReload, isChunkLoadError, markChunkReload } from '@/lib/chunkError'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { ErrorPanel } from '@/components/ui/ErrorPanel'
import { ButtonLink } from '@/components/ui/Button'

interface RouteErrorPageProps {
  /**
   * `page` renders inside the surrounding layout (header/footer or admin nav).
   * `screen` is a standalone full-height screen for when the layout itself crashed.
   */
  shell?: 'page' | 'screen'
  homeTo?: string
  homeLabel?: string
}

/**
 * Route-level error page. Imported statically by the router so it lives in the
 * entry chunk and is available precisely when a lazy chunk fails to load.
 */
export default function RouteErrorPage({ shell = 'page', homeTo = '/', homeLabel = 'العودة إلى الرئيسية' }: RouteErrorPageProps) {
  const error = useRouteError()
  useDocumentMeta('حدث خطأ')

  const stale = isChunkLoadError(error)
  // Pure read during render; the write happens in the effect below.
  const alreadyReloaded = stale && hasRecentChunkReload(sessionStorage, storageKeys.chunkReload)
  const autoReload = stale && !alreadyReloaded

  // A stale chunk after a redeploy is fixed by one full reload; the sessionStorage
  // stamp guarantees it happens at most once per minute per tab.
  useEffect(() => {
    if (!autoReload) return
    markChunkReload(sessionStorage, storageKeys.chunkReload)
    window.location.reload()
  }, [autoReload])

  let title: string | undefined
  let description: string | undefined
  if (autoReload) {
    title = 'تم تحديث الموقع'
    description = 'يُعاد تحميل الصفحة الآن…'
  } else if (stale) {
    title = 'تم تحديث الموقع'
    description = 'تعذّر تحميل جزء من الموقع بعد تحديثه. أعيدي تحميل الصفحة للمتابعة.'
  } else if (isRouteErrorResponse(error)) {
    title = error.status === 404 ? 'الصفحة غير موجودة' : `خطأ ${error.status}`
    description = error.status === 404 ? 'ربما تغيّر الرابط أو كُتب بشكل غير صحيح.' : error.statusText || 'تعذّر إكمال الطلب.'
  }

  const panel = (
    <ErrorPanel
      title={title}
      description={description}
      error={error}
      homeAction={
        <ButtonLink to={homeTo} variant="outline">
          {homeLabel}
        </ButtonLink>
      }
    />
  )

  if (shell === 'screen') {
    return <div className="flex min-h-dvh flex-col items-center justify-center bg-ivory px-4">{panel}</div>
  }
  return <div className="container-x py-10 lg:py-16">{panel}</div>
}
