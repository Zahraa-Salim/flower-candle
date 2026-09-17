/**
 * Image storage contract. `upload` returns a URL that can be used directly as an
 * <img src>. The current implementation keeps everything in the browser: it
 * resizes the photo on a canvas and returns a JPEG data URL, which the site
 * content / product stores persist locally. Replace with a Supabase Storage
 * (or any CDN) adapter later; callers only depend on this interface.
 */
export interface ImageStorage {
  upload(file: File, options?: UploadOptions): Promise<string>
}

export interface UploadOptions {
  /** Longest edge after resizing, in pixels. */
  maxDimension?: number
  /** JPEG quality 0..1 */
  quality?: number
}

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024

/** Product photos render at most ~600px wide in the grid; 1200px keeps 2x density at roughly 150–400KB. */
export const productUploadOptions: UploadOptions = { maxDimension: 1200, quality: 0.82 }

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('تعذّر قراءة الصورة. جرّبي صورة بصيغة JPG أو PNG.'))
    }
    img.src = url
  })
}

class LocalImageStorage implements ImageStorage {
  async upload(file: File, { maxDimension = 1600, quality = 0.86 }: UploadOptions = {}): Promise<string> {
    if (!file.type.startsWith('image/')) throw new Error('الملف المختار ليس صورة.')
    if (file.size > MAX_UPLOAD_BYTES) throw new Error('حجم الصورة كبير جداً (الحد 12 ميغابايت).')

    const img = await loadImage(file)
    const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight))
    const width = Math.max(1, Math.round(img.naturalWidth * scale))
    const height = Math.max(1, Math.round(img.naturalHeight * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('تعذّر معالجة الصورة في هذا المتصفح.')
    // Flatten transparency onto the site's ivory so PNGs with alpha don't turn black as JPEG.
    ctx.fillStyle = '#FBF7F2'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)

    const dataUrl = canvas.toDataURL('image/jpeg', quality)
    if (!dataUrl.startsWith('data:image/jpeg')) throw new Error('تعذّر تحويل الصورة.')
    return dataUrl
  }
}

/** Swap for a Supabase Storage adapter later. */
export const imageStorage: ImageStorage = new LocalImageStorage()
