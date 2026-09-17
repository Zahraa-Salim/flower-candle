export type ShareResult = 'shared' | 'copied' | 'failed' | 'dismissed'

interface SharePayload {
  title: string
  text?: string
  url: string
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through to the legacy path */
  }
  const el = document.createElement('textarea')
  try {
    el.value = text
    el.setAttribute('readonly', '')
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    el.remove()
  }
}

/** Web Share API when available, otherwise copy the URL. */
export async function shareContent(payload: SharePayload): Promise<ShareResult> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      if (!navigator.canShare || navigator.canShare(payload)) {
        await navigator.share(payload)
        return 'shared'
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'dismissed'
      /* any other failure falls back to copying */
    }
  }
  return (await copyToClipboard(payload.url)) ? 'copied' : 'failed'
}
